const bcrypt = require('bcrypt');
const prisma = require('../../../config/database');
const ApiResponse = require('../../../shared/utils/response');
const { NotFoundError, ConflictError, ValidationError, ForbiddenError } = require('../../../shared/errors');
const { logActivity, calculateScore } = require('../../../shared/utils/helpers');
const { checkAndAwardAchievements } = require('./achievementChecker');

exports.getDashboard = async (req, res, next) => {
  try {
    const student = await prisma.students.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, department: true, year: true,
        coding_score: true, total_points: true, problems_solved: true, created_at: true },
    });
    if (!student) throw new NotFoundError('Student not found');

    const [recentSubmissions, totalProblems] = await Promise.all([
      prisma.submissions.findMany({
        where: { student_id: req.user.id },
        include: { problem: { select: { title: true, difficulty: true } } },
        orderBy: { created_at: 'desc' }, take: 5,
      }),
      prisma.problems.count({ where: { is_active: true } }),
    ]);

    ApiResponse.success(res, { student, recentSubmissions, totalProblems });
  } catch (err) { next(err); }
};

exports.getProblems = async (req, res, next) => {
  try {
    const [problems, solvedSubmissions] = await Promise.all([
      prisma.problems.findMany({
        where: { is_active: true },
        select: { id: true, title: true, description: true, difficulty: true,
          input_description: true, output_description: true, constraints: true,
          examples: true, created_at: true },
        orderBy: { created_at: 'desc' },
      }),
      prisma.submissions.findMany({
        where: { student_id: req.user.id },
        select: { problem_id: true },
        distinct: ['problem_id'],
      }),
    ]);

    const solvedIds = new Set(solvedSubmissions.map(s => s.problem_id));

    // Count total and solved per difficulty
    const counts = { easy: { total: 0, solved: 0 }, medium: { total: 0, solved: 0 }, hard: { total: 0, solved: 0 } };
    for (const p of problems) {
      const d = p.difficulty;
      if (counts[d]) {
        counts[d].total++;
        if (solvedIds.has(p.id)) counts[d].solved++;
      }
    }

    // Unlock logic: easy always unlocked, medium if all easy solved, hard if all medium solved
    const unlocked = {
      easy: true,
      medium: counts.easy.total > 0 && counts.easy.solved >= counts.easy.total,
      hard: counts.medium.total > 0 && counts.medium.solved >= counts.medium.total,
    };

    ApiResponse.success(res, {
      problems,
      progress: counts,
      unlocked,
      solvedProblemIds: Array.from(solvedIds),
    });
  } catch (err) { next(err); }
};

exports.getProblem = async (req, res, next) => {
  try {
    const problem = await prisma.problems.findUnique({
      where: { id: Number(req.params.id) },
      select: { id: true, title: true, description: true, difficulty: true,
        input_description: true, output_description: true, constraints: true,
        examples: true, created_at: true },
    });
    if (!problem) throw new NotFoundError('Problem not found');

    // Enforce difficulty lock server-side
    if (problem.difficulty === 'medium' || problem.difficulty === 'hard') {
      const prevDifficulty = problem.difficulty === 'medium' ? 'easy' : 'medium';
      const [totalPrev, solvedPrev] = await Promise.all([
        prisma.problems.count({ where: { is_active: true, difficulty: prevDifficulty } }),
        prisma.submissions.groupBy({
          by: ['problem_id'],
          where: {
            student_id: req.user.id,
            problem: { difficulty: prevDifficulty, is_active: true },
          },
        }),
      ]);
      if (totalPrev > 0 && solvedPrev.length < totalPrev) {
        throw new ForbiddenError(`Complete all ${prevDifficulty} problems first to unlock ${problem.difficulty} problems`);
      }
    }

    const existingSubmission = await prisma.submissions.findFirst({
      where: { student_id: req.user.id, problem_id: Number(req.params.id) },
      orderBy: { created_at: 'desc' },
    });

    ApiResponse.success(res, {
      ...problem,
      hasSubmitted: !!existingSubmission,
      existingSubmission,
    });
  } catch (err) { next(err); }
};

exports.compileCode = async (req, res, next) => {
  try {
    const { problem_id, code, language } = req.body;
    const problem = await prisma.problems.findUnique({ where: { id: Number(problem_id) } });
    if (!problem) throw new NotFoundError('Problem not found');

    let exampleInput = '';
    if (problem.examples) {
      if (typeof problem.examples === 'object' && problem.examples.input) {
        exampleInput = problem.examples.input;
      } else if (typeof problem.examples === 'string') {
        try {
          const parsed = JSON.parse(problem.examples);
          exampleInput = parsed.input || '';
        } catch (e) {
          exampleInput = problem.examples;
        }
      }
    }

    const nemotronService = require('../../../ai/nemotronService');
    const result = await nemotronService.compileCode(problem.description, code, language, exampleInput);

    ApiResponse.success(res, result);
  } catch (err) { next(err); }
};

