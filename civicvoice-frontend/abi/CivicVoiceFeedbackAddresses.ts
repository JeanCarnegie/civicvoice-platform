export const CivicVoiceFeedbackAddresses = {
  "31337": {
    "address": "0x8b220f6784BCDbB668b35E439276bAeD420b1A46",
    "chainId": 31337,
    "chainName": "Hardhat Localhost",
    "rpcUrl": "http://127.0.0.1:8545"
  },
  "11155111": {
    "address": "0xb70d1D4D8773F87A99CADa9440DD58BE73342976",
    "chainId": 11155111,
    "chainName": "Sepolia"
  }
} as const;

export type CivicVoiceDeployment = typeof CivicVoiceFeedbackAddresses[keyof typeof CivicVoiceFeedbackAddresses];
