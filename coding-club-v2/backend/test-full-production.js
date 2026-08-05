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
      email: 'athief@college.edu',
      password: 'student123'
    });
    studentToken = res.data.data.token;
    logPass('2. Student Login (athief@college.edu)', `Token length: ${studentToken.length}`);
  } catch (err) {
    logFail('2. Student Login', err.response?.data?.message || err.message);
  }

  // 3. Admin Authentication
  // NOTE: Admins are students with role='admin' in the DB and log in via the
  // same /auth/student/login endpoint (no separate /auth/admin/login route exists).
  let adminToken = null;
  try {
    const res = await axios.post(`${BASE}/auth/student/login`, {
      email: 'divagar@college.edu',
      password: 'student123'
    });
    if (res.data.data.user.role !== 'admin') {
      throw new Error(`Expected seeded admin role, got: ${res.data.data.user.role}`);
    }
    adminToken = res.data.data.token;
    logPass('3. Admin Login (divagar@college.edu)', `Token length: ${adminToken.length}, Role: ${res.data.data.user.role}`);
  } catch (err) {
    logFail('3. Admin Login', err.response?.data?.message || err.message);
  }

  // 4. Invalid Login Validation
  try {
    await axios.post(`${BASE}/auth/student/login`, { email: 'athief@college.edu', password: 'wrongpassword' });
    logFail('4. Invalid Password Rejection', 'Expected 401/400 error but request succeeded');
  } catch (err) {
    if (err.response?.status === 400 || err.response?.status === 401) {
      logPass('4. Invalid Password Rejection', `Status ${err.response.status}`);
    } else {
      logFail('4. Invalid Password Rejection', err.message);
    }
  }

  // 5. Create a fresh throwaway student (via admin API) and login as them.
  // Tests 5-11 run against this account so the suite is fully re-runnable:
  // a fresh student always has unsubmitted unlocked problems to work with.
  let freshStudentId = null;
  let freshStudentToken = null;
  try {
    const freshStudentEmail = `suite_${Date.now()}@college.edu`;
    const createRes = await axios.post(`${BASE}/admin/students`, {
      name: 'Suite Test Student',
      email: freshStudentEmail,
      password: 'password123',
      department: 'Artificial Intelligence',
      year: '2nd'
    }, { headers: { Authorization: `Bearer ${adminToken}` } });
    freshStudentId = createRes.data.data.id;
    const loginRes = await axios.post(`${BASE}/auth/student/login`, {
      email: freshStudentEmail,
      password: 'password123'
    });
    freshStudentToken = loginRes.data.data.token;
    logPass('5. Fresh Test Student Creation & Login', `ID #${freshStudentId}`);
  } catch (err) {
    logFail('5. Fresh Test Student Creation & Login', err.response?.data?.message || err.message);
  }

  // 5b. Student Dashboard API (fresh student)
  try {
    const res = await axios.get(`${BASE}/student/dashboard`, { headers: { Authorization: `Bearer ${freshStudentToken}` } });
    logPass('5b. Student Dashboard API', `Student Name: ${res.data.data.student.name}`);
  } catch (err) {
    logFail('5b. Student Dashboard API', err.response?.data?.message || err.message);
  }

  // 6. Student Problems List API (Progressive Lock System)
  // Pick the first problem the student is allowed to open AND hasn't already
  // submitted (the API enforces one submission per problem), so the suite is
  // safe to re-run against the same database.
  let targetProblemId = null;
  try {
    const res = await axios.get(`${BASE}/student/problems`, { headers: { Authorization: `Bearer ${freshStudentToken}` } });
    const problems = res.data.data.problems;
    const unlocked = res.data.data.unlocked;
    const solvedIds = new Set(res.data.data.solvedProblemIds || []);
    const openProblem = problems.find(p => unlocked[p.difficulty] && !solvedIds.has(p.id));
    targetProblemId = openProblem?.id;
    if (!targetProblemId) throw new Error('No unsubmitted unlocked problem available for the fresh student');
    logPass('6. Student Problems List API', `Found ${problems.length} problems, unlocked: ${JSON.stringify(unlocked)}`);
  } catch (err) {
    logFail('6. Student Problems List API', err.response?.data?.message || err.message);
  }

  // 7. Student Single Problem Detail API
  try {
    const res = await axios.get(`${BASE}/student/problems/${targetProblemId}`, { headers: { Authorization: `Bearer ${freshStudentToken}` } });
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
    }, { headers: { Authorization: `Bearer ${freshStudentToken}` } });
    logPass('8. Student Code Submission & AI Review', `AI Score: ${res.data.data.review.ai_score}%`);
  } catch (err) {
    logFail('8. Student Code Submission & AI Review', err.response?.data?.message || err.message);
  }

  // 9. Student Leaderboard API
  try {
    const res = await axios.get(`${BASE}/student/leaderboard`, { headers: { Authorization: `Bearer ${freshStudentToken}` } });
    logPass('9. Student Leaderboard API', `Total Entries: ${res.data.data.length}`);
  } catch (err) {
    logFail('9. Student Leaderboard API', err.response?.data?.message || err.message);
  }

  // 10. Student Live Points API
  try {
    const res = await axios.get(`${BASE}/student/live-points`, { headers: { Authorization: `Bearer ${freshStudentToken}` } });
    logPass('10. Student Live Points API', `Points Record: ${res.data.data ? 'Found' : '0'}`);
  } catch (err) {
    logFail('10. Student Live Points API', err.response?.data?.message || err.message);
  }

  // 11. Student Profile API (GET & PUT)
  // NOTE: updateProfile only supports name/department/year (bio lives in user_profiles and has no update endpoint).
  try {
    await axios.get(`${BASE}/student/profile`, { headers: { Authorization: `Bearer ${freshStudentToken}` } });
    const putRes = await axios.put(`${BASE}/student/profile`, { year: '3rd' }, { headers: { Authorization: `Bearer ${freshStudentToken}` } });
    if (putRes.data.data.year !== '3rd') throw new Error('Year was not updated');
    logPass('11. Student Profile GET & PUT API', `Year updated: ${putRes.data.data.year}`);
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

  // 16. Cleanup — remove the throwaway student created in test 5
  if (freshStudentId) {
    try {
      await axios.delete(`${BASE}/admin/students/${freshStudentId}`, { headers: { Authorization: `Bearer ${adminToken}` } });
      logPass('16. Cleanup Fresh Test Student', `Deleted ID #${freshStudentId}`);
    } catch (err) {
      logFail('16. Cleanup Fresh Test Student', err.response?.data?.message || err.message);
    }
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
