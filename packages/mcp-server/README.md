# @ekkos/mcp-server

MCP server bridge for [ekkOS](https://ekkos.dev) — persistent memory for AI coding assistants. Connects tools like Claude Code, Cursor, Windsurf, and other MCP-compatible editors to your ekkOS memory via the [Model Context Protocol](https://modelcontextprotocol.io/).

## What It Does

This package bridges your AI coding tool to the ekkOS cloud memory service. When installed, your AI assistant gains access to persistent memory tools — it can search past solutions, remember your preferences, track what works, and get smarter over time.

## Quick Start

### 1. Get Your API Key

1. Go to [platform.ekkos.dev](https://platform.ekkos.dev)
2. Sign up or log in
3. Navigate to **Settings > API Keys**
4. Click **Generate New Key**

### 2. Configure Your Editor

#### Claude Code

Add to `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "ekkos-memory": {
      "command": "npx",
      "args": ["-y", "@ekkos/mcp-server"],
      "env": {
        "EKKOS_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

#### Cursor

Add to `.cursor/mcp.json` in your project root:

```json
{
  "mcpServers": {
    "ekkos-memory": {
      "command": "npx",
      "args": ["-y", "@ekkos/mcp-server"],
      "env": {
        "EKKOS_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

#### Windsurf

Add to your Windsurf MCP configuration:

```json
{
  "mcpServers": {
    "ekkos-memory": {
      "command": "npx",
      "args": ["-y", "@ekkos/mcp-server"],
      "env": {
        "EKKOS_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

#### Other MCP-Compatible Tools

Any tool that supports the Model Context Protocol can use this server. Point it at the `npx @ekkos/mcp-server` command with your API key in the environment.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `EKKOS_API_KEY` | Yes | Your ekkOS API key from [platform.ekkos.dev](https://platform.ekkos.dev) |
| `EKKOS_USER_ID` | No | Your user ID (optional, for multi-user setups) |
| `EKKOS_MCP_URL` | No | Custom MCP gateway URL (default: `https://mcp.ekkos.dev/api/v1/mcp/sse`) |
| `EKKOS_DEBUG` | No | Set to `true` for verbose debug logging |

## How It Works

```
┌─────────────┐     stdio      ┌──────────────┐      SSE       ┌─────────────┐
│  Claude Code │ ◄────────────► │  MCP Bridge  │ ◄────────────► │ ekkOS Cloud │
│  / Cursor    │                │  (this pkg)  │                │   Memory    │
└─────────────┘                └──────────────┘                └─────────────┘
```

1. Your AI tool launches this bridge as an MCP server via stdio
2. The bridge authenticates with ekkOS cloud using your API key
3. MCP messages are forwarded between your AI tool and ekkOS
4. Your AI assistant gains access to persistent memory tools

## Memory Tools

Once connected, your AI assistant gets access to tools across several categories:

- **Search & Recall** — Search past patterns, solutions, and conversations
- **Pattern Management** — Create, track, and evaluate learned solutions
- **Directives** — Set persistent rules (MUST/NEVER/PREFER/AVOID) your AI follows
- **Plans** — Create and manage structured multi-step plans
- **Secrets** — Securely store and retrieve API keys and credentials
- **Import/Export** — Back up and restore your memory data

For a full list of available tools, see the [documentation](https://docs.ekkos.dev).

## Troubleshooting

### "EKKOS_API_KEY environment variable is required"

You need to set your API key in the MCP config. Get one at [platform.ekkos.dev](https://platform.ekkos.dev/dashboard/settings/api-keys).

### MCP server not loading

1. Check Node.js version: `node --version` (must be 18+)
2. Verify your config JSON is valid (no trailing commas, correct paths)
3. Try running manually: `EKKOS_API_KEY=your_key npx @ekkos/mcp-server`
4. Enable debug mode by adding `"EKKOS_DEBUG": "true"` to your env config

### Connection errors

1. Check your internet connection
2. Verify your API key is correct and active
3. Check [ekkos.dev/status](https://ekkos.dev/status) for service status

## Requirements

- Node.js 18 or later
- An ekkOS account ([sign up](https://platform.ekkos.dev))

## Support

- [Documentation](https://docs.ekkos.dev)
- [Discord Community](https://discord.gg/w2JGepq9qZ)
- [GitHub Issues](https://github.com/ekkos-technologies/ekkos-open/issues)
- [Email Support](mailto:support@ekkos.dev)

## License

Apache-2.0 — see [LICENSE](../../LICENSE) for details.
