const { body, param } = require('express-validator');
const validate = require('../../../middleware/validate');
const { authenticate, authorize } = require('../../../middleware/auth');
const svc = require('../services/sessionService');

const router = require('express').Router();
router.use(authenticate, authorize('admin'));

router.get('/', svc.getAll);
router.post('/', [body('name').trim().isLength({ min: 3 }), body('date').isISO8601()], validate, svc.create);
router.put('/:id', [param('id').isInt()], validate, svc.update);
router.delete('/:id', [param('id').isInt()], validate, svc.remove);
router.post('/points', [body('session_id').isInt(), body('student_id').isInt(), body('points').isInt({ min: 0, max: 100 })], validate, svc.awardPoints);

module.exports = router;
