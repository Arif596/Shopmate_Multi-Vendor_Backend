const escapeHtml = (s = "") =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const emailLayout = ({ heading, content, button }) => `
<div style="background:#f4f5f7;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
         style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    <tr>
      <td style="background:#4f46e5;padding:20px 28px;color:#ffffff;font-size:18px;font-weight:bold;">
        Shop Mate
      </td>
    </tr>
    <tr>
      <td style="padding:28px;color:#374151;font-size:15px;line-height:1.6;">
        <h2 style="margin:0 0 16px;font-size:20px;color:#111827;">${heading}</h2>
        ${content}
        ${
          button
            ? `<p style="margin:28px 0 0;">
                 <a href="${button.url}"
                    style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;
                           padding:12px 22px;border-radius:8px;font-weight:bold;font-size:14px;">
                   ${button.label}
                 </a>
               </p>`
            : ""
        }
      </td>
    </tr>
    <tr>
      <td style="padding:16px 28px;background:#f9fafb;color:#9ca3af;font-size:12px;">
        This is an automated message from Shop Mate. Please do not reply to this email.
      </td>
    </tr>
  </table>
</div>`;

module.exports = { escapeHtml, emailLayout };