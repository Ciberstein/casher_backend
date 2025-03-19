const AppError = require("../utils/appError");

const handleCastError22P02 = (req, res, next) => {
  return new AppError("A data type is beign entered incorrectly", 400);
};

const handleJWTExpiredError = () =>
  new AppError("JWT has expired, please login again", 401);

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    stack: err.stack,
    error: err,
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    res.status(500).json({
      status: "fail",
      message: "Internal server error",
    });
  }
};

exports.globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "fail";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  }

  if (process.env.NODE_ENV === "production") {
    let error = err;

    console.log(error.name);

    if (error.parent?.code === "22P02") error = handleCastError22P02();
    if (error.name === "TokenExpiredError") error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};
