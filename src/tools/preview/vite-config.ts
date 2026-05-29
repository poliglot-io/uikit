/**
 * Programmatic Vite configuration for the preview server.
 */

import type { InlineConfig, Plugin, PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export interface ViteConfigOptions {
  /** Path to the preview-app source directory */
  previewAppPath: string;
  /** Path to the UIKit package root */
  uikitPath: string;
  /** Path to the user's project directory */
  projectDir: string;
  /** Path to the user's poliglot.preview.js config file */
  configPath: string;
  /** Port to run the server on */
  port: number;
  /** Host to bind to */
  host: string;
}

/**
 * Virtual module plugin that provides the user's preview config.
 */
function previewConfigPlugin(configPath: string): Plugin {
  const virtualModuleId = "virtual:preview-config";
  const resolvedVirtualModuleId = "\0" + virtualModuleId;

  return {
    name: "preview-config",
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        // Re-export the user's config as the default export
        return `export { default } from '${configPath}';`;
      }
    },
  };
}

/**
 * Plugin that injects @source directives into preview app's CSS.
 * This tells Tailwind to scan both user's components AND UIKit components.
 */
function injectTailwindSource(projectDir: string, uikitPath: string): Plugin {
  return {
    name: "inject-tailwind-source",
    enforce: "pre",
    transform(code, id) {
      // Only transform the preview app's styles.css
      if (id.includes("preview-app") && id.endsWith("styles.css")) {
        // Inject @source for both user's project and UIKit components
        const sourceDirectives = [
          `@source "${projectDir}/**/*.{js,ts,jsx,tsx}";`,
          `@source "${uikitPath}/dist/components/**/*.{js,ts,jsx,tsx}";`,
        ].join("\n");

        return code.replace(
          '@import "tailwindcss";',
          `@import "tailwindcss";\n${sourceDirectives}`
        );
      }
    },
  };
}

/**
 * Create an inline Vite configuration for the preview server.
 */
export function createViteConfig(options: ViteConfigOptions): InlineConfig {
  const { previewAppPath, uikitPath, projectDir, configPath, port, host } =
    options;

  return {
    root: previewAppPath,
    configFile: false, // Don't look for vite.config.ts
    plugins: [
      injectTailwindSource(projectDir, uikitPath),
      react() as PluginOption,
      tailwindcss() as PluginOption,
      previewConfigPlugin(configPath),
    ],
    server: {
      port,
      host,
      open: true, // Auto-open browser
      fs: {
        // Allow serving files from these directories
        allow: [previewAppPath, uikitPath, projectDir],
      },
    },
    optimizeDeps: {
      // Include these dependencies in the dev server bundle
      include: ["react", "react-dom"],
    },
    logLevel: "info",
  };
}
