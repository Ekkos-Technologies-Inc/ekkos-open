/**
 * Shared types for @ekkos/redaction
 */

/** Result of scrubbing ekkOS control metadata from text. */
export interface ScrubResult {
  /** The scrubbed text. */
  text: string;
  /** Whether any changes were made. */
  changed: boolean;
  /** Number of characters removed. */
  removedChars: number;
}

/** Statistics from a streaming scrub session. */
export interface StreamScrubStats {
  /** Total characters received as input. */
  inputChars: number;
  /** Total characters in scrubbed output. */
  outputChars: number;
  /** Total characters removed. */
  removedChars: number;
  /** Whether any scrubbing occurred. */
  changed: boolean;
}

/** Report from scrubbing an Anthropic API response payload. */
export interface AnthropicScrubReport {
  /** Whether any content blocks were modified. */
  changed: boolean;
  /** Number of text blocks that were scrubbed. */
  blocksChanged: number;
  /** Total characters removed across all blocks. */
  removedChars: number;
}
