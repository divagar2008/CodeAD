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
 */
function executePython(code, exampleInput = '') {
  return new Promise((resolve) => {
    const tempFile = path.join(os.tmpdir(), `script_${Date.now()}_${Math.random().toString(36).substring(7)}.py`);
    try {
      fs.writeFileSync(tempFile, code);
      const pyProcess = spawn('python', [tempFile], { timeout: 4000 });

      let stdout = '';
      let stderr = '';

      if (exampleInput && pyProcess.stdin) {
        pyProcess.stdin.write(exampleInput + '\n');
        pyProcess.stdin.end();
      }

      pyProcess.stdout.on('data', (data) => { stdout += data.toString(); });
      pyProcess.stderr.on('data', (data) => { stderr += data.toString(); });

      pyProcess.on('close', (code) => {
        try { fs.unlinkSync(tempFile); } catch (e) {}

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
        try { fs.unlinkSync(tempFile); } catch (e) {}
        resolve({ executed: false, error: err.message });
      });
    } catch (err) {
      resolve({ executed: false, error: err.message });
    }
  });
}

module.exports = {
  executeJS,
  executePython,
};
