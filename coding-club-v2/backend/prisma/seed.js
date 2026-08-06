const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding...\n');

  const studentPass = await bcrypt.hash('student123', 12);

  // All 60 students — AI&DS, 2nd Year
  const students = [
    { name: 'Ahmed Athief Khan M V', email: 'athief@college.edu', role: 'student' },
    { name: 'Divagar M K', email: 'divagar@college.edu', role: 'admin' },
    { name: 'Dharshan Bala P', email: 'dharshan@college.edu', role: 'admin' },
    { name: 'Jeyavarshan B', email: 'jeyavarshan@college.edu', role: 'student' },
    { name: 'Deepan M', email: 'deepan@college.edu', role: 'student' },
    { name: 'Vetriselvam R', email: 'vetriselvam@college.edu', role: 'student' },
    { name: 'Heman M', email: 'heman@college.edu', role: 'student' },
    { name: 'Gopal Karthick S', email: 'gopalkarthick@college.edu', role: 'student' },
    { name: 'Kanishkumar K', email: 'kanish@college.edu', role: 'student' },
    { name: 'Devadharshan V', email: 'devadharshan@college.edu', role: 'student' },
    { name: 'Sankara Narayanan R', email: 'sankara@college.edu', role: 'student' },
    { name: 'Srinivash T', email: 'srinivash@college.edu', role: 'student' },
    { name: 'Sriram V', email: 'sriram@college.edu', role: 'student' },
    { name: 'Rajarajeswari S', email: 'raji@college.edu', role: 'student' },
    { name: 'Rajasri M', email: 'rajasri@college.edu', role: 'student' },
    { name: 'Praveena M', email: 'praveena@college.edu', role: 'student' },
    { name: 'Yazhini P M', email: 'yazhini@college.edu', role: 'student' },
    { name: 'Supriya J S', email: 'supriya@college.edu', role: 'student' },
    { name: 'Vijayshree S', email: 'vijayshree@college.edu', role: 'student' },
    { name: 'Mathumitha G', email: 'mathunscet@gmail.com', role: 'student' },
    { name: 'Yugasri I', email: 'yugasri@college.edu', role: 'student' },
    { name: 'Sharanya M', email: 'sharanya@college.edu', role: 'student' },
    { name: 'Siva Dharani R', email: 'sivadharani@college.edu', role: 'student' },
    { name: 'Yashika K', email: 'yashika@college.edu', role: 'student' },
    { name: 'Nandhini S', email: 'nandhini@college.edu', role: 'student' },
    { name: 'Pandeeswari M', email: 'pandeeswari@nscet.edu', role: 'student' },
    { name: 'Sugapriya T', email: 'sugapriya@college.edu', role: 'student' },
    { name: 'Meera S', email: 'meera@college.edu', role: 'student' },
    { name: 'Lakshana S', email: 'lakshana@nscet.edu', role: 'student' },
    { name: 'Nivetha S', email: 'nivetha@nscet.edu', role: 'student' },
    { name: 'Yazhini P', email: 'yazhini.p@college.edu', role: 'student' },
    { name: 'Sahana C', email: 'sah626861@college.edu', role: 'student' },
    { name: 'Lakshmi Devi S', email: 'lakshmidevi@nscet.edu', role: 'student' },
    { name: 'Narmatha R B', email: 'narmatha@college.edu', role: 'student' },
    { name: 'Haripriya S', email: 'haripriya@college.edu', role: 'student' },
    { name: 'Akalya J', email: 'akalya@college.edu', role: 'student' },
    { name: 'Baghyalakshmi S', email: 'baghyalakshmi@college.edu', role: 'student' },
    { name: 'Alagumeena S', email: 'alagumeena@college.edu', role: 'student' },
    { name: 'Devipriya T', email: 'devipriya@college.edu', role: 'student' },
    { name: 'Dhanusri B', email: 'dhanusri@college.edu', role: 'student' },
    { name: 'Aathiga Fatima A', email: 'aathigafatima@college.edu', role: 'student' },
    { name: 'Devadharshini M', email: 'devadharshini@college.edu', role: 'student' },
    { name: 'Harini M', email: 'harini@college.edu', role: 'student' },
    { name: 'Dhivya Sri A', email: 'dhivyasri.a05@gmail.com', role: 'student' },
    { name: 'Jeevitha C', email: 'jeevitha@college.edu', role: 'student' },
    { name: 'Divyashree P', email: 'divyashree@college.edu', role: 'student' },
    { name: 'Harinisri M', email: 'harinisri@college.edu', role: 'student' },
    { name: 'Gokula Vani K', email: 'vanivani58042@gmail.com', role: 'student' },
    { name: 'Kavitha S', email: 'kavi27032008@gmail.com', role: 'student' },
    { name: 'Dharshinisaroshree S U', email: 'dharshini@college.edu', role: 'student' },
    { name: 'Kanishka R', email: 'kanishka@college.edu', role: 'student' },
    { name: 'Adhila Fathima A', email: 'adhilafathima@college.edu', role: 'student' },
    { name: 'Aathesree R', email: 'aathesree@college.edu', role: 'student' },
    { name: 'Rithika Sri A', email: 'rithika@college.edu', role: 'student' },
    { name: 'Aswatha J S', email: 'aswatha@college.edu', role: 'student' },
    { name: 'Poorvaja S', email: 'poorvaja@college.edu', role: 'student' },
  ];

  let created = 0;
  let skipped = 0;

  for (const s of students) {
    const existing = await prisma.students.findUnique({ where: { email: s.email } });
    if (existing) {
      skipped++;
      continue;
    }

    const student = await prisma.students.create({
      data: {
        name: s.name,
        email: s.email,
        password: studentPass,
        department: 'AI&DS',
        year: '2nd',
        role: s.role,
      }
    });

    await prisma.leaderboard.create({
      data: { student_id: student.id, coding_score: 0, live_session_pts: 0, total_score: 0 }
    });

    await prisma.user_profiles.create({
      data: { student_id: student.id }
    });

    created++;
  }

  console.log(`Students: ${created} created, ${skipped} already existed`);

  // Problems (only if none exist)
  const existingProblems = await prisma.problems.count();
  if (existingProblems === 0) {
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
  } else {
    console.log(`Problems already exist (${existingProblems}), skipping`);
  }

  // Live session (only if none exist)
  const existingSessions = await prisma.live_sessions.count();
  if (existingSessions === 0) {
    await prisma.live_sessions.create({
      data: {
        name: 'Weekly Challenge #1',
        date: new Date(),
        description: 'Live coding session — points awarded by admin during the session',
        is_published: true,
      }
    });
    console.log('Created 1 live session');
  }

  // Achievements (only if none exist)
  const existingAchievements = await prisma.achievements.count();
  if (existingAchievements === 0) {
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
  }

  console.log('\nDone!');
  console.log(`\nAdmin accounts (password: student123):`);
  students.filter(s => s.role === 'admin').forEach(s => console.log(`  - ${s.name} <${s.email}>`));
  console.log('');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
