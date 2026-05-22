const express = require("express");
const transfersControllers = require("../controllers/transfers.controllers");
const transfersMiddlewares = require("../middlewares/transfers.middlewares");
const validation = require("../middlewares/validation.middleware");
const authMiddleware = require("../middlewares/auth.middleware");
const router = express.Router();

router.use(authMiddleware.protect);

router.get(
  "/:hash?",
  transfersControllers.getTransfers
);

router.post(
  "/send",
  validation.validUser,
  transfersMiddlewares.validUser,
  validation.validAmount,
  transfersMiddlewares.validBalance,
  transfersMiddlewares.validConfirmation,
  validation.validSend,
  transfersControllers.sendPayment,
);

router.post(
  "/request",
  validation.validUser,
  transfersMiddlewares.validUser,
  validation.validAmount,
  transfersMiddlewares.validConfirmation,
  validation.validSend,
  transfersControllers.requestPayment,
);

router.patch(
  "/request/:id",
  validation.validIdParam,
  validation.validManageTx,
  transfersMiddlewares.txById,
  transfersMiddlewares.manageTx,
  transfersControllers.updateTx
);

module.exports = router;
