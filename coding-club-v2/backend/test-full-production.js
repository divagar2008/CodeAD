const axios = require('axios');
const BASE = 'http://localhost:5000/api';

async function testFullProduction() {
  console.log('=== FULL PRODUCTION INTEGRATION & SUITE VERIFICATION ===\n');
  let passCount = 0;
  let failCount = 0;

  function logPass(title, details = '') {
    passCount++;
    console.log(`✅ PASS: ${title} ${details ? '(' + details + ')' : ''}`);
  }

  function logFail(title, error) {
    failCount++;
    console.error(`❌ FAIL: ${title} -> ${error}`);
  }

  // 1. Health Check
  try {
    const res = await axios.get('http://localhost:5000/api/health');
    if (res.data.status === 'ok') logPass('1. System Health Check Endpoint');
    else logFail('1. System Health Check Endpoint', JSON.stringify(res.data));
  } catch (err) {
    logFail('1. System Health Check Endpoint', err.message);
  }

  // 2. Student Authentication
  let studentToken = null;
  try {
    const res = await axios.post(`${BASE}/auth/student/login`, {
      email: 'alice@college.edu',
      password: 'student123'
    });
    studentToken = res.data.data.token;
    logPass('2. Student Login (alice@college.edu)', `Token length: ${studentToken.length}`);
  } catch (err) {
    logFail('2. Student Login', err.response?.data?.message || err.message);
  }

  // 3. Admin Authentication
  let adminToken = null;
  try {
    const res = await axios.post(`${BASE}/auth/admin/login`, {
      email: 'admin@codingclub.com',
      password: 'admin123'
    });
    adminToken = res.data.data.token;
    logPass('3. Admin Login (admin@codingclub.com)', `Token length: ${adminToken.length}`);
  } catch (err) {
    logFail('3. Admin Login', err.response?.data?.message || err.message);
  }

  // 4. Invalid Login Validation
  try {
    await axios.post(`${BASE}/auth/student/login`, { email: 'alice@college.edu', password: 'wrongpassword' });
    logFail('4. Invalid Password Rejection', 'Expected 401/400 error but request succeeded');
  } catch (err) {
    if (err.response?.status === 400 || err.response?.status === 401) {
      logPass('4. Invalid Password Rejection', `Status ${err.response.status}`);
    } else {
      logFail('4. Invalid Password Rejection', err.message);
    }
  }

  // 5. Student Dashboard API
  try {
    const res = await axios.get(`${BASE}/student/dashboard`, { headers: { Authorization: `Bearer ${studentToken}` } });
    logPass('5. Student Dashboard API', `Student Name: ${res.data.data.student.name}`);
  } catch (err) {
    logFail('5. Student Dashboard API', err.response?.data?.message || err.message);
  }

  // 6. Student Problems List API (Progressive Lock System)
  let targetProblemId = null;
  try {
    const res = await axios.get(`${BASE}/student/problems`, { headers: { Authorization: `Bearer ${studentToken}` } });
    const problems = res.data.data.problems;
    targetProblemId = problems[0]?.id;
    logPass('6. Student Problems List API', `Found ${problems.length} problems`);
  } catch (err) {
    logFail('6. Student Problems List API', err.response?.data?.message || err.message);
  }

  // 7. Student Single Problem Detail API
  try {
    const res = await axios.get(`${BASE}/student/problems/${targetProblemId}`, { headers: { Authorization: `Bearer ${studentToken}` } });
    logPass('7. Student Problem Detail API', `Title: ${res.data.data.title}`);
  } catch (err) {
    logFail('7. Student Problem Detail API', err.response?.data?.message || err.message);
  }

  // 8. Student Code Submission & AI Review API
  try {
    const code = 'def solution():\n    return 42';
    const res = await axios.post(`${BASE}/student/submit`, {
      problem_id: targetProblemId,
      code,
      language: 'python'
    }, { headers: { Authorization: `Bearer ${studentToken}` } });
    logPass('8. Student Code Submission & AI Review', `AI Score: ${res.data.data.review.ai_score}%`);
  } catch (err) {
    logFail('8. Student Code Submission & AI Review', err.response?.data?.message || err.message);
  }

  // 9. Student Leaderboard API
  try {
    const res = await axios.get(`${BASE}/student/leaderboard`, { headers: { Authorization: `Bearer ${studentToken}` } });
    logPass('9. Student Leaderboard API', `Total Entries: ${res.data.data.length}`);
  } catch (err) {
    logFail('9. Student Leaderboard API', err.response?.data?.message || err.message);
  }

  // 10. Student Live Points API
  try {
    const res = await axios.get(`${BASE}/student/live-points`, { headers: { Authorization: `Bearer ${studentToken}` } });
    logPass('10. Student Live Points API', `Points Record: ${res.data.data ? 'Found' : '0'}`);
  } catch (err) {
    logFail('10. Student Live Points API', err.response?.data?.message || err.message);
  }

  // 11. Student Profile API (GET & PUT)
  try {
    const getRes = await axios.get(`${BASE}/student/profile`, { headers: { Authorization: `Bearer ${studentToken}` } });
    const putRes = await axios.put(`${BASE}/student/profile`, { bio: 'Passionate developer & student' }, { headers: { Authorization: `Bearer ${studentToken}` } });
    logPass('11. Student Profile GET & PUT API', `Bio updated: ${putRes.data.data.bio}`);
  } catch (err) {
    logFail('11. Student Profile API', err.response?.data?.message || err.message);
  }

  // 12. Admin Reports API
  try {
    const res = await axios.get(`${BASE}/admin/reports`, { headers: { Authorization: `Bearer ${adminToken}` } });
    logPass('12. Admin Reports Overview API', `Total Students: ${res.data.data.totalStudents}, Total Problems: ${res.data.data.totalProblems}`);
  } catch (err) {
    logFail('12. Admin Reports API', err.response?.data?.message || err.message);
  }

  // 13. Admin Students Management API (GET & POST & DELETE)
  let createdStudentId = null;
  try {
    const testEmail = `test_${Date.now()}@college.edu`;
    const createRes = await axios.post(`${BASE}/admin/students`, {
      name: 'Test Student Production',
      email: testEmail,
      password: 'password123',
      department: 'Computer Science',
      year: '1st'
    }, { headers: { Authorization: `Bearer ${adminToken}` } });
    createdStudentId = createRes.data.data.id;

    await axios.delete(`${BASE}/admin/students/${createdStudentId}`, { headers: { Authorization: `Bearer ${adminToken}` } });
    logPass('13. Admin Student Create & Delete API', `Created & Deleted Student ID #${createdStudentId}`);
  } catch (err) {
    logFail('13. Admin Student Management API', err.response?.data?.message || err.message);
  }

  // 14. Admin Problems CRUD API (POST & PUT & DELETE)
  let createdProblemId = null;
  try {
    const createRes = await axios.post(`${BASE}/admin/problems`, {
      title: 'Production Validation Problem',
      description: 'Given number x, return x * 2',
      difficulty: 'easy',
      examples: { input: '2', output: '4' }
    }, { headers: { Authorization: `Bearer ${adminToken}` } });
    createdProblemId = createRes.data.data.id;

    await axios.put(`${BASE}/admin/problems/${createdProblemId}`, {
      title: 'Production Validation Problem (Updated)',
      description: 'Given number x, return x * 2 updated'
    }, { headers: { Authorization: `Bearer ${adminToken}` } });

    await axios.delete(`${BASE}/admin/problems/${createdProblemId}`, { headers: { Authorization: `Bearer ${adminToken}` } });
    logPass('14. Admin Problems CRUD API', `Created, Updated & Deleted Problem ID #${createdProblemId}`);
  } catch (err) {
    logFail('14. Admin Problems CRUD API', err.response?.data?.message || err.message);
  }

  // 15. Admin Sessions Management API (POST & DELETE)
  let createdSessionId = null;
  try {
    const createRes = await axios.post(`${BASE}/admin/sessions`, {
      name: 'Production Session Test',
      date: new Date().toISOString(),
      description: 'Session for production test'
    }, { headers: { Authorization: `Bearer ${adminToken}` } });
    createdSessionId = createRes.data.data.id;

    await axios.delete(`${BASE}/admin/sessions/${createdSessionId}`, { headers: { Authorization: `Bearer ${adminToken}` } });
    logPass('15. Admin Sessions CRUD API', `Created & Deleted Session ID #${createdSessionId}`);
  } catch (err) {
    logFail('15. Admin Sessions CRUD API', err.response?.data?.message || err.message);
  }

  console.log('\n==========================================');
  console.log(`TOTAL TESTED: ${passCount + failCount}`);
  console.log(`PASSED: ${passCount}`);
  console.log(`FAILED: ${failCount}`);
  console.log('==========================================');

  if (failCount > 0) {
    process.exit(1);
  }
}

testFullProduction();
