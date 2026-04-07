import { describe, it, expect } from 'vitest';
import { anonymize } from '../src/anonymizer';

describe('anonymize', () => {
  // -----------------------------------------------------------------------
  // Email addresses
  // -----------------------------------------------------------------------
  it('strips email addresses', () => {
    expect(anonymize('Contact admin@example.com for help')).toBe(
      'Contact [email] for help',
    );
  });

  it('strips multiple email addresses', () => {
    expect(anonymize('From alice@co.uk to bob.smith+tag@domain.org')).toBe(
      'From [email] to [email]',
    );
  });

  // -----------------------------------------------------------------------
  // IPv4 addresses
  // -----------------------------------------------------------------------
  it('strips IPv4 addresses', () => {
    expect(anonymize('Server at 192.168.1.42 responded')).toBe(
      'Server at [ip] responded',
    );
  });

  it('strips multiple IP addresses', () => {
    expect(anonymize('From 10.0.0.1 to 172.16.0.255')).toBe(
      'From [ip] to [ip]',
    );
  });

  // -----------------------------------------------------------------------
  // IPv6 addresses — KNOWN_LIMITATION: not yet handled
  // -----------------------------------------------------------------------
  it.skip('strips IPv6 addresses', () => {
    // KNOWN_LIMITATION: IPv6 addresses are not currently redacted
    expect(anonymize('Host at 2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(
      'Host at [ip]',
    );
  });

  it.skip('strips compressed IPv6 addresses', () => {
    // KNOWN_LIMITATION: IPv6 addresses are not currently redacted
    expect(anonymize('Host at ::1')).toBe('Host at [ip]');
  });

  // -----------------------------------------------------------------------
  // Phone numbers — KNOWN_LIMITATION: not yet handled
  // -----------------------------------------------------------------------
  it.skip('strips US phone numbers (xxx-xxx-xxxx)', () => {
    // KNOWN_LIMITATION: phone numbers are not currently redacted
    expect(anonymize('Call 555-123-4567 for support')).toBe(
      'Call [phone] for support',
    );
  });

  it.skip('strips US phone numbers with parens', () => {
    // KNOWN_LIMITATION: phone numbers are not currently redacted
    expect(anonymize('Call (555) 123-4567')).toBe('Call [phone]');
  });

  it.skip('strips US phone numbers with country code', () => {
    // KNOWN_LIMITATION: phone numbers are not currently redacted
    expect(anonymize('Call +1 555 123 4567')).toBe('Call [phone]');
  });

  it.skip('strips international phone numbers (UK)', () => {
    // KNOWN_LIMITATION: phone numbers are not currently redacted
    expect(anonymize('UK: +44 20 7946 0958')).toBe('UK: [phone]');
  });

  it.skip('strips international phone numbers (Japan)', () => {
    // KNOWN_LIMITATION: phone numbers are not currently redacted
    expect(anonymize('JP: +81 3-1234-5678')).toBe('JP: [phone]');
  });

  // -----------------------------------------------------------------------
  // Unix user paths
  // -----------------------------------------------------------------------
  it('strips /Users/<name> paths', () => {
    expect(anonymize('File at /Users/alice/code/project')).toBe(
      'File at /Users/[user]/code/project',
    );
  });

  it('strips /home/<name> paths', () => {
    expect(anonymize('File at /home/deploy/.config')).toBe(
      'File at /home/[user]/.config',
    );
  });

  it('strips paths with specific username (seann)', () => {
    expect(anonymize('File at /Users/seann/projects/ekkos')).toBe(
      'File at /Users/[user]/projects/ekkos',
    );
  });

  it('strips home paths with specific username', () => {
    expect(anonymize('Config at /home/seann/.bashrc')).toBe(
      'Config at /home/[user]/.bashrc',
    );
  });

  // -----------------------------------------------------------------------
  // Windows user paths
  // -----------------------------------------------------------------------
  it('strips Windows user paths', () => {
    expect(anonymize('Path is C:\\Users\\JohnDoe\\Documents\\file.txt')).toBe(
      'Path is C:\\Users\\[user]\\Documents\\file.txt',
    );
  });

  it('strips Windows paths with specific username (seann)', () => {
    expect(anonymize('C:\\Users\\seann\\Desktop\\notes.md')).toBe(
      'C:\\Users\\[user]\\Desktop\\notes.md',
    );
  });

  // -----------------------------------------------------------------------
  // API keys and tokens
  // -----------------------------------------------------------------------
  it('strips OpenAI-style sk- keys', () => {
    const key = 'sk-' + 'a'.repeat(48);
    expect(anonymize(`Key: ${key}`)).toBe('Key: [api-key]');
  });

  it('strips GitHub personal access tokens (ghp_)', () => {
    const token = 'ghp_' + 'A'.repeat(36);
    expect(anonymize(`Token: ${token}`)).toBe('Token: [api-key]');
  });

  it('strips ekkOS API keys (ekk_)', () => {
    const key = 'ekk_' + 'x'.repeat(24);
    expect(anonymize(`ekkOS key: ${key}`)).toBe('ekkOS key: [api-key]');
  });

  it('strips Stripe live secret keys', () => {
    const key = 'sk_live_' + 'a'.repeat(24);
    expect(anonymize(`Stripe: ${key}`)).toBe('Stripe: [api-key]');
  });

  it('strips Slack bot tokens', () => {
    const token = 'xoxb-' + '1234567890-' + 'a'.repeat(24);
    expect(anonymize(`Slack: ${token}`)).toBe('Slack: [api-key]');
  });

  // -----------------------------------------------------------------------
  // AWS keys
  // -----------------------------------------------------------------------
  it('strips AWS access key IDs', () => {
    expect(anonymize('AWS key: AKIAIOSFODNN7EXAMPLE')).toBe(
      'AWS key: [aws-key-id]',
    );
  });

  it('strips AWS secret access keys when labeled', () => {
    expect(anonymize('aws_secret_access_key = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY')).toBe(
      'aws_secret_access_key = [aws-secret]',
    );
  });

  // -----------------------------------------------------------------------
  // Bearer tokens
  // -----------------------------------------------------------------------
  it('strips Bearer tokens', () => {
    const token = 'a'.repeat(40);
    expect(anonymize(`Authorization: Bearer ${token}`)).toBe(
      'Authorization: Bearer [token]',
    );
  });

  // -----------------------------------------------------------------------
  // URLs with credentials
  // -----------------------------------------------------------------------
  it('strips URLs with inline credentials', () => {
    expect(anonymize('Connect to https://admin:s3cret@db.example.com:5432/mydb')).toBe(
      'Connect to [url-with-credentials]',
    );
  });

  it('strips auth tokens from URL query parameters', () => {
    expect(anonymize('Visit https://api.example.com/data?token=abc123xyzLongEnoughToken')).toBe(
      'Visit https://api.example.com/data?token=[token]',
    );
  });

  it('strips api_key from URL query parameters', () => {
    expect(anonymize('https://api.example.com?api_key=mySecretApiKeyValue123')).toBe(
      'https://api.example.com?api_key=[token]',
    );
  });

  // -----------------------------------------------------------------------
  // Credit card patterns — KNOWN_LIMITATION: not yet handled
  // -----------------------------------------------------------------------
  it.skip('strips credit card numbers (Visa-like)', () => {
    // KNOWN_LIMITATION: credit card numbers are not currently redacted
    expect(anonymize('Card: 4111 1111 1111 1111')).toBe('Card: [credit-card]');
  });

  it.skip('strips credit card numbers (no spaces)', () => {
    // KNOWN_LIMITATION: credit card numbers are not currently redacted
    expect(anonymize('Card: 4111111111111111')).toBe('Card: [credit-card]');
  });

  // -----------------------------------------------------------------------
  // SSH private key headers — KNOWN_LIMITATION: not yet handled
  // -----------------------------------------------------------------------
  it.skip('strips SSH private key headers', () => {
    // KNOWN_LIMITATION: SSH key detection is not currently implemented
    const keyBlock = '-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA0Z3...';
    expect(anonymize(keyBlock)).toContain('[private-key]');
  });

  // -----------------------------------------------------------------------
  // Unicode homoglyph evasion — KNOWN_LIMITATION: not handled
  // -----------------------------------------------------------------------
  it.skip('catches email with Cyrillic "а" (homoglyph)', () => {
    // KNOWN_LIMITATION: Unicode homoglyphs bypass regex matching.
    // "а" below is Cyrillic U+0430, not Latin "a" U+0061
    expect(anonymize('Contact аdmin@example.com')).toBe('Contact [email]');
  });

  // -----------------------------------------------------------------------
  // Adversarial formatting — KNOWN_LIMITATION: not handled
  // -----------------------------------------------------------------------
  it.skip('catches email with inserted spaces', () => {
    // KNOWN_LIMITATION: Whitespace-padded emails bypass pattern matching
    expect(anonymize('user @ domain . com')).toBe('[email]');
  });

  it.skip('catches API key split across lines', () => {
    // KNOWN_LIMITATION: Multi-line token fragments bypass pattern matching
    expect(anonymize('sk-abc123def456\nghi789jkl012mno345pqr678stu901vwx234')).toContain('[api-key]');
  });

  // -----------------------------------------------------------------------
  // Base64-encoded secrets — KNOWN_LIMITATION: not handled
  // -----------------------------------------------------------------------
  it.skip('catches base64-encoded email', () => {
    // KNOWN_LIMITATION: Base64-encoded content is not decoded and scanned.
    // This is documented as a known limitation in the README.
    const encoded = Buffer.from('admin@secret.com').toString('base64');
    expect(anonymize(encoded)).not.toContain('secret');
  });

  // -----------------------------------------------------------------------
  // Mixed content (code snippets with secrets)
  // -----------------------------------------------------------------------
  it('handles code snippets with embedded secrets', () => {
    const code = `const client = createClient({
  url: "https://admin:password@db.example.com",
  key: "sk-${'a'.repeat(48)}"
});`;
    const result = anonymize(code);
    expect(result).toContain('[url-with-credentials]');
    expect(result).toContain('[api-key]');
    expect(result).not.toContain('password');
  });

  it('handles prompts with mixed natural language and secrets', () => {
    const prompt = 'Deploy to 192.168.1.100 using key AKIAIOSFODNN7EXAMPLE and email ops@company.com';
    const result = anonymize(prompt);
    expect(result).toBe('Deploy to [ip] using key [aws-key-id] and email [email]');
  });

  // -----------------------------------------------------------------------
  // Multiline content
  // -----------------------------------------------------------------------
  it('handles multiline content', () => {
    const text = `User: alice@example.com
Server: 10.0.0.5
Path: /Users/alice/project
Token: Bearer ${'x'.repeat(30)}`;
    const result = anonymize(text);
    expect(result).toContain('[email]');
    expect(result).toContain('[ip]');
    expect(result).toContain('/Users/[user]');
    expect(result).toContain('Bearer [token]');
    expect(result).not.toContain('alice');
  });

  // -----------------------------------------------------------------------
  // Recursive: nested objects
  // -----------------------------------------------------------------------
  it('handles nested objects', () => {
    const input = {
      user: { email: 'test@example.com', ip: '10.0.0.1' },
      path: '/Users/alice/project',
    };
    const result = anonymize(input);
    expect(result).toEqual({
      user: { email: '[email]', ip: '[ip]' },
      path: '/Users/[user]/project',
    });
  });

  // -----------------------------------------------------------------------
  // Recursive: arrays
  // -----------------------------------------------------------------------
  it('handles arrays', () => {
    const input = ['admin@test.com', '192.168.0.1', '/Users/bob/file'];
    const result = anonymize(input);
    expect(result).toEqual(['[email]', '[ip]', '/Users/[user]/file']);
  });

  it('handles arrays of objects', () => {
    const input = [
      { email: 'a@b.com' },
      { ip: '1.2.3.4' },
    ];
    const result = anonymize(input);
    expect(result).toEqual([
      { email: '[email]' },
      { ip: '[ip]' },
    ]);
  });

  // -----------------------------------------------------------------------
  // Clean text passthrough
  // -----------------------------------------------------------------------
  it('leaves clean text unchanged', () => {
    const clean = 'This is a normal sentence with no PII.';
    expect(anonymize(clean)).toBe(clean);
  });

  it('leaves numbers unchanged', () => {
    expect(anonymize(42)).toBe(42);
  });

  it('leaves booleans unchanged', () => {
    expect(anonymize(true)).toBe(true);
  });

  it('leaves null unchanged', () => {
    expect(anonymize(null)).toBe(null);
  });

  it('leaves undefined unchanged', () => {
    expect(anonymize(undefined)).toBe(undefined);
  });

  // -----------------------------------------------------------------------
  // Code snippets without secrets (should pass through)
  // -----------------------------------------------------------------------
  it('leaves clean code unchanged', () => {
    const code = 'const result = await fetch("/api/users").then(r => r.json());';
    expect(anonymize(code)).toBe(code);
  });
});
