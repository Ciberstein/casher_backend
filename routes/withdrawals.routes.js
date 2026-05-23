const express = require('express');
const multer = require('multer');
const withdrawalsController = require('../controllers/withdrawals.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const restrictTo = require('../middlewares/restrictTo');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(authMiddleware.protect);

router.post('/', withdrawalsController.createWithdrawal);
router.get('/', withdrawalsController.getMyWithdrawals);
router.patch('/:id/cancel', withdrawalsController.cancelWithdrawal);

router.get('/admin', restrictTo('admin'), withdrawalsController.getPendingWithdrawals);
router.patch('/:id/accept', restrictTo('admin'), upload.single('file'), withdrawalsController.acceptWithdrawal);
router.patch('/:id/reject', restrictTo('admin'), withdrawalsController.rejectWithdrawal);

module.exports = router;
