import { parse } from "yaml";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

export interface PoliglotConfig {
  version: string;
  spec: { directory: string };
  components: { source: string; entry: string };
  output: { directory: string };
}

const DEFAULTS: PoliglotConfig = {
  version: "1",
  spec: { directory: "./spec" },
  components: { source: "./src/components", entry: "index.ts" },
  output: { directory: "./.matrix" },
};

export function loadConfig(projectRoot: string): PoliglotConfig {
  const ymlPath = join(projectRoot, "poliglot.yml");
  const yamlPath = join(projectRoot, "poliglot.yaml");

  let configPath: string | null = null;
  if (existsSync(ymlPath)) configPath = ymlPath;
  else if (existsSync(yamlPath)) configPath = yamlPath;

  if (!configPath) {
    throw new Error('poliglot.yml not found. Run "poliglot-ui init" first.');
  }

  const content = readFileSync(configPath, "utf-8");
  const parsed = parse(content) || {};

  return {
    version: parsed.version ?? DEFAULTS.version,
    spec: { ...DEFAULTS.spec, ...parsed.spec },
    components: { ...DEFAULTS.components, ...parsed.components },
    output: { ...DEFAULTS.output, ...parsed.output },
  };
}
