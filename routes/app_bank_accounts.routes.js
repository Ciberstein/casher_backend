const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const restrictTo = require('../middlewares/restrictTo');
const ctrl = require('../controllers/app_bank_accounts.controller');

const router = express.Router();

router.use(authMiddleware.protect);

router.get('/', ctrl.getAppBankAccounts);
router.post('/', restrictTo('admin'), ctrl.createAppBankAccount);
router.patch('/:id', restrictTo('admin'), ctrl.updateAppBankAccount);
router.delete('/:id', restrictTo('admin'), ctrl.deleteAppBankAccount);

module.exports = router;
