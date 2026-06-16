#!/usr/bin/env tsx
/**
 * Emit a machine-readable description of the UIKit component surface.
 *
 * Walks src/components/ with two passes:
 *
 * 1. react-docgen-typescript to extract per-component prop tables.
 *    Each prop carries its type, required flag, default value, JSDoc
 *    description, and an `origin` tag identifying where it was
 *    inherited from (this file, a Radix primitive, a DOM element, etc.).
 *    This is the bulk of the surface for AI agents and reference docs.
 *
 * 2. TypeScript compiler API to extract class-variance-authority
 *    variants (option lists + defaults) and the file-level JSDoc
 *    header — react-docgen-typescript doesn't see CVA constants since
 *    they aren't React components.
 *
 * Writes surface/components.json. The kleo docs site pulls this
 * artifact at release tags and renders narrative MDX alongside an
 * auto-generated reference per component.
 *
 * Output is deterministic (sorted keys, alphabetical ordering, props
 * sorted by name within each component) so pre-commit / CI can
 * drift-check by regenerating and diffing.
 */

import { mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import ts from "typescript";
import {
  withCustomConfig,
  type ComponentDoc,
  type PropItem,
} from "react-docgen-typescript";

const SCHEMA_VERSION = "2.0.0";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const COMPONENTS_DIR = join(REPO_ROOT, "src", "components");
const OUTPUT = join(REPO_ROOT, "surface", "components.json");
const TSCONFIG = join(REPO_ROOT, "tsconfig.json");
const PKG = JSON.parse(readFileSync(join(REPO_ROOT, "package.json"), "utf8"));

interface Variant {
  name: string;
  options: string[];
  default: string | null;
}

interface SerializedProp {
  name: string;
  type: string;
  required: boolean;
  default: string | null;
  description: string | null;
  origin: string;
}

interface SerializedComponent {
  name: string;
  description: string | null;
  /**
   * Origin tags this component inherits a large standard prop set from.
   * Universal sets (HTMLAttributes, AriaAttributes, DOMAttributes) are
   * surfaced here as a single signal rather than enumerated per prop —
   * "this accepts standard HTML attributes and DOM events" is far more
   * useful than listing all 273 of them. AI agents and docs render this
   * as a sentence; the full enumeration is on MDN.
   */
  inherits: string[];
  /**
   * Props specific to this component or its underlying Radix / library
   * primitive. Excludes universal HTML / ARIA / DOM-event passthrough.
   */
  props: SerializedProp[];
}

interface SerializedFile {
  file: string;
  jsdoc: string | null;
  components: SerializedComponent[];
  variants: Variant[];
}

function fileJsdoc(filePath: string): string | null {
  const text = readFileSync(filePath, "utf8");
  const src = ts.createSourceFile(filePath, text, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TSX);
  if (src.statements.length === 0) return null;
  const ranges = ts.getLeadingCommentRanges(text, src.statements[0].getFullStart());
  if (!ranges) return null;
  const block = ranges.findLast((r) => r.kind === ts.SyntaxKind.MultiLineCommentTrivia);
  if (!block) return null;
  const raw = text.slice(block.pos, block.end);
  if (!raw.startsWith("/**")) return null;
  return (
    raw
      .replace(/^\/\*\*/, "")
      .replace(/\*\/$/, "")
      .split("\n")
      .map((l) => l.replace(/^\s*\*\s?/, ""))
      .join("\n")
      .trim() || null
  );
}

function extractVariants(filePath: string): Variant[] {
  const text = readFileSync(filePath, "utf8");
  const src = ts.createSourceFile(filePath, text, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TSX);
  const variants: Variant[] = [];

  ts.forEachChild(src, (node) => {
    if (!ts.isVariableStatement(node)) return;
    for (const decl of node.declarationList.declarations) {
      if (!decl.initializer || !ts.isCallExpression(decl.initializer)) continue;
      if (decl.initializer.expression.getText() !== "cva") continue;
      variants.push(...variantsFromCvaCall(decl.initializer));
    }
  });

  return variants;
}

function variantsFromCvaCall(call: ts.CallExpression): Variant[] {
  if (call.arguments.length < 2) return [];
  const config = call.arguments[1];
  if (!ts.isObjectLiteralExpression(config)) return [];

  const variantsProp = config.properties.find(
    (p): p is ts.PropertyAssignment =>
      ts.isPropertyAssignment(p) && p.name.getText() === "variants",
  );
  const defaultsProp = config.properties.find(
    (p): p is ts.PropertyAssignment =>
      ts.isPropertyAssignment(p) && p.name.getText() === "defaultVariants",
  );
  if (!variantsProp || !ts.isObjectLiteralExpression(variantsProp.initializer)) return [];

  const defaults: Record<string, string> = {};
  if (defaultsProp && ts.isObjectLiteralExpression(defaultsProp.initializer)) {
    for (const p of defaultsProp.initializer.properties) {
      if (ts.isPropertyAssignment(p) && ts.isStringLiteralLike(p.initializer)) {
        defaults[p.name.getText()] = p.initializer.text;
      }
    }
  }

  const out: Variant[] = [];
  for (const variantProp of variantsProp.initializer.properties) {
    if (!ts.isPropertyAssignment(variantProp)) continue;
    if (!ts.isObjectLiteralExpression(variantProp.initializer)) continue;
    const name = variantProp.name.getText().replace(/^['"]|['"]$/g, "");
    const options: string[] = [];
    for (const opt of variantProp.initializer.properties) {
      if (ts.isPropertyAssignment(opt)) {
        options.push(opt.name.getText().replace(/^['"]|['"]$/g, ""));
      }
    }
    out.push({
      name,
      options: options.sort(),
      default: defaults[name] ?? null,
    });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Tag a prop with where it came from. react-docgen-typescript fills
 * `parent.fileName` with the source file of the type that declared
 * the prop; we turn that into a short, kleo-renderable label.
 *
 * Examples:
 *   - node_modules/@types/react/index.d.ts -> "React.HTMLAttributes"
 *   - node_modules/@radix-ui/react-accordion/dist/index.d.mts -> "RadixAccordion"
 *   - src/components/button.tsx -> "this"
 *   - node_modules/class-variance-authority/dist/types.d.ts -> "cva"
 */
function classifyOrigin(prop: PropItem, currentFile: string): string {
  const parentFile = prop.parent?.fileName ?? "";
  const parentName = prop.parent?.name ?? "";

  if (!parentFile) return "this";
  if (parentFile === currentFile || parentFile.endsWith(currentFile)) return "this";

  if (parentFile.includes("/@radix-ui/")) {
    const match = parentFile.match(/@radix-ui\/react-([^/]+)/);
    if (match) {
      const kebab = match[1];
      const pascal = kebab.replace(/(?:^|-)([a-z])/g, (_, c) => c.toUpperCase());
      return `Radix${pascal}`;
    }
    return "Radix";
  }
  if (parentFile.includes("/@types/react/") || parentFile.includes("/node_modules/react/")) {
    return parentName.startsWith("HTMLAttributes")
      ? "HTMLAttributes"
      : parentName.startsWith("DOMAttributes")
        ? "DOMAttributes"
        : `React.${parentName}`;
  }
  if (parentFile.includes("/class-variance-authority/")) return "cva";
  if (parentFile.includes("/recharts/")) return "Recharts";
  if (parentFile.includes("/cmdk/")) return "cmdk";
  if (parentFile.includes("/embla-carousel")) return "embla-carousel";
  if (parentFile.includes("/vaul/")) return "vaul";
  if (parentFile.includes("/react-day-picker/")) return "react-day-picker";
  if (parentFile.includes("/react-hook-form/")) return "react-hook-form";
  if (parentFile.includes("/react-resizable-panels/")) return "react-resizable-panels";
  if (parentFile.includes("/input-otp/")) return "input-otp";
  if (parentFile.includes("/sonner/")) return "sonner";
  if (parentFile.includes("/lucide-react/")) return "lucide-react";

  // Fallback: package name from node_modules path
  const pkgMatch = parentFile.match(/node_modules\/(@?[^/]+(?:\/[^/]+)?)/);
  if (pkgMatch) return pkgMatch[1];

  return parentName || "unknown";
}

function serializeProp(prop: PropItem, currentFile: string): SerializedProp {
  return {
    name: prop.name,
    type: prop.type.name,
    required: prop.required,
    default: prop.defaultValue?.value != null ? String(prop.defaultValue.value) : null,
    description: (prop.description || "").trim() || null,
    origin: classifyOrigin(prop, currentFile),
  };
}

// Universal passthrough origins — every interactive React element has
// these. Surfaced once per component as an `inherits` flag rather than
// enumerated per prop.
const UNIVERSAL_ORIGINS = new Set([
  "DOMAttributes",
  "HTMLAttributes",
  "React.AriaAttributes",
  "React.Attributes",
  "React.RefAttributes",
  "React.SVGAttributes",
]);

function serializeComponent(doc: ComponentDoc, currentFile: string): SerializedComponent {
  const inherits = new Set<string>();
  const props: SerializedProp[] = [];

  for (const prop of Object.values(doc.props)) {
    const serialized = serializeProp(prop, currentFile);
    if (UNIVERSAL_ORIGINS.has(serialized.origin)) {
      inherits.add(serialized.origin);
      continue;
    }
    props.push(serialized);
  }

  props.sort((a, b) => a.name.localeCompare(b.name));

  return {
    name: doc.displayName,
    description: (doc.description || "").trim() || null,
    inherits: [...inherits].sort(),
    props,
  };
}

function main(): number {
  const parser = withCustomConfig(TSCONFIG, {
    shouldExtractLiteralValuesFromEnum: true,
    shouldRemoveUndefinedFromOptional: true,
    savePropValueAsString: true,
    skipChildrenPropWithoutDoc: false,
    // Keep every prop — kleo can group / filter on the rendering side
    // by `origin` if "every Radix prop" turns out to be too much.
    propFilter: () => true,
  });

  const files = readdirSync(COMPONENTS_DIR)
    .filter((f) => f.endsWith(".tsx") || f.endsWith(".ts"))
    .filter((f) => !f.startsWith("index") && !f.startsWith("__"))
    .filter((f) => !f.endsWith(".stories.tsx") && !f.endsWith(".stories.ts"))
    .filter((f) => !f.endsWith(".test.tsx") && !f.endsWith(".test.ts"))
    .sort();

  const components: SerializedFile[] = [];
  for (const f of files) {
    const filePath = join(COMPONENTS_DIR, f);
    const relPath = `src/components/${f}`;
    const docs = parser.parse(filePath);
    components.push({
      file: relPath,
      jsdoc: fileJsdoc(filePath),
      components: docs
        .map((d) => serializeComponent(d, filePath))
        .sort((a, b) => a.name.localeCompare(b.name)),
      variants: extractVariants(filePath),
    });
  }

  const surface = {
    schemaVersion: SCHEMA_VERSION,
    package: PKG.name,
    version: PKG.version,
    components,
  };

  const serialized = JSON.stringify(surface, null, 2) + "\n";

  const check = process.argv.includes("--check");
  if (check) {
    if (!existsSync(OUTPUT) || readFileSync(OUTPUT, "utf8") !== serialized) {
      console.error(
        `error: surface/components.json is out of date. ` +
          `Run scripts/gen-component-surface.ts and commit the result.`,
      );
      return 1;
    }
    return 0;
  }

  mkdirSync(dirname(OUTPUT), { recursive: true });
  writeFileSync(OUTPUT, serialized);
  const totalComponents = components.reduce((n, c) => n + c.components.length, 0);
  const totalProps = components.reduce(
    (n, c) => n + c.components.reduce((m, cc) => m + cc.props.length, 0),
    0,
  );
  console.log(
    `wrote surface/components.json (${components.length} files, ${totalComponents} components, ${totalProps} props)`,
  );
  return 0;
}

process.exit(main());
