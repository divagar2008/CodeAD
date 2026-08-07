const axios = require('axios');
const config = require('../config');
const crypto = require('crypto');

class NemotronService {
  constructor() {
    this.apiKey = config.nemotron.apiKey;
    this.apiUrl = config.nemotron.apiUrl;
    this.model = config.nemotron.model;
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
    return `You are a strict code review engine. Analyze EVERY LINE of the submitted ${language} code. Return ONLY valid JSON, no markdown, no extra text.

PROBLEM DESCRIPTION:
${problemDesc}

SUBMITTED CODE (${language}):
${code}

${actualOutput ? `ACTUAL PROGRAM OUTPUT (what the code produced):\n${actualOutput}` : ''}
${expectedOutput ? `EXPECTED OUTPUT (what the correct answer should be):\n${expectedOutput}` : ''}

YOUR TASK — Follow these steps IN ORDER:

STEP 1: SYNTAX CHECK
Go through each line. Check for:
- Missing colons (Python), semicolons (Java/C++), brackets, braces
- Unmatched parentheses, brackets, braces
- Indentation errors (Python)
- Missing/extra commas, incorrect operators
- Undefined variables, wrong function calls
If syntax error found → set has_syntax_error true, give EXACT line number (count from line 1), describe the error precisely.

STEP 2: LINE-BY-LINE LOGICAL ANALYSIS
Go through EVERY meaningful line (skip blank lines and comments). For each line explain:
- What this line does
- Whether it correctly contributes to solving the problem
- Any edge cases or bugs in this line
Track each line's correctness.

STEP 3: ALGORITHM ANALYSIS
- Identify the algorithm used (brute force, two pointers, dynamic programming, etc.)
- Is this the right approach for this problem?
- Does it handle all edge cases? (empty input, single element, max values, negative numbers, duplicates)
- Are loop boundaries correct?
- Are conditions correct?
- Does the output match the expected output?

STEP 4: COMPLEXITY ANALYSIS
- Time complexity with justification
- Space complexity with justification

STEP 5: SCORING
Score the code 0-100 based on:
- 90-100: Logic is correct, handles edge cases, clean code
- 70-89: Core logic works but minor gaps (missing edge case, slightly inefficient)
- 50-69: Partially correct, some logic issues
- 30-49: Major logic errors, wrong algorithm
- 0-29: Completely broken or unrelated to the problem

CRITICAL RULES:
- Do NOT penalize for using input()/print() (Python) or console.log/readline (JavaScript). The platform feeds input automatically and expects print/console.log output.
- Do NOT penalize for not writing a function. Using top-level code with input()/print() is the expected format.
- If the actual output matches expected output, the logic IS correct — score accordingly high.
- Focus ONLY on whether the code correctly solves the problem.

Return EXACTLY this JSON:
{
  "has_syntax_error": bool,
  "syntax_error_line": int or null,
  "syntax_error_message": "string",
  "logical_correctness": int (0-100),
  "time_complexity": "string like O(N)",
  "space_complexity": "string like O(1)",
  "line_analysis": "string — brief summary of line-by-line findings",
  "mistakes": "string — list specific bugs/issues found",
  "suggestions": "string — specific improvements",
  "summary": "string — 1-2 sentence overall assessment"
}`;
  }

  parseResponse(content) {
    let raw = content || '';
    raw = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

    const match = raw.match(/\{[\s\S]*\}/);
    let jsonStr = match ? match[0] : raw;

    let data = null;
    try {
      const cleaned = jsonStr
        .replace(/,\s*([\}\]])/g, '$1')
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ');
      data = JSON.parse(cleaned);
    } catch (e1) {
      try {
        data = JSON.parse(jsonStr);
      } catch (e2) {
        console.warn('Using regex fallback to parse LLM response format');
        const hasErr = /"has_syntax_error"\s*:\s*true/i.test(jsonStr);
        const lineMatch = jsonStr.match(/"syntax_error_line"\s*:\s*(\d+)/i);
        const scoreMatch = jsonStr.match(/"logical_correctness"\s*:\s*(\d+)/i);
        const msgMatch = jsonStr.match(/"syntax_error_message"\s*:\s*"([^"]+)"/i);
        const timeMatch = jsonStr.match(/"time_complexity"\s*:\s*"([^"]+)"/i);
        const spaceMatch = jsonStr.match(/"space_complexity"\s*:\s*"([^"]+)"/i);
        const mistakesMatch = jsonStr.match(/"mistakes"\s*:\s*"([^"]+)"/i);
        const suggestionsMatch = jsonStr.match(/"suggestions"\s*:\s*"([^"]+)"/i);
        const summaryMatch = jsonStr.match(/"summary"\s*:\s*"([^"]+)"/i);
        const lineAnalysisMatch = jsonStr.match(/"line_analysis"\s*:\s*"([^"]+)"/i);

        data = {
          has_syntax_error: hasErr,
          syntax_error_line: lineMatch ? Number(lineMatch[1]) : null,
          syntax_error_message: msgMatch ? msgMatch[1] : (hasErr ? 'Syntax error detected' : ''),
          logical_correctness: scoreMatch ? Number(scoreMatch[1]) : 0,
          time_complexity: timeMatch ? timeMatch[1] : 'O(N)',
          space_complexity: spaceMatch ? spaceMatch[1] : 'O(1)',
          mistakes: mistakesMatch ? mistakesMatch[1] : (hasErr ? 'Syntax error in code' : 'Logic gaps detected'),
          suggestions: suggestionsMatch ? suggestionsMatch[1] : 'Check algorithm logic',
          summary: summaryMatch ? summaryMatch[1] : 'Review complete',
          line_analysis: lineAnalysisMatch ? lineAnalysisMatch[1] : 'Line analysis not available',
        };
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
          this.apiUrl,
          {
            model: this.model,
            messages: [
              {
                role: 'system',
                content: 'You are an expert code review engine. You analyze code line by line, check syntax, verify logic against the problem description, and score accuracy. You ALWAYS return valid JSON. You never skip lines. You never give generic answers — every analysis is specific to the exact code submitted.',
              },
              {
                role: 'user',
                content: this.buildReviewPrompt(problemDescription, code, language, actualOutput, expectedOutput),
              },
            ],
            temperature: 0.1,
            max_tokens: 2048,
          },
          {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'http://localhost:3000',
              'X-Title': 'CodeAD',
            },
            timeout: 60000,
          }
        );

        const content = response.data.choices[0].message.content;
        const result = this.parseResponse(content);
        this.setCachedReview(code, language, problemDescription, result);
        return result;
      } catch (err) {
        console.error(`OpenRouter API error (attempt ${attempt}/${maxRetries}):`, err.message);
        if (err.response) {
          console.error('API status:', err.response.status);
          console.error('API body:', JSON.stringify(err.response.data));
        }
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }
      }
    }
    return {
      has_syntax_error: false,
      syntax_error_line: null,
      syntax_error_message: '',
      logical_correctness: 0,
      ai_score: 0,
      time_complexity: 'N/A',
      space_complexity: 'N/A',
      line_analysis: 'N/A',
      mistakes: 'AI service unavailable',
      suggestions: 'Please try submitting again in a moment.',
      syntax_review: 'N/A',
      better_coding_practices: 'N/A',
      summary: 'AI service is currently unavailable.',
    };
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

      console.log(`[Compile] Running AI line-by-line review...`);
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

module.exports = new NemotronService();
