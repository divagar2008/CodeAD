const router = require('express').Router();
const { authenticate, authorize } = require('../../../middleware/auth');
const prisma = require('../../../config/database');
const ApiResponse = require('../../../shared/utils/response');
const { getTier, getStreak, getHeatmap, getScoreHistory, getTopStudents, getMentorStatus, TIERS } = require('../services/achievementService');

router.use(authenticate, authorize('student', 'admin'));

// Get all achievements with earned status
router.get('/', async (req, res, next) => {
  try {
    const [allAchievements, earned] = await Promise.all([
      prisma.achievements.findMany({ orderBy: { id: 'asc' } }),
      prisma.student_achievements.findMany({
        where: { student_id: req.user.id },
        select: { achievement_id: true, earned_at: true },
      }),
    ]);
    const earnedMap = {};
    earned.forEach(e => { earnedMap[e.achievement_id] = e.earned_at; });

    const result = allAchievements.map(a => ({
      ...a, earned: !!earnedMap[a.id], earnedAt: earnedMap[a.id] || null,
    }));
    ApiResponse.success(res, { achievements: result, totalEarned: earned.length });
  } catch (err) { next(err); }
});

// Get tier info
router.get('/tier', async (req, res, next) => {
  try {
    const student = await prisma.students.findUnique({ where: { id: req.user.id }, select: { total_points: true } });
    const tierInfo = getTier(student.total_points);
    ApiResponse.success(res, tierInfo);
  } catch (err) { next(err); }
});

// Get streak
router.get('/streak', async (req, res, next) => {
  try {
    const streak = await getStreak(req.user.id);
    ApiResponse.success(res, streak);
  } catch (err) { next(err); }
});

// Get heatmap
router.get('/heatmap', async (req, res, next) => {
  try {
    const heatmap = await getHeatmap(req.user.id);
    ApiResponse.success(res, heatmap);
  } catch (err) { next(err); }
});

// Get score history
router.get('/score-history', async (req, res, next) => {
  try {
    const history = await getScoreHistory(req.user.id);
    ApiResponse.success(res, history);
  } catch (err) { next(err); }
});

// Get top students for compare
router.get('/compare-list', async (req, res, next) => {
  try {
    const top = await getTopStudents(req.user.id, 15);
    ApiResponse.success(res, top);
  } catch (err) { next(err); }
});

// Compare with a student
router.get('/compare/:targetId', async (req, res, next) => {
  try {
    const targetId = Number(req.params.targetId);
    const [me, other] = await Promise.all([
      prisma.students.findUnique({ where: { id: req.user.id }, select: { id: true, name: true, coding_score: true, total_points: true, problems_solved: true, created_at: true } }),
      prisma.students.findUnique({ where: { id: targetId }, select: { id: true, name: true, coding_score: true, total_points: true, problems_solved: true, created_at: true } }),
    ]);
    if (!other) return ApiResponse.error(res, 'Student not found', 404);
    ApiResponse.success(res, { me, other });
  } catch (err) { next(err); }
});

// Get mentor status
router.get('/mentor', async (req, res, next) => {
  try {
    const status = await getMentorStatus(req.user.id);
    ApiResponse.success(res, status);
  } catch (err) { next(err); }
});

module.exports = router;
