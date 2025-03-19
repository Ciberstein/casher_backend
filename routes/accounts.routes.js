const express = require("express");
const accountController = require("../controllers/accounts.controller");
const accountMiddleware = require("../middlewares/accounts.middleware");
const authCodesMiddleware = require("../middlewares/auth.codes.middleware");
const validation = require("../middlewares/validation.middleware");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.post(
  "/register",
  validation.register,
  accountMiddleware.validRegisterAccount,
  accountController.createAccount
);
router.post(
  "/login",
  validation.login,
  accountMiddleware.validExistAccount,
  accountMiddleware.validLoginAccount,
  authCodesMiddleware.validNotExistCode,
  authCodesMiddleware.validUserHasCode,
  accountController.sendLoginAuthCode
);
router.post(
  "/login/validation",
  validation.authCode,
  authCodesMiddleware.validExistCode,
  authCodesMiddleware.validExpiredCode,
  accountController.loginAccount
);
router.post(
  "/recovery",
  validation.recovery,
  accountMiddleware.validExistAccount,
  authCodesMiddleware.validNotExistCode,
  authCodesMiddleware.validUserHasCode,
  accountController.sendRecoveryAuthCode
);
router.post(
  "/recovery/validation",
  validation.authCode,
  authCodesMiddleware.validExistCode,
  authCodesMiddleware.validExpiredCode,
  accountController.recoverySession
);

router.use(authMiddleware.recovery);

router.patch(
  "/recovery/password",
  validation.recoveryPassword,
  accountMiddleware.validRecoveryPassword,
  accountController.recoveryPassword
);

//router.use(authMiddleware.protect);

//router.get("/", accountControllers.getAccountDetails);

module.exports = router;
