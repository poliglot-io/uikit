/**
 * `preview` — launch Storybook for a project.
 *
 * Storybook is owned by the project (a devDependency, configured under
 * `.storybook/`, scaffolded by `init`). This command just resolves the
 * project's local Storybook binary and starts it on the first open port in
 * the standard Storybook range, so authors get a one-word preview without
 * remembering port flags. It never installs anything.
 */

import { spawn } from "child_process";
import { createServer } from "net";
import { existsSync } from "fs";
import { join, resolve } from "path";

/** Storybook's conventional port range; 6006 is its default. */
const PORT_START = 6006;
const PORT_END = 6099;

const STORYBOOK_CONFIG_FILES = ["main.ts", "main.tsx", "main.js", "main.mjs"];

/** Resolve `true` if nothing is listening on the port on any interface. */
function isPortFree(port: number): Promise<boolean> {
  return new Promise(resolvePort => {
    const server = createServer();
    server.once("error", () => resolvePort(false));
    server.once("listening", () => server.close(() => resolvePort(true)));
    // Bind the wildcard address (not just loopback) so a server listening on
    // 0.0.0.0 — as Storybook's own dev server does — is correctly seen as busy.
    server.listen(port, "0.0.0.0");
  });
}

/** First open port in [start, end], or throw if the range is exhausted. */
async function findOpenPort(start: number, end: number): Promise<number> {
  for (let port = start; port <= end; port++) {
    if (await isPortFree(port)) return port;
  }
  throw new Error(`No open port available in ${start}-${end}.`);
}

function storybookBinary(projectDir: string): string {
  const name = process.platform === "win32" ? "storybook.cmd" : "storybook";
  return join(projectDir, "node_modules", ".bin", name);
}

function hasStorybookConfig(projectDir: string): boolean {
  return STORYBOOK_CONFIG_FILES.some(file =>
    existsSync(join(projectDir, ".storybook", file))
  );
}

export interface PreviewOptions {
  /** Explicit port. Omit to auto-pick the first open port in the range. */
  port?: number;
}

/** Launch Storybook for the project, resolving an open port if none given. */
export async function startPreview(
  projectDir: string,
  options: PreviewOptions = {}
): Promise<void> {
  const dir = resolve(projectDir);

  const bin = storybookBinary(dir);
  if (!existsSync(bin)) {
    throw new Error(
      "Storybook is not installed in this project.\n" +
        "Add it as a dev dependency, then scaffold a config:\n" +
        "  npm install -D storybook @storybook/react-vite @storybook/addon-essentials\n" +
        "  npx poliglot-ui init --name <name> --uri-prefix <uri>"
    );
  }

  if (!hasStorybookConfig(dir)) {
    throw new Error(
      "No .storybook config found in this project.\n" +
        "Run `poliglot-ui init` to scaffold one."
    );
  }

  const port = options.port ?? (await findOpenPort(PORT_START, PORT_END));
  console.log(`Starting Storybook on port ${port}...\n`);

  const child = spawn(bin, ["dev", "-p", String(port)], {
    cwd: dir,
    stdio: "inherit",
  });

  await new Promise<void>((resolvePreview, rejectPreview) => {
    child.on("error", rejectPreview);
    child.on("exit", code => {
      if (code && code !== 0) {
        rejectPreview(new Error(`Storybook exited with code ${code}`));
      } else {
        resolvePreview();
      }
    });
  });
}
