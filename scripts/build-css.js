#!/usr/bin/env node

/**
 * Build script for pre-compiling Tailwind safelist to minified utility classes.
 *
 * 1. Runs Tailwind CLI to compile safelist-source.css
 * 2. Post-processes output to extract ONLY utility class definitions
 * 3. Filters out classes that break the layout contract (see BLOCKED_CLASS_PATTERNS)
 * 4. Minifies and outputs dist/styles.min.css
 */

import { execSync } from "child_process";
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  unlinkSync,
} from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

const INPUT_FILE = join(rootDir, "src/safelist-source.css");
const RAW_OUTPUT = join(rootDir, "dist/styles.raw.css");
const FINAL_OUTPUT = join(rootDir, "dist/styles.min.css");

/**
 * Blocked class patterns — these utilities break the layout contract
 * (arbitrary values, viewport sizing, positioning, etc.) and are excluded
 * from the bundle.
 */
const BLOCKED_CLASS_PATTERNS = [
  /\[.*\]/, // Arbitrary values
  /^(static|fixed|absolute|relative|sticky)$/, // Position
  /^-?(top|right|bottom|left|inset|inset-x|inset-y)-/, // Position offsets (including negative)
  /^z-/, // z-index
  /^[wh]-(screen|svw|svh|lvw|lvh|dvw|dvh)$/, // Viewport sizing
  /^min-[wh]-(screen|svw|svh|lvw|lvh|dvw|dvh)$/,
  /^max-[wh]-(screen|svw|svh|lvw|lvh|dvw|dvh)$/,
  /^-m[xytblr]?-/, // Negative margins
  /^-space-/, // Negative space
  /^-?translate-/, // Translate
  /^overflow-visible$/, // overflow-visible
  /^overflow-[xy]-visible$/,
  /^pointer-events-/, // pointer-events
  /^isolate$/, // isolate
  /^isolation-/, // isolation
  /^will-change-/, // will-change
  /^float-/, // float
  /^clear-/, // clear
  /^columns-/, // columns
  /^container$/, // container
  /^(before|after):content-/, // pseudo content
  /^invisible$/, // invisible
];

/**
 * Check if a class name is blocked.
 */
function isBlockedClass(className) {
  // Extract base class (remove variant prefixes like hover:, dark:, sm:)
  const baseClass = className.includes(":")
    ? className.substring(className.lastIndexOf(":") + 1)
    : className;

  return BLOCKED_CLASS_PATTERNS.some(pattern => pattern.test(baseClass));
}

/**
 * Run Tailwind CLI to compile the safelist source.
 */
function compileTailwind() {
  console.log("Compiling Tailwind CSS...");

  const distDir = dirname(RAW_OUTPUT);
  if (!existsSync(distDir)) {
    mkdirSync(distDir, { recursive: true });
  }

  try {
    execSync(`npx @tailwindcss/cli -i "${INPUT_FILE}" -o "${RAW_OUTPUT}"`, {
      cwd: rootDir,
      stdio: "inherit",
    });
  } catch (error) {
    console.error("Failed to compile Tailwind CSS");
    process.exit(1);
  }
}

/**
 * Extract only utility class definitions from compiled CSS.
 */
