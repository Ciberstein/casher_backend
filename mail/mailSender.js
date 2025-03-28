const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const mailSender = async (to, subject, body) => {

  const html = `
    <div
      style="
        width: 100%;
        padding-top: 4rem;
        padding-bottom: 4rem;
        background-image: url('https://ci5.googleusercontent.com/proxy/DbYaX2yV8PZiUqzFp5SttQgikNDG4EEJzsDtBmM9gBIp3FTPHbVETCt-YIOEK8we3vx07VIIQ_yNcFalwVbHZYBsh1job2TXYh2vG1C38A=s0-d-e1-ft#https://static2.cdn.ubi.com/email/images/grey-background.png');
        text-align: center;
        font-size: 15px;
    ">
      <div
        style="
          background: white;
          width: 600px;
          margin: auto;
          border-radius: 8px;
          overflow: hidden;
        "
      >
        <div
          style="
            padding: 1rem;
            padding-bottom: 4rem;
            text-align: left;
            color: black;
          "
        >
          <p>${body}</p>
          <br />
          <span>Sincerely,</span>
          <br />
          <br />
          <span>Casher team</span>
        </div>
      </div>
    </div>`;

  resend.emails.send(
    {
      from: `"Casher" <${process.env.SENDMAIL_ADDR}>`,
      to,
      subject,
      html,
    },
  );

  return true;
};

module.exports = mailSender;
