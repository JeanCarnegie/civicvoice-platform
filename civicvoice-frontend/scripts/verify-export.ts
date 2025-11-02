import { promises as fs } from "fs";
import path from "path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const OUT_DIR = path.resolve(ROOT, "out");

const REQUIRED_PAGES = ["index.html", "submit/index.html", "reports/index.html", "how-it-works/index.html"];

async function main() {
  try {
    await fs.access(OUT_DIR);
  } catch {
    throw new Error('Static export not found. Ensure "next build" produced the out/ directory.');
  }

  await Promise.all(
    REQUIRED_PAGES.map(async (relativePath) => {
      const target = path.resolve(OUT_DIR, relativePath);
      try {
        await fs.access(target);
      } catch {
        throw new Error(`Missing exported page: ${relativePath}`);
      }
    }),
  );

  console.log('Static export verified.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});


