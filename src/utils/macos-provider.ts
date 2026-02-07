// ============================================================================
// macOS screenshot provider — wraps native `screencapture` CLI
// ============================================================================

import type { ScreenshotProvider, CaptureOptions, WindowTarget, RegionTarget } from './screenshot-provider.js';
import { execFileAsync, commandExists, sleep } from './screenshot-provider.js';
import { getWindowId } from './macos.js';

export class MacOSProvider implements ScreenshotProvider {
  readonly platform = 'macOS';

  async isAvailable(): Promise<boolean> {
    return commandExists('screencapture');
  }

  async captureFullscreen(opts: CaptureOptions): Promise<void> {
    const args = this.buildBaseArgs(opts);
    args.push(opts.outputPath);
    await execFileAsync('screencapture', args);
  }

  async captureWindow(opts: CaptureOptions & WindowTarget): Promise<void> {
    let wid = opts.windowId;
    if (!wid && opts.windowName) {
      wid = (await getWindowId(opts.windowName)) ?? undefined;
    }
    if (!wid) {
      throw new Error(
        opts.windowName
          ? `Window not found: ${opts.windowName}`
          : 'Window mode requires windowId or windowName'
      );
    }

    const args = this.buildBaseArgs(opts);
    args.push('-l', String(wid));
    args.push(opts.outputPath);
    await execFileAsync('screencapture', args);
  }

  async captureRegion(opts: CaptureOptions & RegionTarget): Promise<void> {
    const args = this.buildBaseArgs(opts);
    args.push('-R', `${opts.x},${opts.y},${opts.width},${opts.height}`);
    args.push(opts.outputPath);
    await execFileAsync('screencapture', args);
  }

  // ── Private helpers ────────────────────────────────────────────────────

  private buildBaseArgs(opts: CaptureOptions): string[] {
    const args = ['-x']; // no sound
    if (opts.includeCursor) args.push('-C');
    if (opts.format) args.push('-t', opts.format);
    if (opts.delay && opts.delay > 0) args.push('-T', String(opts.delay));
    if (opts.display) args.push('-D', String(opts.display));
    return args;
  }
}
