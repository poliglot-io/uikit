#!/usr/bin/env node

/**
 * Copy src/preview-app/ source files into dist/preview-app/.
 *
 * Vite's preview server (driven by dist/tools/preview/vite-config.js)
 * uses dist/preview-app as its root. It needs the source files at runtime
 * (index.html, main.tsx, styles.css, App.tsx) since Vite handles TSX/CSS
 * natively in dev mode. tsc alone only emits .js/.d.ts for .tsx — it
 * doesn't carry index.html or styles.css forward.
 */

import { existsSync, mkdirSync, readdirSync, copyFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

const SRC = join(rootDir, "src/preview-app");
const DEST = join(rootDir, "dist/preview-app");

if (!existsSync(SRC)) {
  console.error(`No preview-app source at ${SRC}`);
  process.exit(1);
}

mkdirSync(DEST, { recursive: true });

let count = 0;
for (const name of readdirSync(SRC)) {
  copyFileSync(join(SRC, name), join(DEST, name));
  count++;
}

console.log(`Copied ${count} file(s) into dist/preview-app/`);
