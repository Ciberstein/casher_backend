const express = require("express");
const accountController = require("../controllers/accounts.controller");
const accountMiddleware = require("../middlewares/accounts.middleware");
const authCodesMiddleware = require("../middlewares/auth.codes.middleware");
const validation = require("../middlewares/validation.middleware");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.post(
  "/check",
  accountController.validateAuth
);
router.post(
  "/register",
  validation.register,
  accountMiddleware.validRegisterAccount,
  accountMiddleware.passwordsMatch,
  accountMiddleware.createAccount,
  authMiddleware.authCodeGenerate,
  authMiddleware.userHasCode,
  authMiddleware.sendMailCode,
  accountController.createAccount
);
router.post(
  "/register/validation/",
  validation.registerValidation,
  authMiddleware.authCodeExist,
  authMiddleware.authCodeExpired,
  authMiddleware.authCodeDelete,
  accountController.validateAccount
);
router.post(
  "/login",
  validation.login,
  accountMiddleware.validExistAccount,
  accountMiddleware.validLoginAccount,
  accountMiddleware.accountVerify,
  authMiddleware.authCodeGenerate,
  authMiddleware.userHasCode,
  authMiddleware.sendMailCode,
  accountController.loginAccount
);
router.post(
  "/login/firebase",
  validation.loginFirebase,
  accountMiddleware.firebase,
  accountMiddleware.accountVerify,
  authMiddleware.authCodeGenerate,
  authMiddleware.userHasCode,
  authMiddleware.sendMailCode,
  accountController.loginAccount
);
router.post(
  "/recovery",
  validation.recovery,
  accountMiddleware.validAuthCodeReceipt,
  authCodesMiddleware.authCodeGenerate,
  authCodesMiddleware.userHasCode,
  authMiddleware.sendMailCode,
  accountController.accountRecovery
);
router.post(
  "/recovery/validation",
  validation.recoveryValidation,
  accountMiddleware.passwordsMatch,
  authCodesMiddleware.authCodeExist,
  authCodesMiddleware.authCodeExpired,
  authMiddleware.authCodeDelete,
  accountController.accountRecoveryPassword
);
router.post(
  "/code",
  validation.sendAuthCode,
  accountMiddleware.validAuthCodeReceipt,
  authMiddleware.authCodeGenerate,
  authMiddleware.userHasCode,
  authMiddleware.sendMailCode,
  accountController.sendMailCode
);
router.post("/logout", 
  accountController.logout
);

router.use(authMiddleware.protect);

router.get("/", accountController.getAccountData);


module.exports = router;
