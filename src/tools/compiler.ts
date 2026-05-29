import * as esbuild from "esbuild";
import { join } from "path";
import { mkdirSync, existsSync } from "fs";
import { loadConfig } from "./config.js";
import { parseExports } from "./export-parser.js";
import { generateAndWriteManifest } from "./manifest-generator.js";
import { generateAndWriteStubs } from "./stub-generator.js";

export interface BuildResult {
  outFile: string;
  exports: string[];
  manifestFile?: string;
  stubsFile?: string;
  success: boolean;
  error?: string;
}

export interface BuildOptions {
  quiet?: boolean;
}

export async function build(
  projectRoot: string,
  options: BuildOptions = {}
): Promise<BuildResult> {
  const config = loadConfig(projectRoot);
  const entryPoint = join(
    projectRoot,
    config.components.source,
    config.components.entry
  );
  const distDir = join(projectRoot, config.output.directory, "dist");
  const outFile = join(distDir, "components.js");

  // Check if entry point exists
  if (!existsSync(entryPoint)) {
    return {
      outFile,
      exports: [],
      success: false,
      error: `Entry point not found: ${entryPoint}`,
    };
  }

  // Ensure output directory exists
  mkdirSync(distDir, { recursive: true });

  try {
    // Single bundle from index.ts
    await esbuild.build({
      entryPoints: [entryPoint],
      outfile: outFile,
      bundle: true,
      format: "cjs",
      platform: "node",
      target: "node18",
      minify: true,
      external: [
        "@poliglot-io/uikit",
        "@poliglot-io/uikit/*",
        "react",
        "react/*",
      ],
      jsx: "automatic",
      logLevel: "silent",
    });

    // Parse exports for RDF generation
    const exports = await parseExports(entryPoint);

    if (!options.quiet) {
      console.log(`  ✓ ${config.components.entry} → components.js`);
      console.log(`    Exports: ${exports.join(", ")}`);
    }

    return {
      outFile,
      exports,
      success: true,
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error(`  ✗ Build failed: ${error}`);
    return {
      outFile,
      exports: [],
      success: false,
      error,
    };
  }
}

export interface ClientArtifactsResult {
  manifestFile: string;
  stubsFile: string;
  componentCount: number;
  success: boolean;
  error?: string;
}

/**
 * Generate client-reference artifacts (manifest + stubs) for @poliglot-io/uikit components.
 * These let a host framework render Server Components and emit proper
 * CLIENT_REFERENCE markers for client components.
 */
export async function buildClientArtifacts(
  uikitRoot: string,
  options: BuildOptions = {}
): Promise<ClientArtifactsResult> {
  const componentsIndex = join(uikitRoot, "src/components/index.ts");
  const distDir = join(uikitRoot, "dist");
  const manifestFile = join(distDir, "client-manifest.json");
  const stubsFile = join(distDir, "client-stubs.js");

  if (!existsSync(componentsIndex)) {
    return {
      manifestFile,
      stubsFile,
      componentCount: 0,
      success: false,
      error: `Components index not found: ${componentsIndex}`,
    };
  }

  mkdirSync(distDir, { recursive: true });

  try {
    const { componentCount } = await generateAndWriteManifest(
      componentsIndex,
      manifestFile
    );
    await generateAndWriteStubs(componentsIndex, stubsFile);

    if (!options.quiet) {
      console.log(
        `  ✓ Generated client-manifest.json (${componentCount} components)`
      );
      console.log(`  ✓ Generated client-stubs.js`);
    }

    return {
      manifestFile,
      stubsFile,
      componentCount,
      success: true,
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error(`  ✗ Client artifacts generation failed: ${error}`);
    return {
      manifestFile,
      stubsFile,
      componentCount: 0,
      success: false,
      error,
    };
  }
}
