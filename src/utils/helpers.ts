// ============================================================================
// Shared helper functions
// ============================================================================

import { dirname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import type { McpToolResponse } from '../types/index.js';

/** Return a successful MCP tool response. */
export const ok = (text: string): McpToolResponse => ({
  content: [{ type: 'text' as const, text }],
});

/** Return an error MCP tool response. */
export const err = (text: string): McpToolResponse => ({
  content: [{ type: 'text' as const, text }],
  isError: true,
});

/** Generate an ISO-8601 timestamp safe for filenames (colons/dots replaced with dashes). */
export const timestamp = (): string =>
  new Date().toISOString().replace(/[:.]/g, '-');

/** Ensure the parent directory of a file path exists, creating it recursively if needed. */
export const ensureDir = (p: string): void => {
  const d = dirname(p);
  if (!existsSync(d)) mkdirSync(d, { recursive: true });
};
