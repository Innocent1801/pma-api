const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

dotenv.config();

const transport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

module.exports.sendIdentityEmail = async (email) => {
  console.log("Check");
  const message = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Identity Rejected",
    html: `<h1>Identity Rejected</h1>
          <h2>Hello ${email}</h2>
          <p>The ID for means of identification you provided was rejected. Please try to upload a more clearer and detailed means of identification, thank you.
          </p>
          </div>`,
  };

  await new Promise((resolve, reject) => {
    transport.sendMail(message, (err, info) => {
      if (err) {
        console.log(err);
      } else {
        console.log(info);
      }
    });
  });
};
