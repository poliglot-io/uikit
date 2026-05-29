import React from "react";
import ReactDOM from "react-dom/client";
import PreviewApp from "./App";
import type { PreviewRegistry } from "./App";

// Import preview styles (Tailwind + shell layout + default theme)
import "./styles.css";

// Virtual module provided by Vite config - user's poliglot.preview.js
// @ts-ignore - This is resolved by Vite alias
import previewConfig from "virtual:preview-config";

// Validate and convert the config to registry format
function buildRegistry(config: unknown): PreviewRegistry {
  if (!config || typeof config !== "object") {
    console.error("Invalid preview config: expected an object");
    return {};
  }

  const registry: PreviewRegistry = {};

  for (const [name, entry] of Object.entries(
    config as Record<string, unknown>
  )) {
    if (!entry || typeof entry !== "object") {
      console.warn(`Skipping invalid preview entry: ${name}`);
      continue;
    }

    const { component, variants } = entry as {
      component?: unknown;
      variants?: unknown;
    };

    if (typeof component !== "function") {
      console.warn(`Skipping ${name}: missing or invalid component`);
      continue;
    }

    if (!Array.isArray(variants)) {
      console.warn(`Skipping ${name}: variants must be an array`);
      continue;
    }

    registry[name] = {
      component: component as React.ComponentType<any>,
      variants: variants.map((v: any, i: number) => ({
        name: v.name || `Variant ${i + 1}`,
        props: v.props || {},
      })),
    };
  }

  return registry;
}

const registry = buildRegistry(previewConfig);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PreviewApp registry={registry} />
  </React.StrictMode>
);
