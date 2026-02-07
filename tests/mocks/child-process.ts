import type { CommandExecutor } from '../../src/utils/macos.js';

export function createMockExecutor(responses: Map<string, string | Error>): CommandExecutor {
  return {
    async execFile(command, args) {
      const key = `${command} ${args.join(' ')}`;
      for (const [pattern, result] of responses) {
        if (key.includes(pattern)) {
          if (result instanceof Error) throw result;
          return { stdout: result };
        }
      }
      throw new Error(`Unexpected command: ${key}`);
    }
  };
}
