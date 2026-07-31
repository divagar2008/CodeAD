const axios = require('axios');
const config = require('./src/config');

async function test() {
  const codeWithSyntaxError = `def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen
            return [seen[complement], i]
        seen[num] = i
    return []`;

  console.log('Testing code WITH syntax error...');
  const start = Date.now();
  try {
    const res = await axios.post(config.nemotron.apiUrl, {
      model: config.nemotron.model,
      messages: [
        { role: 'system', content: 'You are a strict code reviewer. Always respond with valid JSON only.' },
        { role: 'user', content: `Review this code for a problem: "Given an array of integers nums and an integer target, return indices of two numbers that add up to target."

\`\`\`python
${codeWithSyntaxError}
\`\`\`

Check for SYNTAX errors first. Then check logic.

Respond with ONLY this JSON:
{
  "has_syntax_error": true,
  "syntax_error_line": <line number or null>,
  "syntax_error_message": "<error>",
  "logical_correctness": <0-100>,
  "time_complexity": "<complexity>",
  "space_complexity": "<complexity>",
  "mistakes": "<list>",
  "suggestions": "<fixes>",
  "summary": "<verdict>"
}` }
      ],
      temperature: 0.2,
      max_tokens: 1024,
    }, {
      headers: {
        Authorization: 'Bearer ' + config.nemotron.apiKey,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Coding Club',
      },
      timeout: 60000,
    });
    console.log('Time:', Date.now() - start + 'ms');
    console.log('Status:', res.status);
    console.log('Full response:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error('Time:', Date.now() - start + 'ms');
    console.error('Error:', err.message);
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', JSON.stringify(err.response.data));
    }
  }
}

test();
