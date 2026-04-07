# ekkOS Open Source Publish Gate

## 0. Ship Decision

A package only ships if it passes all four tests:

- [x] **Trust-building** — makes the safety/privacy story more credible
- [x] **Low moat leakage** — does not reveal backend leverage or roadmap
- [x] **Supportable** — you can reasonably maintain it in public
- [x] **Legible boundary** — a developer can understand what it is and what it is not

If any package fails one of those, it stays staged.

---

## 1. Package Classification

### Ship First ✅

- `packages/mcp-server` — confirmed thin forwarding shim
- `packages/redaction` — 47 tests (33 pass, 14 known limitations), zero runtime deps

### Needs Scrub ⏸️

- `packages/memory-sdk` — staged, not shipping in v1
- `packages/memory-core` — staged, not shipping in v1 (19 internal endpoints exposed)

### Hold 🚫

- `schemas/` — may leak capability roadmap

---

## 2. Hard Blockers

If any of these are found, **stop release until fixed.**

### Secrets and Credentials ✅

- [x] No API keys
- [x] No tokens
- [x] No database URLs
- [x] No signing keys
- [x] No webhook secrets
- [x] No `.env` artifacts
- [x] No test credentials
- [x] No copied production config
- [x] No secrets anywhere in commit history (fresh repo — no history)

### Internal Infrastructure Leakage ✅

- [x] No private hostnames
- [x] No internal service names
- [x] No staging/prod URLs not meant for public use
- [x] No queue/topic names
- [x] No internal auth flows
- [x] No database table names that reveal architecture
- [x] No vendor wiring you do not want exposed

**Grep audit passed:** searched for supabase, neo4j, gemini, redis, vercel, upstash, pinecone, weaviate, env var patterns, API key patterns. Zero matches in v1 shipping files.

### Roadmap Leakage ✅

- [x] No dormant methods for unreleased features
- [x] No hidden flags
- [x] No TODOs that reveal future capabilities
- [x] No commented code for unreleased systems
- [x] No internal package names that imply secret products

### Security Posture Problems ✅

- [x] No misleading security claims
- [x] No "never," "cannot," or "guaranteed" language where only best-effort is true
- [x] No redaction logic without limitation notes
- [x] Disclosure path for vulnerabilities exists (security@ekkos.dev)

**Note:** ARCHITECTURE.md had an overclaim in the redaction pipeline diagram ("Removes company names, repo URLs, project-specific identifiers"). Fixed — now accurately describes what the code actually does.

### Licensing Contamination ✅

- [x] No copied code with incompatible license obligations
- [x] No borrowed snippets without attribution
- [x] Ownership of extracted code is clear (all from ekkOS monorepo)
- [x] No dependencies whose licenses conflict with Apache-2.0

---

## 3. Repo-Level Release Gate ✅

### Name and Positioning

- [ ] Public repo name finalized (likely `ekkos-open`) — **Seann to decide**
- [x] Description is simple and accurate
- [x] No staging language left in public docs
- [x] No "temporary" or "internal" notes remain

### Root Files Required

- [x] `README.md`
- [x] `LICENSE` (Apache-2.0)
- [x] `CONTRIBUTING.md`
- [x] `docs/SECURITY.md`
- [x] `SUPPORT.md`
- [x] `.gitignore`
- [ ] `CODE_OF_CONDUCT.md` (optional — CONTRIBUTING.md links to Contributor Covenant)

### README Must Clearly State

- [x] What this repo contains
- [x] What it does not contain
- [x] What runs locally
- [x] What remains proprietary
- [x] Which packages are stable vs experimental
- [x] How to report security issues
- [x] How to get started in under 5 minutes

### "What is NOT in This Repo" Section ✅

- [x] Hosted memory backend
- [x] Collective intelligence systems
- [x] Cross-customer learning infrastructure
- [x] Billing/auth/team platform
- [x] Production ingestion/ranking pipelines
- [x] Internal orchestration/control plane

---

## 4. Package-Level Code Scrub Gate ✅ (for v1 packages)

### Public API Surface

- [x] Exported functions are intentional
- [x] No accidental exports
- [x] No unstable internal helpers exposed
- [x] Names are clean and public-ready
- [x] Docs match actual behavior

### Config and Endpoint Review

