const express = require('express');
const router = express.Router();
const loanController = require('../controllers/loanController');
const { requireAuth } = require('../middleware/authMiddleware');

router.get('/loans', requireAuth, loanController.getLoans);
router.post('/loans', requireAuth, loanController.applyLoan);

module.exports = router;
