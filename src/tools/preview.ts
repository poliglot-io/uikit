/**
 * `preview` — launch Storybook for a project.
 *
 * Zero-config: the project doesn't configure Storybook. When it has no
 * `.storybook/` of its own, this command generates a throwaway config (under
 * `node_modules/.cache`) that reuses the shared preset from
 * `@poliglot-io/uikit/storybook` — pointing the stories glob and Tailwind at
 * the project, and wrapping every story in the workspace shell with a stand-in
 * trigger executor. If the project DOES have its own `.storybook/`, that wins.
 *
 * Storybook itself is owned by the project (a devDependency); this command
 * resolves the project's local Storybook binary and never installs anything.
 */

import { spawn } from "child_process";
import { createServer } from "net";
import { createRequire } from "module";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { dirname, join, resolve } from "path";

/** Storybook's conventional port range; 6006 is its default. */
const PORT_START = 6006;
const PORT_END = 6099;

const STORYBOOK_CONFIG_FILES = ["main.ts", "main.tsx", "main.js", "main.mjs"];

/** Forward slashes so generated globs/imports work regardless of platform. */
function posix(p: string): string {
  return p.replace(/\\/g, "/");
}

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

/** True if the project ships its own Storybook config (which takes precedence). */
function hasOwnConfig(projectDir: string): boolean {
  return STORYBOOK_CONFIG_FILES.some(file =>
    existsSync(join(projectDir, ".storybook", file))
  );
}

/** Locate the installed `@poliglot-io/uikit/dist` from the project. */
function resolveUikitDist(projectDir: string): string {
  try {
    const req = createRequire(join(projectDir, "package.json"));
    const pkgJson = req.resolve("@poliglot-io/uikit/package.json");
    return join(dirname(pkgJson), "dist");
  } catch {
    const guess = join(
      projectDir,
      "node_modules",
      "@poliglot-io",
      "uikit",
      "dist"
    );
    if (existsSync(guess)) return guess;
    throw new Error(
      "Could not find @poliglot-io/uikit in this project. Install it first."
    );
  }
}

/**
 * Generate the throwaway Storybook config that reuses the shared preset, and
 * return its directory. Tailwind scans the project's sources plus the kit's
 * compiled components so every class used in a preview is generated.
 */
function generateConfig(projectDir: string): string {
  // Outside node_modules: the bundler serves the preview entry relative to the
  // project root and special-cases node_modules, so a config dir there fails
  // to resolve. A dotfolder at the project root works and self-ignores.
  const cacheDir = join(projectDir, ".poliglot-storybook");
  mkdirSync(cacheDir, { recursive: true });
  writeFileSync(join(cacheDir, ".gitignore"), "*\n");

  const uikitDist = posix(resolveUikitDist(projectDir));
  const project = posix(projectDir);
  const tokens = `${uikitDist}/storybook/tokens.css`;

  writeFileSync(
    join(cacheDir, "theme.css"),
    `@import "tailwindcss";\n` +
      `@source "${project}/**/*.{ts,tsx,js,jsx,mdx}";\n` +
      `@source "${uikitDist}/**/*.js";\n` +
      `@import "${tokens}";\n`
  );

  // `main` is evaluated by Node, so it imports the dependency-light preset
  // subpath (no relative imports → valid native ESM). `preview` is bundled by
  // the builder, so it can import the full preset.
  writeFileSync(
    join(cacheDir, "main.mjs"),
    `import { defineMain } from "@poliglot-io/uikit/storybook/preset";\n` +
      `export default defineMain(["${project}/**/*.stories.@(ts|tsx|mdx)"]);\n`
  );

  writeFileSync(
    join(cacheDir, "preview.mjs"),
    `import {\n` +
      `  withWorkspaceShell,\n` +
      `  withMockTrigger,\n` +
      `  themeDecorator,\n` +
      `  baseParameters,\n` +
      `} from "@poliglot-io/uikit/storybook";\n` +
      `import "./theme.css";\n\n` +
      `export const parameters = baseParameters;\n` +
      `export const decorators = [\n` +
      `  withMockTrigger(),\n` +
      `  withWorkspaceShell(),\n` +
      `  themeDecorator,\n` +
      `];\n`
  );

  return cacheDir;
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
        "Add it as a dev dependency:\n" +
        "  npm install -D storybook @storybook/react-vite " +
        "@storybook/addon-essentials @storybook/addon-themes " +
        "@tailwindcss/vite tailwindcss"
    );
  }

  const port = options.port ?? (await findOpenPort(PORT_START, PORT_END));
  const args = ["dev", "-p", String(port)];

  if (hasOwnConfig(dir)) {
    console.log("Using this project's .storybook config.");
  } else {
    const configDir = generateConfig(dir);
    args.push("-c", configDir);
    console.log("Using the bundled zero-config preview.");
  }

  console.log(`Starting Storybook on port ${port}...\n`);

  const child = spawn(bin, args, { cwd: dir, stdio: "inherit" });

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
