# ekkOS Open

> This repository contains the local and inspectable parts of ekkOS: client integrations, SDKs, and redaction logic. Hosted memory infrastructure, collective intelligence, and team platform services remain proprietary.

ekkOS gives your AI coding assistant a memory that persists across sessions. It learns from every interaction -- remembering proven solutions, mistakes to avoid, your preferences, and project context -- so your AI gets smarter the longer you use it.

## What's in this repo

| Package | Status | Description |
|---------|--------|-------------|
| [`packages/mcp-server`](./packages/mcp-server) | **Stable** | MCP server that connects your IDE to ekkOS (stdio + SSE transport) |
| [`packages/redaction`](./packages/redaction) | **Stable** | Auditable PII redaction and anonymization pipeline |
| [`packages/memory-sdk`](./packages/memory-sdk) | **Experimental** | TypeScript SDK for integrating ekkOS memory into any LLM workflow |

## What is NOT in this repo

The **ekkOS cloud service** is a separate commercial product. The following are part of that service and are not included here:

- **Hosted memory storage and retrieval API** -- the backend that persists your patterns and context
- **Collective intelligence network** -- anonymized pattern sharing across users
- **Cross-customer learning infrastructure** -- models that improve from aggregate usage
- **Billing, authentication, and account management** -- user identity and subscriptions
- **Production ingestion and ranking pipelines** -- how patterns are scored and promoted
- **The ekkOS proxy** -- context injection, auto-forging, and prompt enrichment
- **Internal orchestration systems** -- cron jobs, workers, and background processing

## Quick start

### 1. Install the MCP server

```bash
npm install -g @ekkos/mcp-server
```

### 2. Get your API key

Sign up at [ekkos.dev](https://ekkos.dev) and grab your API key from the dashboard.

### 3. Configure your IDE

**Claude Code:**
```bash
claude mcp add ekkos -- npx @ekkos/mcp-server --api-key YOUR_API_KEY
```

**Cursor / Windsurf / VS Code:**

Add to your MCP configuration:
```json
{
  "mcpServers": {
    "ekkos": {
      "command": "npx",
      "args": ["@ekkos/mcp-server"],
      "env": {
        "EKKOS_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

### 4. Start coding

Your AI assistant now has persistent memory. It will automatically search for relevant patterns before answering questions, forge new patterns when it learns something, and track what works and what doesn't.

## Security & Trust

See [docs/SECURITY.md](./docs/SECURITY.md) for a detailed breakdown of what data leaves your machine, what stays local, and how collective memory is anonymized.

The [`packages/redaction`](./packages/redaction) module is the core of our privacy story. Every pattern that enters the collective intelligence network passes through this pipeline. You can read every line of it.

## Documentation

- **Full docs:** [docs.ekkos.dev](https://docs.ekkos.dev)
- **Website:** [ekkos.dev](https://ekkos.dev)

## Release policy

- **Stable** packages follow semver and are safe for production use
- **Experimental** packages may have breaking changes between minor versions
- Security issues: email [security@ekkos.dev](mailto:security@ekkos.dev) (do not open public issues)
- We welcome bug reports and feature requests via GitHub Issues
- External pull requests are accepted by invitation -- open an issue first to discuss

## License

[Apache-2.0](./LICENSE)

Copyright 2026 ekkOS Technologies Inc.
