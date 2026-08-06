const axios = require('axios');
const config = require('../config');
const crypto = require('crypto');

class NemotronService {
  constructor() {
    this.apiKey = config.nemotron.apiKey;
    this.apiUrl = config.nemotron.apiUrl;
    this.model = config.nemotron.model;
    this.cache = new Map(); // Simple in-memory cache
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes
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
    // Limit cache size
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  buildPrompt(problemDesc, code, language) {
    return `Check this ${language} code for a coding problem. Return ONLY valid JSON, no markdown, no extra text.

PROBLEM: ${problemDesc}

CODE:
\`\`\`${language}
${code}
\`\`\`

Analyze:
1. SYNTAX: missing colons, brackets, semicolons, indentation, unmatched braces
2. LOGIC: correct algorithm, edge cases, loop bounds, conditions

IMPORTANT SCORING RULES:
- Do NOT penalize for using input()/print() vs writing a function. The platform provides input automatically — using input()/print() is perfectly acceptable and equivalent to a function.
- Do NOT penalize for using print() to return the result. That is the expected output format.
- ONLY judge whether the core logic/algorithm correctly solves the problem.
- If the logic correctly solves the problem, score 95-100.

If syntax error found: set has_syntax_error true, give exact line number (count from 1).
If no syntax error: set has_syntax_error false, line null, message empty, then score logic 0-100.

RULES:
- Syntax error = score 0, code cannot run
- 90-100: correct logic | 70-89: minor edge case gap | 50-69: partial logic | 30-49: mostly wrong | 0-29: broken

JSON format:
{"has_syntax_error":bool,"syntax_error_line":int|null,"syntax_error_message":str,"logical_correctness":int,"time_complexity":str,"space_complexity":str,"mistakes":str,"suggestions":str,"summary":str}`;
  }

  parseResponse(content) {
    let raw = content || '';
    // Strip markdown code block fences if present
    raw = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

    const match = raw.match(/\{[\s\S]*\}/);
    let jsonStr = match ? match[0] : raw;

    let data = null;
    try {
      // Clean trailing commas before closing braces/brackets and control characters
      const cleaned = jsonStr
        .replace(/,\s*([\}\]])/g, '$1')
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ');
      data = JSON.parse(cleaned);
    } catch (e1) {
      try {
        data = JSON.parse(jsonStr);
      } catch (e2) {
        // Fallback regex extractor for LLM response format
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
      mistakes: hasSyntaxError ? `Syntax error on line ${syntaxErrorLine}: ${syntaxErrorMessage}` : (data.mistakes || 'No mistakes recorded'),
      suggestions: hasSyntaxError ? `Fix the syntax error on line ${syntaxErrorLine}` : (data.suggestions || 'No suggestions recorded'),
      syntax_review: hasSyntaxError ? `Error on line ${syntaxErrorLine}: ${syntaxErrorMessage}` : 'No syntax errors',
      better_coding_practices: 'Logic evaluation completed',
      summary: hasSyntaxError ? `Syntax error on line ${syntaxErrorLine} — code cannot run` : (data.summary || 'Code evaluated'),
    };
  }

  async reviewCode(problemDescription, code, language) {
    // Check cache first
    const cached = this.getCachedReview(code, language, problemDescription);
    if (cached) {
      console.log('Using cached AI review result');
      return cached;
    }

    const maxRetries = 1; // Reduced from 2 to 1 for faster failure
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await axios.post(
          this.apiUrl,
          {
            model: this.model,
            messages: [
              {
                role: 'system',
                content: 'You are a code reviewer. Check syntax then logic. Return ONLY valid JSON, no markdown fences, no explanation text.',
              },
              {
                role: 'user',
                content: this.buildPrompt(problemDescription, code, language),
              },
            ],
            temperature: 0.2,
            max_tokens: 1024, // Reduced from 2048 for faster response
          },
          {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'http://localhost:3000',
              'X-Title': 'CodeAD',
            },
            timeout: 30000, // Reduced from 120000 (120s) to 30000 (30s)
          }
        );

        const content = response.data.choices[0].message.content;
        const result = this.parseResponse(content);
        // Cache the result
        this.setCachedReview(code, language, problemDescription, result);
        return result;
      } catch (err) {
        console.error(`OpenRouter API error (attempt ${attempt}/${maxRetries}):`, err.message);
        if (err.response) {
          console.error('API status:', err.response.status);
          console.error('API body:', JSON.stringify(err.response.data));
        }
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 1000)); // Reduced from 3000 to 1000
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
      mistakes: `Syntax error on line ${line}: ${message}`,
      suggestions: `Fix the syntax error on line ${line}`,
      syntax_review: `Error on line ${line}: ${message}`,
      summary: `Syntax error on line ${line} — code cannot run`,
    };
  }

  async compileCode(problemDescription, code, language, exampleInput = '') {
    const { executeJS, executePython } = require('../shared/utils/codeExecutor');
    const startTime = Date.now();
    
    console.log(`[Compile] Starting compilation for ${language} code...`);
    
    // Run local execution first (fast - milliseconds)
    let localExec = null;
    if (language === 'javascript') {
      localExec = executeJS(code, exampleInput);
    } else if (language === 'python') {
      localExec = await executePython(code, exampleInput);
    }
    
    const localTime = Date.now() - startTime;
    console.log(`[Compile] Local execution completed in ${localTime}ms`);

    // Short-circuit: if local execution found syntax error, skip AI review (saves 5-30 seconds)
    const localSyntaxError = localExec && localExec.executed && localExec.has_syntax_error;
    
    let review;
    if (localSyntaxError) {
      console.log(`[Compile] Syntax error detected locally, skipping AI review`);
      // Skip AI review for syntax errors - return immediate response
      review = this.createSyntaxErrorReview(localExec.syntax_error_line, localExec.syntax_error_message);
    } else {
      // No syntax error - run AI review
      console.log(`[Compile] No syntax error, running AI review...`);
      review = await this.reviewCode(problemDescription, code, language);
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
      outputLog = `=================== PROGRAM STDOUT / OUTPUT ===================\n${programOutput}\n===============================================================\n\n[Compilation Details]\n- Language: ${language}\n- Time Complexity: ${review.time_complexity}\n- Space Complexity: ${review.space_complexity}\n- Status: Ready for submission`;
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
