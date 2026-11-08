const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const { getCountries } = require('../controllers/countries.controller');
const router = express.Router();

router.use(authMiddleware.protect);
router.get('/', getCountries);

module.exports = router;
