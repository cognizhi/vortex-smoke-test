/**
 * Minimal HTML entity encoder for email templates.
 *
 * Escapes the five characters that can break out of HTML text and attribute
 * contexts:  &  <  >  "  '
 *
 * Call this on every user-supplied or merchant-supplied string before
 * interpolating it into an HTML template literal.  Plain-text email bodies
 * do NOT need escaping — only the `html` variant of each template.
 *
 * Note: email subjects are sent as plain text by mail clients, so they must
 * NOT be HTML-escaped (doing so would corrupt the display).
 */
export function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
