import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { name, email, phone, subject, message } = await req.json();

        if (!name || !email || !message) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const emailBody = `
            <div style="font-family: Arial, sans-serif; direction: rtl; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9;">
                <div style="background: linear-gradient(135deg, #1a1a2e, #d4a574); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 22px;">استفسار جديد - منصة بيتلي</h1>
                </div>
                <div style="background: white; padding: 28px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
                    <h2 style="color: #1a1a2e; margin-top: 0;">تفاصيل المرسل</h2>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; color: #666; width: 140px;">الاسم:</td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #1a1a2e;">${name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; color: #666;">البريد الإلكتروني:</td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #1a1a2e;">${email}</td>
                        </tr>
                        ${phone ? `<tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; color: #666;">رقم الجوال:</td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #1a1a2e;">${phone}</td>
                        </tr>` : ''}
                        ${subject ? `<tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; color: #666;">الموضوع:</td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #1a1a2e;">${subject}</td>
                        </tr>` : ''}
                    </table>

                    <h2 style="color: #1a1a2e; margin-top: 24px;">نص الرسالة</h2>
                    <div style="background: #f8f5f0; border-right: 4px solid #d4a574; padding: 16px; border-radius: 8px; color: #333; line-height: 1.7;">
                        ${message.replace(/\n/g, '<br>')}
                    </div>

                    <div style="margin-top: 24px; padding: 12px; background: #f0f4ff; border-radius: 8px; font-size: 12px; color: #666; text-align: center;">
                        تم الإرسال في: ${new Date().toLocaleString('ar-SA', { timeZone: 'Asia/Riyadh' })}
                    </div>
                </div>
            </div>
        `;

        // Send to admin
        await base44.asServiceRole.integrations.Core.SendEmail({
            to: 'info@mybytly.com',
            subject: `استفسار جديد من ${name}${subject ? ' - ' + subject : ''}`,
            body: emailBody,
            from_name: 'منصة بيتلي - نموذج التواصل'
        });

        // Send confirmation to user
        const confirmBody = `
            <div style="font-family: Arial, sans-serif; direction: rtl; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #1a1a2e, #d4a574); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 22px;">شكراً لتواصلك معنا</h1>
                </div>
                <div style="background: white; padding: 28px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
                    <p style="color: #1a1a2e; font-size: 16px;">مرحباً ${name}،</p>
                    <p style="color: #555; line-height: 1.7;">لقد استلمنا رسالتك بنجاح وسيقوم فريقنا بمراجعتها والرد عليك في أقرب وقت ممكن خلال أوقات العمل (الأحد - الخميس، 9 صباحاً - 5 مساءً).</p>
                    <div style="background: #f8f5f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
                        <p style="margin: 0; color: #d4a574; font-weight: bold;">رسالتك:</p>
                        <p style="margin: 8px 0 0; color: #555;">${message.substring(0, 200)}${message.length > 200 ? '...' : ''}</p>
                    </div>
                    <p style="color: #888; font-size: 13px;">فريق بيتلي - لمسة بيت</p>
                </div>
            </div>
        `;

        await base44.asServiceRole.integrations.Core.SendEmail({
            to: email,
            subject: 'تم استلام رسالتك - منصة بيتلي',
            body: confirmBody,
            from_name: 'منصة بيتلي'
        });

        return Response.json({ success: true });
    } catch (error) {
        console.error('contactUs error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});