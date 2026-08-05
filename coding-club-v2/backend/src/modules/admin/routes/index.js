const { body, param } = require('express-validator');
const validate = require('../../../middleware/validate');
const { authenticate, authorize } = require('../../../middleware/auth');
const svc = require('../services/adminService');

const router = require('express').Router();
router.use(authenticate, authorize('admin'));

router.get('/students', svc.getStudents);
router.post('/students', [body('name').trim().isLength({ min: 2 }), body('email').isEmail(), body('password').isLength({ min: 6 })], validate, svc.createStudent);
router.put('/students/:id', [param('id').isInt()], validate, svc.updateStudent);
router.post('/students/:id/reset-scores', [param('id').isInt()], validate, svc.resetStudentScores);
router.delete('/students/:id', [param('id').isInt()], validate, svc.deleteStudent);
router.get('/reports', svc.getReports);
router.get('/analytics', svc.getAnalytics);

module.exports = router;
