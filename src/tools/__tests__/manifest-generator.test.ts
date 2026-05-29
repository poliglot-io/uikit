import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, rmSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import {
  generateManifest,
  writeManifest,
  generateAndWriteManifest,
  type ComponentManifest,
} from "../manifest-generator.js";

describe("manifest-generator", () => {
  const testDir = join(process.cwd(), ".test-temp-manifest");

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  describe("generateManifest", () => {
    it("generates manifest from named exports", () => {
      const content = `export { Button } from './button';`;
      writeFileSync(join(testDir, "index.ts"), content);
      writeFileSync(
        join(testDir, "button.tsx"),
        "export const Button = () => null;"
      );

      const manifest = generateManifest(join(testDir, "index.ts"));

      expect(manifest).toHaveProperty(
        "@poliglot-io/uikit/components/button#Button"
      );
      expect(manifest["@poliglot-io/uikit/components/button#Button"]).toEqual({
        id: "@poliglot-io/uikit/components/button",
        chunks: [],
        name: "Button",
      });
    });

    it("generates manifest for multiple components from same file", () => {
      const content = `export { Button, buttonVariants } from './button';`;
      writeFileSync(join(testDir, "index.ts"), content);
      writeFileSync(
        join(testDir, "button.tsx"),
        "export const Button = () => null; export const buttonVariants = {};"
      );

      const manifest = generateManifest(join(testDir, "index.ts"));

      expect(manifest).toHaveProperty(
        "@poliglot-io/uikit/components/button#Button"
      );
      expect(manifest).toHaveProperty(
        "@poliglot-io/uikit/components/button#buttonVariants"
      );
    });

    it("generates manifest for components from different files", () => {
      const content = `
export { Button } from './button';
export { Card } from './card';
`;
      writeFileSync(join(testDir, "index.ts"), content);
      writeFileSync(
        join(testDir, "button.tsx"),
        "export const Button = () => null;"
      );
      writeFileSync(
        join(testDir, "card.tsx"),
        "export const Card = () => null;"
      );

      const manifest = generateManifest(join(testDir, "index.ts"));

      expect(manifest).toHaveProperty(
        "@poliglot-io/uikit/components/button#Button"
      );
      expect(manifest).toHaveProperty(
        "@poliglot-io/uikit/components/card#Card"
      );
    });

    it("handles export * from pattern", () => {
      // Note: export * from './submodule' - submodule.ts must exist as a file
      const indexContent = `export * from './submodule';`;
      const submoduleContent = `
export { Button } from './button';
export { Card } from './card';
`;
      writeFileSync(join(testDir, "index.ts"), indexContent);
      writeFileSync(join(testDir, "submodule.ts"), submoduleContent);
      writeFileSync(
        join(testDir, "button.tsx"),
        "export const Button = () => null;"
      );
      writeFileSync(
        join(testDir, "card.tsx"),
        "export const Card = () => null;"
      );

      const manifest = generateManifest(join(testDir, "index.ts"));

      expect(Object.keys(manifest).length).toBe(2);
      expect(manifest).toHaveProperty(
        "@poliglot-io/uikit/components/button#Button"
      );
      expect(manifest).toHaveProperty(
        "@poliglot-io/uikit/components/card#Card"
      );
    });

    it("returns empty manifest for empty index", () => {
      writeFileSync(join(testDir, "index.ts"), "");

      const manifest = generateManifest(join(testDir, "index.ts"));

      expect(manifest).toEqual({});
    });

    it("creates unique flight IDs for each component", () => {
      const content = `
export { Button } from './button';
export { Card, CardHeader, CardContent } from './card';
`;
      writeFileSync(join(testDir, "index.ts"), content);
      writeFileSync(
        join(testDir, "button.tsx"),
        "export const Button = () => null;"
      );
      writeFileSync(
        join(testDir, "card.tsx"),
        "export const Card = () => null; export const CardHeader = () => null; export const CardContent = () => null;"
      );

      const manifest = generateManifest(join(testDir, "index.ts"));
      const flightIds = Object.keys(manifest);

      // All IDs should be unique
      const uniqueIds = new Set(flightIds);
      expect(uniqueIds.size).toBe(flightIds.length);
    });
  });

  describe("writeManifest", () => {
    it("writes manifest to JSON file", () => {
      const manifest: ComponentManifest = {
        "@poliglot-io/uikit/components/button#Button": {
          id: "@poliglot-io/uikit/components/button",
          chunks: [],
          name: "Button",
        },
      };
      const outputPath = join(testDir, "manifest.json");

      writeManifest(manifest, outputPath);

      expect(existsSync(outputPath)).toBe(true);
      const content = JSON.parse(readFileSync(outputPath, "utf-8"));
      expect(content).toEqual(manifest);
    });

    it("formats JSON with indentation", () => {
      const manifest: ComponentManifest = {
        "@poliglot-io/uikit/components/button#Button": {
          id: "@poliglot-io/uikit/components/button",
          chunks: [],
          name: "Button",
        },
      };
      const outputPath = join(testDir, "manifest.json");

      writeManifest(manifest, outputPath);

      const content = readFileSync(outputPath, "utf-8");
      expect(content).toContain("\n"); // Should have newlines (formatted)
    });
  });

  describe("generateAndWriteManifest", () => {
    it("generates and writes manifest in one call", async () => {
      const content = `
export { Button } from './button';
export { Card } from './card';
`;
      writeFileSync(join(testDir, "index.ts"), content);
      writeFileSync(
        join(testDir, "button.tsx"),
        "export const Button = () => null;"
      );
      writeFileSync(
        join(testDir, "card.tsx"),
        "export const Card = () => null;"
      );
      const outputPath = join(testDir, "manifest.json");

      const result = await generateAndWriteManifest(
        join(testDir, "index.ts"),
        outputPath
      );

      expect(result.componentCount).toBe(2);
      expect(Object.keys(result.manifest)).toHaveLength(2);
      expect(existsSync(outputPath)).toBe(true);
    });

    it("returns correct component count", async () => {
      const content = `
export { Button, buttonVariants } from './button';
export { Card, CardHeader, CardContent, CardFooter } from './card';
`;
      writeFileSync(join(testDir, "index.ts"), content);
      writeFileSync(
        join(testDir, "button.tsx"),
        "export const Button = () => null; export const buttonVariants = {};"
      );
      writeFileSync(
        join(testDir, "card.tsx"),
        "export const Card = () => null; export const CardHeader = () => null; export const CardContent = () => null; export const CardFooter = () => null;"
      );
      const outputPath = join(testDir, "manifest.json");

      const result = await generateAndWriteManifest(
        join(testDir, "index.ts"),
        outputPath
      );

      expect(result.componentCount).toBe(6); // Button, buttonVariants, Card, CardHeader, CardContent, CardFooter
    });
  });
});
