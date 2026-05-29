import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { parseExports } from "../export-parser.js";

describe("parseExports", () => {
  const testDir = join(process.cwd(), ".test-temp-exports");

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  describe("named exports", () => {
    it('parses export { Foo } from "./Foo"', async () => {
      const content = `export { Button } from './button';`;
      writeFileSync(join(testDir, "index.ts"), content);

      const exports = await parseExports(join(testDir, "index.ts"));

      expect(exports).toContain("Button");
    });

    it('parses export { default as Foo } from "./Foo"', async () => {
      const content = `export { default as Card } from './card';`;
      writeFileSync(join(testDir, "index.ts"), content);

      const exports = await parseExports(join(testDir, "index.ts"));

      expect(exports).toContain("Card");
    });

    it("parses multiple named exports from same module", async () => {
      const content = `export { Button, buttonVariants } from './button';`;
      writeFileSync(join(testDir, "index.ts"), content);

      const exports = await parseExports(join(testDir, "index.ts"));

      expect(exports).toContain("Button");
      expect(exports).toContain("buttonVariants");
    });

    it("parses multiple export statements", async () => {
      const content = `
export { Button } from './button';
export { Card, CardHeader } from './card';
export { Input } from './input';
`;
      writeFileSync(join(testDir, "index.ts"), content);

      const exports = await parseExports(join(testDir, "index.ts"));

      expect(exports).toEqual(["Button", "Card", "CardHeader", "Input"]);
    });
  });

  describe("direct exports", () => {
    it("parses export const Foo = ...", async () => {
      const content = `export const API_URL = 'https://example.com';`;
      writeFileSync(join(testDir, "index.ts"), content);

      const exports = await parseExports(join(testDir, "index.ts"));

      expect(exports).toContain("API_URL");
    });

    it("parses export function Foo() {}", async () => {
      const content = `export function myFunction() { return 42; }`;
      writeFileSync(join(testDir, "index.ts"), content);

      const exports = await parseExports(join(testDir, "index.ts"));

      expect(exports).toContain("myFunction");
    });

    it("parses export class Foo {}", async () => {
      const content = `export class MyClass { constructor() {} }`;
      writeFileSync(join(testDir, "index.ts"), content);

      const exports = await parseExports(join(testDir, "index.ts"));

      expect(exports).toContain("MyClass");
    });

    it("ignores default exports", async () => {
      const content = `
export default function DefaultFunc() {}
export function NamedFunc() {}
`;
      writeFileSync(join(testDir, "index.ts"), content);

      const exports = await parseExports(join(testDir, "index.ts"));

      expect(exports).not.toContain("DefaultFunc");
      expect(exports).toContain("NamedFunc");
    });
  });

  describe("complex scenarios", () => {
    it("parses mixed export types", async () => {
      const content = `
export { Button, buttonVariants } from './button';
export { default as Card } from './card';
export const VERSION = '1.0.0';
export function createComponent() { return null; }
export class ComponentFactory {}
`;
      writeFileSync(join(testDir, "index.ts"), content);

      const exports = await parseExports(join(testDir, "index.ts"));

      expect(exports).toContain("Button");
      expect(exports).toContain("buttonVariants");
      expect(exports).toContain("Card");
      expect(exports).toContain("VERSION");
      expect(exports).toContain("createComponent");
      expect(exports).toContain("ComponentFactory");
    });

    it("handles file with no exports", async () => {
      const content = `const foo = 'bar';`;
      writeFileSync(join(testDir, "index.ts"), content);

      const exports = await parseExports(join(testDir, "index.ts"));

      expect(exports).toEqual([]);
    });

    it("handles file with type exports only", async () => {
      const content = `
export type MyType = string;
export interface MyInterface { name: string; }
`;
      writeFileSync(join(testDir, "index.ts"), content);

      const exports = await parseExports(join(testDir, "index.ts"));

      // Type exports are not captured (only value exports)
      expect(exports).toEqual([]);
    });
  });
});
