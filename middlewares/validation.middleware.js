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

  validFields,
];

exports.login = [
  body("email")
    .notEmpty()
    .withMessage("Email cannot be empty")
    .isEmail()
    .withMessage("Must be a valid email")
    .trim(),
  body("password").notEmpty().withMessage("Password cannot be empty"),

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

exports.recoveryPassword = [
  body("password")
    .notEmpty()
    .withMessage("Password cannot be empty")
    .isLength({ min: 8 })
    .withMessage("The password must have at least 8 characters"),

  body("password_repeat").notEmpty().withMessage("Password cannot be empty"),

  validFields,
];
