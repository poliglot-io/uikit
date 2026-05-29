import * as ts from "typescript";
import { readFileSync } from "fs";

/**
 * Parse a TypeScript file to extract named exports.
 * Handles both:
 *   export { default as Foo } from './Foo';
 *   export { Foo } from './Foo';
 *   export const Foo = ...;
 *   export default function Foo() {}
 */
export async function parseExports(filePath: string): Promise<string[]> {
  const content = readFileSync(filePath, "utf-8");
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );

  const exports: string[] = [];

  function visit(node: ts.Node) {
    // Handle: export { default as Foo } from './Foo';
    // Handle: export { Foo } from './Foo';
    if (ts.isExportDeclaration(node) && node.exportClause) {
      if (ts.isNamedExports(node.exportClause)) {
        for (const element of node.exportClause.elements) {
          // The exported name is element.name
          exports.push(element.name.text);
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
            exports.push(decl.name.text);
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
        exports.push(node.name.text);
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
        exports.push(node.name.text);
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return exports;
}
