import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { loadConfig } from "../config.js";

describe("loadConfig", () => {
  const testDir = join(process.cwd(), ".test-temp-config");

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it("throws error when no config file exists", () => {
    expect(() => loadConfig(testDir)).toThrow("poliglot.yml not found");
  });

  it("loads poliglot.yml config", () => {
    const configContent = `
version: '2'
spec:
  directory: ./custom-spec
components:
  source: ./src/ui
  entry: main.ts
output:
  directory: ./build
`;
    writeFileSync(join(testDir, "poliglot.yml"), configContent);

    const config = loadConfig(testDir);

    expect(config.version).toBe("2");
    expect(config.spec.directory).toBe("./custom-spec");
    expect(config.components.source).toBe("./src/ui");
    expect(config.components.entry).toBe("main.ts");
    expect(config.output.directory).toBe("./build");
  });

  it("loads poliglot.yaml config (alternate extension)", () => {
    const configContent = `
version: '1'
components:
  source: ./components
`;
    writeFileSync(join(testDir, "poliglot.yaml"), configContent);

    const config = loadConfig(testDir);

    expect(config.version).toBe("1");
    expect(config.components.source).toBe("./components");
  });

  it("prefers .yml over .yaml when both exist", () => {
    writeFileSync(join(testDir, "poliglot.yml"), "version: yml-version");
    writeFileSync(join(testDir, "poliglot.yaml"), "version: yaml-version");

    const config = loadConfig(testDir);

    expect(config.version).toBe("yml-version");
  });

  it("uses defaults for missing config values", () => {
    writeFileSync(join(testDir, "poliglot.yml"), 'version: "1"');

    const config = loadConfig(testDir);

    expect(config.spec.directory).toBe("./spec");
    expect(config.components.source).toBe("./src/components");
    expect(config.components.entry).toBe("index.ts");
    expect(config.output.directory).toBe("./.matrix");
  });

  it("handles empty config file", () => {
    writeFileSync(join(testDir, "poliglot.yml"), "");

    const config = loadConfig(testDir);

    // Should use all defaults
    expect(config.version).toBe("1");
    expect(config.spec.directory).toBe("./spec");
    expect(config.components.source).toBe("./src/components");
    expect(config.components.entry).toBe("index.ts");
    expect(config.output.directory).toBe("./.matrix");
  });

  it("merges partial spec config with defaults", () => {
    const configContent = `
spec:
  directory: ./my-spec
`;
    writeFileSync(join(testDir, "poliglot.yml"), configContent);

    const config = loadConfig(testDir);

    expect(config.spec.directory).toBe("./my-spec");
    // Other values should be defaults
    expect(config.components.source).toBe("./src/components");
  });

  it("merges partial components config with defaults", () => {
    const configContent = `
components:
  entry: custom-entry.ts
`;
    writeFileSync(join(testDir, "poliglot.yml"), configContent);

    const config = loadConfig(testDir);

    expect(config.components.entry).toBe("custom-entry.ts");
    expect(config.components.source).toBe("./src/components");
  });
});
