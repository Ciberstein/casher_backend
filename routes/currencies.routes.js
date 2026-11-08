const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const { getCurrencies } = require('../controllers/currencies.controller');
const router = express.Router();

router.use(authMiddleware.protect);
router.get('/', getCurrencies);

module.exports = router;
