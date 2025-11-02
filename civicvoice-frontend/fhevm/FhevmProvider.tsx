'use client';

import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { JsonRpcSigner, ethers } from 'ethers';

import type { UserDecryptResults, FhevmInstance, HandleContractPair } from '@zama-fhe/relayer-sdk/web';

import { createFheInstance, type FhevmInstanceResult, type FhevmMode } from './createFheInstance';
import { useWallet } from '@/hooks/useWalletContext';

type FhevmStatus = 'idle' | 'loading' | 'ready' | 'error';

type StoredSignature = {
  publicKey: string;
  privateKey: string;
  signature: string;
  startTimestamp: number;
  durationDays: number;
  contractAddresses: string[];
};

type EncryptResult = {
  handle: string;
  proof: string;
};

type DecryptResult = {
  values: Record<string, bigint | boolean | string>;
};

export type FhevmContextValue = {
  status: FhevmStatus;
  mode: FhevmMode | null;
  instance?: FhevmInstance;
  error?: string;
  chainId?: number;
  encryptScore: (contractAddress: string, account: string, value: number) => Promise<EncryptResult>;
  decryptHandles: (
    contractAddress: string,
    handles: string[],
    account: string,
    forceRenew?: boolean,
  ) => Promise<DecryptResult>;
  refresh: () => void;
};

const FhevmContext = createContext<FhevmContextValue | undefined>(undefined);

const DECRYPTION_DURATION_DAYS = 30;

function toHex(buffer: Uint8Array): string {
  return ethers.hexlify(buffer);
}

function coerceToHandles(handles: string[], contractAddress: string): HandleContractPair[] {
  return handles.map((handle) => ({ handle, contractAddress }));
}

function isStoredSignatureValid(stored: StoredSignature | null, contractAddresses: string[]): boolean {
  if (!stored) {
    return false;
  }
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = stored.startTimestamp + stored.durationDays * 24 * 60 * 60;
  if (now >= expiresAt) {
    return false;
  }
  const expected = contractAddresses.map((addr) => addr.toLowerCase()).sort();
  const actual = stored.contractAddresses.map((addr) => addr.toLowerCase()).sort();
  return expected.length === actual.length && expected.every((value, index) => value === actual[index]);
}

async function requestTypedSignature(
  provider: ethers.Eip1193Provider,
  account: string,
  typedData: unknown,
): Promise<string> {
  const payload = typeof typedData === 'string' ? typedData : JSON.stringify(typedData);
  const signature = (await provider.request({
    method: 'eth_signTypedData_v4',
    params: [account, payload],
  })) as string;
  return signature;
}

