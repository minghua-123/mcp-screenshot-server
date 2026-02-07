// ============================================================================
// macOS window utilities
// ============================================================================

import { execFile } from 'child_process';
import { promisify } from 'util';
import { SAFE_APP_NAME_PATTERN } from '../config/index.js';

const execFileAsync = promisify(execFile);

/**
 * Interface for executing shell commands, enabling dependency injection for testing.
 */
export interface CommandExecutor {
  execFile(command: string, args: string[]): Promise<{ stdout: string }>;
}

/** Default executor backed by Node's child_process.execFile. */
const defaultExecutor: CommandExecutor = {
  execFile: (command: string, args: string[]) => execFileAsync(command, args),
};

/**
 * Look up a macOS window ID by application name via CoreGraphics.
 *
 * @param appName - The display name of the application (e.g. "Safari").
 * @param executor - Optional command executor for testing / DI.
 * @returns The window ID if found, or null.
 */
export async function getWindowId(
  appName: string,
  executor: CommandExecutor = defaultExecutor,
): Promise<number | null> {
  // NFC-normalize the app name so composed/decomposed Unicode compares equal
  const normalized = appName.normalize('NFC');

  // Security: Reject app names with potentially dangerous characters
  if (!SAFE_APP_NAME_PATTERN.test(normalized)) {
    console.error(`Security: Rejected unsafe app name: ${normalized}`);
    return null;
  }

  try {
    // Build Swift code to find window ID by app name
    const swift = `import CoreGraphics;if let l=CGWindowListCopyWindowInfo(.optionOnScreenOnly,0)as?[[String:Any]]{for w in l{if let n=w[kCGWindowOwnerName as String]as?String,let i=w[kCGWindowNumber as String]as?Int,n.lowercased()=="${normalized.toLowerCase()}"{print(i);exit(0)}}};print(-1)`;

    // Security: Use execFile to avoid shell interpretation (SEC-003)
    const { stdout } = await executor.execFile('swift', ['-e', swift]);
    const id = parseInt(stdout.trim(), 10);
    return id > 0 ? id : null;
  } catch {
    return null;
  }
}
