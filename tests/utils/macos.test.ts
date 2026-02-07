import { describe, it, expect } from 'vitest';
import { getWindowId } from '../../src/utils/macos.js';
import { createMockExecutor } from '../mocks/child-process.js';

describe('getWindowId', () => {
  it('returns window ID for a valid app name', async () => {
    const executor = createMockExecutor(new Map([
      ['safari', '42\n'],
    ]));
    const result = await getWindowId('Safari', executor);
    expect(result).toBe(42);
  });

  it('returns null when app not found (stdout = -1)', async () => {
    const executor = createMockExecutor(new Map([
      ['notfound', '-1\n'],
    ]));
    const result = await getWindowId('notfound', executor);
    expect(result).toBeNull();
  });

  it('returns null when app not found (stdout = 0)', async () => {
    const executor = createMockExecutor(new Map([
      ['zeroapp', '0\n'],
    ]));
    const result = await getWindowId('zeroapp', executor);
    expect(result).toBeNull();
  });

  it('returns null for empty string app name (rejected by regex)', async () => {
    const executor = createMockExecutor(new Map());
    const result = await getWindowId('', executor);
    expect(result).toBeNull();
  });

  it('returns null for app name with special characters (rejected by regex)', async () => {
    const executor = createMockExecutor(new Map());
    const result = await getWindowId('evil;rm -rf /', executor);
    expect(result).toBeNull();
  });

  it('returns null for app name with unicode characters (rejected by regex)', async () => {
    const executor = createMockExecutor(new Map());
    const result = await getWindowId('Ünïcödé', executor);
    expect(result).toBeNull();
  });

  it('returns null for app name with quotes (rejected by regex)', async () => {
    const executor = createMockExecutor(new Map());
    const result = await getWindowId('App"Name', executor);
    expect(result).toBeNull();
  });

  it('returns null when executor throws an error', async () => {
    const executor = createMockExecutor(new Map([
      ['swift', new Error('command failed')],
    ]));
    const result = await getWindowId('Safari', executor);
    expect(result).toBeNull();
  });

  it('accepts app names with spaces, hyphens, and underscores', async () => {
    const executor = createMockExecutor(new Map([
      ['my-cool app_name', '100\n'],
    ]));
    const result = await getWindowId('My-Cool App_Name', executor);
    expect(result).toBe(100);
  });

  it('normalizes NFC unicode before regex check', async () => {
    // Composed é (U+00E9) is not in [a-zA-Z0-9 \-_], so it should be rejected
    const executor = createMockExecutor(new Map());
    const result = await getWindowId('Caf\u00e9', executor);
    expect(result).toBeNull();
  });
});
