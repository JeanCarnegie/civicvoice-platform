export const runtimeConfig = {
  mockRpcUrl: process.env.NEXT_PUBLIC_MOCK_RPC_URL ?? "http://127.0.0.1:8545",
  relayerUrl: process.env.NEXT_PUBLIC_RELAYER_URL ?? "",
  relayerApiKey: process.env.NEXT_PUBLIC_RELAYER_API_KEY ?? "",
  publicRpcUrl: process.env.NEXT_PUBLIC_PUBLIC_RPC_URL ?? "",
};

