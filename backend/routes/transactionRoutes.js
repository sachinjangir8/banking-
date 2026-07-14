const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { requireAuth } = require('../middleware/authMiddleware');

router.post('/deposit', requireAuth, transactionController.deposit);
router.post('/withdraw', requireAuth, transactionController.withdraw);
router.post('/transfer', requireAuth, transactionController.transfer);
router.get('/accounts/:id/statement', requireAuth, transactionController.getStatement);

module.exports = router;
