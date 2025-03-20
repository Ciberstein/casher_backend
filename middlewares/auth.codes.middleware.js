const AppError = require("../utils/appError");
const Codes = require("../models/auth.codes.model");
const generateCode = require("../utils/generateCode");
const Account = require("../models/accounts.model");

exports.authCodeExist = async (req, res, next) => {
  const { code } = req.body;

  const code_exist = await Codes.findOne({
    where: { code },
    include: [{ 
      model: Account,
      attributes: ["id", "email", "status"],
    }],
  });

  if (!code_exist) next(new AppError("Invalid code", 401));

  req.code = code_exist;

  next();
};

exports.authCodeGenerate = async (req, res, next) => {
  let code;
  let code_exist;

  do {
    code = generateCode().toString();

    code_exist = await Codes.findOne({
      where: { code },
    });
  } while (code_exist);

  req.code = code;

  next();
};

exports.userHasCode = async (req, res, next) => {
  const { account, code } = req;

  const query = await Codes.findOne({
    where: { accountId: account.id, },
  });

  if (query) {
    const now = new Date();
    const dif = (now - query.updatedAt) / 1000;
    const limit = process.env.SENDMAIL_TIME_LIMIT;

    if (dif < limit) {
      next(
        new AppError(
          `You must wait a few seconds before generating another code`,
          401
        )
      );
    }

    await query.update({
      code,
    });
  } else {
    await Codes.create({
      code,
      accountId: account.id,
    });
  }

  next();
};

exports.authCodeExpired = async (req, res, next) => {
  const { code } = req;

  const limit = process.env.CODE_EXPIRE_IN * 1000;
  const now = new Date();
  const dif = now - code.updatedAt;

  if (dif > limit) {
    next(new AppError("Code expired", 401));
  }

  next();
};
