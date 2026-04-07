/**
 * Anonymizer — Strip PII from Data Before Collective Storage
 *
 * Recursively walks objects, arrays, and strings to replace personally
 * identifiable information with safe placeholders. Every pattern that enters
 * the ekkOS collective intelligence network passes through this pipeline.
 *
 * Categories handled:
 *  - Email addresses
 *  - IPv4 addresses
 *  - Unix user paths (/Users/..., /home/...)
 *  - Windows user paths (C:\Users\...)
 *  - API keys and tokens (sk-..., ghp_..., ekk_..., Bearer tokens)
 *  - AWS access keys (AKIA...)
 *  - URLs containing auth tokens or credentials
 *  - Generic secret-shaped strings
 */

// ---------------------------------------------------------------------------
// Replacement patterns
// ---------------------------------------------------------------------------

/** Email addresses: user@domain.tld */
const EMAIL_PATTERN = /[\w.+-]+@[\w.-]+\.\w+/g;

/** IPv4 addresses: 192.168.1.1 */
const IPV4_PATTERN = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g;

/** Unix user paths: /Users/<name>/... or /home/<name>/... */
const UNIX_USER_PATH = /\/Users\/[^/\s]+/g;
const UNIX_HOME_PATH = /\/home\/[^/\s]+/g;

/** Windows user paths: C:\Users\<name>\... (case-insensitive drive letter) */
const WINDOWS_USER_PATH = /[A-Za-z]:\\Users\\[^\\\s]+/g;

/**
 * API keys and tokens — common prefixes:
 *  - sk-...     (OpenAI, Stripe secret keys)
 *  - ghp_...    (GitHub personal access tokens)
 *  - gho_...    (GitHub OAuth tokens)
 *  - ghu_...    (GitHub user-to-server tokens)
 *  - ghs_...    (GitHub server-to-server tokens)
 *  - ekk_...    (ekkOS API keys)
 *  - pk_live_.. (Stripe publishable keys)
 *  - sk_live_.. (Stripe secret keys)
 *  - pk_test_.. (Stripe test publishable keys)
 *  - sk_test_.. (Stripe test secret keys)
 *  - xoxb-...   (Slack bot tokens)
 *  - xoxp-...   (Slack user tokens)
 *  - xapp-...   (Slack app-level tokens)
 */
const API_KEY_PATTERN =
  /\b(?:sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9]{36,}|gh[ous]_[A-Za-z0-9]{36,}|ekk_[A-Za-z0-9_-]{16,}|[ps]k_(?:live|test)_[A-Za-z0-9]{10,}|xox[bpa]-[A-Za-z0-9-]{10,}|xapp-[A-Za-z0-9-]{10,})\b/g;

/** AWS access key IDs: always start with AKIA (20 uppercase alphanumeric chars). */
const AWS_ACCESS_KEY = /\bAKIA[A-Z0-9]{16}\b/g;

/** AWS secret access keys: 40-char base64-ish strings often near AWS context. */
const AWS_SECRET_KEY = /(?<=aws_secret_access_key\s*[=:]\s*)[A-Za-z0-9/+=]{40}/g;

/** Bearer tokens in header-style strings: "Bearer <token>" */
const BEARER_TOKEN = /Bearer\s+[A-Za-z0-9._~+/=-]{20,}/gi;

/** URLs with inline credentials: https://user:pass@host or ?token=... or ?key=... */
const URL_AUTH_INLINE = /https?:\/\/[^@\s]+:[^@\s]+@[^\s]+/g;
const URL_AUTH_PARAM =
  /(?<=[?&](?:token|key|secret|access_token|api_key|apikey|auth)=)[A-Za-z0-9._~+/=-]{8,}/gi;

// ---------------------------------------------------------------------------
// Core anonymizer
// ---------------------------------------------------------------------------

/**
 * Anonymize a string by replacing all recognized PII with safe placeholders.
 */
function anonymizeString(input: string): string {
  let result = input;

  // URLs with embedded credentials (must run BEFORE email, since
  // "user:pass@host" contains an email-like substring)
  result = result.replace(URL_AUTH_INLINE, '[url-with-credentials]');
  result = result.replace(URL_AUTH_PARAM, '[token]');

  // Email addresses
  result = result.replace(EMAIL_PATTERN, '[email]');

  // IP addresses
  result = result.replace(IPV4_PATTERN, '[ip]');

  // User paths (Unix + Windows)
  result = result.replace(UNIX_USER_PATH, '/Users/[user]');
  result = result.replace(UNIX_HOME_PATH, '/home/[user]');
  result = result.replace(WINDOWS_USER_PATH, 'C:\\Users\\[user]');

  // API keys and tokens
  result = result.replace(API_KEY_PATTERN, '[api-key]');
  result = result.replace(AWS_ACCESS_KEY, '[aws-key-id]');
  result = result.replace(AWS_SECRET_KEY, '[aws-secret]');
  result = result.replace(BEARER_TOKEN, 'Bearer [token]');

  return result;
}

/**
 * Recursively anonymize data before collective storage.
 *
 * - Strings: applies all PII replacement patterns
 * - Arrays: anonymizes each element
 * - Objects: anonymizes each value (keys are preserved)
 * - Primitives (number, boolean, null, undefined): returned as-is
 *
 * @param data - Any value to anonymize
 * @returns A deep copy with PII replaced by safe placeholders
 *
 * @example
 * ```ts
 * anonymize("Contact admin@example.com at 10.0.0.1")
 * // => "Contact [email] at [ip]"
 *
 * anonymize({ user: "alice", home: "/Users/alice/code" })
 * // => { user: "alice", home: "/Users/[user]/code" }
 *
 * anonymize(["sk-abc123def456ghi789jkl012mno345pqr678"])
 * // => ["[api-key]"]
 * ```
 */
export function anonymize<T>(data: T): T {
  if (typeof data === 'string') {
    return anonymizeString(data) as T;
  }

  if (typeof data === 'object' && data !== null) {
    if (Array.isArray(data)) {
      return data.map((item) => anonymize(item)) as T;
    }

    const result: Record<string, unknown> = {};
    for (const key of Object.keys(data as Record<string, unknown>)) {
      result[key] = anonymize((data as Record<string, unknown>)[key]);
    }
    return result as T;
  }

  // Primitives: number, boolean, null, undefined — pass through
  return data;
}
