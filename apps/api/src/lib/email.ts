import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { config } from '../config';

const ses = new SESClient({ region: config.awsRegion });

export interface InviteEmailParams {
  toEmail:     string;
  toName:      string;
  inviteUrl:   string;
  inviterName: string;
  role:        string;
}

/**
 * Send an admin invite email via AWS SES.
 * Falls back to console.log in development so local testing never fails.
 */
export async function sendInviteEmail(params: InviteEmailParams): Promise<void> {
  const { toEmail, toName, inviteUrl, inviterName, role } = params;

  const roleLabel = role.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#121212;border-radius:16px;border:1px solid rgba(255,255,255,0.08);overflow:hidden">
        <tr><td style="background:linear-gradient(135deg,#FF6B6B,#FF8E53);padding:32px;text-align:center">
          <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;letter-spacing:-0.5px">SnapTik Admin</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px">You've been invited to join the team</p>
        </td></tr>
        <tr><td style="padding:32px">
          <p style="margin:0 0 16px;color:#fff;font-size:16px">Hi <strong>${toName}</strong>,</p>
          <p style="margin:0 0 24px;color:rgba(255,255,255,0.7);font-size:14px;line-height:1.6">
            <strong style="color:#fff">${inviterName}</strong> has invited you to join the SnapTik Admin Dashboard as a <strong style="color:#FF6B6B">${roleLabel}</strong>.
          </p>
          <div style="text-align:center;margin:32px 0">
            <a href="${inviteUrl}" style="display:inline-block;background:#FF6B6B;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:600;letter-spacing:0.2px">
              Accept Invitation →
            </a>
          </div>
          <p style="margin:24px 0 0;color:rgba(255,255,255,0.4);font-size:12px;text-align:center;line-height:1.6">
            This invite expires in 24 hours.<br>
            If you didn't expect this email, you can safely ignore it.<br><br>
            <a href="${inviteUrl}" style="color:rgba(255,255,255,0.3);word-break:break-all">${inviteUrl}</a>
          </p>
        </td></tr>
        <tr><td style="padding:16px 32px 24px;border-top:1px solid rgba(255,255,255,0.06);text-align:center">
          <p style="margin:0;color:rgba(255,255,255,0.3);font-size:11px">© 2026 SnapTik. Internal use only.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `Hi ${toName},\n\n${inviterName} has invited you to join the SnapTik Admin Dashboard as ${roleLabel}.\n\nAccept your invitation here:\n${inviteUrl}\n\nThis invite expires in 24 hours.\n\n© 2026 SnapTik. Internal use only.`;

  if (config.nodeEnv !== 'production') {
    console.log(`[Email] DEV mode — would send invite to ${toEmail}`);
    console.log(`[Email] Invite URL: ${inviteUrl}`);
    return;
  }

  const command = new SendEmailCommand({
    Source: `SnapTik Admin <${config.sesFromEmail}>`,
    Destination: { ToAddresses: [toEmail] },
    Message: {
      Subject: { Data: `You've been invited to SnapTik Admin Dashboard`, Charset: 'UTF-8' },
      Body: {
        Html: { Data: html,  Charset: 'UTF-8' },
        Text: { Data: text,  Charset: 'UTF-8' },
      },
    },
  });

  await ses.send(command);
  console.log(`[Email] Invite sent to ${toEmail}`);
}
