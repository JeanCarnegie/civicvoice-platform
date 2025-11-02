'use client';

import { useEffect, useState } from 'react';
import { BrowserProvider, JsonRpcProvider, type ContractRunner, type JsonRpcSigner } from 'ethers';

import { runtimeConfig } from '@/lib/config/runtime';

import { useWallet } from './useWalletContext';

export function useEthersProviders(): {
  reader?: ContractRunner;
  signer?: JsonRpcSigner;
  wallet: ReturnType<typeof useWallet>;
} {
  const wallet = useWallet();
  const [reader, setReader] = useState<ContractRunner | undefined>(undefined);
  const [signer, setSigner] = useState<JsonRpcSigner | undefined>(undefined);

  useEffect(() => {
    let mounted = true;

    async function setupWalletProvider() {
      if (!wallet.provider) {
        return;
      }

      const provider = new BrowserProvider(wallet.provider, wallet.chainId);
      const walletSigner = await provider.getSigner();
      if (!mounted) return;
      setReader(provider);
      setSigner(walletSigner);
    }

    if (wallet.connected && wallet.provider) {
      setupWalletProvider();
      return () => {
        mounted = false;
      };
    }

    const fallbackUrl = runtimeConfig.publicRpcUrl || (wallet.chainId === 31337 ? runtimeConfig.mockRpcUrl : undefined);
    if (fallbackUrl) {
      const provider = new JsonRpcProvider(fallbackUrl);
      setReader(provider);
    } else {
      setReader(undefined);
    }
    setSigner(undefined);

    return () => {
      mounted = false;
    };
  }, [wallet.provider, wallet.chainId, wallet.connected]);

  return { reader, signer, wallet };
}


