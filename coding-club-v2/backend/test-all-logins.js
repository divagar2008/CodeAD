const axios = require('axios');
const BASE = 'http://localhost:5000/api';

const students = [
  { name: 'Athief Khan', email: 'athief@college.edu' },
  { name: 'Divagar', email: 'divagar@college.edu' },
  { name: 'Dharshan Bala', email: 'dharshan@college.edu' },
  { name: 'Jeyavarshan', email: 'jeyavarshan@college.edu' },
  { name: 'Deepan', email: 'deepan@college.edu' },
  { name: 'Vetriselvam', email: 'vetriselvam@college.edu' },
  { name: 'Heman', email: 'heman@college.edu' },
  { name: 'Gopal Karthick', email: 'gopalkarthick@college.edu' },
  { name: 'Kanish Kumar', email: 'kanish@college.edu' },
  { name: 'Devadharshan', email: 'devadharshan@college.edu' },
  { name: 'Sankara Narayanan', email: 'sankara@college.edu' },
  { name: 'Srinivash', email: 'srinivash@college.edu' },
  { name: 'Sriram', email: 'sriram@college.edu' },
];

async function testAllLogins() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║           STUDENT LOGIN VERIFICATION TEST                   ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // Check server health first
  try {
    const health = await axios.get(`${BASE}/health`);
    console.log('✅ Server is running!\n');
  } catch (err) {
    console.error('❌ Server is not running! Please start the backend server first.');
    process.exit(1);
  }

  let passCount = 0;
  let failCount = 0;
  const results = [];

  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    const startTime = Date.now();
    
    try {
      const res = await axios.post(`${BASE}/auth/student/login`, {
        email: student.email,
        password: 'student123'
      });
      
      const elapsed = Date.now() - startTime;
      const token = res.data.data.token;
      
      // Also fetch dashboard to verify full auth flow
      const dashboard = await axios.get(`${BASE}/student/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const studentData = dashboard.data.data.student;
      
      passCount++;
      results.push({ index: i + 1, name: student.name, status: '✅ PASS', time: `${elapsed}ms` });
      console.log(`  ${i + 1}. ✅ ${student.name.padEnd(22)} | ${student.email.padEnd(30)} | ${elapsed}ms | Token: ${token.substring(0, 20)}...`);
    } catch (err) {
      const elapsed = Date.now() - startTime;
      failCount++;
      const errorMsg = err.response?.data?.message || err.message;
      results.push({ index: i + 1, name: student.name, status: '❌ FAIL', error: errorMsg });
      console.log(`  ${i + 1}. ❌ ${student.name.padEnd(22)} | ${student.email.padEnd(30)} | ERROR: ${errorMsg}`);
    }
  }

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                       TEST SUMMARY                          ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║  Total Students:  ${students.length}`);
  console.log(`║  Passed:          ${passCount} ✅`);
  console.log(`║  Failed:          ${failCount} ❌`);
  console.log(`║  Success Rate:    ${((passCount / students.length) * 100).toFixed(1)}%`);
  console.log('╚══════════════════════════════════════════════════════════════╝');

  if (failCount === 0) {
    console.log('\n🎉 All 13 students can successfully log in with password "student123"!\n');
  } else {
    console.log(`\n⚠️  ${failCount} student(s) failed to login. Check the errors above.\n`);
  }

  process.exit(failCount > 0 ? 1 : 0);
}

testAllLogins();