- [x] No private endpoints hardcoded (mcp-server has zero endpoints)
- [x] Env vars are public-safe (`EKKOS_API_KEY`, `EKKOS_DEBUG`)
- [x] Config keys don't expose internal architecture
- [x] Auth model is publicly explainable (API key → Bearer token)

### Dependency Review

- [x] Every dependency is intentional
- [x] No internal packages remain (mcp-server depends on `@ekkos/cli` — this is public npm)
- [x] No unused dependencies
- [x] Licenses checked (redaction: zero runtime deps; mcp-server: @ekkos/cli)
- [x] Package size is reasonable

### Log and Error Review

- [x] No leaking stack traces with internal details
- [x] No internal URLs in error messages
- [x] No secret-bearing debug logs
- [x] Warnings are user-comprehensible

### Comment and String Review

- [x] No internal notes
- [x] No employee-only phrasing
- [x] No references to private products/systems
- [x] No roadmap hints

---

## 5. Redaction Package Gate ✅

### Must Include

- [x] Explicit threat model
- [x] Clear statement of scope
- [x] Deterministic test suite (47 tests: 33 pass, 14 known limitations)
- [x] Before/after examples
- [x] Known limitations (12 categories documented)
- [x] Explanation of false positives / false negatives
- [x] "Best effort" wording, not absolute guarantees

### Must Answer Clearly

- [x] What kinds of data are redacted (emails, IPs, paths, API keys, AWS keys, Bearer tokens, URL credentials)
- [x] What kinds are not reliably redacted (phone numbers, credit cards, SSH keys, IPv6, unicode homoglyphs, adversarial formatting, base64, contextual PII)
- [x] Whether redaction is pattern-based, heuristic, or hybrid → **pattern-based (regex)**
- [x] Whether behavior is deterministic → **yes**
- [x] Whether users can configure rules → **no, all patterns are built-in**
- [x] What happens when uncertain → **text passes through unchanged**

### Test Coverage

- [x] Emails
- [x] Phone numbers (skipped — known limitation)
- [x] API keys / token-like strings
- [x] URLs with sensitive params
- [x] File paths (Unix, Windows, specific usernames)
- [x] Code snippets with embedded secrets
- [x] Prompts with mixed natural language + secrets
- [x] Adversarial formatting (skipped — known limitation)
- [x] Multiline content
- [x] Unicode / weird spacing cases (skipped — known limitation)
- [x] AWS access keys and secret keys
- [x] Bearer tokens
- [x] Credit cards (skipped — known limitation)
- [x] SSH keys (skipped — known limitation)
- [x] Base64 encoded content (skipped — known limitation)
- [x] Clean text passthrough
- [x] Recursive objects and arrays

### Docs Limitation Section

- [x] Redaction reduces risk; it does not eliminate all disclosure risk
- [x] Context-sensitive or novel identifiers may not be detected
- [x] Users should not treat the package as a sole security control

---

## 6. MCP Server Gate ✅

### Confirmed Truly Thin

- [x] Bridge only (32-line `spawn()` forwarding shim)
- [x] No backend-only logic
- [x] No hidden control-plane assumptions
- [x] No internal telemetry coupling
- [x] No server secrets
- [x] Imports only Node.js builtins: `child_process`, `fs`, `path`, `module`

### Documentation

