/**
 * Preview server - simplified orchestrator.
 *
 * Looks for poliglot.preview.js config file and starts Vite dev server
 * with the pre-built preview app.
 */

import { createServer } from "vite";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";
import { createViteConfig } from "./vite-config.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Path to UIKit package root (relative to this file in dist/tools/preview/)
const UIKIT_PATH = resolve(__dirname, "../../..");

// Path to preview-app source - Vite processes TSX on the fly
const PREVIEW_APP_PATH = resolve(UIKIT_PATH, "src/preview-app");

export interface StartPreviewOptions {
  port?: number;
  host?: string;
}

/**
 * Find the preview config file in the project.
 * Looks for poliglot.preview.js, poliglot.preview.ts, poliglot.preview.mjs
 */
function findPreviewConfig(projectDir: string): string | null {
  const candidates = [
    "poliglot.preview.js",
    "poliglot.preview.ts",
    "poliglot.preview.mjs",
    "poliglot.preview.tsx",
  ];

  for (const candidate of candidates) {
    const configPath = resolve(projectDir, candidate);
    if (existsSync(configPath)) {
      return configPath;
    }
  }

  return null;
}

/**
 * Start the preview development server.
 *
 * @param projectDir - Path to the project containing the preview config
 * @param options - Server options
 */
export async function startPreviewServer(
  projectDir: string,
  options: StartPreviewOptions = {}
): Promise<void> {
  const { port = 3333, host = "localhost" } = options;

  // Resolve to absolute path
  const absoluteProjectDir = resolve(projectDir);

  // Find preview config
  const configPath = findPreviewConfig(absoluteProjectDir);

  if (!configPath) {
    console.log("\nNo preview config found.");
    console.log("Create a poliglot.preview.js file in your project root:\n");
    console.log("  // poliglot.preview.js");
    console.log("  import PersonCard from './src/components/PersonCard';");
    console.log("");
    console.log("  export default {");
    console.log("    PersonCard: {");
    console.log("      component: PersonCard,");
    console.log("      variants: [");
    console.log("        { name: 'Default', props: { id: 1, name: 'John' } },");
    console.log("      ],");
    console.log("    },");
    console.log("  };\n");
    return;
  }

  console.log(`Found preview config: ${configPath}`);
  console.log("Starting preview server...\n");

  const viteConfig = createViteConfig({
    previewAppPath: PREVIEW_APP_PATH,
    uikitPath: UIKIT_PATH,
    projectDir: absoluteProjectDir,
    configPath,
    port,
    host,
  });

  const server = await createServer(viteConfig);

  // Cleanup on exit
  const cleanup = () => {
    console.log("\nShutting down...");
    server.close();
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  await server.listen();
  server.printUrls();
}

// Export types for consumers
export type {
  PreviewVariant,
  ComponentPreview,
  PreviewRegistry,
} from "../../preview-app/App.js";
