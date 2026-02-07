import type { FileSystem } from '../../src/validators/path.js';

export function createMockFs(pathMappings: Map<string, string | Error>): FileSystem {
  return {
    async realpath(path) {
      const result = pathMappings.get(path);
      if (result instanceof Error) throw result;
      if (!result) {
        const err = new Error(`ENOENT: no such file or directory, realpath '${path}'`);
        (err as NodeJS.ErrnoException).code = 'ENOENT';
        throw err;
      }
      return result;
    }
  };
}

export function createFsError(code: string, path: string): NodeJS.ErrnoException {
  const messages: Record<string, string> = {
    ENOENT: 'no such file or directory',
    EACCES: 'permission denied',
    EPERM: 'operation not permitted',
    ENOTDIR: 'not a directory',
  };
  const err = new Error(`${code}: ${messages[code] || 'unknown error'}, realpath '${path}'`);
  (err as NodeJS.ErrnoException).code = code;
  return err as NodeJS.ErrnoException;
}
