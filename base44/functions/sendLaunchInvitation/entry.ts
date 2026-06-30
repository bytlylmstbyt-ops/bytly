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

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function linkify(text) {
  // Escape HTML first, then convert URLs to clickable links
  const escaped = escapeHtml(text);
  return escaped.replace(/(https?:\/\/[^\s<]+)/g, (url) => {
    // Trim trailing punctuation that shouldn't be part of the URL
    const cleanUrl = url.replace(/[.,،;:!؟?)]+$/, '');
    return `<a href="${cleanUrl}" style="color: #C9A66B; text-decoration: underline; font-weight: 600;" target="_blank" rel="noopener">${cleanUrl}</a>`;
  });
}

function textToHtml(text) {
  const lines = text.split('\n');
  const blocks = [];
  let listItems = [];

  const flushList = () => {
    if (listItems.length > 0) {
      blocks.push(
        `<ul style="color: #374151; line-height: 1.9; margin: 0 0 16px 0; padding-right: 8px; list-style: none;">` +
        listItems.map(item =>
          `<li style="margin-bottom: 8px; padding-right: 20px; position: relative;">
            <span style="position: absolute; right: 0; top: 2px; color: #C9A66B; font-weight: bold;">◆</span>
            ${linkify(item)}
          </li>`
        ).join('') +
        `</ul>`
      );
      listItems = [];
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) { flushList(); continue; }

    // Bullet point: lines starting with -, •, ✨, ◆, etc.
    const bulletMatch = line.match(/^(?:[-•◦▪]|✨|✓|✔|◆|→)\s*(.*)/);
    if (bulletMatch) {
      listItems.push(bulletMatch[1]);
      continue;
    }

    flushList();

    // Section heading: short lines ending with ？ or containing key phrases
    if (line.length < 60 && (line.includes('؟') || line.includes('!') || line.endsWith(':') || line.endsWith('：'))) {
      blocks.push(`<h3 style="color: #4A3F35; font-size: 16px; font-weight: 700; margin: 20px 0 10px 0; padding-right: 12px; border-right: 3px solid #C9A66B;">${linkify(line)}</h3>`);
      continue;
    }

    blocks.push(`<p style="color: #374151; line-height: 1.9; margin: 0 0 14px 0;">${linkify(line)}</p>`);
  }
  flushList();

  return blocks.join('');
}

function buildHtmlEmail(personalizedBody) {
  const bodyHtml = textToHtml(personalizedBody);

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background: #f8f6f3; font-family: 'Segoe UI', Tahoma, Arial, sans-serif;">
  <table role="presentation" dir="rtl" style="width: 100%; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(107, 93, 79, 0.12);">

    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #4A3F35 0%, #6B5D4F 50%, #C9A66B 100%); padding: 36px 30px; text-align: center;">
        <div style="display: inline-block; background: rgba(255,255,255,0.15); border: 1px solid rgba(201,166,107,0.3); border-radius: 50px; padding: 8px 20px; margin-bottom: 12px;">
          <span style="color: #E5D4B8; font-size: 11px; font-weight: 600; letter-spacing: 1px;">🚀 منصة بيتلي – لمسة بيت</span>
        </div>
        <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; line-height: 1.4;">انطلقت منصة بيتلي!</h1>
        <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0 0; font-size: 14px;">كن من أوائل المهندسين المستخدمين</p>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding: 36px 30px 20px 30px;">
        ${bodyHtml}
      </td>
    </tr>

    <!-- CTA Button -->
    <tr>
      <td style="padding: 10px 30px 30px 30px; text-align: center;">
        <a href="/login"
           style="display: inline-block; background: linear-gradient(135deg, #6B5D4F, #C9A66B); color: #ffffff; padding: 16px 44px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; box-shadow: 0 4px 16px rgba(201,166,107,0.35);">
          ابدأ الآن - انتقل للوحة التحكم 🚀
        </a>
        <p style="color: #9CA3AF; font-size: 12px; margin: 14px 0 0 0;">أو انقر على الزر أعلاه للانتقال إلى لوحة التحكم</p>
      </td>
    </tr>

    <!-- Divider -->
    <tr>
      <td style="padding: 0 30px;">
        <div style="border-top: 1px solid #f0ebe5; margin: 0;"></div>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background: #faf9f7; padding: 24px 30px; text-align: center;">
        <p style="color: #6B5D4F; font-size: 14px; font-weight: 700; margin: 0 0 6px 0;">فريق بيتلي – لمسة بيت</p>
        <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
          📧 <a href="mailto:info@mybytly.com" style="color: #C9A66B; text-decoration: none;">info@mybytly.com</a>
          &nbsp;•&nbsp;
          🌐 <a href="https://mybytly.com" style="color: #C9A66B; text-decoration: none;">mybytly.com</a>
        </p>
        <p style="color: #C9C9C9; font-size: 11px; margin: 12px 0 0 0;">© ${new Date().getFullYear()} Bytly. جميع الحقوق محفوظة.</p>
      </td>
    </tr>

  </table>
</body>
</html>`;
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