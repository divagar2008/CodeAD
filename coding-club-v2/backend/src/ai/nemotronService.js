const axios = require('axios');
const config = require('../config');
const crypto = require('crypto');

class GeminiService {
  constructor() {
    this.apiKey = config.gemini.apiKey;
    this.model = config.gemini.model;
    this.apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`;
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000;
  }

  getCacheKey(code, language, problemDescription) {
    return crypto.createHash('md5').update(`${language}:${problemDescription}:${code}`).digest('hex');
  }

  getCachedReview(code, language, problemDescription) {
    const key = this.getCacheKey(code, language, problemDescription);
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  setCachedReview(code, language, problemDescription, data) {
    const key = this.getCacheKey(code, language, problemDescription);
    this.cache.set(key, { data, timestamp: Date.now() });
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  buildReviewPrompt(problemDesc, code, language, actualOutput = '', expectedOutput = '') {
    const outputMatches = this.outputMatches(actualOutput, expectedOutput);

    return `You are a strict code reviewer. Review this ${language} code. Return ONLY a JSON object.

PROBLEM: ${problemDesc}

CODE:
${code}

${actualOutput ? `ACTUAL OUTPUT: ${actualOutput}` : ''}
${expectedOutput ? `EXPECTED OUTPUT: ${expectedOutput}` : ''}
OUTPUT MATCHES: ${outputMatches ? 'YES' : 'NO'}

INSTRUCTIONS:
1. Check each line for syntax errors (missing brackets, colons, semicolons, indentation, undefined variables)
2. Check each line for logic errors (wrong conditions, off-by-one, missing edge cases)
3. Analyze the algorithm approach and complexity
4. If OUTPUT MATCHES is NO, identify WHY the output is wrong and deduct points
5. If OUTPUT MATCHES is YES but code has issues (wrong approach, missing edge cases), still deduct points

SCORING RULES:
- 90-100: Code is correct, handles edge cases, clean logic
- 70-89: Works for given input but misses edge cases or uses inefficient approach
- 50-69: Partially works, has logic gaps
- 30-49: Major logic errors
- 0-29: Completely broken

IMPORTANT:
- Do NOT give 100 if output does NOT match expected
- Do NOT give high scores just because code "looks right" — verify the logic actually works
- Be strict. If there is ANY bug, deduct points.
- Do NOT penalize for using input()/print() in Python or console.log in JavaScript. The platform feeds input automatically.

Return ONLY this JSON (no markdown, no explanation):
{"has_syntax_error":bool,"syntax_error_line":int|null,"syntax_error_message":"string","logical_correctness":int,"time_complexity":"string","space_complexity":"string","line_analysis":"string — what each line does and if correct","mistakes":"string — specific bugs found","suggestions":"string — how to fix","summary":"string — overall assessment"}`;
  }

  parseResponse(text) {
    let data = null;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.warn('Gemini response was not valid JSON, attempting parse...');
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          data = JSON.parse(match[0].replace(/,\s*([\}\]])/g, '$1'));
        } catch (e2) {
          console.error('Failed to parse Gemini response:', text.substring(0, 200));
          return this.getDefaultReview();
        }
      } else {
        return this.getDefaultReview();
      }
    }

    const hasSyntaxError = data?.has_syntax_error === true;
    const syntaxErrorLine = hasSyntaxError ? (Number(data.syntax_error_line) || null) : null;
    const syntaxErrorMessage = hasSyntaxError ? (data.syntax_error_message || 'Syntax error detected') : '';
    const score = hasSyntaxError ? 0 : Math.min(100, Math.max(0, Number(data.logical_correctness) || 0));

    return {
      has_syntax_error: hasSyntaxError,
      syntax_error_line: syntaxErrorLine,
      syntax_error_message: syntaxErrorMessage,
      logical_correctness: score,
      ai_score: score,
      time_complexity: data.time_complexity || 'N/A',
      space_complexity: data.space_complexity || 'N/A',
      line_analysis: data.line_analysis || 'N/A',
      mistakes: hasSyntaxError ? `Syntax error on line ${syntaxErrorLine}: ${syntaxErrorMessage}` : (data.mistakes || 'No mistakes recorded'),
      suggestions: hasSyntaxError ? `Fix the syntax error on line ${syntaxErrorLine}` : (data.suggestions || 'No suggestions recorded'),
      syntax_review: hasSyntaxError ? `Error on line ${syntaxErrorLine}: ${syntaxErrorMessage}` : 'No syntax errors',
      better_coding_practices: 'Logic evaluation completed',
      summary: hasSyntaxError ? `Syntax error on line ${syntaxErrorLine} — code cannot run` : (data.summary || 'Code evaluated'),
    };
  }

  getDefaultReview() {
    return {
      has_syntax_error: false,
      syntax_error_line: null,
      syntax_error_message: '',
      logical_correctness: 0,
      ai_score: 0,
      time_complexity: 'N/A',
      space_complexity: 'N/A',
      line_analysis: 'N/A',
      mistakes: 'Could not parse AI response',
      suggestions: 'Please try again',
      syntax_review: 'N/A',
      better_coding_practices: 'N/A',
      summary: 'AI review could not be completed.',
    };
  }

  async reviewCode(problemDescription, code, language, actualOutput = '', expectedOutput = '') {
    const cached = this.getCachedReview(code, language, problemDescription);
    if (cached) {
      console.log('Using cached AI review result');
      return cached;
    }

    const maxRetries = 2;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await axios.post(
          `${this.apiUrl}?key=${this.apiKey}`,
          {
            contents: [{
              parts: [{
                text: `You are a strict code reviewer. Review code and return ONLY valid JSON. Be strict — if output does not match expected, deduct points. Do not give 100 if there are bugs.\n\n${this.buildReviewPrompt(problemDescription, code, language, actualOutput, expectedOutput)}`
              }]
            }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.1,
              maxOutputTokens: 2048,
            },
          },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 60000,
          }
        );

        const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (!text) {
          console.error('Empty Gemini response:', JSON.stringify(response.data).substring(0, 300));
          if (attempt < maxRetries) {
            await new Promise(r => setTimeout(r, 2000));
            continue;
          }
          return this.getDefaultReview();
        }

        const result = this.parseResponse(text);
        this.setCachedReview(code, language, problemDescription, result);
        return result;
      } catch (err) {
        console.error(`Gemini API error (attempt ${attempt}/${maxRetries}):`, err.message);
        if (err.response) {
          console.error('API status:', err.response.status);
          console.error('API body:', JSON.stringify(err.response.data).substring(0, 300));
        }
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }
      }
    }
    return this.getDefaultReview();
  }

  createSyntaxErrorReview(line, message) {
    return {
      has_syntax_error: true,
      syntax_error_line: line,
      syntax_error_message: message,
      logical_correctness: 0,
      ai_score: 0,
      time_complexity: 'N/A',
      space_complexity: 'N/A',
      line_analysis: `Syntax error on line ${line} prevents further analysis`,
      mistakes: `Syntax error on line ${line}: ${message}`,
      suggestions: `Fix the syntax error on line ${line}`,
      syntax_review: `Error on line ${line}: ${message}`,
      summary: `Syntax error on line ${line} — code cannot run`,
    };
  }

  outputMatches(actual, expected) {
    const normalize = (s) => s.replace(/\r/g, '').trim().replace(/\s+/g, ' ');
    const actualNorm = normalize(actual);
    const expectedNorm = normalize(expected);
    if (actualNorm === expectedNorm) return true;
    const actualLines = actualNorm.split('\n').map(l => l.trim()).filter(Boolean);
    const expectedLines = expectedNorm.split('\n').map(l => l.trim()).filter(Boolean);
    if (actualLines.length === expectedLines.length) {
      return actualLines.every((line, i) => line === expectedLines[i]);
    }
    return false;
  }

  async compileCode(problemDescription, code, language, exampleInput = '', expectedOutput = '') {
    const { executeJS, executePython } = require('../shared/utils/codeExecutor');
    const startTime = Date.now();

    console.log(`[Compile] Starting compilation for ${language} code...`);

    let localExec = null;
    if (language === 'javascript') {
      localExec = executeJS(code, exampleInput);
    } else if (language === 'python') {
      localExec = await executePython(code, exampleInput);
    }

    const localTime = Date.now() - startTime;
    console.log(`[Compile] Local execution completed in ${localTime}ms`);

    const localSyntaxError = localExec && localExec.executed && localExec.has_syntax_error;

    let review;
    if (localSyntaxError) {
      console.log(`[Compile] Syntax error detected locally, skipping AI review`);
      review = this.createSyntaxErrorReview(localExec.syntax_error_line, localExec.syntax_error_message);
    } else {
      const actualOutput = (localExec?.program_output || '').trim();
      const expected = (expectedOutput || '').trim();

      console.log(`[Compile] Running AI review via Gemini...`);
      review = await this.reviewCode(problemDescription, code, language, actualOutput, expected);

      if (expected && actualOutput && this.outputMatches(actualOutput, expected)) {
        console.log(`[Compile] Output matches expected.`);
        review.output_matches_expected = true;
      } else {
        review.output_matches_expected = false;
      }
    }

    const totalTime = Date.now() - startTime;
    console.log(`[Compile] Total compilation completed in ${totalTime}ms`);

    const hasSyntaxError = localSyntaxError || review.has_syntax_error;
    const syntaxLine = (localExec && localExec.syntax_error_line) || review.syntax_error_line || 1;
    const syntaxMsg = (localExec && localExec.syntax_error_message) || review.syntax_error_message || 'Syntax Error';

    let programOutput = localExec?.program_output || '';
    if (!programOutput || programOutput === 'Program executed cleanly (No print output)' || programOutput === 'Code executed cleanly (No console.log / print output)') {
      programOutput = review.summary || 'Code executed cleanly.';
    }

    let outputLog = '';
    let errorLog = '';

    if (hasSyntaxError) {
      errorLog = `[Compilation Error] Line ${syntaxLine}: ${syntaxMsg}\n${review.syntax_review || ''}`;
      outputLog = `Compilation Failed!\nFound syntax error on line ${syntaxLine}: ${syntaxMsg}`;
    } else {
      const outputStatus = review.output_matches_expected ? '✓ Output matches expected' : '✗ Output does not match expected';
      outputLog = `=================== PROGRAM STDOUT / OUTPUT ===================\n${programOutput}\n===============================================================\n\n[Compilation Details]\n- Language: ${language}\n- Output Status: ${outputStatus}\n- AI Score: ${review.ai_score}/100\n- Time Complexity: ${review.time_complexity}\n- Space Complexity: ${review.space_complexity}\n- Line Analysis: ${review.line_analysis || 'N/A'}\n- Status: ${review.output_matches_expected ? 'Output matches' : 'Code needs review'}`;
      errorLog = 'No compilation errors. Code is ready for submission.';
    }

    return {
      success: !hasSyntaxError,
      has_syntax_error: hasSyntaxError,
      syntax_error_line: syntaxLine,
      syntax_error_message: syntaxMsg,
      program_output: programOutput,
      output_log: outputLog,
      error_log: errorLog,
      review,
    };
  }
}

module.exports = new GeminiService();
