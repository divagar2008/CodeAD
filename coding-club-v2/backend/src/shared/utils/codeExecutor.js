const vm = require('vm');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Executes JavaScript code safely in Node VM and captures console.log output & return value.
 */
function executeJS(code, exampleInput = '') {
  const logs = [];
  const sandbox = {
    console: {
      log: (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
      error: (...args) => logs.push('[ERROR] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
      warn: (...args) => logs.push('[WARN] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
      info: (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
    },
    input: exampleInput,
  };

  try {
    const script = new vm.Script(code);
    const context = vm.createContext(sandbox);
    const result = script.runInContext(context, { timeout: 3000 });

    let stdout = logs.join('\n');
    if (result !== undefined) {
      const resStr = typeof result === 'object' ? JSON.stringify(result) : String(result);
      stdout += (stdout ? '\nOutput: ' : 'Output: ') + resStr;
    }

    return {
      executed: true,
      has_syntax_error: false,
      program_output: stdout || 'Code executed cleanly (No console.log / print output)',
      error_message: null,
    };
  } catch (err) {
    const lineMatch = err.stack ? err.stack.match(/evalmachine\.<anonymous>:(\d+)/) : null;
    return {
      executed: true,
      has_syntax_error: true,
      syntax_error_line: lineMatch ? Number(lineMatch[1]) : 1,
      syntax_error_message: err.message,
      program_output: '',
      error_message: err.message,
    };
  }
}

/**
 * Executes Python code using system python process and captures stdout/stderr.
 * Tries `python` first, then falls back to `python3` (common on Linux servers).
 */
function executePython(code, exampleInput = '') {
  return new Promise((resolve) => {
    const tempFile = path.join(os.tmpdir(), `script_${Date.now()}_${Math.random().toString(36).substring(7)}.py`);
    const pyBins = ['python', 'python3'];
    let binIndex = 0;

    const cleanup = () => { try { fs.unlinkSync(tempFile); } catch (e) {} };

    const run = () => {
      if (binIndex >= pyBins.length) {
        cleanup();
        return resolve({ executed: false, error: 'Python interpreter not found on server (tried python and python3)' });
      }

      const pyBin = pyBins[binIndex++];
      try {
        fs.writeFileSync(tempFile, code);
        const pyProcess = spawn(pyBin, [tempFile], { timeout: 4000 });

        let stdout = '';
        let stderr = '';

        if (exampleInput && pyProcess.stdin) {
          pyProcess.stdin.write(exampleInput + '\n');
          pyProcess.stdin.end();
        }

        pyProcess.stdout.on('data', (data) => { stdout += data.toString(); });
        pyProcess.stderr.on('data', (data) => { stderr += data.toString(); });

        pyProcess.on('close', (code) => {
          cleanup();

          if (code !== 0 || stderr.trim()) {
            const lineMatch = stderr.match(/File ".*", line (\d+)/);
            return resolve({
              executed: true,
              has_syntax_error: true,
              syntax_error_line: lineMatch ? Number(lineMatch[1]) : 1,
              syntax_error_message: stderr.trim() || 'Python execution error',
              program_output: stdout.trim(),
              error_message: stderr.trim(),
            });
          }

          resolve({
            executed: true,
            has_syntax_error: false,
            program_output: stdout.trim() || 'Program executed cleanly (No print output)',
            error_message: null,
          });
        });

        pyProcess.on('error', (err) => {
          cleanup();
          // ENOENT means the binary doesn't exist — try the next candidate
          if (err.code === 'ENOENT') return run();
          resolve({ executed: false, error: err.message });
        });
      } catch (err) {
        cleanup();
        resolve({ executed: false, error: err.message });
      }
    };

    run();
  });
}

module.exports = {
  executeJS,
  executePython,
};
