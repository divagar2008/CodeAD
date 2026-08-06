const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding...\n');

  // Check if data already exists (skip if DB is populated)
  const existingStudents = await prisma.students.count();
  if (existingStudents > 0) {
    console.log(`Database already has ${existingStudents} students. Skipping seed.`);
    console.log('');
    return;
  }

  console.log('Database is empty. Seeding initial data...');
  const studentPass = await bcrypt.hash('student123', 12);

  // Students — Artificial Intelligence, 2nd Year
  const students = [
    { name: 'Athief Khan', email: 'athief@college.edu', department: 'Artificial Intelligence', year: '2nd', role: 'student' },
    { name: 'Divagar', email: 'divagar@college.edu', department: 'Artificial Intelligence', year: '2nd', role: 'admin' },
    { name: 'Dharshan Bala', email: 'dharshan@college.edu', department: 'Artificial Intelligence', year: '2nd', role: 'admin' },
    { name: 'Jeyavarshan', email: 'jeyavarshan@college.edu', department: 'Artificial Intelligence', year: '2nd', role: 'student' },
    { name: 'Deepan', email: 'deepan@college.edu', department: 'Artificial Intelligence', year: '2nd', role: 'student' },
    { name: 'Vetriselvam', email: 'vetriselvam@college.edu', department: 'Artificial Intelligence', year: '2nd', role: 'student' },
    { name: 'Heman', email: 'heman@college.edu', department: 'Artificial Intelligence', year: '2nd', role: 'student' },
    { name: 'Gopal Karthick', email: 'gopalkarthick@college.edu', department: 'Artificial Intelligence', year: '2nd', role: 'student' },
    { name: 'Kanish Kumar', email: 'kanish@college.edu', department: 'Artificial Intelligence', year: '2nd', role: 'student' },
    { name: 'Devadharshan', email: 'devadharshan@college.edu', department: 'Artificial Intelligence', year: '2nd', role: 'student' },
    { name: 'Sankara Narayanan', email: 'sankara@college.edu', department: 'Artificial Intelligence', year: '2nd', role: 'student' },
    { name: 'Srinivash', email: 'srinivash@college.edu', department: 'Artificial Intelligence', year: '2nd', role: 'student' },
    { name: 'Sriram', email: 'sriram@college.edu', department: 'Artificial Intelligence', year: '2nd', role: 'student' },
  ];

  for (const s of students) {
    const student = await prisma.students.create({
      data: { ...s, password: studentPass }
    });
    await prisma.leaderboard.create({
      data: { student_id: student.id, coding_score: 0, live_session_pts: 0, total_score: 0 }
    });
    await prisma.user_profiles.create({
      data: { student_id: student.id }
    });
  }
  console.log(`Created ${students.length} students`);

  // Problems
  const problems = [
    { title: 'Two Sum', description: 'Given an array of integers nums and an integer target, return indices of the two numbers that add up to target.', difficulty: 'easy', constraints: '2 <= nums.length <= 10^4', examples: { input: '2 7 11 15 9', output: '[0,1]' } },
    { title: 'Reverse String', description: 'Write a function that reverses a string given as a character array.', difficulty: 'easy', examples: { input: 'hello', output: 'olleh' } },
    { title: 'Longest Substring', description: 'Find the length of the longest substring without repeating characters.', difficulty: 'medium', examples: { input: 'abcabcbb', output: '3' } },
    { title: 'Merge Sorted Arrays', description: 'Merge two sorted arrays into one sorted array in-place.', difficulty: 'medium', examples: { input: '[1,2,3,0,0,0] [2,5,6]', output: '[1,2,2,3,5,6]' } },
    { title: 'Trapping Rain Water', description: 'Compute how much water can be trapped after raining given elevation map.', difficulty: 'hard', examples: { input: '[0,1,0,2,1,0,1,3,2,1,2,1]', output: '6' } },
    { title: 'Binary Tree Max Path', description: 'Find the maximum path sum in a non-empty binary tree.', difficulty: 'hard', examples: { input: '[1,2,3]', output: '6' } },
  ];

  for (const p of problems) {
    await prisma.problems.create({ data: p });
  }
  console.log(`Created ${problems.length} problems`);

  // Live session
  await prisma.live_sessions.create({
    data: {
      name: 'Weekly Challenge #1',
      date: new Date(),
      description: 'Live coding session — points awarded by admin during the session',
      is_published: true,
    }
  });
  console.log('Created 1 live session');

  // Achievements
  const achievements = [
    { name: 'first_blood', title: 'First Blood', description: 'Solve your first problem', icon: '🎯', category: 'milestone', tier: 'bronze', points: 10 },
    { name: 'five_solves', title: 'Getting Started', description: 'Solve 5 problems', icon: '🔥', category: 'milestone', tier: 'bronze', points: 25 },
    { name: 'ten_solves', title: 'Problem Solver', description: 'Solve 10 problems', icon: '⚡', category: 'milestone', tier: 'silver', points: 50 },
    { name: 'twentyfive_solves', title: 'Code Warrior', description: 'Solve 25 problems', icon: '⚔️', category: 'milestone', tier: 'gold', points: 100 },
    { name: 'fifty_solves', title: 'Code Master', description: 'Solve 50 problems', icon: '🏆', category: 'milestone', tier: 'platinum', points: 200 },
    { name: 'perfect_score', title: 'Perfect Score', description: 'Get a 100% AI score on any submission', icon: '💯', category: 'score', tier: 'gold', points: 50 },
    { name: 'high_roller', title: 'High Roller', description: 'Score 90+ on 5 submissions', icon: '🌟', category: 'score', tier: 'silver', points: 75 },
    { name: 'multi_lang', title: 'Polyglot', description: 'Use 3 different programming languages', icon: '🌐', category: 'diversity', tier: 'silver', points: 40 },
    { name: 'streak_3', title: 'On Fire', description: 'Maintain a 3-day coding streak', icon: '🔥', category: 'streak', tier: 'bronze', points: 20 },
    { name: 'streak_7', title: 'Week Warrior', description: 'Maintain a 7-day coding streak', icon: '⚡', category: 'streak', tier: 'silver', points: 50 },
    { name: 'streak_30', title: 'Monthly Machine', description: 'Maintain a 30-day coding streak', icon: '💎', category: 'streak', tier: 'platinum', points: 150 },
    { name: 'top_10', title: 'Top 10', description: 'Reach the top 10 on the leaderboard', icon: '🏅', category: 'leaderboard', tier: 'gold', points: 100 },
    { name: 'top_3', title: 'Podium Finish', description: 'Reach the top 3 on the leaderboard', icon: '🥇', category: 'leaderboard', tier: 'platinum', points: 200 },
    { name: 'rank_1', title: 'Champion', description: 'Reach #1 on the leaderboard', icon: '👑', category: 'leaderboard', tier: 'diamond', points: 500 },
    { name: 'hundred_points', title: 'Century Club', description: 'Earn 100 total points', icon: '💯', category: 'points', tier: 'silver', points: 50 },
    { name: 'five_hundred_points', title: 'Point Master', description: 'Earn 500 total points', icon: '⭐', category: 'points', tier: 'gold', points: 100 },
    { name: 'thousand_points', title: 'Point Legend', description: 'Earn 1000 total points', icon: '🌟', category: 'points', tier: 'diamond', points: 300 },
    { name: 'hard_solver', title: 'Hard Hitter', description: 'Solve a hard difficulty problem', icon: '💪', category: 'difficulty', tier: 'gold', points: 75 },
    { name: 'all_easy', title: 'Easy Rider', description: 'Solve all easy problems', icon: '✅', category: 'difficulty', tier: 'silver', points: 60 },
    { name: 'mentor', title: 'Mentor', description: 'Reach the top 5 on the leaderboard', icon: '🎓', category: 'special', tier: 'platinum', points: 150 },
  ];

  for (const a of achievements) {
    await prisma.achievements.create({ data: a });
  }
  console.log(`Created ${achievements.length} achievements`);

  console.log('\nDone! Initial data seeded.\n');
  console.log('Admin accounts (password: student123):');
  students.filter(s => s.role === 'admin').forEach(s => console.log(`  - ${s.name} <${s.email}>`));
  console.log('\nStudent accounts (password: student123):');
  students.filter(s => s.role === 'student').forEach(s => console.log(`  - ${s.email}`));
  console.log('');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
