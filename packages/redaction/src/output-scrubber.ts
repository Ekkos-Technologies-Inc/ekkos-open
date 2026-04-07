/**
 * Output Scrubber — Remove ekkOS Control Metadata from LLM Responses
 *
 * When the ekkOS proxy enriches conversations, control markers can leak into
 * the assistant's output. This module strips those markers so end-users only
 * see clean, natural responses.
 *
 * Handles:
 *  - ekkOS XML block tags (<ekkos-*>...</ekkos-*>)
 *  - ekkOS self-closing tags (<ekkos-* ... />)
 *  - ekkOS control lines ([ekkOS_LEARN], [ekkOS_APPLY], etc.)
 *  - ekkOS signature/footer lines
 *  - Transcript formatting artifacts
 *  - Streaming responses (via StreamingScrubber)
 *  - Anthropic API response payloads
 */

import type { ScrubResult, StreamScrubStats, AnthropicScrubReport } from './types.js';

// ---------------------------------------------------------------------------
// Regex patterns for ekkOS control metadata
// ---------------------------------------------------------------------------

const EKKOS_BLOCK_TAG = /<ekkos-[a-z0-9_-]+(?:\s[^>]*)?>[\s\S]*?<\/ekkos-[a-z0-9_-]+>/gi;
const EKKOS_SELF_CLOSING_TAG = /<ekkos-[a-z0-9_-]+(?:\s[^>]*)?\/>/gi;
const EKKOS_TAG_RESIDUAL = /<\/?ekkos-[a-z0-9_-]+(?:\s[^>]*)?>/gi;
const EKKOS_CONTROL_LINES =
  /^(?:\s*)\[(?:ekkOS_(?:LEARN|APPLY|SKIP|SELECT)|ekkOS:[^\]]*)\][^\r\n]*$/gim;
const EKKOS_SIGNATURE_LINE = /(?:Claude Code.*ekkOS|ekkOS_™)/i;
// Preserve a valid trailing ekkOS footer — it is the user-visible trust stamp.
const EKKOS_FOOTER_LINE =
  /^[^\r\n()]+\([^)]+\)\s*·\s*(?:🧠\s*)?ekkOS_(?:™)?\s*·\s*.+\s*·\s*(?:📅\s*)?.+$/i;
const QUOTE_FENCE_LINES = /^.*<{5,}.*>{5,}.*$/gim;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function normalizeBlankLines(input: string): string {
  return input.replace(/\n{3,}/g, '\n\n');
}

function scrubSignatureLines(input: string): string {
  const lines = input.split(/\r?\n/);
  let lastNonEmptyLine = -1;

  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i]?.trim().length) {
      lastNonEmptyLine = i;
      break;
    }
  }

  return lines
    .filter((line, index) => {
      if (!EKKOS_SIGNATURE_LINE.test(line)) return true;

      // Preserve the canonical trailing footer
      const isTrailingFooter =
        index === lastNonEmptyLine && EKKOS_FOOTER_LINE.test(line.trim());

      return isTrailingFooter;
    })
    .join('\n');
}

