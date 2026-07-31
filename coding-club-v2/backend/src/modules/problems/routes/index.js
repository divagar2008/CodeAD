const { body, param } = require('express-validator');
const validate = require('../../../middleware/validate');
const { authenticate, authorize } = require('../../../middleware/auth');
const svc = require('../services/problemService');

const router = require('express').Router();
router.use(authenticate, authorize('admin'));

router.get('/', svc.getAll);
router.post('/', [body('title').trim().isLength({ min: 3 }), body('description').trim().isLength({ min: 10 }),
  body('difficulty').optional().isIn(['easy', 'medium', 'hard'])], validate, svc.create);
router.put('/:id', [param('id').isInt()], validate, svc.update);
router.delete('/:id', [param('id').isInt()], validate, svc.remove);

module.exports = router;
