/**
 * Props Filtering Utilities for @poliglot-io/uikit
 *
 * These utilities help filter out dangerous props from component spreads.
 * Defense-in-depth layer; consumers may add their own validation upstream.
 */

/**
 * Props that should NEVER be passed through to DOM elements
 */
const BLOCKED_PROPS = new Set([
  // XSS vectors
  "dangerouslySetInnerHTML",

  // Style injection (position: fixed, z-index, etc.)
  "style",

  // Ref escapes (could access DOM directly)
  "ref",

  // iframe/embed dangerous props
  "srcdoc",
  "allow",
  "allowfullscreen",
  "allowpaymentrequest",

  // Form hijacking
  "formaction",
  "formmethod",
  "formtarget",

  // Tracking/security
  "ping",

  // Common event handlers (blocked by pattern, but explicit for clarity)
  "onError",
  "onLoad",
  "onBeforeUnload",
]);

/**
 * Event handler pattern - all on* props are blocked
 */
const EVENT_HANDLER_PATTERN = /^on[A-Z]/;

/**
 * Filter out dangerous props from a props object.
 * Use this when spreading props to DOM elements.
 *
 * @example
 * ```tsx
 * function Card({ children, ...props }: CardProps) {
 *   return <div {...filterSafeProps(props)}>{children}</div>
 * }
 * ```
 */
export function filterSafeProps<T extends Record<string, unknown>>(
  props: T,
  additionalBlocked: string[] = []
): Partial<T> {
  const blocked = new Set([...BLOCKED_PROPS, ...additionalBlocked]);

  return Object.fromEntries(
    Object.entries(props).filter(([key]) => {
      // Block explicitly listed props
      if (blocked.has(key)) return false;

      // Block all event handlers (onClick, onMouseEnter, etc.)
      if (EVENT_HANDLER_PATTERN.test(key)) return false;

      return true;
    })
  ) as Partial<T>;
}

/**
 * List of props that are safe to pass through.
 * More restrictive - only allows known-safe props.
 */
const ALLOWED_PROPS = new Set([
  // Standard HTML attributes
  "id",
  "className",
  "title",
  "lang",
  "dir",
  "hidden",
  "tabIndex",
  "role",

  // Accessibility
  "aria-label",
  "aria-labelledby",
  "aria-describedby",
  "aria-hidden",
  "aria-live",
  "aria-atomic",
  "aria-busy",
  "aria-controls",
  "aria-current",
  "aria-disabled",
  "aria-expanded",
  "aria-haspopup",
  "aria-invalid",
  "aria-pressed",
  "aria-readonly",
  "aria-required",
  "aria-selected",
  "aria-valuemax",
  "aria-valuemin",
  "aria-valuenow",
  "aria-valuetext",

  // Data attributes (pattern matched below)

  // Form (for controlled components only)
  "name",
  "value",
  "checked",
  "disabled",
  "readOnly",
  "required",
  "placeholder",
  "autoComplete",
  "autoFocus",
  "maxLength",
  "minLength",
  "pattern",
  "min",
  "max",
  "step",
  "type",
  "inputMode",

  // Media
  "alt",
  "loading",
  "decoding",
  "crossOrigin",
  "width",
  "height",
]);

/**
 * Data attribute pattern
 */
const DATA_ATTR_PATTERN = /^data-/;

/**
 * Allowlist-based prop filter - more restrictive than filterSafeProps.
 * Only allows explicitly known-safe props through.
 *
 * @example
 * ```tsx
 * function SecureCard({ children, ...props }: CardProps) {
 *   return <div {...allowlistProps(props)}>{children}</div>
 * }
 * ```
 */
export function allowlistProps<T extends Record<string, unknown>>(
  props: T,
  additionalAllowed: string[] = []
): Partial<T> {
  const allowed = new Set([...ALLOWED_PROPS, ...additionalAllowed]);

  return Object.fromEntries(
    Object.entries(props).filter(([key]) => {
      // Allow explicitly listed props
      if (allowed.has(key)) return true;

      // Allow data-* attributes
      if (DATA_ATTR_PATTERN.test(key)) return true;

      return false;
    })
  ) as Partial<T>;
}
