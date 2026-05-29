import { describe, it, expect } from "vitest";
import {
  isAllowedUrl,
  isAllowedDataUrl,
  sanitizeUrl,
  getSafeRel,
} from "../url-validation.js";

describe("isAllowedUrl", () => {
  describe("blocks dangerous protocols", () => {
    it("blocks javascript: URLs", () => {
      expect(isAllowedUrl('javascript:alert("xss")')).toBe(false);
      expect(isAllowedUrl('JAVASCRIPT:alert("xss")')).toBe(false);
      expect(isAllowedUrl("  javascript:void(0)")).toBe(false);
    });

    it("blocks vbscript: URLs", () => {
      expect(isAllowedUrl('vbscript:msgbox("xss")')).toBe(false);
      expect(isAllowedUrl('VBSCRIPT:msgbox("xss")')).toBe(false);
    });

    it("blocks file: URLs", () => {
      expect(isAllowedUrl("file:///etc/passwd")).toBe(false);
      expect(isAllowedUrl("FILE:///C:/Windows/System32")).toBe(false);
    });

    it("blocks data: URLs by default", () => {
      expect(isAllowedUrl('data:text/html,<script>alert("xss")</script>')).toBe(
        false
      );
      expect(isAllowedUrl("data:image/png;base64,abc123")).toBe(false);
    });
  });

  describe("allows safe URLs", () => {
    it("allows null and undefined", () => {
      expect(isAllowedUrl(null)).toBe(true);
      expect(isAllowedUrl(undefined)).toBe(true);
    });

    it("allows empty string", () => {
      expect(isAllowedUrl("")).toBe(true);
      expect(isAllowedUrl("  ")).toBe(true);
    });

    it("allows relative paths", () => {
      expect(isAllowedUrl("/path/to/page")).toBe(true);
      expect(isAllowedUrl("./relative/path")).toBe(true);
      expect(isAllowedUrl("../parent/path")).toBe(true);
      expect(isAllowedUrl("path/without/slash")).toBe(true);
    });

    it("allows anchor links", () => {
      expect(isAllowedUrl("#section")).toBe(true);
      expect(isAllowedUrl("#top")).toBe(true);
    });

    it("allows http/https URLs", () => {
      expect(isAllowedUrl("http://example.com")).toBe(true);
      expect(isAllowedUrl("https://example.com/path?query=value")).toBe(true);
      expect(isAllowedUrl("HTTPS://EXAMPLE.COM")).toBe(true);
    });

    it("allows mailto: URLs", () => {
      expect(isAllowedUrl("mailto:user@example.com")).toBe(true);
      expect(isAllowedUrl("mailto:user@example.com?subject=Hello")).toBe(true);
    });

    it("allows tel: URLs", () => {
      expect(isAllowedUrl("tel:+1234567890")).toBe(true);
      expect(isAllowedUrl("tel:555-1234")).toBe(true);
    });
  });
});

