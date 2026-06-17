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
    // addon-essentials was dissolved into core in Storybook 9; its features
    // (controls, actions, viewport, backgrounds, toolbars) ship built in.
    addons: ["@storybook/addon-themes"],
    framework: { name: "@storybook/react-vite", options: {} },
    viteFinal: async config => {
      config.plugins = config.plugins ?? [];
      config.plugins.push(tailwindcss());
      // Force the automatic JSX runtime so a consumer's components need no
      // `import React` and no tsconfig of their own (esbuild defaults to the
      // classic runtime otherwise → "React is not defined").
      config.esbuild = { ...(config.esbuild || {}), jsx: "automatic" };
      // Pre-bundle react explicitly. A consumer's components use the automatic
      // JSX runtime (no `import React`), so Vite's dep scanner finds no bare
      // `react` import in their source and won't optimize it. But this package's
      // prebuilt preview helpers (ESM under node_modules, which the scanner
      // skips) DO import react — so without this, react is served raw (CJS, no
      // `default` export) and the helpers fail to load. Dedupe so a single
      // optimized copy backs both the helpers and the consumer's components.
      config.optimizeDeps = {
        ...(config.optimizeDeps ?? {}),
        include: [
          ...(config.optimizeDeps?.include ?? []),
          "react",
          "react-dom",
          "react/jsx-runtime",
          "react/jsx-dev-runtime",
        ],
      };
      config.resolve = config.resolve ?? {};
      config.resolve.dedupe = [
        ...(config.resolve.dedupe ?? []),
        "react",
        "react-dom",
      ];
      return config;
    },
  };
}
