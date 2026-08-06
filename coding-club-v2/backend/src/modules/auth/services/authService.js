const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../../../config/database');
const config = require('../../../config');
const ApiResponse = require('../../../shared/utils/response');
const { AuthError, ConflictError } = require('../../../shared/errors');
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

exports.studentRegister = async (req, res, next) => {
  try {
    const { name, email, password, department, year } = req.body;
    
    // Check if email already exists
    const existing = await prisma.students.findUnique({ where: { email } });
    if (existing) throw new ConflictError('Email already registered');

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create student
    const student = await prisma.students.create({
      data: {
        name,
        email,
        password: hashedPassword,
        department: department || null,
        year: year || null,
        role: 'student',
      },
    });

    // Create leaderboard entry
    await prisma.leaderboard.create({ data: { student_id: student.id } });

    // Create user profile
    await prisma.user_profiles.create({ data: { student_id: student.id } });

    // Generate token and login automatically
    const token = jwt.sign(
      { id: student.id, email: student.email, role: 'student' },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    logActivity(student.id, 'student', 'register');

    // Send welcome email (fire-and-forget)
    const { sendWelcomeEmail } = require('../../../shared/services/emailService');
    sendWelcomeEmail(student.name, student.email).catch(err =>
      console.error('[Email] Welcome email failed:', err.message)
    );

    ApiResponse.success(res, {
      token,
      user: { id: student.id, name: student.name, email: student.email, role: 'student',
        department: student.department, year: student.year,
        coding_score: 0, total_points: 0, problems_solved: 0 },
    }, 'Registration successful', 201);
  } catch (err) { next(err); }
};


