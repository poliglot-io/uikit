import * as ts from "typescript";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname, basename } from "path";

export interface ComponentManifestEntry {
  id: string;
  chunks: string[];
  name: string;
}

export interface ComponentManifest {
  [key: string]: ComponentManifestEntry;
}

interface ExportInfo {
  name: string;
  sourceFile: string; // The component file (e.g., "card" from "card.tsx")
}

/**
 * Parse a TypeScript source file and extract all named exports with their source files.
 * Handles re-exports (export * from), named exports, and direct exports.
 */
function getExportsFromFile(
  filePath: string,
  visited: Set<string> = new Set()
): ExportInfo[] {
  if (visited.has(filePath)) {
    return [];
  }
  visited.add(filePath);

  // Try with .tsx extension if not found
  let actualPath = filePath;
  if (!existsSync(actualPath)) {
    if (existsSync(filePath + ".tsx")) {
      actualPath = filePath + ".tsx";
    } else if (existsSync(filePath + ".ts")) {
      actualPath = filePath + ".ts";
    } else {
      return [];
    }
  }

  const content = readFileSync(actualPath, "utf-8");
  const sourceFile = ts.createSourceFile(
    actualPath,
    content,
    ts.ScriptTarget.Latest,
    true,
    actualPath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );

  // Get the component file name (e.g., "card" from "/path/to/card.tsx")
  const componentFile = basename(actualPath).replace(/\.(tsx?|jsx?)$/, "");

  const exports: ExportInfo[] = [];

  function visit(node: ts.Node) {
    // Handle: export * from './module';
    if (ts.isExportDeclaration(node)) {
      if (!node.exportClause && node.moduleSpecifier) {
        // export * from './module'
        const modulePath = (node.moduleSpecifier as ts.StringLiteral).text;
        const resolvedPath = join(dirname(actualPath), modulePath);
        exports.push(...getExportsFromFile(resolvedPath, visited));
      } else if (node.exportClause && ts.isNamedExports(node.exportClause)) {
        // export { Foo, Bar } from './module' or export { Foo, Bar }
        if (node.moduleSpecifier) {
          // Re-export from another module - resolve that module
          const modulePath = (node.moduleSpecifier as ts.StringLiteral).text;
          const resolvedPath = join(dirname(actualPath), modulePath);
          const resolvedFile =
            basename(resolvedPath).replace(/\.(tsx?|jsx?)$/, "") ||
            basename(modulePath).replace(/\.(tsx?|jsx?)$/, "");
          for (const element of node.exportClause.elements) {
            exports.push({ name: element.name.text, sourceFile: resolvedFile });
          }
        } else {
          // Local export
          for (const element of node.exportClause.elements) {
            exports.push({
              name: element.name.text,
              sourceFile: componentFile,
            });
          }
        }
      }
    }

    // Handle: export const Foo = ...;
    if (ts.isVariableStatement(node)) {
      const hasExport = node.modifiers?.some(
        m => m.kind === ts.SyntaxKind.ExportKeyword
      );
      if (hasExport) {
        for (const decl of node.declarationList.declarations) {
          if (ts.isIdentifier(decl.name)) {
            exports.push({ name: decl.name.text, sourceFile: componentFile });
          }
        }
      }
    }

    // Handle: export function Foo() {}
    if (ts.isFunctionDeclaration(node) && node.name) {
      const hasExport = node.modifiers?.some(
        m => m.kind === ts.SyntaxKind.ExportKeyword
      );
      const isDefault = node.modifiers?.some(
        m => m.kind === ts.SyntaxKind.DefaultKeyword
      );
      if (hasExport && !isDefault) {
        exports.push({ name: node.name.text, sourceFile: componentFile });
      }
    }

    // Handle: export class Foo {}
    if (ts.isClassDeclaration(node) && node.name) {
      const hasExport = node.modifiers?.some(
        m => m.kind === ts.SyntaxKind.ExportKeyword
      );
      const isDefault = node.modifiers?.some(
        m => m.kind === ts.SyntaxKind.DefaultKeyword
      );
      if (hasExport && !isDefault) {
        exports.push({ name: node.name.text, sourceFile: componentFile });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return exports;
}

/**
 * Generate the client-reference manifest for @poliglot-io/uikit components.
 * Maps component names to module IDs consumers use at runtime.
 *
 * Module IDs use subpath exports format: @poliglot-io/uikit/components/{file}
 * This allows webpack to resolve the modules at runtime.
 */
export function generateManifest(
  componentsIndexPath: string
): ComponentManifest {
  const exports = getExportsFromFile(componentsIndexPath);
  const manifest: ComponentManifest = {};

  for (const { name, sourceFile } of exports) {
    // Use subpath export format that webpack can resolve
    const moduleId = `@poliglot-io/uikit/components/${sourceFile}`;
    const componentId = `${moduleId}#${name}`;
    manifest[componentId] = {
      id: moduleId,
      chunks: [], // No chunks - components are bundled on client
      name: name,
    };
  }

  return manifest;
}

/**
 * Write manifest to a JSON file.
 */
export function writeManifest(
  manifest: ComponentManifest,
  outputPath: string
): void {
  writeFileSync(outputPath, JSON.stringify(manifest, null, 2));
}

/**
 * Generate and write the component manifest.
 */
export async function generateAndWriteManifest(
  componentsIndexPath: string,
  outputPath: string
): Promise<{ manifest: ComponentManifest; componentCount: number }> {
  const manifest = generateManifest(componentsIndexPath);
  writeManifest(manifest, outputPath);
  return {
    manifest,
    componentCount: Object.keys(manifest).length,
  };
}
