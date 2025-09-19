const express = require('express');
const router = express.Router();
const commissionController = require('../controllers/commissionController');
const authMiddleware = require('../middleware/authMiddleware');

// Add commission entry (for cash payments)
router.post('/add', authMiddleware.verifyToken, commissionController.addCommissionEntry);

// Get commission ledger for a freelancer
router.get('/ledger/:freelancerId', authMiddleware.verifyToken, commissionController.getCommissionLedger);

// Pay commission (mark as paid)
router.post('/pay/:entryId', authMiddleware.verifyToken, commissionController.payCommission);

// Check commission status for a job
router.get('/status/:jobId', authMiddleware.verifyToken, commissionController.checkCommissionStatus);

module.exports = router;
