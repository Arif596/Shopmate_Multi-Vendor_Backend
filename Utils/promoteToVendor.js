const database = require("../Database/db");
const { ErrorHandler } = require("../Middlewares/errorMiddlewares");
const sendEmail = require("./sendEmail");
const { escapeHtml, emailLayout } = require("./emailTemplate");

const promoteToVendor = async (id) => {
  const result = await database.query(
    `UPDATE users
     SET role='Vendor'
     WHERE id=$1 AND role='User'
     RETURNING id, name, email, role`,
    [id],
  );
  if (result.rows.length === 0) {
    throw new ErrorHandler("Only a User account can be promoted", 404);
  }
  const user = result.rows[0];

  try {
    await sendEmail({
      email: user.email,
      subject: "You are now a Vendor",
      message: emailLayout({
        heading: "Vendor request approved",
        content: `
          <p style="margin:0 0 12px;">Hello ${escapeHtml(user.name)},</p>
          <p style="margin:0;">Your vendor request has been approved. You can now sign in to the vendor dashboard with your existing email and password.</p>`,
      }),
    });
  } catch (error) {
    // role already change ho chuka hai; email fail hone par rollback nahi karte
    console.error("Vendor approval email failed:", error.message);
  }

  return user;
};

module.exports = promoteToVendor;