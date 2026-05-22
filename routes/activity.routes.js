const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const { getActivity } = require('../controllers/activity.controller');
const router = express.Router();

router.use(authMiddleware.protect);
router.get('/', getActivity);

module.exports = router;
