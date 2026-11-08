const express = require("express");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const accountController = require("../controllers/accounts.controller");
const sessionsController = require("../controllers/sessions.controller");
const accountMiddleware = require("../middlewares/accounts.middleware");
const authCodesMiddleware = require("../middlewares/auth.codes.middleware");
const validation = require("../middlewares/validation.middleware");
const authMiddleware = require("../middlewares/auth.middleware");
const turnstileMiddleware = require("../middlewares/turnstile.middleware");

const router = express.Router();

// Frena el adivinado de códigos de 6 dígitos. Se limita por cuenta (no por IP: tras el proxy
// todas las IP serían la misma y un usuario bloquearía a los demás).
const twoFactorLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) =>
    String(req.sessionAccount?.id ?? jwt.decode(req.body?.challenge)?.id ?? "anonymous"),
  handler: (_, res) =>
    res.status(429).json({ status: "error", message: "Demasiados intentos, intenta de nuevo en unos minutos" }),
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.post(
  "/check",
  accountController.validateAuth
);
router.post(
  "/register",
  turnstileMiddleware.verifyTurnstile,
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
  turnstileMiddleware.verifyTurnstile,
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
  "/login/2fa",
  twoFactorLimiter,
  accountController.loginTwoFactor
);
router.post(
  "/recovery",
  turnstileMiddleware.verifyTurnstile,
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
router.post("/disconnect", 
  accountController.logout
);
router.post(
  "/refresh",
  authMiddleware.authRefresh,
  accountController.authRefresh,
);

router.post(
  "/validate",
  authMiddleware.authRefresh,
  accountController.validateSession
);

router.use(authMiddleware.protect);

router.get("/admin/users", authMiddleware.isAdmin, accountController.getUsers);
router.patch("/admin/users/:id", authMiddleware.isAdmin, accountController.adminUpdateUser);
router.patch("/admin/users/:id/password", authMiddleware.isAdmin, accountController.adminUpdateUserPassword);
router.patch("/admin/users/:id/picture",authMiddleware.isAdmin, upload.single('avatar'), accountController.adminUpdateUserPicture);

router.post("/2fa/setup", accountController.twoFactorSetup);
router.post("/2fa/enable", twoFactorLimiter, accountController.twoFactorEnable);
router.post("/2fa/disable", twoFactorLimiter, accountController.twoFactorDisable);

router.get("/sessions", sessionsController.listSessions);
router.delete("/sessions", sessionsController.revokeOtherSessions);
router.delete("/sessions/:id", sessionsController.revokeSession);
router.get("/trusted-devices", sessionsController.listTrustedDevices);
router.post("/trusted-devices", sessionsController.addTrustedDevice);
router.delete("/trusted-devices/:id", sessionsController.revokeTrustedDevice);

router.get("/", accountController.getAccountData);
router.post("/pay", accountController.payBalance);

router.patch(
  "/update/email",
  validation.updateEmail,
  accountMiddleware.emailsValidations,
  authMiddleware.authCodeGenerate,
  authMiddleware.userHasCode,
  authMiddleware.sendMailCode,
  accountController.updateEmailCode
);
router.patch(
  "/update/email/validation",
  validation.updateEmailValidation,
  authMiddleware.authCodeExist,
  authMiddleware.authCodeExpired,
  authMiddleware.authCodeDelete,
  accountController.updateEmail
);
router.patch(
  "/update/region",
  accountController.updateRegion
);
router.patch(
  "/update/currency",
  accountController.updateCurrency
);
router.patch(
  "/update/profile",
  upload.single('avatar'),
  accountController.updateProfile
);
router.patch(
  "/update/personal",
  validation.updatePersonalData,
  accountController.updatePersonalData
);
router.patch(
  "/update/password",
  validation.updatePasword,
  accountMiddleware.updatePasword,
  authMiddleware.authCodeGenerate,
  authMiddleware.userHasCode,
  authMiddleware.sendMailCode,
  accountController.updatePaswordCode
);
router.patch(
  "/update/password/validation",
  validation.updatePaswordValidation,
  authMiddleware.authCodeExist,
  authMiddleware.authCodeExpired,
  authMiddleware.authCodeDelete,
  accountController.updatePassword
);

module.exports = router;
