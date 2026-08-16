import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const isAuthenticated = await base44.auth.isAuthenticated();
    if (!isAuthenticated) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const payload = await req.json();

    // Support both direct call and entity automation payload
    const userData = payload.data || payload;
    const fullName = userData.full_name || userData.name || userData.company_name || 'غير محدد';
    const email = userData.email || 'غير محدد';
    const role = payload.role || userData.user_type || 'مستخدم';
    const roleLabels = {
      engineer: 'مهندس', surveyor: 'مهندس مساح', firm: 'شركة استشارية', contractor: 'مقاول',
      consultant: 'مستشار', supplier: 'مورد', legal_consultant: 'مستشار قانوني', client: 'عميل'
    };
    const roleLabel = roleLabels[role] || role;

    // Format signup time in Saudi timezone
    const signupTime = new Date().toLocaleString('ar-SA', {
      timeZone: 'Asia/Riyadh',
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

    // Get Gmail access token
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

    // Build email
    const toEmail = 'bytlylmstbyt@gmail.com';
    const subject = `إشعار تسجيل جديد: ${roleLabel} — بيتلي`;
    const body = `
مرحباً،

تم تسجيل ${roleLabel} جديد في منصة بيتلي 🎉

━━━━━━━━━━━━━━━━━━━━━━━
📌 النوع:    ${roleLabel}
📌 الاسم:    ${fullName}
📧 البريد:   ${email}
🕐 وقت التسجيل: ${signupTime}
━━━━━━━━━━━━━━━━━━━━━━━

يمكنك الاطلاع على تفاصيل التسجيل ومراجعة الحساب من لوحة تحكم المنصة.

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