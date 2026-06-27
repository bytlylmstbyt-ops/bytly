import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function toBase64Url(b64) {
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function buildRawMessage(toEmail, subject, htmlBody) {
  const subjectEncoded = `=?utf-8?B?${utf8ToBase64(subject)}?=`;
  const bodyB64 = utf8ToBase64(htmlBody);
  const raw = `To: ${toEmail}\r\nSubject: ${subjectEncoded}\r\nMIME-Version: 1.0\r\nContent-Type: text/html; charset=utf-8\r\nContent-Transfer-Encoding: base64\r\n\r\n${bodyB64}`;
  return toBase64Url(utf8ToBase64(raw));
}

function personalizeBody(body, name) {
  let result = body;
  if (name) {
    result = result.replace(/^مرحباً بك،/g, `مرحباً ${name}،`);
    result = result.replace(/{name}/g, name);
  }
  return result;
}

function textToHtml(text) {
  return text
    .split('\n')
    .map(line => line.trim() ? `<p style="color: #374151; line-height: 1.8; margin: 0 0 10px 0;">${line}</p>` : '')
    .join('');
}

function buildHtmlEmail(personalizedBody) {
  return `<div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #6B5D4F, #C9A66B); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">Bytly - لمسة بيت</h1>
    </div>
    <div style="background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
      ${textToHtml(personalizedBody)}
      <div style="text-align: center; margin-top: 30px;">
        <a href="https://mybytly.com/login" style="background: linear-gradient(135deg, #6B5D4F, #C9A66B); color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">تفعيل حسابك الآن</a>
      </div>
      <p style="color: #9CA3AF; font-size: 12px; margin-top: 30px; text-align: center;">فريق Bytly | info@mybytly.com</p>
    </div>
  </div>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { recipients, subject, body } = await req.json();

    if (!Array.isArray(recipients) || recipients.length === 0 || !subject || !body) {
      return Response.json({ error: 'Missing recipients, subject, or body' }, { status: 400 });
    }

    // Get Gmail access token via shared connector
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

    const results = [];
    for (const recipient of recipients) {
      const email = typeof recipient === 'string' ? recipient : recipient.email;
      const name = typeof recipient === 'string' ? '' : (recipient.name || '');

      try {
        const personalizedBody = personalizeBody(body, name);
        const htmlBody = buildHtmlEmail(personalizedBody);
        const raw = buildRawMessage(email, subject, htmlBody);

        const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ raw }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData?.error?.message || `Gmail API error ${res.status}`;
          results.push({ email, success: false, error: errMsg });
        } else {
          results.push({ email, success: true });
        }
      } catch (err) {
        results.push({ email, success: false, error: err.message });
      }
    }

    const sent = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return Response.json({ sent, failed, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});