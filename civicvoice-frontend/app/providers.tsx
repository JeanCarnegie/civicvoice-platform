'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { FhevmProvider } from '@/fhevm/FhevmProvider';
import { DensityProvider } from '@/hooks/useDensityMode';
import { WalletProvider } from '@/hooks/useWalletContext';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <DensityProvider>
        <WalletProvider>
          <FhevmProvider>{children}</FhevmProvider>
        </WalletProvider>
      </DensityProvider>
    </QueryClientProvider>
  );
}


