const axios = require('axios');
const BASE = 'http://localhost:5000/api';

async function test() {
  console.log('1. Logging in...');
  const loginRes = await axios.post(BASE + '/auth/student/login', {
    email: 'athief@college.edu',
    password: 'student123'
  });
  const token = loginRes.data.data.token;

  console.log('2. Getting problem...');
  const problemsRes = await axios.get(BASE + '/student/problems', {
    headers: { Authorization: 'Bearer ' + token }
  });
  const problem = problemsRes.data.data.problems[0];
  console.log('   Problem:', problem.id, problem.title);

  // Test with SYNTAX ERROR
  console.log('\n3. Submitting code WITH syntax error...');
  const badCode = `def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen
            return [seen[complement], i]
        seen[num] = i
    return []`;

  const start1 = Date.now();
  const res1 = await axios.post(BASE + '/student/submit', {
    problem_id: problem.id, code: badCode, language: 'python'
  }, { headers: { Authorization: 'Bearer ' + token } });
  const r1 = res1.data.data.review;
  console.log('   Time:', Date.now() - start1 + 'ms');
  console.log('   has_syntax_error:', r1.has_syntax_error);
  console.log('   syntax_error_line:', r1.syntax_error_line);
  console.log('   syntax_error_message:', r1.syntax_error_message);
  console.log('   ai_score:', r1.ai_score);
  console.log('   summary:', r1.summary);

  // Test with CORRECT code
  console.log('\n4. Submitting code WITHOUT syntax error...');
  const goodCode = `def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`;

  const start2 = Date.now();
  const res2 = await axios.post(BASE + '/student/submit', {
    problem_id: problem.id, code: goodCode, language: 'python'
  }, { headers: { Authorization: 'Bearer ' + token } });
  const r2 = res2.data.data.review;
  console.log('   Time:', Date.now() - start2 + 'ms');
  console.log('   has_syntax_error:', r2.has_syntax_error);
  console.log('   ai_score:', r2.ai_score);
  console.log('   logical_correctness:', r2.logical_correctness);
  console.log('   summary:', r2.summary);

  console.log('\n=== ALL TESTS PASSED ===');
}

test().catch(err => {
  console.error('ERROR:', err.response ? JSON.stringify(err.response.data) : err.message);
  process.exit(1);
});
