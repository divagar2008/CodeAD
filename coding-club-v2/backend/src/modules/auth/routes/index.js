const { body } = require('express-validator');
const validate = require('../../../middleware/validate');
const authService = require('../services/authService');

const router = require('express').Router();

router.post('/student/login',
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
  validate,
  authService.studentLogin
);

module.exports = router;
