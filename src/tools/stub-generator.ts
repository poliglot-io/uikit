import { writeFileSync } from "fs";
import {
  generateManifest,
  type ComponentManifest,
} from "./manifest-generator.js";

/**
 * Generate client-reference stubs for @poliglot-io/uikit components.
 * These stubs create wire-format references to client components for a
 * host RSC runtime.
 *
 * The stubs cannot be called as functions — they exist only to be
 * serialized into client-reference markers by the consuming framework.
 */
export function generateStubs(manifest: ComponentManifest): string {
  const lines: string[] = [
    "// Auto-generated CLIENT_REFERENCE stubs for @poliglot-io/uikit",
    "// These stubs create wire-format references for client components.",
    "// DO NOT EDIT - regenerate using: npx poliglot-ui build",
    "",
    'const CLIENT_REFERENCE = Symbol.for("react.client.reference");',
    "",
    "function createClientReference(id, name) {",
    "  const fn = function() {",
    "    throw new Error(`Client component ${name} cannot be called on server. It will be rendered on the client.`);",
    "  };",
    "  Object.defineProperties(fn, {",
    "    $$typeof: { value: CLIENT_REFERENCE, enumerable: false },",
    "    $$id: { value: id, enumerable: false },",
    "    $$async: { value: false, enumerable: false },",
    "    name: { value: name, enumerable: false },",
    "  });",
    "  return fn;",
    "}",
    "",
  ];

  // Generate exports for each component
  // Use full component id (moduleId#exportName) as $$id so consumers can distinguish components
  const exports: string[] = [];
  for (const [componentId, entry] of Object.entries(manifest)) {
    const varName = entry.name;
    // $$id = full flight ID (e.g., @poliglot-io/uikit/components/card#Card)
    // This must be unique per component for serialization
    lines.push(
      `const ${varName} = createClientReference("${componentId}", "${entry.name}");`
    );
    exports.push(varName);
  }

  // Add exports
  lines.push("");
  lines.push("module.exports = {");
  for (const exportName of exports) {
    lines.push(`  ${exportName},`);
  }
  lines.push("};");

  return lines.join("\n");
}

/**
 * Generate and write stubs to a file.
 */
export function writeStubs(stubs: string, outputPath: string): void {
  writeFileSync(outputPath, stubs);
}

/**
 * Generate stubs from component index and write to file.
 */
export async function generateAndWriteStubs(
  componentsIndexPath: string,
  outputPath: string
): Promise<{ componentCount: number }> {
  const manifest = generateManifest(componentsIndexPath);
  const stubs = generateStubs(manifest);
  writeStubs(stubs, outputPath);
  return {
    componentCount: Object.keys(manifest).length,
  };
}
