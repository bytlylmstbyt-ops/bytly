import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const payload = await req.json();
    const { engineer_id, approved, rejection_reason } = payload;

    if (!engineer_id || typeof approved !== 'boolean') {
      return Response.json({ error: 'engineer_id and approved (boolean) are required' }, { status: 400 });
    }

    const engineers = await base44.asServiceRole.entities.Engineer.filter({ id: engineer_id });
    const engineer = engineers[0];

    if (!engineer) {
      return Response.json({ error: 'Engineer not found' }, { status: 404 });
    }

    // 1) Create an in-app Notification record
    const notificationTitle = approved
      ? 'تم اعتماد حسابك في منصة بيتلي'
      : 'تم رفض طلب اعتماد حسابك';

    const notificationMessage = approved
      ? `مرحباً ${engineer.full_name}، تمت الموافقة على طلب تسجيلك واعتمادك كمهندس في منصة بيتلي. يمكنك الآن البدء في استقبال طلبات العملاء.`
      : `مرحباً ${engineer.full_name}، نأسف لإبلاغك بأنه تم رفض طلب اعتماد حسابك${rejection_reason ? ` للسبب التالي: ${rejection_reason}` : ''}. يرجى مراجعة الوثائق المرفوعة وإعادة التقديم.`;

    await base44.asServiceRole.entities.Notification.create({
      recipient_email: engineer.email,
      title: notificationTitle,
      message: notificationMessage,
      type: 'approval',
      related_entity_id: engineer.id,
      action_url: approved ? '/dashboard' : '/register-engineer',
      priority: approved ? 'medium' : 'high',
      email_sent: false
    });

    // 2) Send email notification
    const emailSubject = approved
      ? '🎉 تم اعتماد حسابك في منصة بيتلي!'
      : 'بخصوص طلب تسجيلك في منصة بيتلي';

    const appUrl = 'https://mybytly.com';

    const emailBody = approved ? `
      <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
        <div style="background: linear-gradient(135deg, #6B5D4F 0%, #C9A66B 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 32px; font-weight: bold;">بيتلي</h1>
          <p style="color: #E5D4B8; margin: 8px 0 0 0; font-size: 16px;">لمسة بيت.. بروح هندسية</p>
        </div>
        <div style="background: white; padding: 40px 30px;">
          <h2 style="color: #28a745; text-align: center;">🎊 تم اعتماد حسابك بنجاح 🎊</h2>
          <p style="color: #333; font-size: 17px; line-height: 1.8;">
            عزيزي المهندس <strong>${engineer.full_name}</strong>،
          </p>
          <p style="color: #555; font-size: 16px; line-height: 1.8;">
            تمت مراجعة وثائقك (شهادة التخرج وشهادة القيد في الهيئة السعودية للمهندسين) وتمت <strong style="color: #28a745;">الموافقة على اعتمادك</strong> كمهندس في منصة بيتلي.
          </p>
          <p style="color: #555; font-size: 16px; line-height: 1.8;">
            يمكنك الآن الدخول إلى لوحة التحكم والبدء في استقبال طلبات العملاء وتحديث معرض أعمالك.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${appUrl}/dashboard"
               style="display: inline-block; background: linear-gradient(135deg, #6B5D4F 0%, #C9A66B 100%); color: white; padding: 14px 36px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 16px;">
              🚀 انتقل للوحة التحكم
            </a>
          </div>
          <p style="color: #6B5D4F; font-size: 14px; text-align: center;">مع تحيات، إدارة منصة بيتلي</p>
        </div>
      </div>
    ` : `
      <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
        <div style="background: linear-gradient(135deg, #6B5D4F 0%, #C9A66B 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 32px; font-weight: bold;">بيتلي</h1>
          <p style="color: #E5D4B8; margin: 8px 0 0 0; font-size: 16px;">لمسة بيت.. بروح هندسية</p>
        </div>
        <div style="background: white; padding: 40px 30px;">
          <h2 style="color: #dc3545; text-align: center;">تم رفض طلب الاعتماد</h2>
          <p style="color: #333; font-size: 17px; line-height: 1.8;">
            عزيزي المهندس <strong>${engineer.full_name}</strong>،
          </p>
          <p style="color: #555; font-size: 16px; line-height: 1.8;">
            نأسف لإبلاغك بأنه تم رفض طلب اعتماد حسابك في منصة بيتلي بعد مراجعة الوثائق المرفوعة.
          </p>
          ${rejection_reason ? `
          <div style="background: #fef3cd; border-right: 4px solid #ffc107; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #856404; margin: 0; font-size: 15px;"><strong>سبب الرفض:</strong> ${rejection_reason}</p>
          </div>
          ` : ''}
          <p style="color: #555; font-size: 16px; line-height: 1.8;">
            يمكنك مراجعة الوثائق المرفوعة (شهادة التخرج وشهادة القيد في الهيئة السعودية للمهندسين) وإعادة التقديم بعد استيفاء المتطلبات.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${appUrl}/RegisterEngineer"
               style="display: inline-block; background: linear-gradient(135deg, #6B5D4F 0%, #C9A66B 100%); color: white; padding: 14px 36px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 16px;">
              إعادة التقديم
            </a>
          </div>
          <p style="color: #6B5D4F; font-size: 14px; text-align: center;">مع تحيات، إدارة منصة بيتلي</p>
        </div>
      </div>
    `;

    await base44.asServiceRole.integrations.Core.SendEmail({
      from_name: 'منصة بيتلي',
      to: engineer.email,
      subject: emailSubject,
      body: emailBody
    });

    // Mark notification as email sent
    const notifications = await base44.asServiceRole.entities.Notification.filter({
      recipient_email: engineer.email,
      related_entity_id: engineer.id,
      type: 'approval'
    });
    for (const n of notifications) {
      if (!n.email_sent) {
        await base44.asServiceRole.entities.Notification.update(n.id, { email_sent: true });
      }
    }

    return Response.json({
      success: true,
      message: approved ? 'Approval notification sent' : 'Rejection notification sent',
      engineer_email: engineer.email
    });

  } catch (error) {
    console.error('Error in reviewEngineerCertificate:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});