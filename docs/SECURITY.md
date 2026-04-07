# Security & Trust

ekkOS is designed so you can verify exactly what data leaves your machine. The client-side code in this repository is the only thing that talks to the ekkOS API -- you can read every line of it.

## Data flow

```
┌─────────────────────────────────────────────────────────────────┐
│  YOUR MACHINE                                                   │
│                                                                 │
│  ┌──────────┐     stdio/SSE      ┌──────────────────────┐      │
│  │ Your IDE │ ◄────────────────► │ MCP Server           │      │
│  │ (Claude, │     MCP protocol   │ (this repo)          │      │
│  │  Cursor, │                    │                      │      │
│  │  etc.)   │                    │  ┌────────────────┐  │      │
│  └──────────┘                    │  │ Redaction      │  │      │
│                                  │  │ Pipeline       │  │      │
│                                  │  │ (strips PII,   │  │      │
│                                  │  │  secrets,      │  │      │
│                                  │  │  file paths)   │  │      │
│                                  │  └───────┬────────┘  │      │
│                                  └──────────┼───────────┘      │
│                                             │                   │
└─────────────────────────────────────────────┼───────────────────┘
                                              │ HTTPS (TLS 1.3)
                                              ▼
                                  ┌──────────────────────┐
                                  │ ekkOS API            │
                                  │ (cloud service)      │
                                  │                      │
                                  │  ┌────────────────┐  │
                                  │  │ Your Memory    │  │
                                  │  │ (encrypted,    │  │
                                  │  │  per-user)     │  │
                                  │  └────────────────┘  │
                                  │                      │
                                  │  ┌────────────────┐  │
                                  │  │ Collective     │  │
                                  │  │ Memory         │  │
                                  │  │ (anonymized    │  │
                                  │  │  patterns)     │  │
                                  │  └────────────────┘  │
                                  └──────────────────────┘
```

## What data leaves your machine

The MCP server sends **structured tool calls** to the ekkOS API. These include:

| Tool call | Data sent |
|-----------|-----------|
| `ekkOS_Search` | A short search query (e.g., "React useEffect cleanup pattern") |
| `ekkOS_Forge` | A pattern title, problem description, solution summary, and tags |
| `ekkOS_Track` | A pattern ID and context about how it was applied |
| `ekkOS_Outcome` | Whether a pattern succeeded or failed |
| `ekkOS_Plan` | Plan title and step descriptions |
| `ekkOS_Directive` | Your preference rules (e.g., "always use TypeScript strict mode") |

## What NEVER leaves your machine

The following data stays entirely local and is never transmitted to the ekkOS API:

- **Source code** -- your files, diffs, and repository contents
- **Full conversation transcripts** -- the complete back-and-forth between you and your AI
- **File contents** -- nothing from your filesystem is sent
- **Environment variables and secrets** -- local `.env` files, API keys in your config
- **File paths** -- absolute paths are stripped by the redaction pipeline before any data is shared collectively

The MCP server only sends the specific structured data shown above. Your AI assistant processes your code locally; ekkOS only receives the distilled patterns and queries.

## How collective memory works

ekkOS offers an opt-in collective intelligence feature where anonymized patterns are shared across users. Here's how it works:

1. **You forge a pattern** -- your AI learns something useful and creates a pattern
2. **Redaction pipeline runs** -- the `packages/redaction` module strips:
   - Personally identifiable information (names, emails, usernames)
   - File paths and directory structures
   - API keys, tokens, and credentials
   - Company-specific identifiers
   - Repository names and URLs
3. **Anonymized pattern enters collective pool** -- only the generic technical insight remains
4. **Other users benefit** -- when someone searches for a similar problem, they may find your anonymized solution

You can verify exactly what the redaction pipeline strips by reading the source code in [`packages/redaction`](../packages/redaction).

### Opting out

Collective memory sharing is opt-in. You can disable it entirely in your ekkOS dashboard at [ekkos.dev](https://ekkos.dev). When disabled, your patterns are stored only in your private memory and never enter the collective pool.

## Verify for yourself

Every component that touches your data is in this repository:

- **[`packages/mcp-server`](../packages/mcp-server)** -- see exactly what API calls are made
- **[`packages/redaction`](../packages/redaction)** -- see exactly what gets stripped before collective sharing
- **[`packages/memory-sdk`](../packages/memory-sdk)** -- see the SDK methods and what data they transmit
- **[`schemas/`](../schemas)** -- see the exact JSON schemas for every tool input and output

We encourage you to audit this code. If you find a case where data is transmitted that shouldn't be, please report it immediately.

## Reporting security issues

If you discover a security vulnerability, please report it responsibly:

- **Email:** [security@ekkos.dev](mailto:security@ekkos.dev)
- **Do NOT** open a public GitHub issue for security vulnerabilities
- We will acknowledge receipt within 48 hours
- We aim to provide a fix or mitigation within 7 days for critical issues

We appreciate responsible disclosure and will credit reporters (with permission) in our security advisories.
