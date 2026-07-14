const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

router.get('/admin/stats', requireAuth, requireAdmin, adminController.getStats);
router.get('/admin/loans', requireAuth, requireAdmin, adminController.getPendingLoans);
router.put('/admin/loans/:id/approve', requireAuth, requireAdmin, adminController.approveLoan);
router.put('/admin/loans/:id/reject', requireAuth, requireAdmin, adminController.rejectLoan);

module.exports = router;
