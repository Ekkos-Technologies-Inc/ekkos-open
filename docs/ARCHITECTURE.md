# Architecture

This document describes the high-level architecture of the open-source ekkOS components and how they fit together.

## Overview

```
┌─────────────┐     MCP (stdio/SSE)     ┌───────────────┐     HTTPS     ┌────────────┐
│   Your IDE  │ ◄──────────────────────► │  MCP Server   │ ◄──────────► │  ekkOS API │
│             │                          │               │              │  (cloud)   │
└─────────────┘                          │  ┌─────────┐  │              └────────────┘
                                         │  │ memory  │  │
                                         │  │ -sdk    │  │
                                         │  ├─────────┤  │
                                         │  │ memory  │  │
                                         │  │ -core   │  │
                                         │  ├─────────┤  │
                                         │  │redaction│  │
                                         │  └─────────┘  │
                                         └───────────────┘
```

## The MCP protocol bridge

The MCP server implements the [Model Context Protocol](https://modelcontextprotocol.io/) and supports two transports:

- **stdio** -- the server runs as a child process of your IDE. Communication happens over stdin/stdout. This is the default for Claude Code, Cursor, and most desktop editors.
- **SSE (Server-Sent Events)** -- the server runs as a standalone HTTP process. The IDE connects over HTTP. Useful for remote development, shared servers, or custom integrations.

Both transports expose the same set of MCP tools. The server translates MCP tool calls into ekkOS API requests and returns results in the MCP response format.

### Tool registration

On startup, the MCP server registers all available tools with their JSON schemas (defined in `schemas/`). When your AI assistant calls a tool like `ekkOS_Search`, the flow is:

1. IDE sends MCP `tools/call` request to the server
2. Server validates the input against the tool's JSON schema
3. Server calls the ekkOS API with the validated parameters
4. Server returns the API response as an MCP `tools/call` result

## Memory layers

ekkOS organizes memory into specialized layers, each serving a different purpose:

| Layer | What it stores | Example |
|-------|---------------|---------|
| **Episodic** | Conversation history and temporal context | "Yesterday we debugged a race condition in the auth flow" |
| **Semantic** | Conceptual knowledge and relationships | "This project uses React 19 with Server Components" |
| **Pattern** | Proven solutions and anti-patterns with success rates | "Fix: add `key` prop when mapping JSX elements (98% success)" |
| **Procedural** | Step-by-step plans and workflows | "Deploy sequence: build, test, stage, verify, promote" |
| **Directive** | Your preferences and rules | "MUST: always use TypeScript strict mode" |
| **Collective** | Anonymized patterns from the community | "Common fix for Next.js hydration mismatch: check dynamic imports" |

When your AI searches memory, the ekkOS API queries across all relevant layers and returns a ranked set of results. The `memory-core` package defines the abstractions for these layers; the actual storage and retrieval happens in the ekkOS cloud service.

### The search and retrieval flow

```
AI asks a question
       │
       ▼
MCP Server receives ekkOS_Search call
       │
       ▼
memory-sdk sends search query to ekkOS API
       │
       ▼
ekkOS API searches across memory layers
       │
       ▼
Ranked results returned (patterns, episodic, semantic, etc.)
       │
       ▼
MCP Server returns results to IDE
       │
       ▼
AI uses relevant patterns in its response
```

## How the SDK integrates with any LLM provider

The `memory-sdk` package is a standalone TypeScript library that wraps the ekkOS API. It is not tied to any specific LLM provider -- you can use it with:

- **MCP-compatible IDEs** (via the MCP server in this repo)
- **Custom applications** (import the SDK directly)
- **Other AI frameworks** (LangChain, Vercel AI SDK, etc.)

Basic SDK usage:

```typescript
import { EkkosClient } from '@ekkos/memory-sdk';

const client = new EkkosClient({ apiKey: process.env.EKKOS_API_KEY });

// Search memory
const results = await client.search('React useEffect cleanup');

// Forge a new pattern
await client.forge({
  title: 'useEffect cleanup for subscriptions',
  problem: 'Memory leak when component unmounts with active subscription',
  solution: 'Return cleanup function from useEffect that calls unsubscribe()',
  tags: ['react', 'hooks', 'memory-leak'],
});

// Record an outcome
await client.outcome({ patternId: results[0].id, success: true });
```

## The redaction pipeline

Before any pattern enters the collective memory pool, it passes through the redaction pipeline (`packages/redaction`). This pipeline strips sensitive information in multiple passes:

```
Raw pattern text
       │
       ▼
┌──────────────────┐
│ PII Detection    │  Replaces emails and IPv4 addresses
│                  │  with safe placeholders
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Secret Scanner   │  Replaces API keys (sk-, ghp_, ekk_,
│                  │  Stripe, Slack, AWS), Bearer tokens,
│                  │  and URLs with embedded credentials
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Path Normalizer  │  Replaces absolute user paths
│                  │  (/Users/name, /home/name, C:\Users\name)
│                  │  with generic placeholders
└────────┬─────────┘
         │
         ▼
Anonymized pattern (safe for collective sharing)
```

Each stage is independently testable. The pipeline is deterministic -- given the same input, it always produces the same output. You can run it locally to verify what would be stripped from any text before it leaves your machine.

## Package dependency graph

```
@ekkos/mcp-server
  ├── @ekkos/memory-sdk
  │     └── @ekkos/memory-core
  └── @ekkos/redaction
```

- **`memory-core`** -- defines types, interfaces, and core abstractions (no network calls)
- **`memory-sdk`** -- implements the ekkOS API client using `memory-core` types
- **`redaction`** -- standalone redaction pipeline (no dependencies on other ekkOS packages)
- **`mcp-server`** -- ties everything together as an MCP-compatible server
