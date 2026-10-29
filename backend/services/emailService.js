const nodemailer = require('nodemailer');

/**
 * Creates nodemailer transport if SMTP credentials are provided.
 */
function getTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return null;
  }

  try {
    return nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: Number(SMTP_PORT) === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      }
    });
  } catch (err) {
    console.error('Failed to initialize SMTP transporter:', err.message);
    return null;
  }
}

/**
 * Send notification upon complaint submission.
 */
async function sendComplaintSubmittedEmail(citizenEmail, complaint) {
  if (!citizenEmail || typeof citizenEmail !== 'string' || !citizenEmail.includes('@')) {
    // Safely skip anonymous or email-less complaints
    return { sent: false, skipped: true, reason: 'No citizen email provided' };
  }

  const transporter = getTransporter();
  if (!transporter) {
    console.log('[EmailService] Notification skipped: email service not configured (SMTP credentials absent).');
    return { sent: false, skipped: true, reason: 'SMTP not configured' };
  }

  try {
    const fromAddress = process.env.EMAIL_FROM || 'no-reply@ciw-police.gov';
    const mailOptions = {
      from: `"Crime Investigation Portal" <${fromAddress}>`,
      to: citizenEmail,
      subject: `Complaint Received: ${complaint.complaintId || 'Case Confirmation'}`,
      text: `Hello,\n\nYour complaint has been successfully recorded in our system.\n\nCase Reference ID: ${complaint.complaintId}\nIncident Title: ${complaint.title}\nCategory: ${complaint.category}\nStatus: Pending Review\n\nYou can track the progress of your case using our Public Tracking Portal at any time by providing your Case ID and registered email.\n\nThank you,\nCentral Police Department Crime Investigation Unit`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #0b1c39; margin-bottom: 8px;">Incident Complaint Registered</h2>
          <p style="color: #555;">Your incident report has been securely registered with the Crime Investigation Unit.</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 4px 0;"><strong>Case ID:</strong> <span style="color: #0d6efd; font-weight: bold;">${complaint.complaintId}</span></p>
            <p style="margin: 4px 0;"><strong>Incident Title:</strong> ${complaint.title}</p>
            <p style="margin: 4px 0;"><strong>Category:</strong> ${complaint.category}</p>
            <p style="margin: 4px 0;"><strong>Current Status:</strong> <span style="background: #ffc107; color: #000; padding: 2px 8px; border-radius: 4px; font-size: 12px;">Pending</span></p>
          </div>
          <p style="color: #555;">You can track this case using the public tracking portal with your Reference ID and account email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <small style="color: #888;">This is an automated notification from Central Police Department. Please do not reply directly to this email.</small>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('[EmailService] Complaint submission email sent to:', citizenEmail, info.messageId);
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    // CRITICAL RULE: Email failure must NEVER fail the complaint submission
    console.error('[EmailService] Failed to deliver complaint submission email:', err.message);
    return { sent: false, error: err.message };
  }
}

/**
 * Send notification upon complaint status change.
 */
async function sendComplaintStatusChangedEmail(citizenEmail, complaint, newStatus, note = '') {
  if (!citizenEmail || typeof citizenEmail !== 'string' || !citizenEmail.includes('@')) {
    return { sent: false, skipped: true, reason: 'No citizen email provided' };
  }

  const transporter = getTransporter();
  if (!transporter) {
    console.log('[EmailService] Notification skipped: email service not configured (SMTP credentials absent).');
    return { sent: false, skipped: true, reason: 'SMTP not configured' };
  }

  try {
    const fromAddress = process.env.EMAIL_FROM || 'no-reply@ciw-police.gov';
    const noteText = note ? `\nOfficer Remarks: ${note}` : '';
    const noteHtml = note ? `<p style="margin: 4px 0;"><strong>Officer Remarks:</strong> ${note}</p>` : '';

    const mailOptions = {
      from: `"Crime Investigation Portal" <${fromAddress}>`,
      to: citizenEmail,
      subject: `Case Status Updated: ${complaint.complaintId || 'Case Reference'} [${newStatus}]`,
      text: `Hello,\n\nThe status of your registered incident complaint has been updated.\n\nCase Reference ID: ${complaint.complaintId}\nTitle: ${complaint.title}\nNew Status: ${newStatus}${noteText}\n\nYou can log in to your Citizen Dashboard to review full case details.\n\nThank you,\nCentral Police Department Crime Investigation Unit`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #0b1c39; margin-bottom: 8px;">Case Status Update Notice</h2>
          <p style="color: #555;">There has been an official update regarding your case investigation.</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 4px 0;"><strong>Case ID:</strong> <span style="color: #0d6efd; font-weight: bold;">${complaint.complaintId}</span></p>
            <p style="margin: 4px 0;"><strong>Incident Title:</strong> ${complaint.title}</p>
            <p style="margin: 4px 0;"><strong>Updated Status:</strong> <span style="background: #0d6efd; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${newStatus}</span></p>
            ${noteHtml}
          </div>
          <p style="color: #555;">Please log in to your Citizen Portal to view full notes, evidence logs, and investigation timeline.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <small style="color: #888;">This is an automated notification from Central Police Department. Please do not reply directly to this email.</small>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('[EmailService] Status change email sent to:', citizenEmail, info.messageId);
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    // CRITICAL RULE: Email failure must NEVER fail the status update
    console.error('[EmailService] Failed to deliver status change email:', err.message);
    return { sent: false, error: err.message };
  }
}

module.exports = {
  sendComplaintSubmittedEmail,
  sendComplaintStatusChangedEmail
};

