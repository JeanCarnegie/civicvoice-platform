'use client';

import { useMemo } from 'react';

import { CivicVoiceFeedbackAddresses } from '@/abi/CivicVoiceFeedbackAddresses';
import { createCivicVoiceContract, resolveCivicVoiceDeployment } from '@/lib/contracts/civicVoice';

import { useEthersProviders } from './useEthersProviders';

/**
 * Gets the first deployed chain ID from address mappings
 * Used as fallback when wallet chain ID is unavailable
 */
const FIRST_DEPLOYED_CHAIN = Object.keys(CivicVoiceFeedbackAddresses)[0]
  ? Number.parseInt(Object.keys(CivicVoiceFeedbackAddresses)[0], 10)
  : undefined;

/**
 * Hook to access CivicVoice contract instance
 * Automatically resolves deployment based on current chain ID
 * 
 * @returns Contract instance, deployment info, and wallet state
 */
export function useCivicVoiceContract() {
  const { reader, signer, wallet } = useEthersProviders();

  const chainId = wallet.chainId ?? FIRST_DEPLOYED_CHAIN;

  const deployment = resolveCivicVoiceDeployment(chainId);

  const contract = useMemo(() => {
    if (!reader || !chainId) {
      return undefined;
    }
    try {
      return createCivicVoiceContract(reader, chainId);
    } catch (error) {
      console.warn('CivicVoice contract unavailable', error);
      return undefined;
    }
  }, [reader, chainId]);

  return {
    contract,
    deployment,
    signer,
    reader,
    chainId,
    wallet,
  };
}


