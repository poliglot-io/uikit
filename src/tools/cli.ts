import { Command } from "commander";
import { loadConfig } from "./config.js";
import { build } from "./compiler.js";
import { init } from "./init.js";

const program = new Command();

program
  .name("poliglot-ui")
  .description("Build tooling for @poliglot-io/uikit components")
  .version("0.1.0");

program
  .command("build")
  .description("Compile TSX components to a single JS bundle")
  .option("-d, --dir <path>", "Project directory", process.cwd())
  .option("--json", "Output result as JSON")
  .action(async options => {
    try {
      const config = loadConfig(options.dir);

      if (!options.json) {
        console.log(
          `Building components from ${config.components.source}/${config.components.entry}`
        );
        console.log(
          `Output to ${config.output.directory}/dist/components.js\n`
        );
      }

      const result = await build(options.dir, { quiet: options.json });

      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
      } else if (result.success) {
        console.log(
          `\n✓ Bundle created with ${result.exports.length} export(s)`
        );
      } else {
        console.error(`\n✗ Build failed: ${result.error}`);
        process.exit(1);
      }
    } catch (err) {
      console.error("Build failed:", err instanceof Error ? err.message : err);
      process.exit(1);
    }
  });

program
  .command("init")
  .description("Initialize UI components for a matrix project")
  .option("-d, --dir <path>", "Project directory", process.cwd())
  .requiredOption("-n, --name <name>", "Matrix name")
  .requiredOption("-u, --uri-prefix <uri>", "URI prefix for RDF resources")
  .option("-s, --spec-dir <path>", "Spec directory", "spec")
  .option(
    "-c, --components-dir <path>",
    "Components directory",
    "src/components"
  )
  .action(async options => {
    try {
      await init(options.dir, {
        name: options.name,
        uriPrefix: options.uriPrefix,
        specDir: options.specDir,
        componentsDir: options.componentsDir,
      });
    } catch (err) {
      console.error("Init failed:", err instanceof Error ? err.message : err);
      process.exit(1);
    }
  });

program
  .command("config")
  .description("Show current configuration")
  .option("-d, --dir <path>", "Project directory", process.cwd())
  .action(options => {
    try {
      const config = loadConfig(options.dir);
      console.log(JSON.stringify(config, null, 2));
    } catch (err) {
      console.error("Error:", err instanceof Error ? err.message : err);
      process.exit(1);
    }
  });

program
  .command("preview")
  .description("Start dev server to preview components")
  .option("-d, --dir <path>", "Project directory", process.cwd())
  .option("-p, --port <number>", "Server port", "3333")
  .option("--host <host>", "Server host", "localhost")
  .action(async options => {
    try {
      const { startPreviewServer } = await import("./preview/index.js");
      await startPreviewServer(options.dir, {
        port: parseInt(options.port, 10),
        host: options.host,
      });
    } catch (err) {
      console.error(
        "Preview failed:",
        err instanceof Error ? err.message : err
      );
      process.exit(1);
    }
  });

export function run() {
  program.parse();
}