export function FhevmProvider({ children }: { children: ReactNode }) {
  const wallet = useWallet();
  const [result, setResult] = useState<FhevmInstanceResult | null>(null);
  const [status, setStatus] = useState<FhevmStatus>('idle');
  const [error, setError] = useState<string | undefined>(undefined);
  const abortRef = useRef<AbortController | null>(null);

  const refresh = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();
    setStatus('idle');
    setResult(null);
    setError(undefined);
  }, []);

  useEffect(() => {
    if (!wallet.provider || !wallet.connected || !wallet.chainId) {
      setResult(null);
      setStatus('idle');
      return;
    }

    const controller = abortRef.current ?? new AbortController();
    abortRef.current = controller;

    setStatus('loading');
    setError(undefined);

    createFheInstance({
      provider: wallet.provider,
      chainId: wallet.chainId,
      signal: controller.signal,
    })
      .then((instanceResult) => {
        if (controller.signal.aborted) {
          return;
        }
        setResult(instanceResult);
        setStatus('ready');
      })
      .catch((err) => {
        if (controller.signal.aborted) {
          return;
        }
        console.error('createFheInstance failed', err);
        setStatus('error');
        setError((err as Error)?.message ?? 'Failed to initialise FHEVM');
      });

    return () => {
      controller.abort();
    };
  }, [wallet.provider, wallet.chainId, wallet.connected]);

  const ensureSignature = useCallback(
    async (instance: FhevmInstance, account: string, contractAddresses: string[], forceRenew = false) => {
      const storedRaw = wallet.getStoredDecryptionSignature(account);
      const stored: StoredSignature | null = storedRaw ? JSON.parse(storedRaw) : null;

      if (!forceRenew && isStoredSignatureValid(stored, contractAddresses)) {
        return stored as StoredSignature;
      }

      const keypair = instance.generateKeypair();
      const startTimestamp = Math.floor(Date.now() / 1000);
      const durationDays = DECRYPTION_DURATION_DAYS;

      const typedData = instance.createEIP712(
        keypair.publicKey,
        contractAddresses,
        startTimestamp,
        durationDays,
      );

      const signature = await requestTypedSignature(wallet.provider!, account, typedData);

      const payload: StoredSignature = {
        publicKey: keypair.publicKey,
        privateKey: keypair.privateKey,
        signature,
        startTimestamp,
        durationDays,
        contractAddresses,
      };

      wallet.setStoredDecryptionSignature(account, JSON.stringify(payload));

      return payload;
    },
    [wallet],
  );

  const encryptScore = useCallback<
    FhevmContextValue['encryptScore']
  >(
    async (contractAddress, account, value) => {
      if (!result?.instance) {
        throw new Error('FHEVM instance is not ready');
      }
      
      // Ensure addresses are checksummed
      const checksummedContract = ethers.getAddress(contractAddress);
      const checksummedAccount = ethers.getAddress(account);
      
      console.log('[encryptScore] Creating encrypted input:', {
        contractAddress: checksummedContract,
        account: checksummedAccount,
        value,
        mode: result.mode,
        chainId: result.chainId,
      });
      
      try {
        const builder = result.instance.createEncryptedInput(checksummedContract, checksummedAccount);
        const encrypted = await builder.add32(value).encrypt();
        const handle = toHex(encrypted.handles[0]);
        const proof = toHex(encrypted.inputProof);
        console.log('[encryptScore] ✅ Encryption successful');
        return { handle, proof };
      } catch (error) {
        console.error('[encryptScore] ❌ Encryption failed:', error);
        throw error;
      }
    },
    [result?.instance, result?.mode, result?.chainId],
  );

  const decryptHandles = useCallback<
    FhevmContextValue['decryptHandles']
  >(
    async (contractAddress, handles, account, forceRenew = false) => {
      if (!result?.instance) {
        throw new Error('FHEVM instance is not ready');
      }
      if (!wallet.provider) {
        throw new Error('Wallet provider unavailable');
      }

      const allowedHandles = handles.filter(Boolean);
      if (allowedHandles.length === 0) {
        return { values: {} };
      }

      const signature = await ensureSignature(result.instance, account, [contractAddress], forceRenew);

      const response: UserDecryptResults = await result.instance.userDecrypt(
        coerceToHandles(allowedHandles, contractAddress),
        signature.privateKey,
        signature.publicKey,
        signature.signature,
        signature.contractAddresses,
        account,
        signature.startTimestamp,
        signature.durationDays,
      );

      return { values: response };
    },
    [ensureSignature, result?.instance, wallet.provider],
  );

  const contextValue = useMemo<FhevmContextValue>(
    () => ({
      status,
      mode: result?.mode ?? null,
      instance: result?.instance,
      error,
      chainId: result?.chainId ?? wallet.chainId,
      encryptScore,
      decryptHandles,
      refresh,
    }),
    [status, result?.mode, result?.instance, result?.chainId, error, wallet.chainId, encryptScore, decryptHandles, refresh],
  );

  return <FhevmContext.Provider value={contextValue}>{children}</FhevmContext.Provider>;
}

export function useFhevm(): FhevmContextValue {
  const context = useContext(FhevmContext);
  if (!context) {
    throw new Error('useFhevm must be used within FhevmProvider');
  }
  return context;
}

