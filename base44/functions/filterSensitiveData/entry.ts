import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content } = await req.json();

    // Regex patterns for sensitive data
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const phonePattern = /(?:\+?966|0)?(?:5[0-9]{8}|[1-9][0-9]{7,8})/g;
    const whatsappPattern = /(?:واتس|whatsapp|رقمي|جوالي|هاتفي|تواصل معي)/gi;

    let filteredContent = content;
    let hasSensitiveData = false;

    // Filter emails
    if (emailPattern.test(content)) {
      filteredContent = filteredContent.replace(emailPattern, '[بريد إلكتروني محجوب]');
      hasSensitiveData = true;
    }

    // Filter phone numbers
    if (phonePattern.test(content)) {
      filteredContent = filteredContent.replace(phonePattern, '[رقم محجوب]');
      hasSensitiveData = true;
    }

    // Warn about WhatsApp mentions
    if (whatsappPattern.test(content)) {
      hasSensitiveData = true;
    }

    return Response.json({
      filteredContent,
      originalContent: content,
      hasSensitiveData,
      warning: hasSensitiveData ? 'تم حجب معلومات اتصال لحماية خصوصيتك. يرجى استخدام المنصة فقط للتواصل.' : null
    });
  } catch (error) {
    console.error('Filter error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});