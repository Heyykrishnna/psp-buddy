import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER || 'khandelwalyatharth39@gmail.com';
    const rawPass = process.env.SMTP_PASS || 'xvpx ykrc acys khqa';
    const pass = rawPass.replace(/\s+/g, '');

    if (user && pass) {
      if (host.includes('gmail')) {
        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user, pass },
          tls: { rejectUnauthorized: false },
        });
      } else {
        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: { user, pass },
          tls: { rejectUnauthorized: false },
        });
      }
      this.logger.log(`Nodemailer Gmail SMTP transport initialized for ${user}`);
    } else {
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
          user: 'demo@ethereal.email',
          pass: 'demo',
        },
      });
      this.logger.warn(`No active SMTP_USER/SMTP_PASS found in environment. MailService ready with fallback logging.`);
    }
  }

  async sendVerificationEmail(toEmail: string, code: string): Promise<boolean> {
    const fromName = process.env.SMTP_FROM_NAME || 'Dradix';
    const smtpUser = process.env.SMTP_USER || 'khandelwalyatharth39@gmail.com';
    const from = process.env.SMTP_FROM;
    const subject = `Your Verification Code: ${code}`;
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f6; margin: 0; padding: 20px; }
    .card { max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .brand { font-size: 16px; font-weight: 700; color: #111827; letter-spacing: 1.5px; margin-bottom: 24px; text-transform: uppercase; }
    .title { font-size: 22px; font-weight: 600; color: #111827; margin-bottom: 12px; }
    .text { font-size: 14px; color: #4b5563; line-height: 1.5; margin-bottom: 24px; }
    .code-box { background: #f3f4f6; border-radius: 12px; padding: 18px; text-align: center; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #2563eb; margin-bottom: 24px; font-family: monospace; }
    .footer { font-size: 12px; color: #9ca3af; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">PSP Lumora</div>
    <div class="title">Verification Code</div>
    <div class="text">Use the 6-digit confirmation code below to verify your email address and complete your registration:</div>
    <div class="code-box">${code}</div>
    <div class="text">This code will expire in 15 minutes. If you did not request this code, please ignore this email.</div>
    <div class="footer">© 2026 ${fromName}. All rights reserved.</div>
  </div>
</body>
</html>
    `;

    try {
      const info = await this.transporter.sendMail({
        from,
        to: toEmail,
        subject,
        html,
      });
      this.logger.log(`✉️ Nodemailer successfully sent verification email to ${toEmail} (MessageId: ${info.messageId})`);
      return true;
    } catch (err: any) {
      this.logger.error(`Failed to send email to ${toEmail}: ${err.message}`, err.stack);
      return false;
    }
  }
}
