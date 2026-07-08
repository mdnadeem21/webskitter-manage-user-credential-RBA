const transporter = require("../config/emailConfig")
const OtpModel = require("../models/OtpModel")

const sendEmail = async (req, user) => {
  // Generate a random 4-digit OTP and a random password
//   const otp = Math.floor(1000 + Math.random() * 9000);
  const randomPassword = Math.random().toString(36).slice(-8);

  // Save OTP in Database
//   await new OtpModel({ userId: user._id, otp }).save();

  const dummyLoginLink = `${process.env.APP_URL || "https://example.com"}/login`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: "Welcome! Your login details",
    text: `Hello ${user.name},\n\nYour account has been created with the following credentials:\nEmail: ${user.email}\nPassword: ${randomPassword}\n\nUse the link below to login:\n${dummyLoginLink}\n\nYour OTP is: ${otp}\n\nPlease keep this information secure.`,
    html: `
      <p>Dear ${user.name},</p>
      <p>Your account has been created successfully. Use the details below to sign in:</p>
      <ul>
        <li><strong>Email:</strong> ${user.email}</li>
        <li><strong>Password:</strong> ${randomPassword}</li>
      </ul>
      <p>Please login to your account using the above credentials and reset password for security purpose.</p>
      <p><a href="${dummyLoginLink}">Click here to login</a></p>
      <p>If you did not request this account, please ignore this email.</p>
    `,
  });

  return { randomPassword };
}

module.exports = sendEmail;