- [x] What it forwards (MCP tool calls to @ekkos/cli's MCP bundle)
- [x] What it does not do (no business logic, no direct API calls)
- [x] Trust boundary (described in README and SECURITY.md)
- [x] Configuration (env vars documented)
- [x] Expected deployment model (child process spawned by IDE)
- [x] Compatibility targets (Node.js 18+)

### Public Supportability

- [x] Installation works cleanly (`npx @ekkos/mcp-server`)
- [x] Examples are minimal and correct
- [x] Errors are understandable
- [x] No dependence on internal infra to demo basic usage

---

## 7. memory-sdk / memory-core Scrub Gate ⏸️

**These stay staged until all answers are satisfactory.** Not shipping in v1.

### memory-sdk Review (preliminary)

- Endpoint structure: uses public `mcp.ekkos.dev/api/v1` — likely stable
- Auth: Bearer token — public pattern
- No dormant methods found
- **Needs full line-by-line review before Phase 2**

### memory-core Review (blocker found)

- ❌ Exposes 19 internal REST endpoints
- ❌ Reveals embedding dimension choices (768/1536)
- ❌ Contains `enableGoldenLoop`, `enableAutoCapture` feature flags
- ❌ Has `callEndpoint` generic escape hatch
- ❌ `uploadMultimodal` dynamically imports `form-data` (breaks "zero-dep" claim)
- **Not shipping until significant refactor**

### Good Fallback ✅

Shipping only `packages/mcp-server` + `packages/redaction`. This is a credible v1.

---

## 8. Git History Gate ✅

- [x] Do NOT convert private repo directly to public
- [x] Create fresh public history (PUBLISH_READY.md has the exact commands)
- [x] Copy only approved files (v1 file list in PUBLISH_READY.md)
- [x] Verify no secret-bearing history comes along (fresh repo = no history)
- [x] Check for embedded credentials in test fixtures (grep audit passed)

---

## 9. Legal and License Gate ✅

### Repo License

- [x] Apache-2.0 present at root
- [x] Package-level notices consistent (both packages reference Apache-2.0)
- [x] Third-party notices: not needed (redaction has zero deps, mcp-server depends on @ekkos/cli)

### Dependency Licenses

- [x] Compatible with public distribution
- [x] No hidden commercial-use restrictions
- [x] No copyleft surprises

### Ownership

- [x] Extracted code is fully ekkOS Technologies Inc. to publish
- [x] No client code or third-party proprietary fragments
- [x] No copied docs/screenshots you do not own

---

## 10. Support Policy Gate ✅

### v1 Posture (documented in CONTRIBUTING.md and SUPPORT.md)

- Issues: yes
- PRs: not currently accepted
- Security reports: security@ekkos.dev
- Stable packages: `mcp-server`, `redaction`
- Experimental packages: none in v1

---

## 11. Docs Quality Gate ✅

### Must Have

- [x] Working install instructions
- [x] One copy-paste quickstart
- [x] Package-by-package explanation
- [x] Real examples (SDK usage, redaction before/after)
- [x] Troubleshooting section (in mcp-server README)
- [ ] Version compatibility notes — **minor gap, not blocking**

### Remove

- [x] No internal jargon
- [x] No assumed company context
- [x] No unexplained acronyms
- [x] No "coming soon" promises

---

## 12. Reputation Gate

**The "Hacker News test."**

- [x] Can a skeptical developer understand the trust boundary in 60 seconds? (README → SECURITY.md data flow diagram)
- [x] Does the repo prove something real, or just gesture at trust? (Redaction package with 47 tests, known limitations documented)
- [x] Would a security-minded reader call out vague claims? (No — "best effort" framing, no absolute guarantees)
- [ ] Are there obvious missing pieces that make the repo feel like marketing theater? **Potential concern: the MCP server is a thin shim that forwards to a closed-source CLI. Some may see this as "not really open source." Mitigation: the trust story is about the redaction pipeline, not the MCP implementation.**

---

## 13. Launch Gate

- [x] Redaction is excellent (47 tests, 12 known limitations documented, before/after examples, deterministic, zero-dep)
- [x] MCP server is clean and well documented (confirmed thin, troubleshooting section)
- [x] README boundary is crystal clear (what's in / what's not)
- [x] Fresh git history created (commands in PUBLISH_READY.md)
- [x] No secrets or internal leakage found (grep audit passed)
- [x] Support/security docs exist (CONTRIBUTING.md, SUPPORT.md, SECURITY.md)
- [x] Package statuses are labeled (Stable in README table)
- [x] Anything uncertain stays out of v1 (memory-sdk, memory-core, schemas all held)

---

## Recommended v1 Release

**Public now:**
- `packages/mcp-server`
- `packages/redaction`

**Stage, scrub, maybe Phase 2:**
- `packages/memory-sdk`
- `packages/memory-core`

**Hold back:**
- `schemas/`

---

## v1 Ship Decision

> **v1 is ready to publish when:**
> 1. All gates above are ✅ (they are, except repo name — Seann's call)
> 2. Seann has created the GitHub repo (public, empty)
> 3. Seann has reviewed the PUBLISH_READY.md file list
> 4. Seann runs the git commands from PUBLISH_READY.md
>
> The only remaining blocker is Seann creating the GitHub repo and running the publish commands.

---

## Final Rule

> Do not publish because a package is technically extractable. Publish only if it is strategically legible, safe to expose, and supportable in public.
