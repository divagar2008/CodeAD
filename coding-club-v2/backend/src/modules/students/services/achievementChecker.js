const prisma = require('../../../config/database');

/**
 * Check and award all achievements for a student after a submission.
 * Returns an array of newly earned achievement names (for notifications).
 */
async function checkAndAwardAchievements(studentId) {
  // Get all achievement definitions
  const allAchievements = await prisma.achievements.findMany();
  
  // Get already earned achievements
  const earned = await prisma.student_achievements.findMany({
    where: { student_id: studentId },
    select: { achievement_id: true },
  });
  const earnedIds = new Set(earned.map(e => e.achievement_id));
  
  // Filter to unearned only
  const unearned = allAchievements.filter(a => !earnedIds.has(a.id));
  if (unearned.length === 0) return [];
  
  // Gather student stats in parallel
  const [student, submissions, distinctLanguages, leaderboardEntry, totalProblems, easyProblems] = await Promise.all([
    prisma.students.findUnique({ where: { id: studentId }, select: { problems_solved: true, total_points: true, created_at: true } }),
    prisma.submissions.findMany({ where: { student_id: studentId }, select: { ai_score: true, language: true, created_at: true, problem: { select: { difficulty: true } } } }),
    prisma.submissions.findMany({ where: { student_id: studentId }, select: { language: true }, distinct: ['language'] }),
    prisma.leaderboard.findUnique({ where: { student_id: studentId } }),
    prisma.problems.count({ where: { is_active: true } }),
    prisma.problems.findMany({ where: { is_active: true, difficulty: 'easy' }, select: { id: true } }),
  ]);
  
  // Compute derived stats
  const solvedCount = student.problems_solved;
  const totalPoints = student.total_points;
  const langCount = distinctLanguages.length;
  const scores90plus = submissions.filter(s => (s.ai_score || 0) >= 90).length;
  const hasHardSolve = submissions.some(s => s.problem?.difficulty === 'hard');
  const solvedEasyIds = new Set(
    submissions.filter(s => s.problem?.difficulty === 'easy').map(s => s.problem_id)
  );
  const allEasySolved = easyProblems.length > 0 && easyProblems.every(p => solvedEasyIds.has(p.id));
  
  // Reuse streak calculation from achievementService
  const { getStreak } = require('./achievementService');
  const streakResult = await getStreak(studentId);
  const streak = streakResult.current;
  
  // Leaderboard rank
  let rank = null;
  if (leaderboardEntry) {
    const higher = await prisma.leaderboard.count({ where: { total_score: { gt: leaderboardEntry.total_score } } });
    rank = higher + 1;
  }
  
  // Evaluate each unearned achievement
  const newlyEarned = [];
  
  for (const achievement of unearned) {
    let earned = false;
    
    switch (achievement.name) {
      case 'first_blood':       earned = solvedCount >= 1; break;
      case 'five_solves':       earned = solvedCount >= 5; break;
      case 'ten_solves':        earned = solvedCount >= 10; break;
      case 'twentyfive_solves': earned = solvedCount >= 25; break;
      case 'fifty_solves':      earned = solvedCount >= 50; break;
      case 'perfect_score':     earned = submissions.some(s => s.ai_score === 100); break;
      case 'high_roller':       earned = scores90plus >= 5; break;
      case 'multi_lang':        earned = langCount >= 3; break;
      case 'streak_3':          earned = streak >= 3; break;
      case 'streak_7':          earned = streak >= 7; break;
      case 'streak_30':         earned = streak >= 30; break;
      case 'top_10':            earned = rank !== null && rank <= 10; break;
      case 'top_3':             earned = rank !== null && rank <= 3; break;
      case 'rank_1':            earned = rank === 1; break;
      case 'mentor':            earned = rank !== null && rank <= 5; break;
      case 'hundred_points':    earned = totalPoints >= 100; break;
      case 'five_hundred_points': earned = totalPoints >= 500; break;
      case 'thousand_points':   earned = totalPoints >= 1000; break;
      case 'hard_solver':       earned = hasHardSolve; break;
      case 'all_easy':          earned = allEasySolved; break;
    }
    
    if (earned) {
      newlyEarned.push(achievement);
    }
  }
  
  if (newlyEarned.length === 0) return [];
  
  // Award all newly earned achievements in a single transaction
  await prisma.$transaction(
    newlyEarned.map(a => 
      prisma.student_achievements.upsert({
        where: { student_id_achievement_id: { student_id: studentId, achievement_id: a.id } },
        update: {},
        create: { student_id: studentId, achievement_id: a.id },
      })
    )
  );
  
  // Also add achievement bonus points to student's total
  const bonusPoints = newlyEarned.reduce((sum, a) => sum + (a.points || 0), 0);
  if (bonusPoints > 0) {
    await prisma.students.update({
      where: { id: studentId },
      data: { total_points: { increment: bonusPoints } },
    });
    // Update leaderboard too
    if (leaderboardEntry) {
      await prisma.leaderboard.update({
        where: { student_id: studentId },
        data: { total_score: { increment: bonusPoints } },
      });
    }
  }
  
  return newlyEarned;
}

module.exports = { checkAndAwardAchievements };
