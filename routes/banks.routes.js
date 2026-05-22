const express = require('express');
const router = express.Router();
const banksController = require('../controllers/banks.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.get('/', authMiddleware.protect, banksController.getBanks);

module.exports = router;
