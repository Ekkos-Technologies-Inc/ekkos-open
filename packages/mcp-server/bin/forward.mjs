#!/usr/bin/env node
/**
 * @deprecated Install `@ekkos/cli` and use `npx @ekkos/cli mcp` or global `ekkos mcp`.
 * This shim keeps `npx @ekkos/mcp-server` working by forwarding to the MCP bundle in @ekkos/cli.
 */
import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
let cliRoot;
try {
  cliRoot = dirname(require.resolve('@ekkos/cli/package.json'));
} catch {
  console.error('[ekkOS] Missing dependency @ekkos/cli. Run: npm install -g @ekkos/cli');
  process.exit(1);
}
const entry = join(cliRoot, 'dist', 'mcp', 'index.js');
if (!existsSync(entry)) {
  console.error('[ekkOS] MCP bundle not found at', entry, '— reinstall @ekkos/cli');
  process.exit(1);
}
const child = spawn(process.execPath, [entry], { stdio: 'inherit' });
child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
