'use client';

import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import type { ethers } from 'ethers';

type Eip1193Provider = ethers.Eip1193Provider;

type EIP6963ProviderDetail = {
  info: {
    name: string;
    rdns?: string;
    icon?: string;
    uuid: string;
  };
  provider: Eip1193Provider;
};

export type WalletConnector = {
  id: string;
  name: string;
  icon?: string;
  provider: Eip1193Provider;
};

export type WalletState = {
  connectorId?: string;
  accounts: string[];
  chainId?: number;
  connected: boolean;
  isConnecting: boolean;
  provider?: Eip1193Provider;
  lastError?: string;
};

export type WalletContextValue = WalletState & {
  connectors: WalletConnector[];
  connect: (connectorId: string) => Promise<void>;
  disconnect: () => void;
  switchChain: (targetChainId: number) => Promise<void>;
  clearError: () => void;
  getStoredDecryptionSignature: (account: string) => string | null;
  setStoredDecryptionSignature: (account: string, payload: string | null) => void;
};

type ProviderWithEvents = Eip1193Provider & {
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
};

const STORAGE_KEYS = {
  connectorId: 'wallet.lastConnectorId',
  accounts: 'wallet.lastAccounts',
  chainId: 'wallet.lastChainId',
  connected: 'wallet.connected',
  signature: (account: string) => `fhevm.decryptionSignature.${account.toLowerCase()}`,
} as const;

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

const parseAccounts = (value: string | null): string[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch (error) {
    console.error('Failed to parse stored accounts', error);
    return [];
  }
};

function getFallbackConnector(): WalletConnector | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const ethereum = (window as unknown as { ethereum?: Eip1193Provider }).ethereum;
  if (!ethereum) {
    return undefined;
  }

  return {
    id: 'injected',
    name: 'Injected Provider',
    icon: undefined,
    provider: ethereum,
  };
}

function normalizeConnectorId(detail: EIP6963ProviderDetail): string {
  return detail.info.rdns ?? detail.info.uuid ?? detail.info.name;
}

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

