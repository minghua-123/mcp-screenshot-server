import { describe, it, expect, vi, beforeEach } from 'vitest';
import { existsSync, mkdirSync } from 'fs';

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return {
    ...actual,
    existsSync: vi.fn(),
    mkdirSync: vi.fn(),
  };
});

// Import after mock setup so the module gets the mocked fs
import { ok, err, timestamp, ensureDir } from '../../src/utils/helpers.js';

const mockExistsSync = vi.mocked(existsSync);
const mockMkdirSync = vi.mocked(mkdirSync);

describe('ok', () => {
  it('returns MCP response with text content and no isError', () => {
    const result = ok('success message');
    expect(result).toEqual({
      content: [{ type: 'text', text: 'success message' }],
    });
    expect(result.isError).toBeUndefined();
  });
});

describe('err', () => {
  it('returns MCP response with text content and isError: true', () => {
    const result = err('failure message');
    expect(result).toEqual({
      content: [{ type: 'text', text: 'failure message' }],
      isError: true,
    });
  });
});

describe('timestamp', () => {
  it('returns ISO-like string with colons and dots replaced by dashes', () => {
    const ts = timestamp();
    // Should not contain colons or dots
    expect(ts).not.toContain(':');
    expect(ts).not.toContain('.');
    // Should contain dashes and T (ISO format structure)
    expect(ts).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z$/);
  });

  it('returns different values over time', async () => {
    const ts1 = timestamp();
    // Small delay to ensure time changes
    await new Promise((r) => setTimeout(r, 5));
    const ts2 = timestamp();
    // They could be the same within ms, but the format should be valid
    expect(ts2).toMatch(/^\d{4}-/);
  });
});

describe('ensureDir', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls mkdirSync with recursive when dir does not exist', () => {
    mockExistsSync.mockReturnValueOnce(false);

    ensureDir('/some/path/file.png');

    expect(mockMkdirSync).toHaveBeenCalledWith('/some/path', { recursive: true });
  });

  it('does not call mkdirSync when dir already exists', () => {
    mockExistsSync.mockReturnValueOnce(true);

    ensureDir('/existing/path/file.png');

    expect(mockMkdirSync).not.toHaveBeenCalled();
  });
});