function extractUtilityClasses(css) {
  let result = css;

  // Remove multi-line comments
  result = result.replace(/\/\*[\s\S]*?\*\//g, "");

  // Remove @layer declarations
  result = result.replace(/@layer\s+[^{;]+;/g, "");

  // Remove non-utility layer blocks
  result = removeNestedBlock(result, "@layer theme");
  result = removeNestedBlock(result, "@layer base");
  result = removeNestedBlock(result, "@layer components");
  result = removeNestedBlock(result, "@layer properties");
  result = removeNestedBlock(result, "@keyframes");
  result = removeNestedBlock(result, "@property");

  // Unwrap @layer utilities - keep contents, remove wrapper
  result = unwrapLayer(result, "@layer utilities");

  return result;
}

/**
 * Filter out blocked CSS rules.
 * Parses CSS and removes rules for blocked class names.
 */
function filterBlockedClasses(css) {
  // Split into individual rules (handle both minified and formatted)
  const rules = [];
  let current = "";
  let braceCount = 0;

  for (const char of css) {
    current += char;
    if (char === "{") braceCount++;
    if (char === "}") {
      braceCount--;
      if (braceCount === 0) {
        rules.push(current.trim());
        current = "";
      }
    }
  }

  let blockedCount = 0;
  const filtered = rules.filter(rule => {
    // Extract selector (everything before first {)
    const match = rule.match(/^([^{]+)\{/);
    if (!match) return true;

    const selector = match[1].trim();

    // Check if it's a class selector
    if (!selector.startsWith(".")) return true;

    // Extract class name (remove leading dot, handle escapes)
    let className = selector.substring(1);

    // Handle escaped characters like \: for variants, \/ for fractions
    className = className.replace(/\\(.)/g, "$1");

    // Check if blocked
    if (isBlockedClass(className)) {
      blockedCount++;
      return false;
    }

    return true;
  });

  console.log(`  Filtered ${blockedCount} blocked classes`);
  return filtered.join("");
}

/**
 * Scope all selectors with [data-rsc] prefix so the bundled CSS only
 * takes effect inside containers that opt in via the attribute.
 */
function scopeSelectors(css) {
  // Split into individual rules
  const rules = [];
  let current = "";
  let braceCount = 0;

  for (const char of css) {
    current += char;
    if (char === "{") braceCount++;
    if (char === "}") {
      braceCount--;
      if (braceCount === 0) {
        rules.push(current.trim());
        current = "";
      }
    }
  }

  // Process each rule
  const scoped = rules.map(rule => {
    const match = rule.match(/^([^{]+)\{([\s\S]*)\}$/);
    if (!match) return rule;

    const selector = match[1].trim();
    const body = match[2];

    // Handle comma-separated selectors
    const selectors = selector.split(",").map(s => s.trim());
    const scopedSelectors = selectors.map(s => `[data-rsc] ${s}`);

    return `${scopedSelectors.join(",")}{${body}}`;
  });

  return scoped.join("");
}

/**
 * Minify CSS by removing whitespace and newlines.
 */
function minifyCss(css) {
  return (
    css
      // Remove newlines and excess whitespace
      .replace(/\s+/g, " ")
      // Remove space around braces and colons
      .replace(/\s*{\s*/g, "{")
      .replace(/\s*}\s*/g, "}")
      .replace(/\s*:\s*/g, ":")
      .replace(/\s*;\s*/g, ";")
      // Remove trailing semicolons before closing braces
      .replace(/;}/g, "}")
      .trim()
  );
}

/**
 * Remove a nested block that may contain nested braces.
 */
function removeNestedBlock(css, blockStart) {
  const regex = new RegExp(
    blockStart.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*\\{",
    "g"
  );
  let result = css;
  let match;

  while ((match = regex.exec(result)) !== null) {
    const startIndex = match.index;
    let braceCount = 1;
    let i = match.index + match[0].length;

    while (i < result.length && braceCount > 0) {
      if (result[i] === "{") braceCount++;
      if (result[i] === "}") braceCount--;
      i++;
    }

    result = result.slice(0, startIndex) + result.slice(i);
    regex.lastIndex = startIndex;
  }

  return result;
}

/**
 * Unwrap a @layer block - keep contents, remove the wrapper.
 */
function unwrapLayer(css, layerName) {
  const regex = new RegExp(
    layerName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*\\{",
    "g"
  );
  let result = css;
  let match;

  while ((match = regex.exec(result)) !== null) {
    const startIndex = match.index;
    let braceCount = 1;
    let i = match.index + match[0].length;
    const contentStart = i;

    while (i < result.length && braceCount > 0) {
      if (result[i] === "{") braceCount++;
      if (result[i] === "}") braceCount--;
      i++;
    }

    const content = result.slice(contentStart, i - 1);
    result = result.slice(0, startIndex) + content + result.slice(i);
    regex.lastIndex = startIndex;
  }

  return result;
}

/**
 * Main build process.
 */
function main() {
  console.log("Building UIKit safelist CSS...\n");

  // Compile with Tailwind
  compileTailwind();

  // Post-process
  console.log("\nPost-processing...");
  const rawCss = readFileSync(RAW_OUTPUT, "utf-8");
  const utilityClasses = extractUtilityClasses(rawCss);

  // Filter blocked classes
  console.log("Filtering blocked classes...");
  const filtered = filterBlockedClasses(utilityClasses);

  // Scope selectors with [data-rsc] prefix
  console.log("Scoping selectors with [data-rsc]...");
  const scoped = scopeSelectors(filtered);

  // Minify
  console.log("Minifying...");
  const minified = minifyCss(scoped);

  // Write minified output
  writeFileSync(FINAL_OUTPUT, minified);

  // Clean up raw file
  unlinkSync(RAW_OUTPUT);

  // Report
  const sizeKb = (Buffer.byteLength(minified, "utf-8") / 1024).toFixed(1);
  console.log(`\nBuild complete!`);
  console.log(`  Output: ${FINAL_OUTPUT}`);
  console.log(`  Size: ${sizeKb} KB`);
}

main();
