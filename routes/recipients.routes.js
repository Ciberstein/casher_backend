const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const recipientsController = require('../controllers/recipients.controller');

const router = express.Router();

router.use(authMiddleware.protect);

router.get('/', recipientsController.getRecipients);
router.post('/', recipientsController.addRecipient);
router.delete('/:id', recipientsController.deleteRecipient);

module.exports = router;
