import type { Meta, StoryObj } from "@storybook/react";
import { Mermaid } from "./mermaid";

const meta = {
  title: "Components/Mermaid",
  component: Mermaid,
  tags: ["autodocs"],
} satisfies Meta<typeof Mermaid>;

export default meta;
type Story = StoryObj<typeof meta>;

const flowchart = `flowchart TD
  A[Start] --> B{Ready?}
  B -- Yes --> C[Continue]
  B -- No --> D[Wait]
  D --> B
  C --> E[Done]`;

export const Default: Story = {
  args: {
    chart: flowchart,
  },
};

const sequence = `sequenceDiagram
  participant Client
  participant Server
  Client->>Server: Request
  Server-->>Client: Response`;

export const Sequence: Story = {
  args: {
    chart: sequence,
  },
};
