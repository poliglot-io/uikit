#!/usr/bin/env tsx
/**
 * Emit a machine-readable description of the UIKit component surface.
 *
 * Walks src/components/, captures exported component / utility names,
 * their JSDoc summaries, and any class-variance-authority (CVA) variants
 * declared in the same file. Writes surface/components.json.
 *
 * The kleo docs site pulls this artifact at release tags and renders
 * narrative MDX alongside an auto-generated reference per component.
 *
 * Why not full react-docgen-typescript? Most components in this kit are
 * thin wrappers around Radix primitives — their "props" are spread
 * radix passthrough, which is not useful in a reference table. The
 * actually-useful metadata is: what components exist, what variants
 * does each have, what does the JSDoc say. That's what this captures.
 *
 * Output is deterministic (sorted keys, alphabetical component order)
 * so pre-commit / CI can drift-check by regenerating and diffing.
 */

import { mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import ts from "typescript";

const SCHEMA_VERSION = "1.0.0";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const COMPONENTS_DIR = join(REPO_ROOT, "src", "components");
const OUTPUT = join(REPO_ROOT, "surface", "components.json");
const PKG = JSON.parse(readFileSync(join(REPO_ROOT, "package.json"), "utf8"));

interface Variant {
  name: string;
  options: string[];
  default: string | null;
}

interface ExportedSymbol {
  name: string;
  kind: "component" | "function" | "type" | "const";
  jsdoc: string | null;
}

interface ComponentFile {
  file: string;
  jsdoc: string | null;
  exports: ExportedSymbol[];
  variants: Variant[];
}

function extractJsdoc(node: ts.Node, src: ts.SourceFile): string | null {
  const ranges = ts.getLeadingCommentRanges(src.getFullText(), node.getFullStart());
  if (!ranges) return null;
  const block = ranges.findLast((r) => r.kind === ts.SyntaxKind.MultiLineCommentTrivia);
  if (!block) return null;
  const raw = src.getFullText().slice(block.pos, block.end);
  if (!raw.startsWith("/**")) return null;
  return raw
    .replace(/^\/\*\*/, "")
    .replace(/\*\/$/, "")
    .split("\n")
    .map((l) => l.replace(/^\s*\*\s?/, ""))
    .join("\n")
    .trim() || null;
}

function classifyExport(node: ts.Node): ExportedSymbol["kind"] {
  if (ts.isFunctionDeclaration(node) || ts.isFunctionLike(node)) {
    // A function starting with uppercase is conventionally a React component
    const name = (node as ts.FunctionDeclaration).name?.text ?? "";
    return /^[A-Z]/.test(name) ? "component" : "function";
  }
  if (ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node)) return "type";
  if (ts.isVariableStatement(node)) {
    const decl = node.declarationList.declarations[0];
    const name = decl.name.getText();
    return /^[A-Z]/.test(name) ? "component" : "const";
  }
  return "const";
}

function nameOfDeclaration(node: ts.Node): string | null {
  if (ts.isFunctionDeclaration(node)) return node.name?.text ?? null;
  if (ts.isVariableStatement(node)) return node.declarationList.declarations[0]?.name.getText() ?? null;
  if (ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node)) return node.name.text;
  if (ts.isClassDeclaration(node)) return node.name?.text ?? null;
  return null;
}

function isExported(node: ts.Node): boolean {
  return !!(ts.getCombinedModifierFlags(node as ts.Declaration) & ts.ModifierFlags.Export);
}

function extractVariantsFromCva(callExpr: ts.CallExpression): Variant[] {
  // cva(base, { variants: { foo: { a: "...", b: "..." } }, defaultVariants: { foo: "a" } })
  if (callExpr.arguments.length < 2) return [];
  const config = callExpr.arguments[1];
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

function processFile(filePath: string, relPath: string): ComponentFile {
  const text = readFileSync(filePath, "utf8");
  const src = ts.createSourceFile(filePath, text, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TSX);

  const exportsByName = new Map<string, ExportedSymbol>();
  const variants: Variant[] = [];
  let fileJsdoc: string | null = null;

  // File-level JSDoc: leading comment on the first statement
  if (src.statements.length > 0) {
    fileJsdoc = extractJsdoc(src.statements[0], src);
  }

  // Collect CVA variant declarations (function/variable level)
  ts.forEachChild(src, (node) => {
    if (ts.isVariableStatement(node)) {
      for (const decl of node.declarationList.declarations) {
        if (decl.initializer && ts.isCallExpression(decl.initializer)) {
          const callee = decl.initializer.expression.getText();
          if (callee === "cva") {
            variants.push(...extractVariantsFromCva(decl.initializer));
          }
        }
      }
    }
  });

  // Walk for direct `export` declarations + collect later named export lists
  const directlyExported = new Set<string>();
  const namedExportLists: ts.ExportDeclaration[] = [];
  const symbolDeclMap = new Map<string, ts.Node>();

  ts.forEachChild(src, (node) => {
    if (ts.isExportDeclaration(node) && node.exportClause && ts.isNamedExports(node.exportClause)) {
      namedExportLists.push(node);
      return;
    }
    const name = nameOfDeclaration(node);
    if (name) {
      symbolDeclMap.set(name, node);
      if (isExported(node)) {
        directlyExported.add(name);
        exportsByName.set(name, {
          name,
          kind: classifyExport(node),
          jsdoc: extractJsdoc(node, src),
        });
      }
    }
  });

  // Apply named-export lists (e.g. `export { Button, buttonVariants }`)
  for (const exportDecl of namedExportLists) {
    if (!exportDecl.exportClause || !ts.isNamedExports(exportDecl.exportClause)) continue;
    for (const spec of exportDecl.exportClause.elements) {
      const exportedName = spec.name.text;
      if (exportsByName.has(exportedName)) continue;
      const localDecl = symbolDeclMap.get(spec.propertyName?.text ?? exportedName);
      exportsByName.set(exportedName, {
        name: exportedName,
        kind: localDecl ? classifyExport(localDecl) : "const",
        jsdoc: localDecl ? extractJsdoc(localDecl, src) : null,
      });
    }
  }

  const exports = [...exportsByName.values()].sort((a, b) => a.name.localeCompare(b.name));

  return {
    file: relPath,
    jsdoc: fileJsdoc,
    exports,
    variants,
  };
}

function main(): number {
  const files = readdirSync(COMPONENTS_DIR)
    .filter((f) => f.endsWith(".tsx") || f.endsWith(".ts"))
    .filter((f) => !f.startsWith("index") && !f.startsWith("__"))
    .sort();

  const components = files.map((f) => processFile(join(COMPONENTS_DIR, f), `src/components/${f}`));

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
  const totalExports = components.reduce((n, c) => n + c.exports.length, 0);
  console.log(
    `wrote surface/components.json (${components.length} files, ${totalExports} exports)`,
  );
  return 0;
}

process.exit(main());
