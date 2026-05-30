import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from "fs";
import { join } from "path";
import { build, buildClientArtifacts } from "../compiler.js";

describe("compiler", () => {
  const testDir = join(process.cwd(), ".test-temp-compiler");

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  describe("build", () => {
    function setupProject(components: Record<string, string>) {
      const srcDir = join(testDir, "src", "components");
      mkdirSync(srcDir, { recursive: true });
      for (const [name, content] of Object.entries(components)) {
        writeFileSync(join(srcDir, name), content);
      }
    }

    function buildOptions() {
      return {
        entry: join(testDir, "src/components/index.ts"),
        outFile: join(testDir, ".matrix/dist/components.js"),
        quiet: true,
      };
    }

    it("returns error when entry point not found", async () => {
      const result = await build(buildOptions());

      expect(result.success).toBe(false);
      expect(result.error).toContain("Entry point not found");
    });

    it("builds components successfully", async () => {
      setupProject({
        "index.ts": `
export { Button } from './button';
`,
        "button.tsx": `
import React from 'react';
export function Button({ children }: { children: React.ReactNode }) {
  return <button>{children}</button>;
}
`,
      });

      const result = await build(buildOptions());

      expect(result.success).toBe(true);
      expect(result.exports).toContain("Button");
      expect(existsSync(result.outFile)).toBe(true);
    });

    it("creates output directory if it does not exist", async () => {
      setupProject({
        "index.ts": 'export const VERSION = "1.0.0";',
      });

      const result = await build(buildOptions());

      expect(result.success).toBe(true);
      expect(existsSync(join(testDir, ".matrix", "dist"))).toBe(true);
    });

    it("extracts multiple exports", async () => {
      setupProject({
        "index.ts": `
export { Button, buttonVariants } from './button';
export { Card, CardHeader } from './card';
`,
        "button.tsx": `
export const Button = () => null;
export const buttonVariants = {};
`,
        "card.tsx": `
export const Card = () => null;
export const CardHeader = () => null;
`,
      });

      const result = await build(buildOptions());

      expect(result.success).toBe(true);
      expect(result.exports).toContain("Button");
      expect(result.exports).toContain("buttonVariants");
      expect(result.exports).toContain("Card");
      expect(result.exports).toContain("CardHeader");
    });

    it("handles build errors gracefully", async () => {
      setupProject({
        "index.ts": `
import { NonExistent } from './non-existent';
export { NonExistent };
`,
      });

      const result = await build(buildOptions());

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("buildClientArtifacts", () => {
    function setupUikit(components: Record<string, string>) {
      const srcDir = join(testDir, "src", "components");
      mkdirSync(srcDir, { recursive: true });

      for (const [name, content] of Object.entries(components)) {
        writeFileSync(join(srcDir, name), content);
      }
    }

    it("returns error when components index not found", async () => {
      const result = await buildClientArtifacts(testDir, { quiet: true });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Components index not found");
    });

    it("generates manifest and stubs", async () => {
      setupUikit({
        "index.ts": `
export { Button } from './button';
export { Card } from './card';
`,
        "button.tsx": "export const Button = () => null;",
        "card.tsx": "export const Card = () => null;",
      });

      const result = await buildClientArtifacts(testDir, { quiet: true });

      expect(result.success).toBe(true);
      expect(result.componentCount).toBe(2);
      expect(existsSync(result.manifestFile)).toBe(true);
      expect(existsSync(result.stubsFile)).toBe(true);
    });

    it("manifest file contains correct structure", async () => {
      setupUikit({
        "index.ts": `export { Button } from './button';`,
        "button.tsx": "export const Button = () => null;",
      });

      const result = await buildClientArtifacts(testDir, { quiet: true });

      const manifest = JSON.parse(readFileSync(result.manifestFile, "utf-8"));
      expect(manifest).toHaveProperty(
        "@poliglot-io/uikit/components/button#Button"
      );
      expect(manifest["@poliglot-io/uikit/components/button#Button"]).toEqual({
        id: "@poliglot-io/uikit/components/button",
        chunks: [],
        name: "Button",
      });
    });

    it("stubs file contains CLIENT_REFERENCE", async () => {
      setupUikit({
        "index.ts": `export { Button } from './button';`,
        "button.tsx": "export const Button = () => null;",
      });

      const result = await buildClientArtifacts(testDir, { quiet: true });

      const stubs = readFileSync(result.stubsFile, "utf-8");
      expect(stubs).toContain("CLIENT_REFERENCE");
      expect(stubs).toContain("createClientReference");
      expect(stubs).toContain("Button");
    });

    it("creates dist directory if it does not exist", async () => {
      setupUikit({
        "index.ts": 'export const VERSION = "1.0.0";',
      });

      await buildClientArtifacts(testDir, { quiet: true });

      expect(existsSync(join(testDir, "dist"))).toBe(true);
    });
  });
});
