const nodemailer = require("nodemailer");

async function test() {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      auth: {
        user: "gauswarn@gmail.com",
        pass: "kwqu coum lnax zlqs",
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const info = await transporter.sendMail({
      from: '"Test" <gauswarn@gmail.com>',
      to: "gauswarn@gmail.com",
      subject: "Test email",
      text: "Test email from local backend",
    });
    console.log("Success:", info.messageId);
  } catch (err) {
    console.error("Error:", err);
  }
}
test();
