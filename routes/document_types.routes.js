const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const { getDocumentTypes } = require('../controllers/document_types.controller');
const router = express.Router();

router.use(authMiddleware.protect);
router.get('/', getDocumentTypes);

module.exports = router;
