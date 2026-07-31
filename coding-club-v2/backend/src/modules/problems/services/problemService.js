const prisma = require('../../../config/database');
const ApiResponse = require('../../../shared/utils/response');
const { NotFoundError } = require('../../../shared/errors');
const { logActivity } = require('../../../shared/utils/helpers');

exports.getAll = async (req, res, next) => {
  try {
    const { search, difficulty, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where = {};
    if (search) where.OR = [{ title: { contains: search, mode: 'insensitive' } }, { description: { contains: search, mode: 'insensitive' } }];
    if (difficulty) where.difficulty = difficulty;

    const [data, total] = await Promise.all([
      prisma.problems.findMany({ where, skip, take: Number(limit), orderBy: { created_at: 'desc' },
        include: { _count: { select: { submissions: true } } } }),
      prisma.problems.count({ where }),
    ]);
    ApiResponse.paginated(res, data, total, page, limit);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { title, description, difficulty, input_description, output_description, constraints, examples } = req.body;
    const problem = await prisma.problems.create({
      data: { title, description, difficulty: difficulty || 'easy', input_description, output_description, constraints, examples },
    });
    logActivity(req.user.id, 'admin', 'create_problem', { id: problem.id });
    ApiResponse.success(res, problem, 'Created', 201);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const problem = await prisma.problems.findUnique({ where: { id: Number(req.params.id) } });
    if (!problem) throw new NotFoundError('Problem not found');
    const updated = await prisma.problems.update({ where: { id: Number(req.params.id) }, data: req.body });
    ApiResponse.success(res, updated, 'Updated');
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const problem = await prisma.problems.findUnique({ where: { id: Number(req.params.id) } });
    if (!problem) throw new NotFoundError('Problem not found');
    await prisma.problems.delete({ where: { id: Number(req.params.id) } });
    logActivity(req.user.id, 'admin', 'delete_problem', { id: Number(req.params.id) });
    ApiResponse.success(res, null, 'Deleted');
  } catch (err) { next(err); }
};
