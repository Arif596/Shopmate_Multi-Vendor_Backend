// const nodemailer = require("nodemailer");

// const sendEmail = async ({ email, subject, message }) => {
//   try {
//     const transporter = nodemailer.createTransport({
//       service: process.env.SMTP_SERVICE,
//       auth: {
//         user: process.env.SMTP_MAIL,
//         pass: process.env.SMTP_PASSWORD,
//       },
//     });

//     const options = {
//       from: process.env.SMTP_MAIL,
//       to: email,
//       subject,
//       html: message,
//     };

//     await transporter.sendMail(options);
//   } catch (err) {
//     console.error("Email sending failed:", err.message);
//     throw new Error("Email could not be sent");
//   }
// };

// module.exports = sendEmail;
// Production (Render): Resend HTTP API use hoti hai, kyunki free plan par SMTP block hai.
// Local: RESEND_API_KEY na ho to purana Nodemailer (Gmail SMTP) chalta rahega.

const sendWithResend = async ({ email, subject, message }) => {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || "ShopMate <onboarding@resend.dev>",
      to: [email],
      subject,
      html: message,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      `Resend error ${response.status}: ${data.message || JSON.stringify(data)}`,
    );
  }
  return data;
};

const sendWithNodemailer = async ({ email, subject, message }) => {
  const nodemailer = require("nodemailer");

  const transporter = nodemailer.createTransport({
    service: process.env.SMTP_SERVICE,
    auth: {
      user: process.env.SMTP_MAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_MAIL,
    to: email,
    subject,
    html: message,
  });
};

const sendEmail = async ({ email, subject, message }) => {
  try {
    if (process.env.RESEND_API_KEY) {
      const data = await sendWithResend({ email, subject, message });
      console.log("Email sent via Resend to", email, "id:", data.id);
    } else {
      await sendWithNodemailer({ email, subject, message });
      console.log("Email sent via SMTP to", email);
    }
  } catch (err) {
    console.error("Email sending failed:", err.message);
    throw new Error("Email could not be sent");
  }
};

module.exports = sendEmail;
