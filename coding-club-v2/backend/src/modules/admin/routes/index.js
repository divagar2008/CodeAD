const { body, param } = require('express-validator');
const validate = require('../../../middleware/validate');
const { authenticate, authorize } = require('../../../middleware/auth');
const svc = require('../services/adminService');

const router = require('express').Router();
router.use(authenticate, authorize('admin'));

router.get('/students', svc.getStudents);
router.post('/students', [body('name').trim().isLength({ min: 2 }), body('email').isEmail(), body('password').isLength({ min: 6 })], validate, svc.createStudent);
router.put('/students/:id', [param('id').isInt()], validate, svc.updateStudent);
router.delete('/students/:id', [param('id').isInt()], validate, svc.deleteStudent);
router.get('/reports', svc.getReports);
router.get('/analytics', svc.getAnalytics);

router.post('/test-email', [body('email').isEmail()], validate, async (req, res) => {
  try {
    const { sendWelcomeEmail } = require('../../../shared/services/emailService');
    const { email } = req.body;
    const result = await sendWelcomeEmail(req.user.name || 'Admin', email);
    if (result) {
      res.json({ success: true, message: 'Test email sent to ' + email, messageId: result.messageId });
    } else {
      res.status(500).json({ success: false, message: 'Failed to send email. Check BREVO_API_KEY on Render.' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
