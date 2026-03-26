import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    // Support both direct call and entity automation payload
    const userData = payload.data || payload;
    const fullName = userData.full_name || userData.name || 'غير محدد';
    const email = userData.email || 'غير محدد';

    // Format signup time in Saudi timezone
    const signupTime = new Date().toLocaleString('ar-SA', {
      timeZone: 'Asia/Riyadh',
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

    // Get Gmail access token
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

    // Build email
    const toEmail = 'info@mybytly.com';
    const subject = 'إشعار جديد: مستخدم انضم إلى لمسة بيت';
    const body = `
مرحباً،

انضم مستخدم جديد إلى منصة بيتلي - لمسة بيت 🎉

━━━━━━━━━━━━━━━━━━━━━━━
📌 الاسم:    ${fullName}
📧 البريد:   ${email}
🕐 وقت التسجيل: ${signupTime}
━━━━━━━━━━━━━━━━━━━━━━━

يمكنك الاطلاع على تفاصيل المستخدم من لوحة تحكم المنصة.

مع التحية،
نظام إشعارات بيتلي
    `.trim();

    // Encode email as RFC 2822
    const rawEmail = [
      `To: ${toEmail}`,
      `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: 8bit',
      '',
      body,
    ].join('\r\n');

    const encodedEmail = btoa(unescape(encodeURIComponent(rawEmail)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: encodedEmail }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Gmail send error:', err);
      return Response.json({ error: 'Failed to send email', details: err }, { status: 500 });
    }

    const result = await res.json();
    console.log(`New user signup email sent for "${fullName}" (${email}), messageId: ${result.id}`);
    return Response.json({ success: true, messageId: result.id });

  } catch (error) {
    console.error('notifyNewUserSignup error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});