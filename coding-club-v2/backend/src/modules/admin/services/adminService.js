const bcrypt = require('bcrypt');
const prisma = require('../../../config/database');
const ApiResponse = require('../../../shared/utils/response');
const { NotFoundError, ConflictError } = require('../../../shared/errors');
const { logActivity } = require('../../../shared/utils/helpers');

exports.getStudents = async (req, res, next) => {
  try {
    const { search, department, year, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where = {};
    if (search) where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }];
    if (department) where.department = department;
    if (year) where.year = year;

    const [data, total] = await Promise.all([
      prisma.students.findMany({ where, skip, take: Number(limit), orderBy: { created_at: 'desc' },
        select: { id: true, name: true, email: true, department: true, year: true,
          coding_score: true, total_points: true, problems_solved: true, is_active: true, created_at: true } }),
      prisma.students.count({ where }),
    ]);
    ApiResponse.paginated(res, data, total, page, limit);
  } catch (err) { next(err); }
};

exports.createStudent = async (req, res, next) => {
  try {
    const { name, email, password, department, year } = req.body;
    const exists = await prisma.students.findUnique({ where: { email } });
    if (exists) throw new ConflictError('Email already exists');

    const student = await prisma.students.create({
      data: { name, email, password: await bcrypt.hash(password, 12), department, year },
    });
    await prisma.leaderboard.create({ data: { student_id: student.id } });
    await prisma.user_profiles.create({ data: { student_id: student.id } });
    logActivity(req.user.id, 'admin', 'create_student', { id: student.id });
    ApiResponse.success(res, { id: student.id, name: student.name, email: student.email }, 'Created', 201);
  } catch (err) { next(err); }
};

exports.updateStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const student = await prisma.students.findUnique({ where: { id: Number(id) } });
    if (!student) throw new NotFoundError('Student not found');

    const updated = await prisma.students.update({ where: { id: Number(id) }, data: req.body });
    logActivity(req.user.id, 'admin', 'update_student', { id: Number(id) });
    ApiResponse.success(res, { id: updated.id, name: updated.name, email: updated.email }, 'Updated');
  } catch (err) { next(err); }
};

exports.deleteStudent = async (req, res, next) => {
  try {
    const student = await prisma.students.findUnique({ where: { id: Number(req.params.id) } });
    if (!student) throw new NotFoundError('Student not found');
    await prisma.students.delete({ where: { id: Number(req.params.id) } });
    logActivity(req.user.id, 'admin', 'delete_student', { id: Number(req.params.id) });
    ApiResponse.success(res, null, 'Deleted');
  } catch (err) { next(err); }
};

exports.getReports = async (req, res, next) => {
  try {
    const [totalStudents, totalProblems, totalSubmissions, avgResult] = await Promise.all([
      prisma.students.count(), prisma.problems.count(), prisma.submissions.count(),
      prisma.submissions.aggregate({ _avg: { ai_score: true } }),
    ]);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);

    const [todayActivity, weeklyActivity, topStudents] = await Promise.all([
      prisma.activity_logs.count({ where: { created_at: { gte: today } } }),
      prisma.activity_logs.count({ where: { created_at: { gte: weekAgo } } }),
      prisma.leaderboard.findMany({
        include: { student: { select: { id: true, name: true, email: true, department: true } } },
        orderBy: { total_score: 'desc' }, take: 10,
      }),
    ]);

    ApiResponse.success(res, {
      totalStudents, totalProblems, totalSubmissions,
      averageAiScore: Math.round(avgResult._avg.ai_score || 0),
      todayActivity, weeklyActivity, topStudents,
    });
  } catch (err) { next(err); }
};

exports.getAnalytics = async (req, res, next) => {
  try {
    const [totalStudents, totalProblems, totalSubmissions, avgResult] = await Promise.all([
      prisma.students.count(), prisma.problems.count(), prisma.submissions.count(),
      prisma.submissions.aggregate({ _avg: { ai_score: true } }),
    ]);

    // ── Submissions Over Time (last 30 days) ──
    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);
    const recentSubs = await prisma.submissions.findMany({
      where: { created_at: { gte: thirtyDaysAgo } },
      select: { created_at: true },
      orderBy: { created_at: 'asc' },
    });

    const subsByDay = {};
    const d = new Date(thirtyDaysAgo);
    while (d <= new Date()) {
      const key = d.toISOString().slice(0, 10);
      subsByDay[key] = 0;
      d.setDate(d.getDate() + 1);
    }
    recentSubs.forEach(s => {
      const key = s.created_at.toISOString().slice(0, 10);
      if (subsByDay[key] !== undefined) subsByDay[key]++;
    });
    const submissionsOverTime = Object.entries(subsByDay).map(([date, count]) => ({
      date: date.slice(5),
      submissions: count,
    }));

    // ── Single query for score distribution, language usage, and difficulty breakdown ──
    const allSubmissions = await prisma.submissions.findMany({
      select: { ai_score: true, language: true, problem: { select: { difficulty: true } } },
    });

    const scoreRanges = [
      { label: '0-20', min: 0, max: 20 },
      { label: '21-40', min: 21, max: 40 },
      { label: '41-60', min: 41, max: 60 },
      { label: '61-80', min: 61, max: 80 },
      { label: '81-100', min: 81, max: 100 },
    ];
    const scoreDistribution = scoreRanges.map(r => ({
      range: r.label,
      count: allSubmissions.filter(s => s.ai_score != null && s.ai_score >= r.min && s.ai_score <= r.max).length,
    }));

    const langMap = {};
    const diffCounts = { easy: 0, medium: 0, hard: 0 };
    allSubmissions.forEach(s => {
      langMap[s.language] = (langMap[s.language] || 0) + 1;
      const d = s.problem?.difficulty || 'easy';
      if (diffCounts[d] !== undefined) diffCounts[d]++;
    });
    const languageUsage = Object.entries(langMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    const difficultyBreakdown = [
      { name: 'Easy', submissions: diffCounts.easy, fill: '#22c55e' },
      { name: 'Medium', submissions: diffCounts.medium, fill: '#f59e0b' },
      { name: 'Hard', submissions: diffCounts.hard, fill: '#ef4444' },
    ];

    // ── Top Performers ──
    const topPerformers = await prisma.leaderboard.findMany({
      include: { student: { select: { id: true, name: true } } },
      orderBy: { total_score: 'desc' }, take: 10,
    });
    const topPerformersData = topPerformers.map((e, i) => ({
      rank: i + 1,
      name: e.student?.name || 'Unknown',
      score: e.total_score || 0,
      coding: e.coding_score || 0,
      live: e.live_session_pts || 0,
    }));

    // ── Department breakdown ──
    const deptCounts = await prisma.students.groupBy({
      by: ['department'], _count: { department: true }, orderBy: { _count: { department: 'desc' } },
    });
    const departmentBreakdown = deptCounts.map(d => ({
      name: d.department || 'Unknown',
      count: d._count.department,
    }));

    ApiResponse.success(res, {
      totalStudents, totalProblems, totalSubmissions,
      averageAiScore: Math.round(avgResult._avg.ai_score || 0),
      submissionsOverTime,
      scoreDistribution,
      languageUsage,
      difficultyBreakdown,
      topPerformers: topPerformersData,
      departmentBreakdown,
    });
  } catch (err) { next(err); }
};
