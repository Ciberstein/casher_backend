const express = require('express');
const withdrawalsController = require('../controllers/withdrawals.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const restrictTo = require('../middlewares/restrictTo');

const router = express.Router();

router.use(authMiddleware.protect);

router.post('/', withdrawalsController.createWithdrawal);
router.get('/', withdrawalsController.getMyWithdrawals);
router.patch('/:id/cancel', withdrawalsController.cancelWithdrawal);

router.get('/admin', restrictTo('admin'), withdrawalsController.getPendingWithdrawals);
router.patch('/:id/accept', restrictTo('admin'), withdrawalsController.acceptWithdrawal);
router.patch('/:id/reject', restrictTo('admin'), withdrawalsController.rejectWithdrawal);

module.exports = router;
