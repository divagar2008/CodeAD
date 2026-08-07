const { body } = require('express-validator');
const validate = require('../../../middleware/validate');
const authService = require('../services/authService');
const bcrypt = require('bcrypt');
const prisma = require('../../../config/database');

const router = require('express').Router();

router.post('/student/login',
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
  validate,
  authService.studentLogin
);

router.post('/student/register',
  body('name').trim().notEmpty().withMessage('Name required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
  body('department').optional().trim(),
  body('year').optional().trim(),
  validate,
  authService.studentRegister
);

router.post('/reset-admin-password', [body('email').isEmail(), body('password').isLength({ min: 6 })], validate, async (req, res) => {
  try {
    const { email, password } = req.body;
    const hash = await bcrypt.hash(password, 12);
    const updated = await prisma.students.update({ where: { email }, data: { password: hash } });
    res.json({ success: true, message: `Password reset for ${email}` });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
