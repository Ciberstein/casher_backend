const express = require('express');
const bankAccountsController = require('../controllers/bank_accounts.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(authMiddleware.protect);

router.get('/', bankAccountsController.getMyBankAccounts);
router.post('/', bankAccountsController.createBankAccount);
router.put('/:id', bankAccountsController.updateBankAccount);
router.delete('/:id', bankAccountsController.deleteBankAccount);

module.exports = router;
