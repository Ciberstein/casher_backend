const express = require('express');
const loansController = require('../controllers/loans.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const restrictTo = require('../middlewares/restrictTo');

const router = express.Router();

router.use(authMiddleware.protect);

router.post('/', loansController.createLoan);
router.get('/', loansController.getMyLoans);
router.patch('/:id/cancel', loansController.cancelLoan);

router.get('/admin', restrictTo('admin'), loansController.getPendingLoans);
router.patch('/:id/accept', restrictTo('admin'), loansController.acceptLoan);
router.patch('/:id/reject', restrictTo('admin'), loansController.rejectLoan);

module.exports = router;
