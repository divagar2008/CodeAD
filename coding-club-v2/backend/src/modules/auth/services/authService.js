const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../../../config/database');
const config = require('../../../config');
const ApiResponse = require('../../../shared/utils/response');
const { AuthError } = require('../../../shared/errors');
const { logActivity } = require('../../../shared/utils/helpers');

exports.studentLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const student = await prisma.students.findUnique({ where: { email } });

    if (!student || !(await bcrypt.compare(password, student.password))) {
      throw new AuthError('Invalid email or password');
    }
    if (!student.is_active) throw new AuthError('Account deactivated');

    const token = jwt.sign(
      { id: student.id, email: student.email, role: 'student' },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    logActivity(student.id, 'student', 'login');

    ApiResponse.success(res, {
      token,
      user: { id: student.id, name: student.name, email: student.email, role: 'student',
        department: student.department, year: student.year,
        coding_score: student.coding_score, total_points: student.total_points,
        problems_solved: student.problems_solved },
    });
  } catch (err) { next(err); }
};

exports.adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const admin = await prisma.admins.findUnique({ where: { email } });

    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      throw new AuthError('Invalid email or password');
    }
    if (!admin.is_active) throw new AuthError('Account deactivated');

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: 'admin' },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    logActivity(admin.id, 'admin', 'login');

    ApiResponse.success(res, {
      token,
      user: { id: admin.id, name: admin.name, email: admin.email, role: 'admin' },
    });
  } catch (err) { next(err); }
};
