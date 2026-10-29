const database = require("../Database/db");
const catchAsyncError = require("../Middlewares/catchAsyncError");
const { ErrorHandler } = require("../Middlewares/errorMiddlewares");
const sendEmail = require("../Utils/sendEmail");
const promoteToVendor = require("../Utils/promoteToVendor");
const { escapeHtml, emailLayout } = require("../Utils/emailTemplate");

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// USER: send a vendor request
const createVendorRequest = catchAsyncError(async (req, res, next) => {
  const { name, reason } = req.body;

  if (req.user.role !== "User") {
    return next(new ErrorHandler("Only users can request vendor access", 403));
  }
  if (!name?.trim() || !reason?.trim() || reason.trim().length < 20) {
    return next(
      new ErrorHandler("Name and a reason (min 20 chars) are required", 400),
    );
  }

  // email comes from the logged-in user, not from the form
  const email = req.user.email;

  const pending = await database.query(
    "SELECT id FROM vendor_requests WHERE user_id=$1 AND status='pending'",
    [req.user.id],
  );
  if (pending.rows.length > 0) {
    return next(new ErrorHandler("You already have a pending request", 400));
  }

  const result = await database.query(
    `INSERT INTO vendor_requests (user_id, name, email, reason)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [req.user.id, name.trim(), email, reason.trim()],
  );

  // notify admin (request stays saved even if the email fails)
  try {
    await sendEmail({
      email: process.env.ADMIN_EMAIL,
      subject: `New vendor request from ${name.trim()}`,
      message: emailLayout({
        heading: "New vendor request",
        content: `
          <p style="margin:0 0 16px;">A customer has applied to become a vendor on Shop Mate. Details are below.</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                 style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">
            <tr>
              <td style="padding:12px 16px;color:#6b7280;width:90px;">Name</td>
              <td style="padding:12px 16px;color:#111827;font-weight:bold;">${escapeHtml(name.trim())}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px;color:#6b7280;">Email</td>
              <td style="padding:12px 16px;color:#111827;">${escapeHtml(email)}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px;color:#6b7280;vertical-align:top;">Reason</td>
              <td style="padding:12px 16px;color:#111827;white-space:pre-wrap;">${escapeHtml(reason.trim())}</td>
            </tr>
          </table>
          <p style="margin:16px 0 0;">Please review this request in the admin dashboard and approve or decline it.</p>`,
        button: process.env.DASHBOARD_URL
          ? { label: "Review request", url: process.env.DASHBOARD_URL }
          : null,
      }),
    });
  } catch (e) {
    console.error("Admin notify failed:", e.message);
  }

  res.status(201).json({
    success: true,
    message: "Request sent to admin",
    request: result.rows[0],
  });
});

// ADMIN: list requests
const getVendorRequests = catchAsyncError(async (req, res, next) => {
  const status = ["pending", "approved", "rejected"].includes(req.query.status)
    ? req.query.status
    : "pending";
  const result = await database.query(
    "SELECT * FROM vendor_requests WHERE status=$1 ORDER BY created_at DESC",
    [status],
  );
  res.status(200).json({ success: true, requests: result.rows });
});

// ADMIN: approve
const approveVendorRequest = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  if (!uuidPattern.test(id)) return next(new ErrorHandler("Invalid ID", 400));

  const reqRow = await database.query(
    "SELECT * FROM vendor_requests WHERE id=$1 AND status='pending'",
    [id],
  );
  if (reqRow.rows.length === 0) {
    return next(new ErrorHandler("Pending request not found", 404));
  }

  // role change + approval email (throws and rolls back if the email fails)
  const user = await promoteToVendor(reqRow.rows[0].user_id);

  await database.query(
    "UPDATE vendor_requests SET status='approved', reviewed_at=NOW() WHERE id=$1",
    [id],
  );

  res.status(200).json({ success: true, message: "Request approved", user });
});

// ADMIN: reject
const rejectVendorRequest = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  if (!uuidPattern.test(id)) return next(new ErrorHandler("Invalid ID", 400));

  const raw = typeof req.body?.reason === "string" ? req.body.reason.trim() : "";
  const reason = raw.slice(0, 500) || null; // optional

  const result = await database.query(
    `UPDATE vendor_requests
     SET status='rejected', reviewed_at=NOW(), rejection_reason=$2
     WHERE id=$1 AND status='pending'
     RETURNING email, name`,
    [id, reason],
  );
  if (result.rows.length === 0) {
    return next(new ErrorHandler("Pending request not found", 404));
  }

  try {
    await sendEmail({
      email: result.rows[0].email,
      subject: "Update on your vendor request",
      message: emailLayout({
        heading: "Your vendor request",
        content: `
          <p style="margin:0 0 12px;">Hello ${escapeHtml(result.rows[0].name)},</p>
          <p style="margin:0 0 12px;">Thank you for your interest in becoming a vendor on Shop Mate. After reviewing your application, we are unable to approve it at this time.</p>
          ${
            reason
              ? `<div style="margin:16px 0;padding:12px 16px;background:#fef2f2;border-left:4px solid #dc2626;border-radius:4px;color:#7f1d1d;">
                   <strong>Reason:</strong><br/>${escapeHtml(reason)}
                 </div>`
              : ""
          }
          <p style="margin:0;">You are welcome to apply again in the future. Thank you for your understanding.</p>`,
      }),
    });
  } catch (e) {
    console.error("Reject email failed:", e.message);
  }

  res.status(200).json({ success: true, message: "Request rejected" });
});

module.exports = {
  createVendorRequest,
  getVendorRequests,
  approveVendorRequest,
  rejectVendorRequest,
};