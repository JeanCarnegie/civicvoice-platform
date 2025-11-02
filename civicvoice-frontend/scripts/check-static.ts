import { promises as fs } from "fs";
import path from "path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const APP_DIR = path.resolve(ROOT, "app");

const bannedPatterns = [
  /getServerSideProps/,
  /getServerSidePaths/,
  /getInitialProps/,
  /server-only/,
  /dynamic\s*=\s*['\"]force-dynamic['\"]/,
  /from\s+['\"]next\/headers['\"]/,
  /cookies\s*\(/,
  /export\s+const\s+runtime\s*=\s*['\"]edge['\"]/,
];

async function assertNextConfig() {
  const configPath = path.resolve(ROOT, "next.config.ts");
  const contents = await fs.readFile(configPath, "utf-8");
  if (!contents.includes("output: \"export\"")) {
    throw new Error('next.config.ts must set output: "export"');
  }
  if (!contents.includes("trailingSlash: true")) {
    throw new Error('next.config.ts must enable trailingSlash: true');
  }
  if (!contents.includes("images") || !contents.includes("unoptimized: true")) {
    throw new Error('next.config.ts must set images.unoptimized = true');
  }
}

async function scanForBannedPatterns(dir: string) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.includes("[")) {
        throw new Error(`Dynamic route folder detected (${fullPath}). Provide generateStaticParams or remove dynamic segment.`);
      }
      await scanForBannedPatterns(fullPath);
    } else if (entry.isFile() && /(tsx?|jsx?|mdx?)$/.test(entry.name)) {
      const contents = await fs.readFile(fullPath, "utf-8");
      for (const pattern of bannedPatterns) {
        if (pattern.test(contents)) {
          throw new Error(`Static export violation: ${pattern} found in ${fullPath}`);
        }
      }
    }
  }
}

async function ensureNoApiRoutes() {
  const apiPath = path.join(APP_DIR, "api");
  try {
    await fs.access(apiPath);
    throw new Error('API routes are not allowed for static export (found app/api).');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}

async function main() {
  await assertNextConfig();
  await ensureNoApiRoutes();
  await scanForBannedPatterns(APP_DIR);
  console.log("Static export checks passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});


