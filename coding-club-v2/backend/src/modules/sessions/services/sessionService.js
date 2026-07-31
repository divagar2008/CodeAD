const prisma = require('../../../config/database');
const ApiResponse = require('../../../shared/utils/response');
const { NotFoundError } = require('../../../shared/errors');
const { logActivity } = require('../../../shared/utils/helpers');

exports.getAll = async (req, res, next) => {
  try {
    const sessions = await prisma.live_sessions.findMany({
      include: { _count: { select: { live_points: true } } },
      orderBy: { date: 'desc' },
    });
    ApiResponse.success(res, sessions);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { name, date, description } = req.body;
    const session = await prisma.live_sessions.create({
      data: { name, date: new Date(date), description },
    });
    logActivity(req.user.id, 'admin', 'create_session', { id: session.id });
    ApiResponse.success(res, session, 'Created', 201);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const session = await prisma.live_sessions.findUnique({ where: { id: Number(req.params.id) } });
    if (!session) throw new NotFoundError('Session not found');
    const updated = await prisma.live_sessions.update({ where: { id: Number(req.params.id) }, data: req.body });
    ApiResponse.success(res, updated, 'Updated');
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const session = await prisma.live_sessions.findUnique({ where: { id: Number(req.params.id) } });
    if (!session) throw new NotFoundError('Session not found');
    await prisma.live_sessions.delete({ where: { id: Number(req.params.id) } });
    ApiResponse.success(res, null, 'Deleted');
  } catch (err) { next(err); }
};

exports.awardPoints = async (req, res, next) => {
  try {
    const { session_id, student_id, points } = req.body;
    const [session, student] = await Promise.all([
      prisma.live_sessions.findUnique({ where: { id: Number(session_id) } }),
      prisma.students.findUnique({ where: { id: Number(student_id) } }),
    ]);
    if (!session) throw new NotFoundError('Session not found');
    if (!student) throw new NotFoundError('Student not found');

    await prisma.live_points.upsert({
      where: { session_id_student_id: { session_id: Number(session_id), student_id: Number(student_id) } },
      update: { points: Number(points) },
      create: { session_id: Number(session_id), student_id: Number(student_id), points: Number(points) },
    });

    const allPts = await prisma.live_points.findMany({ where: { student_id: Number(student_id) } });
    const totalLive = allPts.reduce((s, p) => s + p.points, 0);

    await prisma.students.update({ where: { id: Number(student_id) }, data: { total_points: { increment: Number(points) } } });
    const s = await prisma.students.findUnique({ where: { id: Number(student_id) } });

    await prisma.leaderboard.upsert({
      where: { student_id: Number(student_id) },
      update: { live_session_pts: totalLive, total_score: s.total_points },
      create: { student_id: Number(student_id), coding_score: s.coding_score, live_session_pts: totalLive, total_score: s.total_points },
    });

    logActivity(req.user.id, 'admin', 'award_points', { session_id, student_id, points });
    ApiResponse.success(res, null, 'Points awarded');
  } catch (err) { next(err); }
};
