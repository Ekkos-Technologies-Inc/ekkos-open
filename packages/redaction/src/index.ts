/**
 * @ekkos/redaction — Auditable PII redaction, anonymization, and content sanitization
 *
 * This package consolidates the privacy pipeline used by ekkOS to ensure no
 * personally identifiable information leaks into the collective intelligence
 * network or end-user responses.
 *
 * Three modules:
 *  1. content-sanitizer — strips proxy-injected XML metadata from conversation content
 *  2. anonymizer — removes PII (emails, IPs, paths, API keys) from data
 *  3. output-scrubber — removes ekkOS control markers from LLM output
 */

// Types
export type { ScrubResult, StreamScrubStats, AnthropicScrubReport } from './types.js';

// Content Sanitizer
export { stripProxyContent, isProxyNoise, stripAndValidate } from './content-sanitizer.js';

// Anonymizer
export { anonymize } from './anonymizer.js';

// Output Scrubber
export {
  scrubControlText,
  StreamingScrubber,
  createStreamingScrubber,
  scrubAnthropicResponse,
} from './output-scrubber.js';