function useProvideWallet(): WalletContextValue {
  const [connectors, setConnectors] = useState<WalletConnector[]>([]);
  const [state, setState] = useState<WalletState>({
    accounts: [],
    connected: false,
    isConnecting: false,
  });
  const activeProviderRef = useRef<Eip1193Provider | undefined>(undefined);
  const listenersAttachedRef = useRef(false);
  const activeListenersRef = useRef<
    | {
        provider: ProviderWithEvents;
        accounts: (accounts: unknown) => void;
        chain: (chainIdHex: string) => void;
        connect: (info: { chainId: string }) => void;
        disconnect: () => void;
      }
    | null
  >(null);
  const hydratedRef = useRef(false);

  const updateStorage = useCallback((payload: Partial<{ accounts: string[]; chainId?: number; connected?: boolean; connectorId?: string }>) => {
    if (typeof window === 'undefined') {
      return;
    }
    if (payload.accounts) {
      window.localStorage.setItem(STORAGE_KEYS.accounts, JSON.stringify(payload.accounts));
    }
    if (payload.chainId !== undefined) {
      window.localStorage.setItem(STORAGE_KEYS.chainId, payload.chainId.toString());
    }
    if (payload.connected !== undefined) {
      window.localStorage.setItem(STORAGE_KEYS.connected, String(payload.connected));
    }
    if (payload.connectorId !== undefined) {
      window.localStorage.setItem(STORAGE_KEYS.connectorId, payload.connectorId ?? '');
    }
  }, []);

  const attachProviderListeners = useCallback((provider: Eip1193Provider) => {
    if (listenersAttachedRef.current && activeProviderRef.current === provider) {
      return;
    }

    const handleAccountsChanged = (accounts: unknown) => {
      if (!Array.isArray(accounts)) {
        return;
      }
      setState((prev) => {
        const connected = accounts.length > 0;
        updateStorage({ accounts, connected });
        if (!connected) {
          updateStorage({ connectorId: '', chainId: undefined });
        }
        return {
          ...prev,
          accounts: accounts as string[],
          connected,
          isConnecting: false,
        };
      });
    };

    const handleChainChanged = (chainIdHex: string) => {
      const parsed = Number.parseInt(chainIdHex, 16);
      updateStorage({ chainId: parsed });
      setState((prev) => ({ ...prev, chainId: parsed }));
    };

    const handleConnect = (info: { chainId: string }) => {
      const parsed = Number.parseInt(info.chainId, 16);
      updateStorage({ chainId: parsed, connected: true });
      setState((prev) => ({ ...prev, connected: true, chainId: parsed }));
    };

    const handleDisconnect = () => {
      updateStorage({ connected: false });
      setState((prev) => ({ ...prev, connected: false, accounts: [], chainId: undefined }));
    };

    const eventful = provider as ProviderWithEvents;
    eventful.on?.('accountsChanged', handleAccountsChanged);
    eventful.on?.('chainChanged', handleChainChanged as never);
    eventful.on?.('connect', handleConnect as never);
    eventful.on?.('disconnect', handleDisconnect as never);

    activeProviderRef.current = provider;
    listenersAttachedRef.current = true;
    activeListenersRef.current = {
      provider: eventful,
      accounts: handleAccountsChanged,
      chain: handleChainChanged,
      connect: handleConnect,
      disconnect: handleDisconnect,
    };
  }, [updateStorage]);

  const detachListeners = useCallback(() => {
    if (!listenersAttachedRef.current || !activeListenersRef.current) {
      return;
    }

    const { provider, accounts, chain, connect, disconnect } = activeListenersRef.current;
    const eventful = provider as ProviderWithEvents;

    eventful.removeListener?.('accountsChanged', accounts);
    eventful.removeListener?.('chainChanged', chain as never);
    eventful.removeListener?.('connect', connect as never);
    eventful.removeListener?.('disconnect', disconnect as never);

    activeProviderRef.current = undefined;
    listenersAttachedRef.current = false;
    activeListenersRef.current = null;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const discovered = new Map<string, WalletConnector>();

    const addConnector = (detail: EIP6963ProviderDetail) => {
      const id = normalizeConnectorId(detail);
      discovered.set(id, {
        id,
        name: detail.info.name,
        icon: detail.info.icon,
        provider: detail.provider,
      });
      setConnectors((current) => {
        const fallback = getFallbackConnector();
        const values = Array.from(discovered.values());
        const list = fallback && !values.find((item) => item.id === fallback.id) ? [fallback, ...values] : values;
        return list;
      });
    };

    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<EIP6963ProviderDetail>;
      if (customEvent.detail) {
        addConnector(customEvent.detail);
      }
    };

    window.addEventListener('eip6963:announceProvider', handler as EventListener);
    window.dispatchEvent(new Event('eip6963:requestProvider'));

    const fallback = getFallbackConnector();
    if (fallback) {
      discovered.set(fallback.id, fallback);
      setConnectors(Array.from(discovered.values()));
    }

    return () => {
      window.removeEventListener('eip6963:announceProvider', handler as EventListener);
    };
  }, []);

  useEffect(() => {
    if (hydratedRef.current || typeof window === 'undefined') {
      return;
    }

    hydratedRef.current = true;

    const persistedConnectorId = window.localStorage.getItem(STORAGE_KEYS.connectorId) ?? undefined;
    const persistedAccounts = parseAccounts(window.localStorage.getItem(STORAGE_KEYS.accounts));
    const persistedChainId = window.localStorage.getItem(STORAGE_KEYS.chainId);
    const persistedConnected = window.localStorage.getItem(STORAGE_KEYS.connected) === 'true';

    setState((prev) => ({
      ...prev,
      connectorId: persistedConnectorId || undefined,
      accounts: persistedAccounts,
      chainId: persistedChainId ? Number.parseInt(persistedChainId, 10) : undefined,
      connected: persistedConnected && persistedAccounts.length > 0,
    }));
  }, []);

  const connectWithProvider = useCallback(
    async (connector: WalletConnector, silent = false) => {
      try {
        setState((prev) => ({ ...prev, isConnecting: !silent, lastError: undefined }));

        const method = silent ? 'eth_accounts' : 'eth_requestAccounts';
        const accounts = (await connector.provider.request({ method })) as string[];

        if (!accounts || accounts.length === 0) {
          if (!silent) {
            throw new Error('No accounts returned by provider');
          }
          updateStorage({ accounts: [], connected: false });
          setState((prev) => ({ ...prev, accounts: [], connected: false, isConnecting: false }));
          return;
        }

        const chainIdHex = (await connector.provider.request({ method: 'eth_chainId' })) as string;
        const parsedChainId = Number.parseInt(chainIdHex, 16);

        updateStorage({
          accounts,
          chainId: parsedChainId,
          connected: true,
          connectorId: connector.id,
        });

        detachListeners();
        attachProviderListeners(connector.provider);

        setState({
          connectorId: connector.id,
          accounts,
          chainId: parsedChainId,
          connected: true,
          provider: connector.provider,
          isConnecting: false,
          lastError: undefined,
        });
      } catch (error) {
        if (silent && isAbort(error)) {
          return;
        }
        console.error('Wallet connection failed', error);
        setState((prev) => ({ ...prev, isConnecting: false, lastError: (error as Error)?.message ?? 'Connection failed' }));
        if (!silent) {
          updateStorage({ connected: false });
        }
      }
    },
    [attachProviderListeners, detachListeners, updateStorage],
  );

  useEffect(() => {
    if (!state.connectorId || !state.connected) {
      return;
    }
    const connector = connectors.find((item) => item.id === state.connectorId);
    if (!connector) {
      return;
    }
    if (state.provider && state.provider === connector.provider) {
      return;
    }
    connectWithProvider(connector, true);
  }, [connectors, connectWithProvider, state.connectorId, state.connected, state.provider]);

  const connect = useCallback(
    async (connectorId: string) => {
      const connector = connectors.find((item) => item.id === connectorId);
      if (!connector) {
        throw new Error(`Connector ${connectorId} not found`);
      }
      return connectWithProvider(connector, false);
    },
    [connectors, connectWithProvider],
  );

  const disconnect = useCallback(() => {
    detachListeners();
    updateStorage({ accounts: [], chainId: undefined, connected: false, connectorId: '' });
    setState({ accounts: [], chainId: undefined, connected: false, isConnecting: false });
  }, [detachListeners, updateStorage]);

  const switchChain = useCallback(
    async (targetChainId: number) => {
      if (!state.provider) {
        throw new Error('Wallet not connected');
      }
      const hexChainId = `0x${targetChainId.toString(16)}`;
      await state.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexChainId }],
      });
      updateStorage({ chainId: targetChainId });
      setState((prev) => ({ ...prev, chainId: targetChainId }));
    },
    [state.provider, updateStorage],
  );

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, lastError: undefined }));
  }, []);

  const getStoredDecryptionSignature = useCallback((account: string) => {
    if (typeof window === 'undefined') {
      return null;
    }
    return window.localStorage.getItem(STORAGE_KEYS.signature(account));
  }, []);

  const setStoredDecryptionSignature = useCallback((account: string, payload: string | null) => {
    if (typeof window === 'undefined') {
      return;
    }
    const key = STORAGE_KEYS.signature(account);
    if (!payload) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, payload);
    }
  }, []);

  const value = useMemo<WalletContextValue>(
    () => ({
      connectors,
      ...state,
      connect,
      disconnect,
      switchChain,
      clearError,
      getStoredDecryptionSignature,
      setStoredDecryptionSignature,
    }),
    [connectors, state, connect, disconnect, switchChain, clearError, getStoredDecryptionSignature, setStoredDecryptionSignature],
  );

  return value;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const value = useProvideWallet();
  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletContextValue {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

