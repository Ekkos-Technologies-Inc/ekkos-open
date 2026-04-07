# @ekkos/redaction

Auditable PII redaction, anonymization, and content sanitization for ekkOS memory.

**This package exists so you can verify ekkOS's privacy claims.** Every pattern that enters the collective intelligence network passes through this pipeline. Every LLM response is scrubbed of internal control metadata before reaching you.

## What Gets Redacted

| Category | Example | Replacement |
|----------|---------|-------------|
| Email addresses | `user@example.com` | `[email]` |
| IPv4 addresses | `192.168.1.42` | `[ip]` |
| Unix user paths | `/Users/alice/code` | `/Users/[user]/code` |
| Windows user paths | `C:\Users\John\docs` | `C:\Users\[user]\docs` |
| API keys | `sk-abc...`, `ghp_...`, `ekk_...` | `[api-key]` |
| AWS access keys | `AKIAIOSFODNN7EXAMPLE` | `[aws-key-id]` |
| Bearer tokens | `Bearer eyJhbG...` | `Bearer [token]` |
| URLs with credentials | `https://user:pass@host` | `[url-with-credentials]` |
| URL auth parameters | `?token=secret123` | `?token=[token]` |
| Proxy-injected XML | `<ekkos-patterns>...</ekkos-patterns>` | *(removed)* |
| Internal control lines | `[ekkOS_LEARN] ...` | *(removed)* |

## Three Modules

### 1. Content Sanitizer

Strips proxy-injected XML metadata from conversation content before it enters the learning pipeline.

```ts
import { stripProxyContent, isProxyNoise, stripAndValidate } from '@ekkos/redaction';

// Remove all proxy-injected blocks
const clean = stripProxyContent(rawContent);

// Check if text is mostly proxy noise (>60% removed)
if (isProxyNoise(text)) {
  // skip — not real user content
}

// Strip and enforce minimum length
const validated = stripAndValidate(text, 50);
// Returns null if stripped result is < 50 chars
```

### 2. Anonymizer

Removes PII from data before it enters the collective intelligence network. Works recursively on strings, objects, and arrays.

```ts
import { anonymize } from '@ekkos/redaction';

// Simple string
anonymize("Contact admin@example.com at 10.0.0.1");
// => "Contact [email] at [ip]"

// Nested object — recursively anonymized
anonymize({
  user: { email: "alice@co.uk", home: "/Users/alice" },
  servers: ["192.168.1.1", "10.0.0.1"],
  apiKey: "sk-abc123def456ghi789jkl012mno345pqr678",
});
// => {
//   user: { email: "[email]", home: "/Users/[user]" },
//   servers: ["[ip]", "[ip]"],
//   apiKey: "[api-key]",
// }
```

### 3. Output Scrubber

Removes ekkOS control markers from LLM responses so end-users see clean output.

```ts
import {
  scrubControlText,
  StreamingScrubber,
  scrubAnthropicResponse,
} from '@ekkos/redaction';

// Scrub a complete response
const result = scrubControlText(assistantOutput);
console.log(result.text);       // clean text
console.log(result.changed);    // true if anything was removed
console.log(result.removedChars); // number of chars stripped

// Streaming responses
const scrubber = new StreamingScrubber();
for (const delta of stream) {
  const clean = scrubber.push(delta);
  if (clean) emit(clean);
}
emit(scrubber.flush());

// Anthropic API response (mutates in place)
const report = scrubAnthropicResponse(apiResponse);
```

## How It Works

The redaction engine is **pattern-based (regex matching)**, not ML or heuristic. Each PII category has a specific regular expression that matches known formats.

- **Deterministic:** given the same input, it always produces the same output
- **No configuration:** there are no user-configurable rules; all patterns are built-in
- **No false positives for clean text:** if text doesn't match a pattern, it passes through unchanged
- **Potential false negatives:** novel or obfuscated formats that don't match the patterns will not be caught

When the anonymizer encounters text, it applies each regex pattern in a fixed order. Strings are processed directly; objects and arrays are walked recursively, anonymizing every string value.

## Known Limitations

**This is a best-effort redaction pipeline, not a cryptographic guarantee.**

The anonymizer uses regex pattern matching. It will catch common PII formats but is not guaranteed to catch every possible form of personally identifiable information. Specifically:

| Limitation | Detail |
|------------|--------|
| **Novel key formats** | Only matches known API key prefixes (`sk-`, `ghp_`, `ekk_`, etc.). A custom API key format like `myco_abc123` will not be caught. |
| **Encoded data** | Base64-encoded emails, URL-encoded paths, or PII embedded in binary/encoded strings will pass through undetected. |
| **Contextual PII** | A person's name ("Alice wrote this") is not redacted — only structured identifiers (emails, paths, IPs, keys) are matched. |
| **Non-Latin scripts** | Path and email patterns are tuned for ASCII/Latin characters. Unicode usernames or paths may not be fully matched. |
| **IPv6 addresses** | Only IPv4 addresses are matched. IPv6 addresses are not currently redacted. |
| **Semantic leakage** | A pattern like "fix the bug in our payments microservice" preserves the architectural detail. Redaction strips identifiers, not meaning. |
| **Phone numbers** | Phone numbers (US or international) are not currently redacted. |
| **Credit card numbers** | Credit card number patterns are not currently redacted. |
| **SSH private keys** | SSH/PGP private key blocks are not currently detected. |
| **Unicode homoglyphs** | Cyrillic or other look-alike characters in emails/tokens bypass pattern matching. |
| **Adversarial formatting** | Emails with inserted spaces (`user @ domain . com`) or tokens split across lines bypass matching. |
| **Regex ordering** | Overlapping patterns are applied in sequence. In rare edge cases, one replacement may interfere with another. |

### What this means in practice

When a pattern enters the collective intelligence network:
- **Emails, IPs, file paths, and API keys are stripped.** This covers the most common and highest-risk PII categories.
- **Domain-specific language, architecture descriptions, and technical approaches are preserved.** This is intentional — it's what makes collective patterns useful.
- **If you include sensitive business logic in pattern descriptions, that content will be shared.** The anonymizer strips identifiers, not ideas.

If you find a PII category that should be redacted but isn't, please open an issue or email [security@ekkos.dev](mailto:security@ekkos.dev).

## Before / After Examples

Input:
```
Fix the auth bug in /Users/alice/projects/acme-corp/src/auth.ts.
The endpoint at 192.168.1.50 returns 401 when using token sk-proj-abc123def456ghi789.
Contact alice@acme.com for the AWS key AKIAIOSFODNN7EXAMPLE.
```

After `anonymize()`:
```
Fix the auth bug in /Users/[user]/projects/acme-corp/src/auth.ts.
The endpoint at [ip] returns 401 when using token [api-key].
Contact [email] for the AWS key [aws-key-id].
```

Note: `acme-corp` and `auth.ts` are **not** redacted — they are project structure, not PII. The anonymizer targets identifiers, not code paths.

## Zero Runtime Dependencies

This package has **zero runtime dependencies**. It uses only built-in JavaScript regex operations — no external libraries, no network calls, no filesystem access.

## Security

For security concerns or to report a vulnerability in the redaction pipeline, see [SECURITY.md](../../docs/SECURITY.md).

## License

Apache-2.0
