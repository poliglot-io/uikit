import { describe, it, expect } from "vitest";
import { cn } from "../utils.js";

describe("cn", () => {
  describe("basic functionality", () => {
    it("combines class names", () => {
      expect(cn("foo", "bar")).toBe("foo bar");
    });

    it("handles single class", () => {
      expect(cn("foo")).toBe("foo");
    });

    it("handles empty input", () => {
      expect(cn()).toBe("");
    });

    it("handles undefined and null", () => {
      expect(cn("foo", undefined, "bar", null)).toBe("foo bar");
    });

    it("handles false and empty strings", () => {
      expect(cn("foo", false, "bar", "")).toBe("foo bar");
    });
  });

  describe("conditional classes", () => {
    it("handles conditional classes with &&", () => {
      const isActive = true;
      const isDisabled = false;
      expect(cn("base", isActive && "active", isDisabled && "disabled")).toBe(
        "base active"
      );
    });

    it("handles object syntax", () => {
      expect(cn({ foo: true, bar: false, baz: true })).toBe("foo baz");
    });

    it("handles array syntax", () => {
      expect(cn(["foo", "bar"])).toBe("foo bar");
    });

    it("handles nested arrays", () => {
      expect(cn("foo", ["bar", ["baz"]])).toBe("foo bar baz");
    });
  });

  describe("tailwind merge", () => {
    it("merges conflicting padding", () => {
      expect(cn("p-4", "p-8")).toBe("p-8");
    });

    it("merges conflicting margin", () => {
      expect(cn("m-2", "m-4")).toBe("m-4");
    });

    it("merges conflicting text colors", () => {
      expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
    });

    it("merges conflicting background colors", () => {
      expect(cn("bg-red-500", "bg-blue-500")).toBe("bg-blue-500");
    });

    it("merges conflicting widths", () => {
      expect(cn("w-4", "w-full")).toBe("w-full");
    });

    it("merges conflicting flex", () => {
      expect(cn("flex-row", "flex-col")).toBe("flex-col");
    });

    it("preserves non-conflicting classes", () => {
      expect(cn("p-4", "m-4", "text-red-500")).toBe("p-4 m-4 text-red-500");
    });

    it("handles complex merges", () => {
      const result = cn(
        "px-4 py-2 bg-blue-500 text-white rounded",
        "bg-red-500", // override bg
        "px-6" // override px
      );
      expect(result).toContain("bg-red-500");
      expect(result).toContain("px-6");
      expect(result).toContain("py-2");
      expect(result).toContain("text-white");
      expect(result).toContain("rounded");
      expect(result).not.toContain("bg-blue-500");
      expect(result).not.toContain("px-4");
    });
  });

  describe("edge cases", () => {
    it("handles whitespace in class names", () => {
      expect(cn("  foo  ", "  bar  ")).toBe("foo bar");
    });

    it("handles duplicate non-tailwind classes (not merged)", () => {
      // tailwind-merge only deduplicates conflicting Tailwind utilities, not arbitrary classes
      expect(cn("foo", "foo", "bar")).toBe("foo foo bar");
    });

    it("handles responsive prefixes", () => {
      expect(cn("md:p-4", "lg:p-8")).toBe("md:p-4 lg:p-8");
    });

    it("handles state prefixes", () => {
      expect(cn("hover:bg-blue-500", "focus:bg-red-500")).toBe(
        "hover:bg-blue-500 focus:bg-red-500"
      );
    });

    it("merges same prefix variants", () => {
      expect(cn("hover:bg-blue-500", "hover:bg-red-500")).toBe(
        "hover:bg-red-500"
      );
    });
  });
});
