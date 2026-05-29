/**
 * URL Validation Utilities for @poliglot-io/uikit
 *
 * These utilities validate URLs passed to components to prevent
 * javascript: and other dangerous protocol attacks.
 *
 * Defense-in-depth layer; consumers may add their own validation upstream.
 */

/**
 * Protocols that should NEVER be allowed in URLs
 */
const BLOCKED_PROTOCOLS = [
  "javascript:",
  "vbscript:",
  "file:",
  "data:", // Blocked by default, use isAllowedDataUrl for specific cases
];

/**
 * Check if a URL uses a blocked protocol.
 * Returns true if the URL is dangerous.
 */
function hasBlockedProtocol(url: string): boolean {
  const normalized = url.toLowerCase().trim();
  return BLOCKED_PROTOCOLS.some(protocol => normalized.startsWith(protocol));
}

/**
 * Check if a URL is allowed for general use (href, src, etc.)
 *
 * Allowed:
 * - Relative paths: /path/to/resource, ./file, ../file
 * - Anchor links: #section
 * - mailto: links: mailto:user@example.com
 * - tel: links: tel:+1234567890
 * - HTTP/HTTPS URLs: https://example.com
 *
 * Blocked:
 * - javascript: URLs
 * - vbscript: URLs
 * - file: URLs
 * - data: URLs (use isAllowedDataUrl for images)
 *
 * @example
 * ```tsx
 * function Link({ href, children }: LinkProps) {
 *   if (!isAllowedUrl(href)) {
 *     console.warn(`Blocked URL: ${href}`)
 *     return <span>{children}</span>
 *   }
 *   return <a href={href}>{children}</a>
 * }
 * ```
 */
export function isAllowedUrl(url: string | undefined | null): boolean {
  // Empty/null URLs are safe (no navigation)
  if (!url) return true;

  const trimmed = url.trim();

  // Empty string is safe
  if (trimmed === "") return true;

  // Check for blocked protocols
  if (hasBlockedProtocol(trimmed)) {
    return false;
  }

  // Everything else is allowed:
  // - Relative paths: /foo, ./foo, ../foo, foo
  // - Anchors: #section
  // - Protocols: http://, https://, mailto:, tel:
  return true;
}

/**
 * Check if a data: URL is allowed (only for images).
 *
 * Only allows:
 * - data:image/png;base64,...
 * - data:image/jpeg;base64,...
 * - data:image/gif;base64,...
 * - data:image/webp;base64,...
 * - data:image/svg+xml;base64,...
 * - data:image/svg+xml,...
 *
 * @example
 * ```tsx
 * function Image({ src, alt }: ImageProps) {
 *   if (src?.startsWith('data:') && !isAllowedDataUrl(src)) {
 *     console.warn(`Blocked data URL: ${src.slice(0, 50)}...`)
 *     return null
 *   }
 *   return <img src={src} alt={alt} />
 * }
 * ```
 */
export function isAllowedDataUrl(url: string | undefined | null): boolean {
  if (!url) return false;

  const normalized = url.toLowerCase().trim();

  // Must be a data: URL
  if (!normalized.startsWith("data:")) return false;

  // Extract MIME type
  const mimeMatch = normalized.match(/^data:([^;,]+)/);
  if (!mimeMatch) return false;

  const mimeType = mimeMatch[1];

  // Only allow image MIME types
  const allowedImageTypes = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "image/avif",
  ];

  return allowedImageTypes.includes(mimeType);
}

/**
 * Sanitize a URL for use in href/src attributes.
 * Returns the URL if safe, or undefined if blocked.
 *
 * @example
 * ```tsx
 * function Link({ href, children }: LinkProps) {
 *   return <a href={sanitizeUrl(href) ?? '#'}>{children}</a>
 * }
 * ```
 */
export function sanitizeUrl(
  url: string | undefined | null
): string | undefined {
  if (!url) return undefined;

  // Check if it's a data URL
  if (url.toLowerCase().startsWith("data:")) {
    return isAllowedDataUrl(url) ? url : undefined;
  }

  // Check general URL safety
  return isAllowedUrl(url) ? url : undefined;
}

/**
 * Get safe rel attribute for external links.
 * Adds noopener noreferrer to prevent tabnabbing attacks.
 *
 * @example
 * ```tsx
 * function Link({ href, children, rel }: LinkProps) {
 *   const isExternal = href?.startsWith('http')
 *   return (
 *     <a
 *       href={sanitizeUrl(href)}
 *       rel={isExternal ? getSafeRel(rel) : rel}
 *       target={isExternal ? '_blank' : undefined}
 *     >
 *       {children}
 *     </a>
 *   )
 * }
 * ```
 */
export function getSafeRel(existingRel?: string): string {
  const required = ["noopener", "noreferrer"];

  if (!existingRel) {
    return required.join(" ");
  }

  const existing = existingRel.split(/\s+/);
  const merged = new Set([...existing, ...required]);
  return Array.from(merged).join(" ");
}
