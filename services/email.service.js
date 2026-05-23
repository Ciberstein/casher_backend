const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// Fire-and-forget — never throws, never blocks a response.
const send = (to, subject, html) => {
  resend.emails.send({
    from: `"Casher" <${process.env.MAIL_SEND_ADDR}>`,
    to,
    subject,
    html,
  }).catch(err => console.error('[email] send failed:', err.message));
};

module.exports = { send };
