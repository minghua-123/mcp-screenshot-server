import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock child_process for commandExists
vi.mock('child_process', () => ({
  execFile: vi.fn((_cmd: string, _args: string[], cb: Function) => cb(null, '', '')),
}));

vi.mock('util', () => ({
  promisify: () => vi.fn().mockResolvedValue({ stdout: '/usr/bin/screencapture', stderr: '' }),
}));

import { commandExists, sleep, resetProviderCache } from '../../src/utils/screenshot-provider.js';

describe('screenshot-provider utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetProviderCache();
  });

  describe('sleep', () => {
    it('resolves after the specified time', async () => {
      vi.useFakeTimers();
      const promise = sleep(1);
      vi.advanceTimersByTime(1000);
      await promise;
      vi.useRealTimers();
    });

    it('handles zero seconds', async () => {
      vi.useFakeTimers();
      const promise = sleep(0);
      vi.advanceTimersByTime(0);
      await promise;
      vi.useRealTimers();
    });
  });
});
