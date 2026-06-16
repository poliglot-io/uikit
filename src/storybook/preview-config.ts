/**
 * Shared Storybook `preview` pieces (theme switch + parameters).
 *
 * Evaluated on the bundler/browser side, so it can pull in addon packages
 * freely. The `main` side lives in `./preset` and stays Node-ESM clean.
 */

import type { Preview } from "@storybook/react";
import { withThemeByClassName } from "@storybook/addon-themes";

/** Light/dark switch wired to the `.dark` class the tokens key off. */
export const themeDecorator = withThemeByClassName({
  themes: { light: "", dark: "dark" },
  defaultTheme: "light",
});

/** Shared Storybook `preview` parameters. */
export const baseParameters: Preview["parameters"] = {
  layout: "centered",
  controls: {
    matchers: { color: /(background|color)$/i, date: /Date$/i },
  },
  backgrounds: { disable: true },
};
