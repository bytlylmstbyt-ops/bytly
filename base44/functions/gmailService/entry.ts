import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1/users/me';

async function getAccessToken(base44) {
  return await base44.asServiceRole.connectors.getAccessToken('gmail');
}

async function gmailRequest(accessToken, endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(`${GMAIL_API}${endpoint}`, options);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gmail API error: ${res.status} - ${err}`);
  }
  return res.json();
}

function encodeEmail(to, subject, body, fromName = 'Bytly') {
  const rawEmail = [
    `To: ${to}`,
    `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: base64`,
    ``,
    body,
  ].join('\r\n');
  return btoa(unescape(encodeURIComponent(rawEmail)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function parseEmailBody(payload) {
  if (!payload) return '';
  if (payload.body?.data) {
    try { return atob(payload.body.data.replace(/-/g, '+').replace(/_/g, '/')); } catch { return ''; }
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
        if (part.body?.data) {
          try { return atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/')); } catch { return ''; }
        }
      }
    }
    for (const part of payload.parts) {
      const nested = parseEmailBody(part);
      if (nested) return nested;
    }
  }
  return '';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { action, data } = await req.json();
    const accessToken = await getAccessToken(base44);

    switch (action) {

      // List inbox messages
      case 'listEmails': {
        const { maxResults = 20, labelIds = ['INBOX'], q = '' } = data || {};
        let endpoint = `/messages?maxResults=${maxResults}`;
        if (labelIds.length) endpoint += `&labelIds=${labelIds.join('&labelIds=')}`;
        if (q) endpoint += `&q=${encodeURIComponent(q)}`;

        const list = await gmailRequest(accessToken, endpoint);
        if (!list.messages || list.messages.length === 0) {
          return Response.json({ success: true, emails: [] });
        }

        // Fetch metadata for each message in parallel
        const emails = await Promise.all(
          list.messages.map(async (msg) => {
            try {
              const detail = await gmailRequest(accessToken, `/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date`);
              const headers = detail.payload?.headers || [];
              const get = (name) => headers.find(h => h.name === name)?.value || '';
              return {
                id: detail.id,
                threadId: detail.threadId,
                snippet: detail.snippet,
                from: get('From'),
                to: get('To'),
                subject: get('Subject'),
                date: get('Date'),
                labelIds: detail.labelIds || [],
                isUnread: (detail.labelIds || []).includes('UNREAD'),
              };
            } catch { return null; }
          })
        );

        return Response.json({ success: true, emails: emails.filter(Boolean) });
      }

      // Get full email content
      case 'getEmail': {
        const { messageId } = data;
        const detail = await gmailRequest(accessToken, `/messages/${messageId}?format=full`);
        const headers = detail.payload?.headers || [];
        const get = (name) => headers.find(h => h.name === name)?.value || '';
        const body = parseEmailBody(detail.payload);
        return Response.json({
          success: true,
          email: {
            id: detail.id,
            threadId: detail.threadId,
            from: get('From'),
            to: get('To'),
            subject: get('Subject'),
            date: get('Date'),
            body,
            labelIds: detail.labelIds || [],
            isUnread: (detail.labelIds || []).includes('UNREAD'),
          }
        });
      }

      // Send email
      case 'sendEmail': {
        const { to, subject, body } = data;
        const raw = encodeEmail(to, subject, body);
        const result = await gmailRequest(accessToken, '/messages/send', 'POST', { raw });
        return Response.json({ success: true, messageId: result.id, message: 'تم إرسال البريد الإلكتروني بنجاح' });
      }

      // Reply to email
      case 'replyEmail': {
        const { messageId, to, subject, body, threadId } = data;
        const raw = encodeEmail(to, `Re: ${subject}`, body);
        const result = await gmailRequest(accessToken, '/messages/send', 'POST', { raw, threadId });
        return Response.json({ success: true, messageId: result.id, message: 'تم إرسال الرد بنجاح' });
      }

      // Mark as read
      case 'markAsRead': {
        const { messageId } = data;
        await gmailRequest(accessToken, `/messages/${messageId}/modify`, 'POST', {
          removeLabelIds: ['UNREAD']
        });
        return Response.json({ success: true, message: 'تم التحديد كمقروء' });
      }

      // Delete / trash email
      case 'trashEmail': {
        const { messageId } = data;
        await gmailRequest(accessToken, `/messages/${messageId}/trash`, 'POST');
        return Response.json({ success: true, message: 'تم نقل الرسالة إلى المهملات' });
      }

      // Get labels
      case 'getLabels': {
        const result = await gmailRequest(accessToken, '/labels');
        return Response.json({ success: true, labels: result.labels || [] });
      }

      // AI-draft reply
      case 'draftReply': {
        const { emailBody, emailFrom, emailSubject, context } = data;
        const draft = await base44.integrations.Core.InvokeLLM({
          prompt: `أنت مساعد لشركة Bytly للخدمات الهندسية والتصميم في السعودية.

اكتب رداً احترافياً بالعربية على هذا البريد الإلكتروني:
المرسل: ${emailFrom}
الموضوع: ${emailSubject}
المحتوى: ${emailBody}
${context ? `سياق إضافي: ${context}` : ''}

شروط الرد:
- قصير ومهني (3-5 جمل)
- باللغة العربية الفصيحة
- يُنهي بتحية مناسبة من فريق Bytly
- لا تُضف موضوع أو عنوان، فقط نص الرد`
        });
        return Response.json({ success: true, draft });
      }

      default:
        return Response.json({ error: 'Action غير معروف' }, { status: 400 });
    }

  } catch (error) {
    console.error('Gmail service error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});