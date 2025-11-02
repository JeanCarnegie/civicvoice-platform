import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FRONTEND_ROOT = path.resolve(__dirname, "..");
const BACKEND_ROOT = path.resolve(FRONTEND_ROOT, "../fhevm-hardhat-template");

const ABI_OUTPUT = path.resolve(FRONTEND_ROOT, "abi/CivicVoiceFeedbackABI.ts");
const ADDR_OUTPUT = path.resolve(FRONTEND_ROOT, "abi/CivicVoiceFeedbackAddresses.ts");

const ARTIFACT_PATH = path.resolve(
  BACKEND_ROOT,
  "artifacts/contracts/CivicVoiceFeedback.sol/CivicVoiceFeedback.json",
);

const NETWORK_MAP: Record<string, { chainId: number; chainName: string; rpcUrl?: string }> = {
  localhost: { chainId: 31337, chainName: "Hardhat Localhost", rpcUrl: "http://127.0.0.1:8545" },
  hardhat: { chainId: 31337, chainName: "Hardhat" },
  anvil: { chainId: 31337, chainName: "Anvil", rpcUrl: "http://127.0.0.1:8545" },
  sepolia: { chainId: 11155111, chainName: "Sepolia" },
};

type DeploymentEntry = {
  address: string;
  chainId: number;
  chainName: string;
  rpcUrl?: string;
};

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

async function ensureDir(target: string) {
  await fs.mkdir(path.dirname(target), { recursive: true });
}

async function readArtifact() {
  try {
    const contents = await fs.readFile(ARTIFACT_PATH, "utf-8");
    return JSON.parse(contents);
  } catch (error) {
    throw new Error(`Failed to read artifact at ${ARTIFACT_PATH}: ${(error as Error).message}`);
  }
}

async function collectDeployments(): Promise<Record<string, DeploymentEntry>> {
  const deploymentsDir = path.resolve(BACKEND_ROOT, "deployments");
  const entries: Record<string, DeploymentEntry> = {};

  let folders: string[] = [];
  try {
    folders = await fs.readdir(deploymentsDir);
  } catch {
    console.warn(`No deployments directory found at ${deploymentsDir}. Running scripts will generate it.`);
    return entries;
  }

  await Promise.all(
    folders.map(async (folder) => {
      const mapping = NETWORK_MAP[folder];
      if (!mapping) {
        return;
      }
      const filepath = path.resolve(deploymentsDir, folder, "CivicVoiceFeedback.json");
      try {
        const contents = await fs.readFile(filepath, "utf-8");
        const json = JSON.parse(contents);
        const address = json.address as string;
        entries[mapping.chainId.toString()] = {
          address,
          chainId: mapping.chainId,
          chainName: mapping.chainName,
          rpcUrl: mapping.rpcUrl,
        };
      } catch {
        entries[mapping.chainId.toString()] = {
          address: ZERO_ADDRESS,
          chainId: mapping.chainId,
          chainName: mapping.chainName,
          rpcUrl: mapping.rpcUrl,
        };
        console.warn(`Deployment missing for ${folder}. Run "npx hardhat --network ${folder} deploy" 需运行生成.`);
      }
    }),
  );

  return entries;
}

function formatAbiModule(artifact: { abi: unknown }) {
  const serialized = JSON.stringify(artifact.abi, null, 2);
  return `export const CivicVoiceFeedbackABI = {
  abi: ${serialized}
} as const;

export default CivicVoiceFeedbackABI;
`;
}

function formatAddressModule(entries: Record<string, DeploymentEntry>) {
  const serialized = Object.fromEntries(
    Object.entries(entries).map(([key, value]) => [key, { ...value }]),
  );
  const json = JSON.stringify(serialized, null, 2);
  return `export const CivicVoiceFeedbackAddresses = ${json} as const;

export type CivicVoiceDeployment = typeof CivicVoiceFeedbackAddresses[keyof typeof CivicVoiceFeedbackAddresses];
`;
}

async function main() {
  const artifact = await readArtifact();
  const deployments = await collectDeployments();

  if (!Object.keys(deployments).length) {
    console.warn("No CivicVoiceFeedback deployments detected; address map will be empty (需运行生成).");
  }

  await ensureDir(ABI_OUTPUT);
  await fs.writeFile(ABI_OUTPUT, formatAbiModule(artifact));
  await fs.writeFile(ADDR_OUTPUT, formatAddressModule(deployments));

  console.log(`Generated ABI at ${path.relative(FRONTEND_ROOT, ABI_OUTPUT)}`);
  console.log(`Generated address map at ${path.relative(FRONTEND_ROOT, ADDR_OUTPUT)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

