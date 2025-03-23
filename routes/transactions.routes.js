const express = require("express");
const transactionsControllers = require("../controllers/transactions.controllers");
const transactionsMiddlewares = require("../middlewares/transactions.middlewares");
const validation = require("../middlewares/validation.middleware");
const authMiddleware = require("../middlewares/auth.middleware");
const router = express.Router();

router.use(authMiddleware.protect);

router.get(
  "/:hash?",
  transactionsControllers.getTransactions
);

router.post(
  "/send",
  validation.validReceiver,
  transactionsMiddlewares.validReceiver,
  validation.validAmount,
  transactionsMiddlewares.validBalance,
  validation.validSend,
  transactionsControllers.sendPayment,
);

module.exports = router;
