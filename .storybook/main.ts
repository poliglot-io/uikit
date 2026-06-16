// Storybook evaluates this file with Node's native loader, so the relative
// import needs an explicit extension.
import { defineMain } from "../src/storybook/preset.ts";

export default defineMain(["../src/**/*.stories.@(ts|tsx|mdx)"]);
