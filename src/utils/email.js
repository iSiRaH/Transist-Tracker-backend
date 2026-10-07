const nodemailer = require('nodemailer');

const createTransporter = () => {
  if (
    process.env.EMAIL_HOST &&
    process.env.EMAIL_USERNAME &&
    process.env.EMAIL_PASSWORD
  ) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: Number(process.env.EMAIL_PORT) === 465,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  return null;
};

const sendEmail = async ({ to, subject, text, html }) => {
  const from =
    process.env.EMAIL_FROM ||
    (process.env.EMAIL_USERNAME
      ? `"Transit Tracker" <${process.env.EMAIL_USERNAME}>`
      : '"Transit Tracker" <noreply@transittracker.com>');

  const mailOptions = {
    from,
    to,
    subject,
    text,
    html: html || `<p>${(text || '').replace(/\n/g, '<br>')}</p>`,
  };

  const transporter = createTransporter();

  if (!transporter) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Email service is not configured on the server');
    }
    // Development or test environment without configured SMTP
    console.log(`[Email Service - Simulated] To: ${to}`);
    console.log(`[Email Service - Simulated] Subject: ${subject}`);
    console.log(`[Email Service - Simulated] Text:\n${text}`);
    return { accepted: [to], messageId: 'simulated-dev-id' };
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    if (
      info &&
      Array.isArray(info.rejected) &&
      info.rejected.length > 0 &&
      (!info.accepted || !info.accepted.includes(to))
    ) {
      throw new Error(`Email recipient ${to} was rejected by the mail server`);
    }
    return info;
  } catch (error) {
    console.error(
      `[Email Service Error] Failed sending to ${to}:`,
      error.message,
    );
    throw error;
  }
};

const buildCodeTemplate = ({
  name,
  code,
  actionName,
  description,
  warning,
}) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px; }
    .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #1e3c72, #2a5298); padding: 28px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px; }
    .content { padding: 32px 28px; color: #333333; line-height: 1.6; }
    .greeting { font-size: 16px; margin-bottom: 16px; }
    .description { font-size: 15px; color: #555555; margin-bottom: 24px; }
    .code-box { background: #f0f4ff; border: 2px dashed #3b82f6; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px; }
    .code { font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #1e3c72; font-family: 'Courier New', monospace; }
    .expiry { font-size: 13px; color: #6b7280; margin-top: 8px; }
    .warning { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; font-size: 13px; color: #92400e; margin-bottom: 20px; border-radius: 0 6px 6px 0; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #9ca3af; border-top: 1px solid #f0f0f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Transit Tracker</h1>
    </div>
    <div class="content">
      <div class="greeting">Hello ${name || 'User'},</div>
      <div class="description">${description}</div>
      <div class="code-box">
        <div class="code">${code}</div>
        <div class="expiry">This verification code is valid for 10 minutes.</div>
      </div>
      <div class="warning">
        <strong>Security Notice:</strong> ${warning || 'Never share this code with anyone. Transit Tracker staff will never ask for your verification code.'}
      </div>
      <p style="font-size: 13px; color: #6b7280; margin: 0;">If you did not request this ${actionName}, please disregard this email or update your account password immediately.</p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Transit Tracker. All rights reserved.
    </div>
  </div>
</body>
</html>
`;

const sendVerificationCodeEmail = async ({
  to,
  name,
  code,
  action,
  warning,
}) => {
  let subject = 'Your Verification Code - Transit Tracker';
  let description =
    'Please enter the following 6-digit verification code to complete your request.';
  let actionName = 'action';

  if (action === 'forgot-password') {
    subject = 'Transit Tracker - Password Reset Verification Code';
    actionName = 'password reset';
    description =
      'We received a request to reset your Transit Tracker account password. Use the verification code below to proceed.';
  } else if (action === 'deactivate-account') {
    subject = 'Transit Tracker - Account Deactivation Verification Code';
    actionName = 'account deactivation';
    description =
      'You requested to deactivate your Transit Tracker account. Enter this verification code to confirm.';
  } else if (action === 'delete-account') {
    subject = 'CRITICAL: Transit Tracker - Account Deletion Verification Code';
    actionName = 'account deletion';
    description =
      'A request was made to permanently delete your Transit Tracker account and all associated data. Enter this code to verify.';
  }

  const text = `Hello ${name || 'User'},\n\nYour verification code for ${actionName} is:\n\n${code}\n\nThis code will expire in 10 minutes.\n\n${warning || 'Never share this code with anyone.'}\n\nIf you did not make this request, please secure your account immediately.\n\nTransit Tracker Team`;

  const html = buildCodeTemplate({
    name,
    code,
    actionName,
    description,
    warning,
  });

  return sendEmail({ to, subject, text, html });
};

const sendSecurityAlertEmail = async ({ to, name, subject, message }) => {
  const text = `Hello ${name || 'User'},\n\n${message}\n\nDate: ${new Date().toUTCString()}\n\nIf you did not authorize this change, please contact support immediately.\n\nTransit Tracker Team`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px; }
    .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .header { background: #1e3c72; padding: 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 22px; }
    .content { padding: 28px; color: #333333; line-height: 1.6; }
    .notice-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 18px 0; font-size: 15px; }
    .footer { text-align: center; padding: 18px; font-size: 12px; color: #9ca3af; border-top: 1px solid #f0f0f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Transit Tracker Security Alert</h1>
    </div>
    <div class="content">
      <p>Hello ${name || 'User'},</p>
      <div class="notice-box">${message}</div>
      <p style="font-size: 13px; color: #6b7280;">If you did not perform this action, please contact support immediately.</p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Transit Tracker. All rights reserved.
    </div>
  </div>
</body>
</html>
`;

  return sendEmail({ to, subject, text, html });
};

const sendWelcomeEmail = async ({ to, name, role = 'user' }) => {
  const roleDisplay = role.charAt(0).toUpperCase() + role.slice(1);
  const subject = `Welcome to Transit Tracker, ${name || 'Rider'}!`;
  const text = `Hello ${name || 'User'},\n\nWelcome to Transit Tracker! Your account has been registered as a ${roleDisplay}.\n\nYou can now log in and start using our public transit tracking and management services.\n\nTransit Tracker Team`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px; }
    .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #10b981, #059669); padding: 28px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 28px; color: #333333; line-height: 1.6; }
    .footer { text-align: center; padding: 18px; font-size: 12px; color: #9ca3af; border-top: 1px solid #f0f0f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to Transit Tracker!</h1>
    </div>
    <div class="content">
      <p>Hello <strong>${name || 'User'}</strong>,</p>
      <p>Thank you for joining Transit Tracker as a <strong>${roleDisplay}</strong>! We're excited to have you on board.</p>
      <p>You can now sign in to your account, track real-time transit routes, and manage your schedules seamlessly.</p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Transit Tracker. All rights reserved.
    </div>
  </div>
</body>
</html>
`;

  return sendEmail({ to, subject, text, html });
};

module.exports = {
  sendEmail,
  sendVerificationCodeEmail,
  sendSecurityAlertEmail,
  sendWelcomeEmail,
};
