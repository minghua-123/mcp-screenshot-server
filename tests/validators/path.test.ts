import { describe, it, expect } from 'vitest';
import { validateOutputPath } from '../../src/validators/path.js';
import type { PathConfig } from '../../src/validators/path.js';
import { createMockFs } from '../mocks/fs.js';

const TEST_CONFIG: PathConfig = {
  allowedOutputDirs: ['/home/user/Desktop/Screenshots', '/tmp', '/home/user/Downloads', '/home/user/Documents'],
  defaultOutDir: '/home/user/Desktop/Screenshots',
};

// Mock FS where realpath returns identity for allowed dirs and paths within them
function buildMockFs(extra?: Map<string, string | Error>) {
  const mappings = new Map<string, string | Error>([
    // Allowed dirs resolve to themselves
    ['/home/user/Desktop/Screenshots', '/home/user/Desktop/Screenshots'],
    ['/tmp', '/tmp'],
    ['/home/user/Downloads', '/home/user/Downloads'],
    ['/home/user/Documents', '/home/user/Documents'],
  ]);
  if (extra) {
    for (const [k, v] of extra) mappings.set(k, v);
  }
  return createMockFs(mappings);
}

describe('validateOutputPath', () => {
  it('uses default path when no custom path given', async () => {
    const result = await validateOutputPath(undefined, 'screenshot.png', TEST_CONFIG);
    expect(result).toEqual({
      valid: true,
      path: '/home/user/Desktop/Screenshots/screenshot.png',
    });
  });

  it('uses default path when empty string given', async () => {
    const result = await validateOutputPath('', 'screenshot.png', TEST_CONFIG);
    expect(result).toEqual({
      valid: true,
      path: '/home/user/Desktop/Screenshots/screenshot.png',
    });
  });

  it('uses default path when whitespace-only string given', async () => {
    const result = await validateOutputPath('   ', 'screenshot.png', TEST_CONFIG);
    expect(result).toEqual({
      valid: true,
      path: '/home/user/Desktop/Screenshots/screenshot.png',
    });
  });

  it('accepts valid custom path within allowed directory', async () => {
    const fs = buildMockFs(new Map([
      ['/tmp/my-screenshot.png', '/tmp/my-screenshot.png'],
    ]));
    const result = await validateOutputPath('/tmp/my-screenshot.png', 'default.png', TEST_CONFIG, fs);
    expect(result.valid).toBe(true);
    expect(result.path).toBe('/tmp/my-screenshot.png');
  });

  it('accepts path in Downloads', async () => {
    const targetPath = '/home/user/Downloads/shot.png';
    // File doesn't exist yet, parent resolves
    const fs = buildMockFs();
    const result = await validateOutputPath(targetPath, 'default.png', TEST_CONFIG, fs);
    expect(result.valid).toBe(true);
    expect(result.path).toBe('/home/user/Downloads/shot.png');
  });

  it('accepts path in Documents', async () => {
    const targetPath = '/home/user/Documents/report.png';
    const fs = buildMockFs();
    const result = await validateOutputPath(targetPath, 'default.png', TEST_CONFIG, fs);
    expect(result.valid).toBe(true);
    expect(result.path).toBe('/home/user/Documents/report.png');
  });

  it('accepts path in /tmp', async () => {
    const fs = buildMockFs();
    const result = await validateOutputPath('/tmp/test.png', 'default.png', TEST_CONFIG, fs);
    expect(result.valid).toBe(true);
    expect(result.path).toBe('/tmp/test.png');
  });

  it('rejects path traversal attempt', async () => {
    // ../../etc/passwd resolved to /etc/passwd which is outside allowed dirs
    const fs = buildMockFs(new Map([
      ['/etc/passwd', '/etc/passwd'],
    ]));
    const result = await validateOutputPath('/etc/passwd', 'default.png', TEST_CONFIG, fs);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('allowed directories');
  });

  it('rejects symlink resolving outside allowed dirs', async () => {
    // Symlink at /tmp/evil resolves to /etc/shadow
    const fs = buildMockFs(new Map([
      ['/tmp/evil', '/etc/shadow'],
    ]));
    const result = await validateOutputPath('/tmp/evil', 'default.png', TEST_CONFIG, fs);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('allowed directories');
  });

  it('rejects null byte in path', async () => {
    const result = await validateOutputPath('/tmp/evil\x00.png', 'default.png', TEST_CONFIG);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('null bytes');
  });

  it('rejects %00 in path', async () => {
    const result = await validateOutputPath('/tmp/evil%00.png', 'default.png', TEST_CONFIG);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('null bytes');
  });

  it('fails when parent directory does not exist', async () => {
    // Neither the path nor the parent exist in mock FS
    const fs = createMockFs(new Map([
      ['/home/user/Desktop/Screenshots', '/home/user/Desktop/Screenshots'],
      ['/tmp', '/tmp'],
      ['/home/user/Downloads', '/home/user/Downloads'],
      ['/home/user/Documents', '/home/user/Documents'],
    ]));
    const result = await validateOutputPath('/nonexistent/dir/file.png', 'default.png', TEST_CONFIG, fs);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Parent directory does not exist');
  });
});
