const express = require('express');
const multer = require('multer');
const authMiddleware = require('../middlewares/auth.middleware');
const { uploadFile } = require('../controllers/upload.controller');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(authMiddleware.protect);

router.post('/', upload.single('file'), uploadFile);

module.exports = router;
