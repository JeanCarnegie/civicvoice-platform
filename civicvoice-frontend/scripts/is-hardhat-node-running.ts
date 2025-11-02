import { JsonRpcProvider } from "ethers";

import { runtimeConfig } from "@/lib/config/runtime";

async function main() {
  const rpcUrl = runtimeConfig.mockRpcUrl;
  const provider = new JsonRpcProvider(rpcUrl);
  try {
    const version = await provider.send("web3_clientVersion", []);
    if (typeof version !== "string" || version.toLowerCase().includes("hardhat") === false) {
      throw new Error(`RPC ${rpcUrl} is reachable but not a Hardhat node.`);
    }
    console.log(`Hardhat node detected: ${version}`);
  } catch (error) {
    console.error(`Hardhat node not reachable at ${rpcUrl}. Start it with "npx hardhat node".`);
    console.error((error as Error).message);
    process.exit(1);
  } finally {
    provider.destroy();
  }
}

main();


