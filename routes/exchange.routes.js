const express = require('express');
const exchangeController = require('../controllers/exchange.controller');

const router = express.Router();

router.get('/', exchangeController.getExchangeRate);

module.exports = router;
