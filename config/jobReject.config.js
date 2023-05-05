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

module.exports.sendJobReject = async (email, username, jobTitle) => {
  console.log("Check");

  const message = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Identity Rejected",
    html: `<h1>Identity Rejected</h1>
          <h2>Hello ${username}</h2>
          <p>The job (${jobTitle}) you posted was rejected due to that it does not meet up to our standard, thank you.
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