function scrubTranscriptBlocks(input: string): string {
  const lines = input.split(/\r?\n/);
  const kept: string[] = [];
  let skippingToolOutput = false;

  for (const line of lines) {
    const trimmed = line.trimStart();

    // Tool-use bullet markers
    if (/^(?:⏺|✻)\s/.test(trimmed)) {
      skippingToolOutput = false;
      continue;
    }

    // Tool result markers
    if (/^⎿\s/.test(trimmed)) {
      skippingToolOutput = true;
      continue;
    }

    // Quote fence lines
    if (/^.*<{5,}.*>{5,}.*$/.test(line)) {
      continue;
    }

    if (skippingToolOutput) {
      if (trimmed.length === 0) {
        skippingToolOutput = false;
      }
      continue;
    }

    kept.push(line);
  }

  return kept.join('\n');
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Scrub internal ekkOS protocol markers from plain assistant text.
 *
 * @param input - Raw assistant output that may contain ekkOS control metadata
 * @returns A ScrubResult with the cleaned text and stats
 *
 * @example
 * ```ts
 * const result = scrubControlText("Hello <ekkos-applied id=\"123\" /> world");
 * // result.text === "Hello  world"
 * // result.changed === true
 * ```
 */
export function scrubControlText(input: string): ScrubResult {
  const original = input || '';
  let text = original;

  text = text.replace(EKKOS_BLOCK_TAG, '');
  text = text.replace(EKKOS_SELF_CLOSING_TAG, '');
  text = text.replace(EKKOS_TAG_RESIDUAL, '');
  text = text.replace(EKKOS_CONTROL_LINES, '');
  text = scrubSignatureLines(text);
  text = text.replace(QUOTE_FENCE_LINES, '');
  text = scrubTranscriptBlocks(text);
  text = normalizeBlankLines(text);

  const changed = text !== original;
  return {
    text,
    changed,
    removedChars: Math.max(0, original.length - text.length),
  };
}

/**
 * Stateful scrubber for streaming deltas.
 *
 * Keeps a holdback window to avoid leaking split markers across chunk
 * boundaries. Call `push()` with each incoming delta, then `flush()` at
 * the end of the stream to emit any remaining buffered content.
 *
 * @example
 * ```ts
 * const scrubber = new StreamingScrubber();
 * for (const delta of stream) {
 *   const clean = scrubber.push(delta);
 *   if (clean) emit(clean);
 * }
 * const remaining = scrubber.flush();
 * if (remaining) emit(remaining);
 * ```
 */
export class StreamingScrubber {
  private raw = '';
  private sanitized = '';
  private emittedChars = 0;

  constructor(private readonly holdbackChars = 160) {}

  /** Push a streaming delta and receive any safe-to-emit scrubbed text. */
  push(delta: string): string {
    const next = delta || '';
    this.raw += next;
    this.sanitized = scrubControlText(this.raw).text;

    const emitUpto = Math.max(0, this.sanitized.length - this.holdbackChars);
    if (emitUpto <= this.emittedChars) {
      return '';
    }

    const chunk = this.sanitized.slice(this.emittedChars, emitUpto);
    this.emittedChars = emitUpto;
    return chunk;
  }

  /** Flush remaining buffered content at the end of a stream. */
  flush(): string {
    this.sanitized = scrubControlText(this.raw).text;
    if (this.sanitized.length <= this.emittedChars) {
      return '';
    }
    const chunk = this.sanitized.slice(this.emittedChars);
    this.emittedChars = this.sanitized.length;
    return chunk;
  }

  /** Get statistics about the scrubbing session. */
  getStats(): StreamScrubStats {
    const inputChars = this.raw.length;
    const outputChars = this.sanitized.length;
    const removedChars = Math.max(0, inputChars - outputChars);
    return {
      inputChars,
      outputChars,
      removedChars,
      changed: removedChars > 0,
    };
  }
}

/**
 * Create a new StreamingScrubber instance.
 *
 * @param holdbackChars - Number of characters to hold back from emission
 *   to avoid split markers crossing chunk boundaries. Default: 160.
 */
export function createStreamingScrubber(holdbackChars = 160): StreamingScrubber {
  return new StreamingScrubber(holdbackChars);
}

/**
 * Scrub text blocks in a non-streaming Anthropic API response payload.
 * Mutates the payload in place.
 *
 * @param data - An Anthropic Messages API response object
 * @returns A report of what was changed
 *
 * @example
 * ```ts
 * const response = await anthropic.messages.create({ ... });
 * const report = scrubAnthropicResponse(response);
 * // response.content[*].text is now scrubbed
 * ```
 */
export function scrubAnthropicResponse(data: Record<string, unknown>): AnthropicScrubReport {
  const content = (data as { content?: unknown }).content;
  if (!Array.isArray(content)) {
    return { changed: false, blocksChanged: 0, removedChars: 0 };
  }

  let blocksChanged = 0;
  let removedChars = 0;

  for (const block of content as Array<Record<string, unknown>>) {
    if (!block || typeof block !== 'object') continue;
    if (block.type !== 'text' || typeof block.text !== 'string') continue;

    const scrubbed = scrubControlText(block.text);
    if (!scrubbed.changed) continue;

    block.text = scrubbed.text;
    blocksChanged += 1;
    removedChars += scrubbed.removedChars;
  }

  return {
    changed: blocksChanged > 0,
    blocksChanged,
    removedChars,
  };
}
