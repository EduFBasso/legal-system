/**
 * Convert a string that may contain HTML into plain text.
 *
 * Important: we intentionally DO NOT render HTML in task cards,
 * because task descriptions can originate from external sources.
 */
export function htmlToText(input) {
  if (input === null || input === undefined) return '';

  const value = String(input);
  if (!value) return '';

  // Prefer DOM parsing when available (browser / jsdom).
  if (typeof document !== 'undefined' && document?.createElement) {
    const tmp = document.createElement('div');
    tmp.innerHTML = value;
    const text = tmp.textContent || tmp.innerText || '';
    return text.replace(/\s+/g, ' ').trim();
  }

  // Fallback for non-DOM environments.
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}
