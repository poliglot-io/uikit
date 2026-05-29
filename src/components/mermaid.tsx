"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTheme } from "next-themes";
import mermaid from "mermaid";

interface MermaidProps {
  chart: string;
  className?: string;
}

export function Mermaid({ chart, className }: MermaidProps) {
  const id = useId().replace(/:/g, "-");
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const isDark = resolvedTheme === "dark";
    mermaid.initialize({
      startOnLoad: false,
      theme: "base",
      fontFamily: "inherit",
      themeVariables: {
        background: "transparent",
        primaryColor: isDark ? "#1e293b" : "#e2e8f0",
        primaryTextColor: isDark ? "#e2e8f0" : "#1e293b",
        primaryBorderColor: isDark ? "#475569" : "#94a3b8",
        secondaryColor: isDark ? "#334155" : "#f1f5f9",
        secondaryTextColor: isDark ? "#e2e8f0" : "#1e293b",
        secondaryBorderColor: isDark ? "#475569" : "#94a3b8",
        tertiaryColor: isDark ? "#1e293b" : "#e2e8f0",
        tertiaryTextColor: isDark ? "#e2e8f0" : "#1e293b",
        tertiaryBorderColor: isDark ? "#475569" : "#94a3b8",
        lineColor: isDark ? "#94a3b8" : "#475569",
        textColor: isDark ? "#e2e8f0" : "#1e293b",
        mainBkg: isDark ? "#1e293b" : "#e2e8f0",
        nodeBorder: isDark ? "#475569" : "#94a3b8",
        clusterBkg: "transparent",
        titleColor: isDark ? "#e2e8f0" : "#1e293b",
        edgeLabelBackground: "transparent",
      },
      flowchart: {
        useMaxWidth: false,
        htmlLabels: true,
        padding: 16,
        nodeSpacing: 30,
        rankSpacing: 40,
      },
    });

    const themedChart = chart
      .replace(
        /classDef pass ([^\n]*)/g,
        `classDef pass fill:${isDark ? "#065f46" : "#d1fae5"},stroke:#34d399,color:${isDark ? "#d1fae5" : "#064e3b"}`
      )
      .replace(
        /classDef fail ([^\n]*)/g,
        `classDef fail fill:${isDark ? "#991b1b" : "#fee2e2"},stroke:#f87171,color:${isDark ? "#fee2e2" : "#7f1d1d"}`
      );

    const renderChart = async () => {
      try {
        const { svg: rendered } = await mermaid.render(
          `mermaid${id}`,
          themedChart
        );
        setSvg(rendered);
      } catch (error) {
        console.error("Mermaid rendering error:", error);
      }
    };

    renderChart();
  }, [chart, id, resolvedTheme]);

  // After SVG is injected, fix its sizing
  useEffect(() => {
    if (!svg || !containerRef.current) return;
    const svgEl = containerRef.current.querySelector("svg");
    if (!svgEl) return;

    // Ensure viewBox exists for responsive scaling
    if (!svgEl.getAttribute("viewBox")) {
      const bbox = svgEl.getBBox();
      svgEl.setAttribute(
        "viewBox",
        `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`
      );
    }

    // Let the SVG scale responsively within its container
    svgEl.removeAttribute("style");
    svgEl.style.maxWidth = "100%";
    svgEl.style.height = "auto";
    svgEl.setAttribute("preserveAspectRatio", "xMidYMid meet");
  }, [svg]);

  if (!svg) {
    return <div className={`mermaid-container ${className ?? ""}`} />;
  }

  return (
    <div
      ref={containerRef}
      className={`mermaid-container ${className ?? ""}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
