const express = require('express');
const router = express.Router();
const beneficiaryController = require('../controllers/beneficiaryController');
const { requireAuth } = require('../middleware/authMiddleware');

router.get('/beneficiaries', requireAuth, beneficiaryController.getBeneficiaries);
router.post('/beneficiaries', requireAuth, beneficiaryController.addBeneficiary);
router.delete('/beneficiaries/:id', requireAuth, beneficiaryController.removeBeneficiary);

module.exports = router;
