import type { Preview } from "@storybook/react";
import { themeDecorator, baseParameters } from "../src/storybook/preview-config";
import "./theme.css";

const preview: Preview = {
  parameters: baseParameters,
  decorators: [themeDecorator],
};

export default preview;
