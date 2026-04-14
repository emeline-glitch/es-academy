/**
 * Email tracking utilities
 * - Injects a tracking pixel for open tracking
 * - Rewrites all links for click tracking
 */

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001";

/**
 * Inject tracking pixel (1x1 transparent GIF) before </body> or at end of HTML
 */
export function injectTrackingPixel(html: string, sendId: string): string {
  const pixelUrl = `${BASE_URL}/api/track/open?sid=${encodeURIComponent(sendId)}`;
  const pixelTag = `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:none;width:1px;height:1px;border:0;" />`;

  // Insert before </body> if exists, otherwise append
  if (html.includes("</body>")) {
    return html.replace("</body>", `${pixelTag}</body>`);
  }
  return html + pixelTag;
}

/**
 * Rewrite all <a href="..."> links to go through our click tracker
 * Preserves mailto: and anchor (#) links
 */
export function rewriteLinks(html: string, sendId: string): string {
  return html.replace(
    /<a\s+([^>]*?)href=["']([^"']+)["']([^>]*?)>/gi,
    (match, before, href, after) => {
      // Don't track mailto, tel, anchor links, or already-tracked links
      if (
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("#") ||
        href.includes("/api/track/")
      ) {
        return match;
      }

      const trackUrl = `${BASE_URL}/api/track/click?sid=${encodeURIComponent(sendId)}&url=${encodeURIComponent(href)}`;
      return `<a ${before}href="${trackUrl}"${after}>`;
    }
  );
}

/**
 * Apply all tracking to an email HTML body
 */
export function applyTracking(html: string, sendId: string): string {
  let tracked = rewriteLinks(html, sendId);
  tracked = injectTrackingPixel(tracked, sendId);
  return tracked;
}
