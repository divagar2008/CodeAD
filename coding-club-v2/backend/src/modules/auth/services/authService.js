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

    const studentRole = student.role || 'student';
    const token = jwt.sign(
      { id: student.id, email: student.email, role: studentRole },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    logActivity(student.id, studentRole, 'login');

    ApiResponse.success(res, {
      token,
      user: { id: student.id, name: student.name, email: student.email, role: studentRole,
        department: student.department, year: student.year,
        coding_score: student.coding_score, total_points: student.total_points,
        problems_solved: student.problems_solved },
    });
  } catch (err) { next(err); }
};


