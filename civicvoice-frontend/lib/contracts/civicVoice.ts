import { Contract, type ContractRunner } from "ethers";

import { CivicVoiceFeedbackABI } from "@/abi/CivicVoiceFeedbackABI";
import { CivicVoiceFeedbackAddresses } from "@/abi/CivicVoiceFeedbackAddresses";

export type CivicVoiceDeployment = (typeof CivicVoiceFeedbackAddresses)[keyof typeof CivicVoiceFeedbackAddresses];

/**
 * Resolves deployment configuration for a given chain ID
 * @param chainId - Ethereum chain ID
 * @returns Deployment configuration or undefined if not found
 */
export function resolveCivicVoiceDeployment(chainId?: number): CivicVoiceDeployment | undefined {
    if (!chainId) {
        return undefined;
    }
    const key = chainId.toString() as keyof typeof CivicVoiceFeedbackAddresses;
    return CivicVoiceFeedbackAddresses[key];
}

export function createCivicVoiceContract(runner: ContractRunner, chainId: number): Contract {
    const deployment = resolveCivicVoiceDeployment(chainId);
    if (!deployment) {
        throw new Error(`CivicVoiceFeedback deployment not found for chainId=${chainId}`);
    }
    const address = deployment.address as string | undefined;
    if (!address || address === "0x0000000000000000000000000000000000000000") {
        throw new Error(`CivicVoiceFeedback deployment not found for chainId=${chainId}`);
    }
    return new Contract(address as `0x${string}`, CivicVoiceFeedbackABI.abi, runner);
}


