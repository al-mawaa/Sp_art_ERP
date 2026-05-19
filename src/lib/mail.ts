import nodemailer from 'nodemailer';

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
const EMAIL_HOST = process.env.EMAIL_HOST ?? 'smtp.gmail.com';
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT ?? '587', 10);
const EMAIL_SECURE = process.env.EMAIL_SECURE === 'true' || EMAIL_PORT === 465;
const EMAIL_FROM = process.env.EMAIL_FROM ?? EMAIL_USER;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? 'http://localhost:3000';

if (!EMAIL_USER || !EMAIL_PASSWORD) {
  throw new Error('Missing SMTP email credentials. Please set EMAIL_USER and EMAIL_PASSWORD in environment variables.');
}

const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: EMAIL_SECURE,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASSWORD,
  },
});

const roleLabels: Record<string, string> = {
  student: 'Student',
  teacher: 'Teacher',
  senior_teacher: 'Senior Teacher',
};

const buildCredentialEmail = ({
  name,
  role,
  username,
  password,
}: {
  name: string;
  role: string;
  username: string;
  password: string;
}) => {
  const roleLabel = roleLabels[role] ?? role;
  const loginUrl = `${APP_URL}/login`;
  const html = `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#111;"><h2>Your ${roleLabel} account is ready</h2><p>Hi ${name},</p><p>Your ${roleLabel.toLowerCase()} account has been created successfully. Use the credentials below to sign in:</p><ul><li><strong>Username:</strong> ${username}</li><li><strong>Password:</strong> ${password}</li></ul><p>Login at <a href="${loginUrl}">${loginUrl}</a></p><p>Please change your password after signing in for the first time.</p><p>Thanks,<br/>SpArt ERP Team</p></div>`;
  const text = `Your ${roleLabel} account is ready

Hi ${name},

Your ${roleLabel.toLowerCase()} account has been created successfully. Use the credentials below to sign in:

Username: ${username}
Password: ${password}

Login at: ${loginUrl}

Please change your password after signing in for the first time.

Thanks,
SpArt ERP Team`;

  return { html, text };
};

export async function sendCredentialEmail({
  to,
  name,
  role,
  username,
  password,
}: {
  to: string;
  name: string;
  role: string;
  username: string;
  password: string;
}) {
  const roleLabel = roleLabels[role] ?? role;
  const subject = `Your ${roleLabel} account credentials`;
  const { html, text } = buildCredentialEmail({ name, role, username, password });

  await transporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject,
    text,
    html,
  });
}
