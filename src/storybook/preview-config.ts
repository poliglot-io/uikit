/**
 * Shared Storybook `preview` pieces (theme switch + viewports + parameters).
 *
 * Evaluated on the bundler/browser side, so it can pull in addon packages
 * freely. The `main` side lives in `./preset` and stays Node-ESM clean.
 */

import type { Preview } from "@storybook/react";
import { withThemeByClassName } from "@storybook/addon-themes";

/**
 * Light/dark switch. The class goes on `<html>` so the whole canvas — including
 * the body background and any portaled/fixed UI — re-themes. (Toggling a story
 * wrapper instead leaves the surrounding background on the light token, which
 * reads as the theme being "stuck".)
 */
export const themeDecorator = withThemeByClassName({
  themes: { light: "", dark: "dark" },
  defaultTheme: "light",
  parentSelector: "html",
});

/** Width presets from a narrow floor up to a wide desktop. */
const viewports = {
  floor: { name: "Floor (360)", styles: { width: "360px", height: "900px" } },
  mobile: { name: "Mobile (390)", styles: { width: "390px", height: "900px" } },
  tablet: { name: "Tablet (768)", styles: { width: "768px", height: "1024px" } },
  laptop: {
    name: "Laptop (1024)",
    styles: { width: "1024px", height: "800px" },
  },
  desktop: {
    name: "Desktop (1280)",
    styles: { width: "1280px", height: "900px" },
  },
  wide: { name: "Wide (1536)", styles: { width: "1536px", height: "960px" } },
};

/** Shared Storybook `preview` parameters. */
export const baseParameters: Preview["parameters"] = {
  layout: "centered",
  controls: {
    matchers: { color: /(background|color)$/i, date: /Date$/i },
  },
  backgrounds: { disable: true },
  // Full-width is the default (no entry selected); these add explicit device
  // widths from mobile up to a wide desktop.
  viewport: { viewports },
};
