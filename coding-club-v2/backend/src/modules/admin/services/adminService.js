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
