import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock child_process before any imports
vi.mock('child_process', () => ({
  execFile: vi.fn((_cmd: string, _args: string[], cb: Function) => cb(null, '', '')),
}));

vi.mock('util', () => ({
  promisify: () => vi.fn().mockResolvedValue({ stdout: '', stderr: '' }),
}));

vi.mock('../../src/utils/macos.js', () => ({
  getWindowId: vi.fn(),
}));

// Mock commandExists to return true for screencapture
vi.mock('../../src/utils/screenshot-provider.js', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/utils/screenshot-provider.js')>();
  return {
    ...original,
    commandExists: vi.fn().mockResolvedValue(true),
    execFileAsync: vi.fn().mockResolvedValue({ stdout: '', stderr: '' }),
  };
});

import { MacOSProvider } from '../../src/utils/macos-provider.js';
import { execFileAsync } from '../../src/utils/screenshot-provider.js';
import { getWindowId } from '../../src/utils/macos.js';

const mockExecFile = vi.mocked(execFileAsync);
const mockGetWindowId = vi.mocked(getWindowId);

describe('MacOSProvider', () => {
  let provider: MacOSProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new MacOSProvider();
  });

  it('has platform name "macOS"', () => {
    expect(provider.platform).toBe('macOS');
  });

  describe('captureFullscreen', () => {
    it('calls screencapture with -x and output path', async () => {
      await provider.captureFullscreen({ outputPath: '/tmp/test.png' });

      expect(mockExecFile).toHaveBeenCalledWith('screencapture', ['-x', '/tmp/test.png']);
    });

    it('includes -C flag when includeCursor is true', async () => {
      await provider.captureFullscreen({ outputPath: '/tmp/test.png', includeCursor: true });

      expect(mockExecFile).toHaveBeenCalledWith(
        'screencapture',
        expect.arrayContaining(['-C'])
      );
    });

    it('includes -t flag for format', async () => {
      await provider.captureFullscreen({ outputPath: '/tmp/test.jpg', format: 'jpg' });

      expect(mockExecFile).toHaveBeenCalledWith(
        'screencapture',
        expect.arrayContaining(['-t', 'jpg'])
      );
    });

    it('includes -T flag for delay', async () => {
      await provider.captureFullscreen({ outputPath: '/tmp/test.png', delay: 3 });

      expect(mockExecFile).toHaveBeenCalledWith(
        'screencapture',
        expect.arrayContaining(['-T', '3'])
      );
    });

    it('includes -D flag for display', async () => {
      await provider.captureFullscreen({ outputPath: '/tmp/test.png', display: 2 });

      expect(mockExecFile).toHaveBeenCalledWith(
        'screencapture',
        expect.arrayContaining(['-D', '2'])
      );
    });
  });

  describe('captureWindow', () => {
    it('uses windowId directly with -l flag', async () => {
      await provider.captureWindow({ outputPath: '/tmp/test.png', windowId: 42 });

      expect(mockExecFile).toHaveBeenCalledWith(
        'screencapture',
        expect.arrayContaining(['-l', '42'])
      );
    });

    it('resolves windowName via getWindowId', async () => {
      mockGetWindowId.mockResolvedValueOnce(99);

      await provider.captureWindow({ outputPath: '/tmp/test.png', windowName: 'Safari' });

      expect(mockGetWindowId).toHaveBeenCalledWith('Safari');
      expect(mockExecFile).toHaveBeenCalledWith(
        'screencapture',
        expect.arrayContaining(['-l', '99'])
      );
    });

    it('throws when window not found by name', async () => {
      mockGetWindowId.mockResolvedValueOnce(null);

      await expect(
        provider.captureWindow({ outputPath: '/tmp/test.png', windowName: 'NonExistent' })
      ).rejects.toThrow('Window not found: NonExistent');
    });

    it('throws when no windowId or windowName provided', async () => {
      await expect(
        provider.captureWindow({ outputPath: '/tmp/test.png' })
      ).rejects.toThrow('Window mode requires windowId or windowName');
    });
  });

  describe('captureRegion', () => {
    it('uses -R flag with region coordinates', async () => {
      await provider.captureRegion({
        outputPath: '/tmp/test.png',
        x: 100, y: 200, width: 800, height: 600,
      });

      expect(mockExecFile).toHaveBeenCalledWith(
        'screencapture',
        expect.arrayContaining(['-R', '100,200,800,600'])
      );
    });
  });
});
