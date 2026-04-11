<div align="center">

<img src="docs/ekkos-lockup.svg" alt="ekkOS_" width="350" />

<br/><br/>

**Persistent memory for AI coding assistants**

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![npm](https://img.shields.io/badge/@ekkos/cli-CB3837?logo=npm&logoColor=white)](https://www.npmjs.com/package/@ekkos/cli)
[![Homebrew](https://img.shields.io/badge/Homebrew-FBB040?logo=homebrew&logoColor=black)](https://github.com/Ekkos-Technologies-Inc/homebrew-ekkos)

</div>

---

> This repository contains the **open-source, auditable** parts of ekkOS: install scripts, client integrations, and the PII redaction pipeline. Hosted memory infrastructure and collective intelligence remain proprietary.

---

## Install

```bash
# macOS (Homebrew)
brew install ekkos-technologies-inc/ekkos/ekkos

# macOS / Linux
curl -fsSL https://ekkos.dev/i | bash

# Windows (PowerShell)
irm https://ekkos.dev/i | iex

# npm (all platforms)
npm install -g @ekkos/cli
```

Then run `ekkos init` to connect your account.

<details>
<summary><b>View install scripts before running</b></summary>

Security-conscious? Audit the scripts first:

```bash
# macOS/Linux — view, then run
curl https://ekkos.dev/i | less

# Windows — view first
irm https://ekkos.dev/i
```

Source: [install.sh](scripts/install/install.sh) · [install.ps1](scripts/install/install.ps1)

</details>

---

## What's in this repo

| Path | Description |
|------|-------------|
| [`scripts/install/`](./scripts/install) | Install scripts served by `ekkos.dev/i` — fully auditable |
| [`packages/mcp-server/`](./packages/mcp-server) | MCP server connecting your IDE to ekkOS (stdio + SSE) |
| [`packages/redaction/`](./packages/redaction) | PII redaction pipeline — every pattern passes through this |
| [`docs/SECURITY.md`](./docs/SECURITY.md) | What data leaves your machine and how it's anonymized |

## What's NOT in this repo

The **ekkOS cloud service** is proprietary:

- Hosted memory storage and retrieval API
- Collective intelligence network (anonymized cross-user patterns)
- The ekkOS proxy (context injection, auto-forging, prompt enrichment)
- Billing, authentication, team management

---

## MCP Server Configuration

After installing, configure your IDE:

**Claude Code:**
```bash
claude mcp add ekkos -- npx @ekkos/mcp-server
```

**Cursor / Windsurf / VS Code:**
```json
{
  "mcpServers": {
    "ekkos": {
      "command": "npx",
      "args": ["@ekkos/mcp-server"]
    }
  }
}
```

Your AI assistant now has persistent memory — it searches patterns before answering, forges new patterns when it learns, and tracks what works.

---

## Security & Trust

The [`packages/redaction`](./packages/redaction) module is the core of our privacy story. Every pattern entering the collective intelligence network passes through this pipeline. **You can read every line.**

→ [Full security documentation](./docs/SECURITY.md)

---

## Links

- **Docs:** [docs.ekkos.dev](https://docs.ekkos.dev)
- **Website:** [ekkos.dev](https://ekkos.dev)
- **Homebrew Tap:** [homebrew-ekkos](https://github.com/Ekkos-Technologies-Inc/homebrew-ekkos)

## License

[Apache-2.0](./LICENSE) · Copyright 2026 ekkOS Technologies Inc.
