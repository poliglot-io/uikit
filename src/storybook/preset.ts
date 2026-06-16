/**
 * Shared Storybook `main` config.
 *
 * Kept dependency-light and free of relative imports so it is valid native
 * ESM: the consumer preview's `main` is evaluated by Node (not the bundler),
 * and imports this through the `@poliglot-io/uikit/storybook/preset` subpath.
 * The decorator/theme side lives in `./preview-config` (bundler-evaluated).
 */

import type { StorybookConfig } from "@storybook/react-vite";
import tailwindcss from "@tailwindcss/vite";

/**
 * Build a Storybook `main` config. Callers pass the `stories` globs for their
 * own project; framework, addons, and the Tailwind plugin are shared.
 */
export function defineMain(
  stories: StorybookConfig["stories"]
): StorybookConfig {
  return {
    stories,
    addons: ["@storybook/addon-essentials", "@storybook/addon-themes"],
    framework: { name: "@storybook/react-vite", options: {} },
    viteFinal: async config => {
      config.plugins = config.plugins ?? [];
      config.plugins.push(tailwindcss());
      // Force the automatic JSX runtime so a consumer's components need no
      // `import React` and no tsconfig of their own (esbuild defaults to the
      // classic runtime otherwise → "React is not defined").
      config.esbuild = { ...(config.esbuild || {}), jsx: "automatic" };
      return config;
    },
  };
}
