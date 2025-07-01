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
  validation.validUser,
  transactionsMiddlewares.validUser,
  validation.validAmount,
  transactionsMiddlewares.validBalance,
  transactionsMiddlewares.validConfirmation,
  validation.validSend,
  transactionsControllers.sendPayment,
);

router.post(
  "/request",
  validation.validUser,
  transactionsMiddlewares.validUser,
  validation.validAmount,
  transactionsMiddlewares.validConfirmation,
  validation.validSend,
  transactionsControllers.requestPayment,
);

router.patch(
  "/request/:hash",
);

module.exports = router;
