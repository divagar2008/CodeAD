const { body, param } = require('express-validator');
const validate = require('../../../middleware/validate');
const { authenticate, authorize } = require('../../../middleware/auth');
const svc = require('../services/studentService');

const router = require('express').Router();
router.use(authenticate, authorize('student', 'admin'));

router.get('/dashboard', svc.getDashboard);
router.get('/problems', svc.getProblems);
router.get('/problems/:id', [param('id').isInt()], validate, svc.getProblem);
router.post('/compile', [
  body('problem_id').isInt(), body('code').trim().notEmpty(),
  body('language').isIn(['javascript', 'python', 'java', 'cpp', 'c', 'other']),
], validate, svc.compileCode);
router.post('/submit', [
  body('problem_id').isInt(), body('code').trim().notEmpty(),
  body('language').isIn(['javascript', 'python', 'java', 'cpp', 'c', 'other']),
], validate, svc.submitCode);
router.get('/leaderboard', svc.getLeaderboard);
router.get('/live-points', svc.getLivePoints);
router.get('/profile', svc.getProfile);
router.put('/profile', [body('name').optional().trim().isLength({ min: 2 })], validate, svc.updateProfile);
router.put('/password', [
  body('currentPassword').notEmpty(), body('newPassword').isLength({ min: 6 }),
], validate, svc.changePassword);

module.exports = router;
