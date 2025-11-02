'use client';

import { useCallback } from 'react';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { ethers } from 'ethers';

import { civicCategories } from '@/design/design-tokens';

import { useFhevm } from '@/fhevm/FhevmProvider';

import { useCivicVoiceContract } from './useCivicVoiceContract';

type SubmitScoreInput = {
  categoryId: number;
  value: number;
};

export function useAggregateScores(categoryId: number) {
  const { contract, chainId } = useCivicVoiceContract();

  return useQuery({
    queryKey: ['civicvoice', 'aggregate', chainId, categoryId],
    enabled: Boolean(contract),
    queryFn: async () => {
      if (!contract) {
        throw new Error('CivicVoice contract unavailable');
      }
      const reader = contract as typeof contract & {
        getEncryptedAggregate: (categoryId: number) => Promise<[string, string]>;
      };
      const [sumHandle, countHandle] = await reader.getEncryptedAggregate(categoryId);
      return {
        sumHandle: sumHandle as string,
        countHandle: countHandle as string,
      };
    },
    staleTime: 20_000,
  });
}

export function useAggregatesForCategories(categoryIds: number[]) {
  const { contract, chainId } = useCivicVoiceContract();

  return useQueries({
    queries: categoryIds.map((categoryId) => ({
      queryKey: ['civicvoice', 'aggregate', chainId, categoryId],
      enabled: Boolean(contract),
      queryFn: async () => {
        if (!contract) {
          throw new Error('CivicVoice contract unavailable');
        }
        const reader = contract as typeof contract & {
          getEncryptedAggregate: (categoryId: number) => Promise<[string, string]>;
        };
        const [sumHandle, countHandle] = await reader.getEncryptedAggregate(categoryId);
        return { sumHandle: sumHandle as string, countHandle: countHandle as string, categoryId };
      },
      staleTime: 20_000,
    })),
  });
}

export function useCivicVoice() {
  const { contract, signer, wallet, deployment } = useCivicVoiceContract();
  const fhevm = useFhevm();
  const queryClient = useQueryClient();

  const submitScore = useMutation({
    mutationKey: ['civicvoice', 'submit'],
    mutationFn: async ({ categoryId, value }: SubmitScoreInput) => {
      if (!contract || !signer) {
        throw new Error('Connect wallet to submit scores');
      }
      if (!wallet.accounts[0]) {
        throw new Error('No active account');
      }
      if (value < 0 || value > 10) {
        throw new Error('Score must be between 0 and 10');
      }

      const contractAddress = contract.target as string;
      const encrypted = await fhevm.encryptScore(contractAddress, wallet.accounts[0], value);

      const writer = contract.connect(signer) as typeof contract & {
        submitScore: (categoryId: number, handle: string, proof: string) => Promise<unknown>;
      };
      const tx = (await writer.submitScore(categoryId, encrypted.handle, encrypted.proof)) as {
        wait?: () => Promise<unknown>;
        hash?: string;
        blockNumber?: number;
      };

      const receipt = (await tx.wait?.()) as { hash?: string; blockNumber?: number } | undefined;

      await queryClient.invalidateQueries({
        queryKey: ['civicvoice', 'aggregate', wallet.chainId, categoryId],
      });

      return { hash: receipt?.hash, blockNumber: receipt?.blockNumber, encrypted };
    },
  });

  const allowDecryptAll = useMutation({
    mutationKey: ['civicvoice', 'allow-decrypt-all'],
    mutationFn: async () => {
      if (!contract || !signer) {
        throw new Error('Connect wallet to authorize decryption');
      }
      const activeAccount = wallet.accounts[0];
      if (!activeAccount) {
        throw new Error('No active account');
      }

      const writer = contract.connect(signer) as typeof contract & {
        allowDecryptAll: (grantee: string) => Promise<unknown>;
      };
      const tx = (await writer.allowDecryptAll(activeAccount)) as {
        wait?: () => Promise<unknown>;
        hash?: string;
      };
      const receipt = (await tx.wait?.()) as { hash?: string } | undefined;
      return { hash: receipt?.hash };
    },
  });

  const decryptAggregate = useCallback(
    async (categoryId: number, handles: { sumHandle: string; countHandle: string }) => {
      if (!contract) {
        throw new Error('CivicVoice contract unavailable');
      }
      const activeAccount = wallet.accounts[0];
      if (!activeAccount) {
        throw new Error('Connect wallet to decrypt results');
      }

      const contractAddress = contract.target as string;
      const filteredHandles = [handles.sumHandle, handles.countHandle].filter(
        (handle) => handle && handle !== ethers.ZeroHash,
      );

      if (filteredHandles.length === 0) {
        return { values: {}, sum: 0n, count: 0n, average: 0 };
      }

      const result = await fhevm.decryptHandles(contractAddress, filteredHandles, activeAccount, true);
      const values = result.values;

      const rawSum = values[handles.sumHandle];
      const rawCount = values[handles.countHandle];

      const sumValue =
        typeof rawSum === 'bigint' ? rawSum : rawSum ? BigInt(rawSum as string) : (0n as bigint);
      const countValue =
        typeof rawCount === 'bigint' ? rawCount : rawCount ? BigInt(rawCount as string) : (0n as bigint);

      return {
        values,
        sum: sumValue,
        count: countValue,
        average: countValue === 0n ? 0 : Number(sumValue) / Number(countValue),
      };
    },
    [contract, fhevm, wallet.accounts],
  );

  return {
    submitScore,
    allowDecryptAll,
    decryptAggregate,
    wallet,
    deployment,
    categories: civicCategories,
  };
}

