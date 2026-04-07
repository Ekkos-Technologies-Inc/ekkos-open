/**
 * Content Sanitizer — Strip Proxy-Injected XML from Episode Content
 *
 * The ekkOS proxy injects context blocks (<system-reminder>, <ekkos-*>, etc.)
 * into conversations. When these conversations become learning episodes, the
 * raw XML leaks into pattern titles, collective memory, semantic facts, and
 * fact timeline entries.
 *
 * This module provides a centralized sanitizer that strips all proxy injection
 * content before it enters any learning pipeline.
 */

// ---------------------------------------------------------------------------
// Known proxy-injected XML tag patterns (multiline, non-greedy)
// ---------------------------------------------------------------------------

const PROXY_BLOCK_TAGS = [
  'system-reminder',
  'ekkos-directives',
  'ekkos-session',
  'ekkos-patterns',
  'ekkos-goal',
  'ekkos-recall',
  'ekkos-schema',
  'ekkos-context-preserved',
  'ekkos-context-policy',
  'ekkos-context-summary',
  'ekkos-forge-protocol',
  'ekkos-system-context',
  'ekkos-prometheus',
  'ekkos-gap',
  'ekkos-insight',
  'current-time',
  'footer-format',
  'footer-note',
  'footer-scope',
  'fast_mode_info',
];

// Build one regex that matches all known block tags (multiline, non-greedy)
const BLOCK_TAG_PATTERN = new RegExp(
  `<(?:${PROXY_BLOCK_TAGS.join('|')})[^>]*>[\\s\\S]*?</(?:${PROXY_BLOCK_TAGS.join('|')})>`,
  'gi',
);

// Catch-all for any <ekkos-*>...</ekkos-*> blocks we haven't listed
const EKKOS_CATCHALL_PATTERN = /<ekkos-[a-z][\w-]*>[\s\S]*?<\/ekkos-[a-z][\w-]*>/gi;

// Self-closing tags like <ekkos-applied id="..." ... />
const SELF_CLOSING_PATTERN = /<ekkos-[a-z][\w-]*\s[^>]*\/>/gi;

// CLAUDE.md preamble lines injected by the proxy
const CLAUDEMD_PREAMBLE = /^Contents of \/Users\/.*?\.md \(.*?\):\s*$/gm;
const INSTRUCTION_PREAMBLE = /^Codebase and user instructions are shown below\..*$/gm;

// Working set blocks
const WORKING_SET_PATTERN = /\[EKKOS_CORE_WORKING_SET[^\]]*\][\s\S]*?\[\/EKKOS_CORE_WORKING_SET\]/gi;

// Strategy blocks
const STRATEGY_PATTERN = /\[Strategy\][^\n]*/gi;

// Orphan opening tags (truncated — no closing tag)
// e.g. "<system-reminder>\nSome partial text" at the start of content
const ORPHAN_OPENING_PATTERN = new RegExp(
  `<(?:${PROXY_BLOCK_TAGS.join('|')})[^>]*>(?:(?!</(?:${PROXY_BLOCK_TAGS.join('|')})>)[\\s\\S])*$`,
  'gi',
);

// Multiple consecutive newlines -> double newline
const EXCESS_NEWLINES = /\n{3,}/g;

/**
 * Strip all proxy-injected XML blocks and system content from text.
 *
 * Safe to call on already-clean text (no-op if nothing to strip).
 */
export function stripProxyContent(text: string): string {
  if (!text) return '';

  let cleaned = text;

  // Strip known block tags
  cleaned = cleaned.replace(BLOCK_TAG_PATTERN, '');

  // Strip any remaining ekkos-* blocks
  cleaned = cleaned.replace(EKKOS_CATCHALL_PATTERN, '');

  // Strip self-closing ekkos tags
  cleaned = cleaned.replace(SELF_CLOSING_PATTERN, '');

  // Strip CLAUDE.md preamble lines
  cleaned = cleaned.replace(CLAUDEMD_PREAMBLE, '');
  cleaned = cleaned.replace(INSTRUCTION_PREAMBLE, '');

  // Strip working set blocks
  cleaned = cleaned.replace(WORKING_SET_PATTERN, '');

  // Strip orphan opening tags (truncated content)
  cleaned = cleaned.replace(ORPHAN_OPENING_PATTERN, '');

  // Strip strategy annotations
  cleaned = cleaned.replace(STRATEGY_PATTERN, '');

  // Collapse excess newlines and trim
  cleaned = cleaned.replace(EXCESS_NEWLINES, '\n\n').trim();

  return cleaned;
}

/**
 * Check if text is predominantly proxy noise.
 *
 * Returns true if stripping removes >60% of the content
 * OR the stripped result is shorter than 30 characters.
 */
export function isProxyNoise(text: string): boolean {
  if (!text || text.trim().length === 0) return true;

  const original = text.trim();
  const stripped = stripProxyContent(original);

  if (stripped.length < 30) return true;
  if (stripped.length < original.length * 0.4) return true;

  return false;
}

/**
 * Strip proxy content and validate minimum length.
 * Returns null if the stripped result is below minLength.
 */
export function stripAndValidate(text: string, minLength: number): string | null {
  const stripped = stripProxyContent(text);
  return stripped.length >= minLength ? stripped : null;
}
