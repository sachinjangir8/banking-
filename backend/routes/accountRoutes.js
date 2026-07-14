const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');
const { requireAuth } = require('../middleware/authMiddleware');

router.get('/me', requireAuth, accountController.getMe);
router.get('/customers', accountController.getCustomers);
router.get('/accounts/:id', requireAuth, accountController.getAccountById);

module.exports = router;
