// ── Utility: strip hidden-content blocks (both saved `data-hlb-id`
// blocks and any leftover `.hlb-pending` editor markup) out of a
// content string, and report whether the thread contains a hidden
// link — so listing pages (ThreadList, SubcategoryPageClient, search
// results, profile "recent threads", etc.) can show a clean excerpt
// plus a small professional badge instead of leaking the raw block. ──

export interface StrippedContent {
  /** Plain-text excerpt with all hidden-block markup removed. */
  excerpt: string;
  /** True if the original content contained one or more hidden blocks. */
  hasHiddenLink: boolean;
}

/**
 * Removes hidden-link block markup from an HTML content string and
 * returns a short plain-text excerpt safe to show in a thread list row.
 *
 * @param html       Raw thread.content (may contain `data-hlb-id` divs
 *                    or `.hlb-pending` editor placeholders)
 * @param maxLength   Max characters for the returned excerpt
 */
export function stripHiddenBlocks(
  html: string | null | undefined,
  maxLength = 160
): StrippedContent {
  if (!html) {
    return { excerpt: "", hasHiddenLink: false };
  }

  const hasHiddenLink =
    html.includes("data-hlb-id") || html.includes("hlb-pending");

  // Server-safe: works with or without DOMParser (SSR fallback uses regex).
  let textOnly: string;

  if (typeof window !== "undefined" && typeof DOMParser !== "undefined") {
    const doc = new DOMParser().parseFromString(html, "text/html");

    doc
      .querySelectorAll("[data-hlb-id], .hlb-pending")
      .forEach((el) => el.remove());

    textOnly = (doc.body.textContent || "").replace(/\s+/g, " ").trim();
  } else {
    textOnly = html
      .replace(/<div[^>]*data-hlb-id[^>]*>[\s\S]*?<\/div>/gi, "")
      .replace(/<div[^>]*class="hlb-pending"[\s\S]*?<\/div>\s*<div>\s*<br\s*\/?>\s*<\/div>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  const excerpt =
    textOnly.length > maxLength
      ? textOnly.slice(0, maxLength).trimEnd() + "…"
      : textOnly;

  return { excerpt, hasHiddenLink };
}