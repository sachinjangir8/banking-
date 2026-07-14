const express = require('express');
const router = express.Router();
const jointAccountController = require('../controllers/jointAccountController');
const { requireAuth } = require('../middleware/authMiddleware');

router.get('/joint-accounts', requireAuth, jointAccountController.getJointAccounts);
router.post('/joint-accounts', requireAuth, jointAccountController.addJointAccount);
router.delete('/joint-accounts/:id', requireAuth, jointAccountController.removeJointAccount);

module.exports = router;
