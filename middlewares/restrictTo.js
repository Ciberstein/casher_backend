const AppError = require("../utils/appError");

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.sessionAccount.role))
      next(
        new AppError("You do not have permission to perform this account", 403)
      );

    next();
  };
};

module.exports = restrictTo;
