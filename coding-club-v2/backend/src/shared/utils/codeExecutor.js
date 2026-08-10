const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Executes JavaScript code in a real Node process so `require`, `process.stdin`,
 * and `readline` all work. Captures stdout/stderr and reports the failing line.
 */
function executeJS(code, exampleInput = '') {
  return new Promise((resolve) => {
    const tempFile = path.join(os.tmpdir(), `script_${Date.now()}_${Math.random().toString(36).substring(7)}.js`);
    const cleanup = () => { try { fs.unlinkSync(tempFile); } catch (e) {} };

    try {
      fs.writeFileSync(tempFile, code);
    } catch (err) {
      cleanup();
      return resolve({ executed: false, error: err.message });
    }

    const jsProcess = spawn('node', [tempFile], { timeout: 4000 });

    let stdout = '';
    let stderr = '';

    if (exampleInput && jsProcess.stdin) {
      jsProcess.stdin.write(exampleInput + '\n');
      jsProcess.stdin.end();
    }

    jsProcess.stdout.on('data', (data) => { stdout += data.toString(); });
    jsProcess.stderr.on('data', (data) => { stderr += data.toString(); });

    jsProcess.on('close', (code) => {
      cleanup();

      if (code !== 0 || stderr.trim()) {
        const isSyntax = /SyntaxError/.test(stderr);
        const lineMatch = stderr.match(/\.js:(\d+)/);
        return resolve({
          executed: true,
          has_syntax_error: isSyntax,
          has_runtime_error: !isSyntax,
          syntax_error_line: lineMatch ? Number(lineMatch[1]) : 1,
          syntax_error_message: stderr.trim() || 'JavaScript execution error',
          program_output: stdout.trim(),
          error_message: stderr.trim(),
        });
      }

      resolve({
        executed: true,
        has_syntax_error: false,
        has_runtime_error: false,
        program_output: stdout.trim() || 'Program executed cleanly (No console.log output)',
        error_message: null,
      });
    });

    jsProcess.on('error', (err) => {
      cleanup();
      resolve({ executed: false, error: err.message });
    });
  });
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
            const isSyntax = /SyntaxError|IndentationError|TabError/.test(stderr);
            const lineMatch = stderr.match(/File ".*", line (\d+)/);
            return resolve({
              executed: true,
              has_syntax_error: isSyntax,
              has_runtime_error: !isSyntax,
              syntax_error_line: lineMatch ? Number(lineMatch[1]) : 1,
              syntax_error_message: stderr.trim() || 'Python execution error',
              program_output: stdout.trim(),
              error_message: stderr.trim(),
            });
          }

          resolve({
            executed: true,
            has_syntax_error: false,
            has_runtime_error: false,
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
