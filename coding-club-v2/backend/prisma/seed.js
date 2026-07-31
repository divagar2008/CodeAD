const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding...\n');

  const adminPass = await bcrypt.hash('admin123', 12);
  const studentPass = await bcrypt.hash('student123', 12);

  await prisma.admins.upsert({ where: { email: 'admin@codingclub.com' }, update: {},
    create: { name: 'Admin', email: 'admin@codingclub.com', password: adminPass } });

  const students = [
    { name: 'Alice Johnson', email: 'alice@college.edu', department: 'Computer Science', year: '3rd' },
    { name: 'Bob Smith', email: 'bob@college.edu', department: 'IT', year: '2nd' },
    { name: 'Charlie Brown', email: 'charlie@college.edu', department: 'Computer Science', year: '4th' },
    { name: 'Diana Prince', email: 'diana@college.edu', department: 'Electronics', year: '3rd' },
    { name: 'Eve Wilson', email: 'eve@college.edu', department: 'Computer Science', year: '2nd' },
  ];

  for (const s of students) {
    const student = await prisma.students.upsert({ where: { email: s.email }, update: {},
      create: { ...s, password: studentPass } });
    await prisma.leaderboard.upsert({ where: { student_id: student.id }, update: {},
      create: { student_id: student.id } });
    await prisma.user_profiles.upsert({ where: { student_id: student.id }, update: {},
      create: { student_id: student.id } });
  }

  const problems = [
    { title: 'Two Sum', description: 'Given an array of integers nums and an integer target, return indices of the two numbers that add up to target.', difficulty: 'easy', constraints: '2 <= nums.length <= 10^4', examples: { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]' } },
    { title: 'Reverse String', description: 'Write a function that reverses a string given as a character array.', difficulty: 'easy', examples: { input: 'hello', output: 'olleh' } },
    { title: 'Longest Substring', description: 'Find the length of the longest substring without repeating characters.', difficulty: 'medium', examples: { input: 'abcabcbb', output: '3' } },
    { title: 'Merge Sorted Arrays', description: 'Merge two sorted arrays into one sorted array in-place.', difficulty: 'medium', examples: { input: '[1,2,3,0,0,0], [2,5,6]', output: '[1,2,2,3,5,6]' } },
    { title: 'Trapping Rain Water', description: 'Compute how much water can be trapped after raining given elevation map.', difficulty: 'hard', examples: { input: '[0,1,0,2,1,0,1,3,2,1,2,1]', output: '6' } },
    { title: 'Binary Tree Max Path', description: 'Find the maximum path sum in a non-empty binary tree.', difficulty: 'hard', examples: { input: '[1,2,3]', output: '6' } },
  ];

  for (const p of problems) {
    await prisma.problems.create({ data: p });
  }

  await prisma.live_sessions.create({ data: { name: 'Weekly Challenge #1', date: new Date('2026-08-05T18:00:00Z'), description: 'First session', is_published: true } });

  console.log('Done! Admin: admin@codingclub.com / admin123');
  console.log('Student: alice@college.edu / student123\n');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
