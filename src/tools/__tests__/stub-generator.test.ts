import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, rmSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import {
  generateStubs,
  writeStubs,
  generateAndWriteStubs,
} from "../stub-generator.js";
import type { ComponentManifest } from "../manifest-generator.js";

describe("stub-generator", () => {
  const testDir = join(process.cwd(), ".test-temp-stubs");

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  describe("generateStubs", () => {
    it("generates stubs with CLIENT_REFERENCE symbol", () => {
      const manifest: ComponentManifest = {
        "@poliglot-io/uikit/components/button#Button": {
          id: "@poliglot-io/uikit/components/button",
          chunks: [],
          name: "Button",
        },
      };

      const stubs = generateStubs(manifest);

      expect(stubs).toContain(
        'const CLIENT_REFERENCE = Symbol.for("react.client.reference")'
      );
    });

    it("generates createClientReference helper", () => {
      const manifest: ComponentManifest = {};

      const stubs = generateStubs(manifest);

      expect(stubs).toContain("function createClientReference(id, name)");
      expect(stubs).toContain("$$typeof: { value: CLIENT_REFERENCE");
      expect(stubs).toContain("$$id: { value: id");
      expect(stubs).toContain("$$async: { value: false");
    });

    it("generates stub for each component", () => {
      const manifest: ComponentManifest = {
        "@poliglot-io/uikit/components/button#Button": {
          id: "@poliglot-io/uikit/components/button",
          chunks: [],
          name: "Button",
        },
        "@poliglot-io/uikit/components/card#Card": {
          id: "@poliglot-io/uikit/components/card",
          chunks: [],
          name: "Card",
        },
      };

      const stubs = generateStubs(manifest);

      expect(stubs).toContain(
        'const Button = createClientReference("@poliglot-io/uikit/components/button#Button", "Button")'
      );
      expect(stubs).toContain(
        'const Card = createClientReference("@poliglot-io/uikit/components/card#Card", "Card")'
      );
    });

    it("exports all components", () => {
      const manifest: ComponentManifest = {
        "@poliglot-io/uikit/components/button#Button": {
          id: "@poliglot-io/uikit/components/button",
          chunks: [],
          name: "Button",
        },
        "@poliglot-io/uikit/components/card#Card": {
          id: "@poliglot-io/uikit/components/card",
          chunks: [],
          name: "Card",
        },
      };

      const stubs = generateStubs(manifest);

      expect(stubs).toContain("module.exports = {");
      expect(stubs).toContain("Button,");
      expect(stubs).toContain("Card,");
    });

    it("includes warning comment", () => {
      const manifest: ComponentManifest = {};

      const stubs = generateStubs(manifest);

      expect(stubs).toContain(
        "DO NOT EDIT - regenerate using: npx poliglot-ui build"
      );
    });

    it("stub function throws error when called", () => {
      const manifest: ComponentManifest = {
        "@poliglot-io/uikit/components/button#Button": {
          id: "@poliglot-io/uikit/components/button",
          chunks: [],
          name: "Button",
        },
      };

      const stubs = generateStubs(manifest);

      expect(stubs).toContain(
        "throw new Error(`Client component ${name} cannot be called on server."
      );
    });

    it("handles empty manifest", () => {
      const manifest: ComponentManifest = {};

      const stubs = generateStubs(manifest);

      expect(stubs).toContain("module.exports = {");
      expect(stubs).toContain("};");
      // Should have the helper function but no component-specific createClientReference calls
      expect(stubs).toContain("function createClientReference");
      // No component exports in module.exports
      expect(stubs).toMatch(/module\.exports = \{\s*\};/);
    });
  });

  describe("writeStubs", () => {
    it("writes stubs to file", () => {
      const stubs = "// Test stubs content";
      const outputPath = join(testDir, "stubs.js");

      writeStubs(stubs, outputPath);

      expect(existsSync(outputPath)).toBe(true);
      expect(readFileSync(outputPath, "utf-8")).toBe(stubs);
    });
  });

  describe("generateAndWriteStubs", () => {
    it("generates and writes stubs from component index", async () => {
      const indexContent = `
export { Button } from './button';
export { Card } from './card';
`;
      writeFileSync(join(testDir, "index.ts"), indexContent);
      writeFileSync(
        join(testDir, "button.tsx"),
        "export const Button = () => null;"
      );
      writeFileSync(
        join(testDir, "card.tsx"),
        "export const Card = () => null;"
      );
      const outputPath = join(testDir, "stubs.js");

      const result = await generateAndWriteStubs(
        join(testDir, "index.ts"),
        outputPath
      );

      expect(result.componentCount).toBe(2);
      expect(existsSync(outputPath)).toBe(true);

      const content = readFileSync(outputPath, "utf-8");
      expect(content).toContain("Button");
      expect(content).toContain("Card");
    });
  });
});
