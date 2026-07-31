const axios = require('axios');
const config = require('./src/config');

const models = [
  'nvidia/nemotron-3-nano-30b-a3b:free',
  'cohere/north-mini-code:free',
  'nvidia/nemotron-nano-9b-v2:free',
  'openrouter/free',
  'nvidia/nemotron-3-ultra-550b-a55b:free'
];

async function testModel(model) {
  const code = 'def two_sum(nums, target):\n    seen = {}\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in seen\n            return [seen[complement], i]\n        seen[num] = i\n    return []';

  console.log(`\nTesting speed of: ${model}...`);
  const start = Date.now();
  try {
    const res = await axios.post(config.nemotron.apiUrl, {
      model: model,
      messages: [
        { role: 'system', content: 'Respond with JSON only.' },
        { role: 'user', content: 'Check this Python code for syntax errors. Return JSON: {"has_syntax_error":bool,"syntax_error_line":int|null,"syntax_error_message":str,"logical_correctness":0-100,"summary":str}\n\nCode:\n' + code }
      ],
      temperature: 0.1,
      max_tokens: 250,
    }, {
      headers: { Authorization: 'Bearer ' + config.nemotron.apiKey, 'Content-Type': 'application/json', 'HTTP-Referer': 'http://localhost:3000', 'X-Title': 'Coding Club' },
      timeout: 30000,
    });
    const elapsed = Date.now() - start;
    console.log(`⚡ SUCCESS [${model}] -> Time: ${elapsed}ms (${(elapsed/1000).toFixed(2)} seconds)`);
    console.log('Sample output:', res.data.choices[0].message.content.slice(0, 90).replace(/\n/g, ' '));
    return { model, elapsed, success: true };
  } catch (e) {
    console.log(`❌ FAIL [${model}]: ${e.response?.data?.error?.message || e.message}`);
    return { model, elapsed: Date.now() - start, success: false };
  }
}

async function runBenchmark() {
  console.log('=== REAL-TIME OPENROUTER FREE MODEL LATENCY BENCHMARK ===');
  for (const m of models) {
    await testModel(m);
  }
}

runBenchmark();
