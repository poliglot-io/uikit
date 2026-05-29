/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button, buttonVariants } from "../button.js";

describe("Button", () => {
  describe("rendering", () => {
    it("renders children text", () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole("button")).toHaveTextContent("Click me");
    });

    it("renders as button element by default", () => {
      render(<Button>Test</Button>);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("applies data-slot attribute", () => {
      render(<Button>Test</Button>);
      expect(screen.getByRole("button")).toHaveAttribute("data-slot", "button");
    });
  });

  describe("variants", () => {
    it("applies default variant classes", () => {
      render(<Button>Test</Button>);
      const button = screen.getByRole("button");
      expect(button.className).toContain("bg-primary");
    });

    it("applies destructive variant", () => {
      render(<Button variant="destructive">Delete</Button>);
      const button = screen.getByRole("button");
      expect(button.className).toContain("bg-destructive");
    });

    it("applies outline variant", () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByRole("button");
      expect(button.className).toContain("border");
      expect(button.className).toContain("bg-background");
    });

    it("applies secondary variant", () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole("button");
      expect(button.className).toContain("bg-secondary");
    });

    it("applies ghost variant", () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole("button");
      expect(button.className).toContain("hover:bg-accent");
    });

    it("applies link variant", () => {
      render(<Button variant="link">Link</Button>);
      const button = screen.getByRole("button");
      expect(button.className).toContain("underline-offset-4");
    });
  });

  describe("sizes", () => {
    it("applies default size", () => {
      render(<Button>Test</Button>);
      const button = screen.getByRole("button");
      expect(button.className).toContain("h-9");
    });

    it("applies sm size", () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole("button");
      expect(button.className).toContain("h-8");
    });

    it("applies lg size", () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole("button");
      expect(button.className).toContain("h-10");
    });

    it("applies icon size", () => {
      render(<Button size="icon">🔍</Button>);
      const button = screen.getByRole("button");
      expect(button.className).toContain("size-9");
    });
  });

  describe("className prop", () => {
    it("allows custom className to be passed", () => {
      render(<Button className="custom-class">Test</Button>);
      const button = screen.getByRole("button");
      expect(button.className).toContain("custom-class");
    });

    it("merges custom className with variant classes", () => {
      render(
        <Button className="my-class" variant="destructive">
          Test
        </Button>
      );
      const button = screen.getByRole("button");
      expect(button.className).toContain("my-class");
      expect(button.className).toContain("bg-destructive");
    });
  });

  describe("asChild", () => {
    it("renders as Slot when asChild is true", () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      );
      // When asChild is true, the Button renders as the child element
      const link = screen.getByRole("link");
      expect(link).toBeInTheDocument();
      expect(link).toHaveTextContent("Link Button");
    });
  });

  describe("HTML attributes", () => {
    it("passes through disabled attribute", () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole("button")).toBeDisabled();
    });

    it("passes through type attribute", () => {
      render(<Button type="submit">Submit</Button>);
      expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
    });

    it("passes through aria-label", () => {
      render(<Button aria-label="Close dialog">X</Button>);
      expect(screen.getByRole("button")).toHaveAttribute(
        "aria-label",
        "Close dialog"
      );
    });
  });
});

describe("buttonVariants", () => {
  it("is a function", () => {
    expect(typeof buttonVariants).toBe("function");
  });

  it("returns base classes with no arguments", () => {
    const classes = buttonVariants();
    expect(classes).toContain("inline-flex");
    expect(classes).toContain("items-center");
  });

  it("accepts variant option", () => {
    const classes = buttonVariants({ variant: "destructive" });
    expect(classes).toContain("bg-destructive");
  });

  it("accepts size option", () => {
    const classes = buttonVariants({ size: "lg" });
    expect(classes).toContain("h-10");
  });

  it("accepts className option", () => {
    const classes = buttonVariants({ className: "my-custom-class" });
    expect(classes).toContain("my-custom-class");
  });
});
