const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SENDMAIL_HOST,
  port: process.env.SENDMAIL_PORT,
  secure: true, // true para el puerto 465, false para otros puertos
  auth: {
    user: process.env.SENDMAIL_USER,
    pass: process.env.SENDMAIL_PASS,
  },
});

module.exports = { transporter };
