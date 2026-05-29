import { describe, it, expect } from "vitest";
import { filterSafeProps, allowlistProps } from "../safe-props.js";

describe("filterSafeProps", () => {
  describe("blocks dangerous props", () => {
    it("blocks dangerouslySetInnerHTML", () => {
      const props = {
        dangerouslySetInnerHTML: { __html: '<script>alert("xss")</script>' },
      };
      const result = filterSafeProps(props);
      expect(result).not.toHaveProperty("dangerouslySetInnerHTML");
    });

    it("blocks style prop", () => {
      const props = { style: { position: "fixed", zIndex: 9999 } };
      const result = filterSafeProps(props);
      expect(result).not.toHaveProperty("style");
    });

    it("blocks ref prop", () => {
      const props = { ref: {} };
      const result = filterSafeProps(props);
      expect(result).not.toHaveProperty("ref");
    });

    it("blocks srcdoc prop", () => {
      const props = { srcdoc: "<script>evil()</script>" };
      const result = filterSafeProps(props);
      expect(result).not.toHaveProperty("srcdoc");
    });

    it("blocks form hijacking props", () => {
      const props = {
        formaction: "http://evil.com",
        formmethod: "POST",
        formtarget: "_blank",
      };
      const result = filterSafeProps(props);
      expect(result).not.toHaveProperty("formaction");
      expect(result).not.toHaveProperty("formmethod");
      expect(result).not.toHaveProperty("formtarget");
    });

    it("blocks ping prop", () => {
      const props = { ping: "http://tracker.com" };
      const result = filterSafeProps(props);
      expect(result).not.toHaveProperty("ping");
    });
  });

  describe("blocks event handlers", () => {
    it("blocks onClick", () => {
      const props = { onClick: () => {} };
      const result = filterSafeProps(props);
      expect(result).not.toHaveProperty("onClick");
    });

    it("blocks onMouseEnter", () => {
      const props = { onMouseEnter: () => {} };
      const result = filterSafeProps(props);
      expect(result).not.toHaveProperty("onMouseEnter");
    });

    it("blocks onError", () => {
      const props = { onError: () => {} };
      const result = filterSafeProps(props);
      expect(result).not.toHaveProperty("onError");
    });

    it("blocks onLoad", () => {
      const props = { onLoad: () => {} };
      const result = filterSafeProps(props);
      expect(result).not.toHaveProperty("onLoad");
    });

    it("blocks onFocus, onBlur, onChange", () => {
      const props = { onFocus: () => {}, onBlur: () => {}, onChange: () => {} };
      const result = filterSafeProps(props);
      expect(result).not.toHaveProperty("onFocus");
      expect(result).not.toHaveProperty("onBlur");
      expect(result).not.toHaveProperty("onChange");
    });
  });

  describe("allows safe props", () => {
    it("allows className", () => {
      const props = { className: "text-red-500" };
      const result = filterSafeProps(props);
      expect(result).toHaveProperty("className", "text-red-500");
    });

    it("allows id", () => {
      const props = { id: "my-element" };
      const result = filterSafeProps(props);
      expect(result).toHaveProperty("id", "my-element");
    });

    it("allows data-* attributes", () => {
      const props = { "data-testid": "button", "data-value": "123" };
      const result = filterSafeProps(props);
      expect(result).toHaveProperty("data-testid", "button");
      expect(result).toHaveProperty("data-value", "123");
    });

    it("allows aria-* attributes", () => {
      const props = { "aria-label": "Close", "aria-hidden": true };
      const result = filterSafeProps(props);
      expect(result).toHaveProperty("aria-label", "Close");
      expect(result).toHaveProperty("aria-hidden", true);
    });

    it("allows title", () => {
      const props = { title: "Tooltip text" };
      const result = filterSafeProps(props);
      expect(result).toHaveProperty("title", "Tooltip text");
    });
  });

  describe("additional blocked props", () => {
    it("blocks additional props when specified", () => {
      const props = { className: "foo", customDanger: "bad" };
      const result = filterSafeProps(props, ["customDanger"]);
      expect(result).toHaveProperty("className", "foo");
      expect(result).not.toHaveProperty("customDanger");
    });
  });
});

describe("allowlistProps", () => {
  describe("only allows safe props", () => {
    it("allows standard HTML attributes", () => {
      const props = {
        id: "test",
        className: "foo",
        title: "bar",
        hidden: true,
      };
      const result = allowlistProps(props);
      expect(result).toEqual({
        id: "test",
        className: "foo",
        title: "bar",
        hidden: true,
      });
    });

    it("allows accessibility props", () => {
      const props = {
        "aria-label": "test",
        "aria-hidden": true,
        "aria-expanded": false,
      };
      const result = allowlistProps(props);
      expect(result).toHaveProperty("aria-label", "test");
      expect(result).toHaveProperty("aria-hidden", true);
      expect(result).toHaveProperty("aria-expanded", false);
    });

    it("allows data-* attributes", () => {
      const props = { "data-testid": "button", "data-custom": "value" };
      const result = allowlistProps(props);
      expect(result).toHaveProperty("data-testid", "button");
      expect(result).toHaveProperty("data-custom", "value");
    });

    it("allows form control props", () => {
      const props = {
        name: "email",
        value: "test@example.com",
        disabled: true,
        required: true,
      };
      const result = allowlistProps(props);
      expect(result).toEqual({
        name: "email",
        value: "test@example.com",
        disabled: true,
        required: true,
      });
    });

    it("allows media props", () => {
      const props = { alt: "Image", width: 100, height: 100, loading: "lazy" };
      const result = allowlistProps(props);
      expect(result).toEqual({
        alt: "Image",
        width: 100,
        height: 100,
        loading: "lazy",
      });
    });
  });

  describe("blocks dangerous props", () => {
    it("blocks dangerouslySetInnerHTML", () => {
      const props = {
        dangerouslySetInnerHTML: { __html: "bad" },
        className: "foo",
      };
      const result = allowlistProps(props);
      expect(result).not.toHaveProperty("dangerouslySetInnerHTML");
      expect(result).toHaveProperty("className", "foo");
    });

    it("blocks style", () => {
      const props = { style: { color: "red" }, className: "foo" };
      const result = allowlistProps(props);
      expect(result).not.toHaveProperty("style");
    });

    it("blocks event handlers", () => {
      const props = { onClick: () => {}, className: "foo" };
      const result = allowlistProps(props);
      expect(result).not.toHaveProperty("onClick");
    });

    it("blocks unknown props", () => {
      const props = { customProp: "value", className: "foo" };
      const result = allowlistProps(props);
      expect(result).not.toHaveProperty("customProp");
      expect(result).toHaveProperty("className", "foo");
    });
  });

  describe("additional allowed props", () => {
    it("allows additional props when specified", () => {
      const props = { className: "foo", customSafe: "good" };
      const result = allowlistProps(props, ["customSafe"]);
      expect(result).toHaveProperty("className", "foo");
      expect(result).toHaveProperty("customSafe", "good");
    });
  });
});
