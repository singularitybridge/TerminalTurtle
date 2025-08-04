import * as pty from 'node-pty';
import stripAnsi from 'strip-ansi';

const DEFAULT_TIMEOUT = 5 * 60 * 1000;

const createTimeout = (ptyProcess: pty.IPty): Promise<never> =>
  new Promise((_, reject) =>
    setTimeout(() => {
      ptyProcess.kill();
      reject(new Error(`Command timed out after ${DEFAULT_TIMEOUT}ms`));
    }, DEFAULT_TIMEOUT)
  );

export const executeCommand = (
  command: string,
  workingDirectory: string,
  streamCallback?: (data: string) => void
): {
  ptyProcess: pty.IPty;
  resultPromise: Promise<{
    success: boolean;
    output: string;
    exitCode: number;
    timedOut?: boolean;
  }>;
} => {
  const ptyProcess = pty.spawn('bash', ['-c', command], {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: workingDirectory,
    env: {
      ...process.env,
      FORCE_COLOR: '1',
      TERM: 'xterm-256color',
      GIT_TERMINAL_PROMPT: '1',
      CI: 'true',
    },
  });

  let output = '';

  const execPromise = new Promise<{ exitCode: number }>((resolve) => {
    ptyProcess.onData((data) => {
      output += data;
      if (streamCallback) {
        streamCallback(stripAnsi(data));
      }
    });

    ptyProcess.onExit(({ exitCode }) => {
      resolve({ exitCode: exitCode ?? -1 });
    });
  });

  const resultPromise = Promise.race([execPromise, createTimeout(ptyProcess)])
    .then(({ exitCode }) => {
      const cleanOutput = stripAnsi(output);
      return {
        success: exitCode === 0,
        output: cleanOutput,
        exitCode,
      };
    })
    .catch((error) => {
      const err = error as any;
      if (err.message && err.message.includes('Command timed out')) {
        return {
          success: false,
          output: `Command terminated: ${err.message}`,
          exitCode: 124,
          timedOut: true,
        };
      }
      const errorOutput = stripAnsi(err.output || err.message || 'Unknown error occurred');
      return {
        success: false,
        output: errorOutput,
        exitCode: err.code || -1,
      };
    });

  return { ptyProcess, resultPromise };
};
