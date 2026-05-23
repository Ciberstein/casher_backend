const express = require('express');
const multer = require('multer');
const ctrl = require('../controllers/deposit_requests.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const restrictTo = require('../middlewares/restrictTo');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(authMiddleware.protect);

router.post('/', upload.single('file'), ctrl.createDepositRequest);
router.get('/', ctrl.getMyDepositRequests);
router.patch('/:id/cancel', ctrl.cancelDepositRequest);

router.get('/admin', restrictTo('admin'), ctrl.getDepositRequests);
router.patch('/:id/accept', restrictTo('admin'), ctrl.acceptDepositRequest);
router.patch('/:id/reject', restrictTo('admin'), ctrl.rejectDepositRequest);

module.exports = router;
