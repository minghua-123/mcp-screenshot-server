// ============================================================================
// Cross-platform screenshot provider interface + factory
// ============================================================================

import { execFile } from 'child_process';
import { promisify } from 'util';

export const execFileAsync = promisify(execFile);

// ── Types ──────────────────────────────────────────────────────────────────

export interface CaptureOptions {
  outputPath: string;
  format?: 'png' | 'jpg';
  includeCursor?: boolean;
  delay?: number;
  display?: number;
}

export interface WindowTarget {
  windowId?: number;
  windowName?: string;
}

export interface RegionTarget {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ── Provider interface ─────────────────────────────────────────────────────

export interface ScreenshotProvider {
  /** Human-readable platform name for error messages */
  readonly platform: string;

  /** Check whether the required capture tools are available on this system */
  isAvailable(): Promise<boolean>;

  /** Capture the entire screen (or a specific display) */
  captureFullscreen(opts: CaptureOptions): Promise<void>;

  /** Capture a specific window by name or ID */
  captureWindow(opts: CaptureOptions & WindowTarget): Promise<void>;

  /** Capture a rectangular region of the screen */
  captureRegion(opts: CaptureOptions & RegionTarget): Promise<void>;
}

// ── Factory ────────────────────────────────────────────────────────────────

let _cachedProvider: ScreenshotProvider | null = null;

/**
 * Return the appropriate ScreenshotProvider for the current OS.
 * The provider is cached after first call.
 */
export async function getScreenshotProvider(): Promise<ScreenshotProvider> {
  if (_cachedProvider) return _cachedProvider;

  let provider: ScreenshotProvider;

  switch (process.platform) {
    case 'darwin': {
      const { MacOSProvider } = await import('./macos-provider.js');
      provider = new MacOSProvider();
      break;
    }
    case 'linux': {
      const { LinuxProvider } = await import('./linux-provider.js');
      provider = new LinuxProvider();
      break;
    }
    case 'win32': {
      const { WindowsProvider } = await import('./windows-provider.js');
      provider = new WindowsProvider();
      break;
    }
    default:
      throw new Error(`Unsupported platform: ${process.platform}`);
  }

  const available = await provider.isAvailable();
  if (!available) {
    throw new Error(
      `No screenshot tools found for ${provider.platform}. ` +
      `See README for required system dependencies.`
    );
  }

  _cachedProvider = provider;
  return provider;
}

/** Reset the cached provider (for testing) */
export function resetProviderCache(): void {
  _cachedProvider = null;
}

// ── Helpers shared across providers ────────────────────────────────────────

/**
 * Check if a command exists on the system PATH.
 */
export async function commandExists(cmd: string): Promise<boolean> {
  try {
    const whichCmd = process.platform === 'win32' ? 'where' : 'which';
    await execFileAsync(whichCmd, [cmd]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sleep for a given number of seconds (for delay support).
 */
export function sleep(seconds: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}