describe("isAllowedDataUrl", () => {
  describe("allows image data URLs", () => {
    it("allows PNG data URLs", () => {
      expect(isAllowedDataUrl("data:image/png;base64,abc123")).toBe(true);
    });

    it("allows JPEG data URLs", () => {
      expect(isAllowedDataUrl("data:image/jpeg;base64,abc123")).toBe(true);
      expect(isAllowedDataUrl("data:image/jpg;base64,abc123")).toBe(true);
    });

    it("allows GIF data URLs", () => {
      expect(isAllowedDataUrl("data:image/gif;base64,abc123")).toBe(true);
    });

    it("allows WebP data URLs", () => {
      expect(isAllowedDataUrl("data:image/webp;base64,abc123")).toBe(true);
    });

    it("allows SVG data URLs", () => {
      expect(isAllowedDataUrl("data:image/svg+xml;base64,abc123")).toBe(true);
      expect(isAllowedDataUrl("data:image/svg+xml,<svg></svg>")).toBe(true);
    });

    it("allows AVIF data URLs", () => {
      expect(isAllowedDataUrl("data:image/avif;base64,abc123")).toBe(true);
    });

    it("is case insensitive", () => {
      expect(isAllowedDataUrl("DATA:IMAGE/PNG;base64,abc123")).toBe(true);
      expect(isAllowedDataUrl("Data:Image/Jpeg;Base64,abc123")).toBe(true);
    });
  });

  describe("blocks non-image data URLs", () => {
    it("blocks text/html data URLs", () => {
      expect(
        isAllowedDataUrl('data:text/html,<script>alert("xss")</script>')
      ).toBe(false);
    });

    it("blocks text/javascript data URLs", () => {
      expect(isAllowedDataUrl('data:text/javascript,alert("xss")')).toBe(false);
    });

    it("blocks application/javascript data URLs", () => {
      expect(isAllowedDataUrl('data:application/javascript,alert("xss")')).toBe(
        false
      );
    });

    it("blocks text/plain data URLs", () => {
      expect(isAllowedDataUrl("data:text/plain,hello")).toBe(false);
    });
  });

  describe("handles edge cases", () => {
    it("returns false for null/undefined", () => {
      expect(isAllowedDataUrl(null)).toBe(false);
      expect(isAllowedDataUrl(undefined)).toBe(false);
    });

    it("returns false for non-data URLs", () => {
      expect(isAllowedDataUrl("https://example.com/image.png")).toBe(false);
      expect(isAllowedDataUrl("/path/to/image.png")).toBe(false);
    });

    it("returns false for malformed data URLs", () => {
      expect(isAllowedDataUrl("data:")).toBe(false);
      expect(isAllowedDataUrl("data:;base64,abc")).toBe(false);
    });
  });
});

describe("sanitizeUrl", () => {
  it("returns undefined for blocked URLs", () => {
    expect(sanitizeUrl('javascript:alert("xss")')).toBeUndefined();
    expect(sanitizeUrl('vbscript:msgbox("xss")')).toBeUndefined();
    expect(sanitizeUrl("file:///etc/passwd")).toBeUndefined();
  });

  it("returns undefined for blocked data URLs", () => {
    expect(sanitizeUrl("data:text/html,<script>bad</script>")).toBeUndefined();
  });

  it("returns the URL for allowed data URLs", () => {
    const dataUrl = "data:image/png;base64,abc123";
    expect(sanitizeUrl(dataUrl)).toBe(dataUrl);
  });

  it("returns the URL for allowed URLs", () => {
    expect(sanitizeUrl("https://example.com")).toBe("https://example.com");
    expect(sanitizeUrl("/path/to/page")).toBe("/path/to/page");
    expect(sanitizeUrl("#anchor")).toBe("#anchor");
  });

  it("returns undefined for null/undefined", () => {
    expect(sanitizeUrl(null)).toBeUndefined();
    expect(sanitizeUrl(undefined)).toBeUndefined();
  });
});

describe("getSafeRel", () => {
  it("returns noopener noreferrer for undefined input", () => {
    expect(getSafeRel()).toBe("noopener noreferrer");
    expect(getSafeRel(undefined)).toBe("noopener noreferrer");
  });

  it("adds noopener noreferrer to empty string", () => {
    const result = getSafeRel("");
    expect(result).toContain("noopener");
    expect(result).toContain("noreferrer");
  });

  it("preserves existing rel values", () => {
    const result = getSafeRel("author");
    expect(result).toContain("author");
    expect(result).toContain("noopener");
    expect(result).toContain("noreferrer");
  });

  it("does not duplicate existing noopener/noreferrer", () => {
    const result = getSafeRel("noopener noreferrer");
    const parts = result.split(/\s+/);
    expect(parts.filter(p => p === "noopener").length).toBe(1);
    expect(parts.filter(p => p === "noreferrer").length).toBe(1);
  });

  it("handles multiple existing values", () => {
    const result = getSafeRel("author license");
    expect(result).toContain("author");
    expect(result).toContain("license");
    expect(result).toContain("noopener");
    expect(result).toContain("noreferrer");
  });
});
