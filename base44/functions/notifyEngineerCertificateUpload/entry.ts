import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const isAuthenticated = await base44.auth.isAuthenticated();
    if (!isAuthenticated) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const payload = await req.json();

    const engineer_id = payload.data?.id || payload.entity_id;

    if (!engineer_id) {
      return Response.json({ error: 'engineer_id is required' }, { status: 400 });
    }

    const engineers = await base44.asServiceRole.entities.Engineer.filter({ id: engineer_id });
    const engineer = engineers[0];

    if (!engineer) {
      return Response.json({ error: 'Engineer not found' }, { status: 404 });
    }

    if (!engineer.graduation_certificate_url) {
      return Response.json({ message: 'No graduation certificate uploaded, skipping', skipped: true });
    }

    if (engineer.is_verified) {
      return Response.json({ message: 'Engineer already verified, skipping', skipped: true });
    }

    const admin_email = 'bytlylmstbyt@gmail.com';

    await base44.asServiceRole.entities.Notification.create({
      recipient_email: admin_email,
      title: '🏅 طلب اعتماد مهندس جديد',
      message: `قام المهندس «${engineer.full_name || 'غير معروف'}» برفع شهادة تخرج جديدة بانتظار المراجعة والاعتماد.`,
      type: 'review',
      priority: 'high',
      related_project_id: null,
      is_read: false,
      email_sent: false,
      description: `طلب اعتماد من المهندس: ${engineer.full_name} | البريد: ${engineer.email} | رقم القيد: ${engineer.registration_number || 'غير متوفر'} | التخصص: ${engineer.specialization || 'غير محدد'}`
    });

    await base44.asServiceRole.integrations.Core.SendEmail({
      from_name: 'منصة بيتلي',
      to: admin_email,
      subject: '🏅 طلب اعتماد مهندس جديد - بانتظار المراجعة',
      body: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
          <div style="background: linear-gradient(135deg, #6B5D4F 0%, #C9A66B 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">بيتلي</h1>
            <p style="color: #E5D4B8; margin: 5px 0 0 0; font-size: 14px;">لمسة بيت</p>
          </div>

          <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #6B5D4F; margin-top: 0; font-size: 22px;">🏅 طلب اعتماد مهندس جديد</h2>

            <p style="color: #666; font-size: 16px;">قام أحد المهندسين برفع شهادة تخرج جديدة بانتظار المراجعة ومنح شارة الاعتماد:</p>

            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #C9A66B;">
              <p style="margin: 5px 0;"><strong style="color: #6B5D4F;">الاسم:</strong> ${engineer.full_name || 'غير معروف'}</p>
              <p style="margin: 5px 0;"><strong style="color: #6B5D4F;">البريد الإلكتروني:</strong> ${engineer.email || 'غير متوفر'}</p>
              <p style="margin: 5px 0;"><strong style="color: #6B5D4F;">رقم القيد المهني:</strong> ${engineer.registration_number || 'غير متوفر'}</p>
              <p style="margin: 5px 0;"><strong style="color: #6B5D4F;">التخصص:</strong> ${engineer.specialization || 'غير محدد'}</p>
              <p style="margin: 5px 0;"><strong style="color: #6B5D4F;">نوع المستخدم:</strong> ${engineer.user_type || 'غير محدد'}</p>
              <p style="margin: 5px 0;"><strong style="color: #6B5D4F;">المدينة:</strong> ${engineer.city || 'غير محددة'}</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${engineer.graduation_certificate_url}"
                 style="background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; margin-left: 10px;">
                تحميل الشهادة
              </a>
            </div>

            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 15px 0; border-right: 4px solid #ffc107;">
              <p style="margin: 0; color: #856404;"><strong>⚠️ إجراء مطلوب:</strong> يرجى مراجعة الشهادة في لوحة تحكم الإدارة ومنح شارة الاعتماد في حال استيفاء المتطلبات.</p>
            </div>

            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
              منصة بيتلي - لمسة بيت © ${new Date().getFullYear()}
            </p>
          </div>
        </div>
      `
    });

    return Response.json({
      success: true,
      message: 'Engineer certificate notification sent to admin dashboard'
    });

  } catch (error) {
    console.error('Error sending engineer certificate notification:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});