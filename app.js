
const { cors: cors_conf } = require('./cors/config');
const cookieParser = require('cookie-parser');
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const http = require('http');
const app = express();

const server = http.createServer(app);
const router = express.Router();

// CONTROLLERS //
const { globalErrorHandler } = require("./controllers/error.controllers");

// ROUTES //
const accounts = require("./routes/accounts.routes");
const transactions = require("./routes/transactions.routes");
const exchange = require("./routes/exchange.routes");
const loans = require("./routes/loans.routes");
const bankAccounts = require("./routes/bank_accounts.routes");
const withdrawals = require("./routes/withdrawals.routes");
const banks = require("./routes/banks.routes");
const activity = require("./routes/activity.routes");
const documentTypes = require("./routes/document_types.routes");

if (process.env.NODE_ENV === "development") 
  app.use(morgan("dev"));

app.use("/ping", (_, r) => r.send("pong"));
app.use(cors(cors_conf));
app.use(cookieParser()); 
app.use(express.json());

router.use("/auth", accounts);
router.use("/transactions", transactions);
router.use("/exchange", exchange);
router.use("/loans", loans);
router.use("/bank-accounts", bankAccounts);
router.use("/withdrawals", withdrawals);
router.use("/banks", banks);
router.use("/activity", activity);
router.use("/document-types", documentTypes);

app.use("/api/v1", router);

app.use(globalErrorHandler);

module.exports = { server };
