import { Contract, JsonRpcProvider, ethers } from "ethers";

import { runtimeConfig } from "@/lib/config/runtime";

import { MockFhevmInstance } from "@fhevm/mock-utils";
import type { FhevmInstance, FhevmInstanceConfig } from "@zama-fhe/relayer-sdk/web";

export type FhevmMode = "mock" | "relayer";

export type CreateFheInstanceOptions = {
  provider: ethers.Eip1193Provider | string;
  chainId: number;
  signal?: AbortSignal;
};

export type FhevmInstanceResult = {
  instance: FhevmInstance;
  mode: FhevmMode;
  chainId: number;
};

async function fetchJsonRpc<T>(rpcUrl: string, method: string, params: unknown[] = [], signal?: AbortSignal): Promise<T> {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method, params }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`RPC request failed: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  if (payload.error) {
    throw new Error(payload.error.message ?? `RPC error invoking ${method}`);
  }
  return payload.result as T;
}

async function createMockInstance(chainId: number, signal?: AbortSignal): Promise<FhevmInstanceResult> {
  const rpcUrl = runtimeConfig.mockRpcUrl;

  const metadata = await fetchJsonRpc<{
    ACLAddress: `0x${string}`;
    InputVerifierAddress: `0x${string}`;
    KMSVerifierAddress: `0x${string}`;
    VerifyingContractAddressDecryption?: `0x${string}`;
    VerifyingContractAddressInputVerification?: `0x${string}`;
    GatewayChainId?: number;
  }>(rpcUrl, "fhevm_relayer_metadata", [], signal);

  const provider = new JsonRpcProvider(rpcUrl);

  // Query InputVerifier EIP712 domain to get the actual verifyingContract address and chainId
  const inputVerifierContract = new Contract(
    metadata.InputVerifierAddress,
    [
      "function eip712Domain() external view returns (bytes1 fields, string name, string version, uint256 chainId, address verifyingContract, bytes32 salt, uint256[] extensions)",
    ],
    provider,
  );

  let verifyingContractAddressInputVerification: `0x${string}`;
  let gatewayChainId: number;

  try {
    const domain = await inputVerifierContract.eip712Domain();
    verifyingContractAddressInputVerification = domain[4] as `0x${string}`; // verifyingContract is at index 4
    gatewayChainId = Number(domain[3]); // chainId from EIP712 domain - MUST match for assertion
    console.log("[fhevmMockCreateInstance] InputVerifier EIP712 domain:", {
      gatewayChainId,
      verifyingContract: verifyingContractAddressInputVerification,
      name: domain[1],
      version: domain[2],
    });
  } catch (error) {
    console.error("[fhevmMockCreateInstance] ❌ Failed to query InputVerifier EIP712 domain:", error);
    console.warn("[fhevmMockCreateInstance] Using fallback values");
    verifyingContractAddressInputVerification = (
      metadata.VerifyingContractAddressInputVerification ?? "0x812b06e1CDCE800494b79fFE4f925A504a9A9810"
    ) as `0x${string}`;
    gatewayChainId = metadata.GatewayChainId ?? 55815;
    console.warn("[fhevmMockCreateInstance] Fallback verifyingContract:", verifyingContractAddressInputVerification);
    console.warn("[fhevmMockCreateInstance] Fallback gatewayChainId:", gatewayChainId);
  }

  // Config requirements:
  // - chainId: Use wallet's chainId (31337) for the contract network
  // - gatewayChainId: MUST match inputVerifier.eip712Domain.chainId (10901) for assertion to pass
  // - verifyingContractAddressInputVerification: MUST match inputVerifier.eip712Domain.verifyingContract
  const config = {
    aclContractAddress: metadata.ACLAddress,
    chainId: chainId, // Use wallet's chainId (31337) for contract network
    gatewayChainId: gatewayChainId, // MUST match EIP712 domain chainId (10901)
    inputVerifierContractAddress: metadata.InputVerifierAddress,
    kmsContractAddress: metadata.KMSVerifierAddress,
    verifyingContractAddressDecryption:
      metadata.VerifyingContractAddressDecryption ?? "0x5ffdaAB0373E62E2ea2944776209aEf29E631A64",
    verifyingContractAddressInputVerification,
  };

  console.log("[fhevmMockCreateInstance] Config:", {
    chainId: config.chainId,
    gatewayChainId: config.gatewayChainId,
    inputVerifierContractAddress: config.inputVerifierContractAddress,
    verifyingContractAddressInputVerification: config.verifyingContractAddressInputVerification,
  });

  const instance = await MockFhevmInstance.create(provider as never, provider, config, {
    inputVerifierProperties: {},
    kmsVerifierProperties: {},
  });

  console.log("[fhevmMockCreateInstance] ✅ Mock FHEVM instance created successfully");
  console.log("[fhevmMockCreateInstance] Instance type:", typeof instance);
  console.log("[fhevmMockCreateInstance] Instance methods:", Object.keys(instance).filter(key => typeof (instance as any)[key] === 'function'));

  return { instance: instance as unknown as FhevmInstance, mode: "mock", chainId };
}

type RelayerModule = typeof import("@zama-fhe/relayer-sdk/web");

declare global {
  interface Window {
    relayerSDK?: RelayerModule & { __initialized__?: boolean };
  }
}

const RELAYER_CDN = "https://cdn.zama.org/relayer-sdk-js/0.3.0-5/relayer-sdk-js.umd.cjs";
const RELAYER_LOCAL = "/relayer-sdk-js.umd.cjs";

async function loadRelayerModule(): Promise<RelayerModule> {
  if (typeof window === "undefined") {
    throw new Error("Relayer SDK requires a browser environment");
  }

  if (window.relayerSDK) {
    return window.relayerSDK;
  }

  if (!document.querySelector("script[data-relayer-sdk]") && typeof document !== "undefined") {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.async = true;
      script.crossOrigin = "anonymous";
      script.setAttribute("data-relayer-sdk", "true");
      
      // Try CDN first, fallback to local
      script.src = RELAYER_CDN;
      script.onerror = () => {
        console.warn("[RelayerSDKLoader] CDN failed, trying local backup");
        script.src = RELAYER_LOCAL;
        script.onerror = () => reject(new Error("Failed to load relayer SDK from both CDN and local"));
      };
      
      script.onload = () => resolve();
      document.body.appendChild(script);
    });
  }

  if (window.relayerSDK) {
    return window.relayerSDK;
  }

  const module = await import("@zama-fhe/relayer-sdk/web");
  window.relayerSDK = module;
  return module;
}

async function createRelayerInstance(
  options: CreateFheInstanceOptions,
  signal?: AbortSignal,
): Promise<FhevmInstanceResult> {
  const module = await loadRelayerModule();

  const moduleWithFlag = module as RelayerModule & { __initialized__?: boolean };

  if (!moduleWithFlag.__initialized__) {
    const initResult = await module.initSDK();
    if (!initResult) {
      throw new Error("Unable to initialize relayer SDK");
    }
    moduleWithFlag.__initialized__ = true;
    if (typeof window !== "undefined") {
      window.relayerSDK = moduleWithFlag;
    }
  }

  const baseConfig: FhevmInstanceConfig = {
    ...moduleWithFlag.SepoliaConfig,
    network: options.provider,
  };

  if (runtimeConfig.relayerUrl) {
    baseConfig.relayerUrl = runtimeConfig.relayerUrl;
  }

  if (runtimeConfig.relayerApiKey) {
    baseConfig.auth = {
      __type: "ApiKeyHeader",
      header: "x-api-key",
      value: runtimeConfig.relayerApiKey,
    } as FhevmInstanceConfig["auth"];
  }

  const instance = await module.createInstance(baseConfig);
  return { instance, mode: "relayer", chainId: options.chainId };
}

export async function createFheInstance(options: CreateFheInstanceOptions): Promise<FhevmInstanceResult> {
  if (options.signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  if (options.chainId === 31337) {
    return createMockInstance(options.chainId, options.signal);
  }

  return createRelayerInstance(options, options.signal);
}

