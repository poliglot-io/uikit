import React, { useState, useMemo, useEffect } from "react";

/**
 * Preview variant definition.
 */
export interface PreviewVariant {
  name: string;
  props: Record<string, unknown>;
}

/**
 * Component preview configuration.
 */
export interface ComponentPreview {
  component: React.ComponentType<any>;
  variants: PreviewVariant[];
}

/**
 * Preview registry - map of component names to their preview configs.
 */
export type PreviewRegistry = Record<string, ComponentPreview>;

interface PreviewAppProps {
  registry: PreviewRegistry;
}

/**
 * Main preview application component.
 *
 * Features:
 * - Sidebar with component list and variant selection
 * - Content area rendering the selected component
 * - Props panel showing current props as JSON
 * - Dark mode toggle
 * - Keyboard navigation (up/down arrows)
 */
export default function PreviewApp({ registry }: PreviewAppProps) {
  const componentNames = useMemo(
    () => Object.keys(registry).sort(),
    [registry]
  );
  const [selectedComponent, setSelectedComponent] = useState(
    componentNames[0] || ""
  );
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [darkMode, setDarkMode] = useState(false);

  const currentPreview = registry[selectedComponent];
  const Component = currentPreview?.component;
  const variants = currentPreview?.variants || [];
  const currentVariant = variants[selectedVariant];

  // Handle keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowUp" && selectedVariant > 0) {
        setSelectedVariant(selectedVariant - 1);
      } else if (
        e.key === "ArrowDown" &&
        selectedVariant < variants.length - 1
      ) {
        setSelectedVariant(selectedVariant + 1);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedVariant, variants.length]);

  // Apply dark mode to document
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // Empty state
  if (componentNames.length === 0) {
    return (
      <div className="preview-empty">
        <div className="preview-empty-box">
          <h1 className="preview-empty-title">No previews found</h1>
          <p className="preview-empty-text">
            Create a{" "}
            <code className="preview-empty-code">poliglot.preview.js</code> file
            in your project root.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="preview-shell">
      {/* Sidebar */}
      <div className="preview-sidebar">
        <div className="preview-sidebar-header">
          <h1 className="preview-sidebar-title">Component Preview</h1>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="preview-dark-toggle"
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>
        <nav className="preview-nav">
          {componentNames.map(name => (
            <div key={name} className="preview-nav-group">
              <button
                onClick={() => {
                  setSelectedComponent(name);
                  setSelectedVariant(0);
                }}
                className={`preview-nav-btn ${selectedComponent === name ? "active" : ""}`}
              >
                {name}
              </button>
              {selectedComponent === name && (
                <div className="preview-variants">
                  {registry[name].variants.map((variant, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedVariant(idx)}
                      className={`preview-variant-btn ${selectedVariant === idx ? "active" : ""}`}
                    >
                      {variant.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <div className="preview-main">
        <div className="preview-content">
          {Component && currentVariant && (
            <Component {...currentVariant.props} />
          )}
        </div>

        {/* Props panel */}
        <div className="preview-props">
          <div className="preview-props-label">Props:</div>
          <pre>{JSON.stringify(currentVariant?.props || {}, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}