exports.submitCode = async (req, res, next) => {
  try {
    const { problem_id, code, language } = req.body;
    const problem = await prisma.problems.findUnique({ where: { id: Number(problem_id) } });
    if (!problem) throw new NotFoundError('Problem not found');

    const existingSubmission = await prisma.submissions.findFirst({
      where: { student_id: req.user.id, problem_id: Number(problem_id) },
    });
    if (existingSubmission) {
      throw new ForbiddenError('You have already submitted a solution for this problem. Only one submission is permitted per problem.');
    }

    const nemotronService = require('../../../ai/nemotronService');
    const review = await nemotronService.reviewCode(problem.description, code, language);

    const { calculateScore } = require('../../../shared/utils/helpers');
    const points = calculateScore(problem.difficulty, review.ai_score);

    const submission = await prisma.submissions.create({
      data: { student_id: req.user.id, problem_id: Number(problem_id), code, language,
        ai_score: review.ai_score, logical_correctness: review.logical_correctness,
        syntax_review: review.syntax_review, suggestions: review.suggestions,
        time_complexity: review.time_complexity, space_complexity: review.space_complexity,
        mistakes: review.mistakes, ai_feedback: review },
    });

    await prisma.students.update({
      where: { id: req.user.id },
      data: { coding_score: { increment: review.ai_score }, total_points: { increment: points }, problems_solved: { increment: 1 } },
    });

    const s = await prisma.students.findUnique({ where: { id: req.user.id } });
    await prisma.leaderboard.upsert({
      where: { student_id: req.user.id },
      update: { coding_score: s.coding_score, total_score: s.total_points },
      create: { student_id: req.user.id, coding_score: s.coding_score, total_score: s.total_points },
    });

    logActivity(req.user.id, 'student', 'submit_code', { problem_id, language, score: review.ai_score });

    // Auto-check and award achievements
    const newAchievements = await checkAndAwardAchievements(req.user.id);

    ApiResponse.success(res, { submission, review, pointsEarned: points, newAchievements });
  } catch (err) { next(err); }
};

exports.getLeaderboard = async (req, res, next) => {
  try {
    const entries = await prisma.leaderboard.findMany({
      include: { student: { select: { id: true, name: true, email: true, department: true } } },
      orderBy: { total_score: 'desc' },
    });
    ApiResponse.success(res, entries.map((e, i) => ({ rank: i + 1, ...e })));
  } catch (err) { next(err); }
};

exports.getLivePoints = async (req, res, next) => {
  try {
    const points = await prisma.live_points.findMany({
      where: { student_id: req.user.id },
      include: { session: { select: { id: true, name: true, date: true } } },
      orderBy: { created_at: 'desc' },
    });
    ApiResponse.success(res, {
      sessions: points,
      totalLivePoints: points.reduce((sum, p) => sum + p.points, 0),
    });
  } catch (err) { next(err); }
};

exports.getProfile = async (req, res, next) => {
  try {
    const student = await prisma.students.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, name: true, email: true, role: true, department: true, year: true,
        coding_score: true, total_points: true, problems_solved: true,
        is_active: true, created_at: true, profile: true,
      },
    });
    if (!student) throw new NotFoundError('Student not found');

    const [submissions, leaderboardEntry, livePointsData] = await Promise.all([
      prisma.submissions.findMany({
        where: { student_id: req.user.id },
        select: { id: true, language: true, ai_score: true, created_at: true },
        orderBy: { created_at: 'desc' },
      }),
      prisma.leaderboard.findUnique({ where: { student_id: req.user.id } }),
      prisma.live_points.aggregate({
        where: { student_id: req.user.id },
        _sum: { points: true },
      }),
    ]);

    // Language breakdown
    const languageMap = {};
    let totalScore = 0;
    let scoreCount = 0;
    submissions.forEach(s => {
      languageMap[s.language] = (languageMap[s.language] || 0) + 1;
      if (s.ai_score != null) { totalScore += s.ai_score; scoreCount++; }
    });
    const languages = Object.entries(languageMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const avgScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;
    const bestScore = submissions.length > 0 ? Math.max(...submissions.map(s => s.ai_score || 0)) : 0;
    const totalLivePoints = livePointsData._sum.points || 0;

    // Leaderboard rank
    let rank = null;
    if (leaderboardEntry) {
      const higher = await prisma.leaderboard.count({ where: { total_score: { gt: leaderboardEntry.total_score } } });
      rank = higher + 1;
    }

    ApiResponse.success(res, {
      ...student,
      languages,
      avgScore,
      bestScore,
      totalSubmissions: submissions.length,
      rank,
      totalLivePoints,
      recentSubmissions: submissions.slice(0, 5).map(s => ({
        id: s.id, language: s.language, ai_score: s.ai_score, created_at: s.created_at,
      })),
    });
  } catch (err) { next(err); }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, department, year } = req.body;
    const updated = await prisma.students.update({
      where: { id: req.user.id },
      data: { ...(name && { name }), ...(department && { department }), ...(year && { year }) },
      select: { id: true, name: true, email: true, department: true, year: true },
    });
    ApiResponse.success(res, updated, 'Profile updated');
  } catch (err) { next(err); }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const student = await prisma.students.findUnique({ where: { id: req.user.id } });
    if (!(await bcrypt.compare(currentPassword, student.password))) {
      throw new ValidationError('Current password is incorrect');
    }
    await prisma.students.update({
      where: { id: req.user.id },
      data: { password: await bcrypt.hash(newPassword, 12) },
    });
    ApiResponse.success(res, null, 'Password changed');
  } catch (err) { next(err); }
};
