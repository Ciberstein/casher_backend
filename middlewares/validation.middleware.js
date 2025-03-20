const { body, validationResult, param } = require("express-validator");

const validFields = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: "error",
      errors: errors.mapped(),
    });
  }

  next();
};

exports.register = [
  body("first_name")
    .notEmpty()
    .withMessage("First name cannot be empty"),
  body("last_name")
    .notEmpty()
    .withMessage("Last name cannot be empty"),
  body("email")
    .notEmpty()
    .withMessage("Email cannot be empty")
    .isEmail()
    .withMessage("Must be a valid email"),
  body("password")
    .notEmpty()
    .withMessage("Password cannot be empty")
    .isLength({ min: 8 })
    .withMessage("The password must have at least 8 characters"),
  body("password_repeat")
    .notEmpty()
    .withMessage("Password repeat cannot be empty")
    .isLength({ min: 8 })
    .withMessage("The password must have at least 8 characters"),

  validFields,
];

exports.login = [
  body("email")
    .notEmpty()
    .withMessage("Email cannot be empty")
    .isEmail()
    .withMessage("Must be a valid email")
    .trim(),
  body("password")
    .notEmpty()
    .withMessage("Password cannot be empty"),

  validFields,
];

exports.authCode = [
  body("code")
    .notEmpty()
    .withMessage("Auth code cannot be empty")
    .isNumeric()
    .withMessage("Must be a valid number")
    .trim(),

  validFields,
];

exports.recovery = [
  body("email")
    .notEmpty()
    .withMessage("Email cannot be empty")
    .isEmail()
    .withMessage("Must be a valid email")
    .trim(),

  validFields,
];

exports.recoveryValidation = [
  body("accountId")
    .notEmpty()
    .withMessage("Account ID is required")
    .isInt()
    .withMessage("Account ID must be a valid integer"),
  body("code")
    .notEmpty()
    .withMessage("Auth code is required")
    .isInt()
    .withMessage("Account ID must be a valid integer"),
  body("password")
    .notEmpty()
    .withMessage("Password cannot be empty")
    .isLength({ min: 8 })
    .withMessage("The password must have at least 8 characters"),
  body("password_repeat")
    .notEmpty()
    .withMessage("Password repeat cannot be empty")
    .isLength({ min: 8 })
    .withMessage("The password repeat must have at least 8 characters"),

  validFields,
];

exports.sendAuthCode = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Valid email is required"),

  validFields,
];

exports.registerValidation = [
  body("accountId")
    .notEmpty()
    .withMessage("Account ID is required")
    .isInt()
    .withMessage("Account ID must be a valid integer"),
  body("code")
    .notEmpty()
    .withMessage("Auth code is required")
    .isInt()
    .withMessage("Auth code must be a valid integer"),

  validFields,
];

exports.loginFirebase = [
  body("token")
    .notEmpty()
    .withMessage("Token cannot be empty")
    .trim(),

  validFields,
];