
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

if (process.env.NODE_ENV === "development") 
  app.use(morgan("dev"));

app.use("/ping", (_, r) => r.send("pong"));
app.use(cors(cors_conf));
app.use(cookieParser()); 
app.use(express.json());

router.use("/auth", accounts);
router.use("/transactions", transactions);

app.use("/api/v1", router);

app.use(globalErrorHandler);

module.exports = { server };
