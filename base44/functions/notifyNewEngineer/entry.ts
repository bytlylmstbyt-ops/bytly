import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const isAuthenticated = await base44.auth.isAuthenticated();
    if (!isAuthenticated) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const payload = await req.json();
    
    const engineer_id = payload.data?.id || payload.engineer_id;
    
    if (!engineer_id) {
      return Response.json({ error: 'engineer_id is required' }, { status: 400 });
    }

    // Get engineer details
    const engineers = await base44.asServiceRole.entities.Engineer.filter({ id: engineer_id });
    const engineer = engineers[0];

    if (!engineer) {
      return Response.json({ error: 'Engineer not found' }, { status: 404 });
    }

    // Send email to admin
    await base44.asServiceRole.integrations.Core.SendEmail({
      from_name: 'منصة بيتلي',
      to: 'bytlylmstbyt@gmail.com',
      subject: '🆕 تسجيل مهندس جديد',
      body: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
          <div style="background: linear-gradient(135deg, #6B5D4F 0%, #C9A66B 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">بيتلي</h1>
            <p style="color: #E5D4B8; margin: 5px 0 0 0; font-size: 14px;">لمسة بيت</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #6B5D4F; margin-top: 0; font-size: 22px;">مهندس جديد في انتظار الموافقة</h2>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #C9A66B;">
              <p style="margin: 5px 0;"><strong style="color: #6B5D4F;">الاسم:</strong> ${engineer.full_name}</p>
              <p style="margin: 5px 0;"><strong style="color: #6B5D4F;">البريد الإلكتروني:</strong> ${engineer.email}</p>
              <p style="margin: 5px 0;"><strong style="color: #6B5D4F;">الهاتف:</strong> ${engineer.phone || 'غير متوفر'}</p>
              <p style="margin: 5px 0;"><strong style="color: #6B5D4F;">التخصص:</strong> ${engineer.specialization || 'غير محدد'}</p>
              <p style="margin: 5px 0;"><strong style="color: #6B5D4F;">المدينة:</strong> ${engineer.city || 'غير محدد'}</p>
              <p style="margin: 5px 0;"><strong style="color: #6B5D4F;">سنوات الخبرة:</strong> ${engineer.years_experience || 'غير محدد'}</p>
              <p style="margin: 5px 0;"><strong style="color: #6B5D4F;">الحالة:</strong> <span style="color: #856404; background: #fff3cd; padding: 3px 8px; border-radius: 4px;">${engineer.status === 'pending' ? 'في انتظار المراجعة' : engineer.status}</span></p>
            </div>

            <p style="color: #666; margin: 20px 0;">تاريخ التسجيل: ${new Date(engineer.created_date).toLocaleDateString('ar-SA')}</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${Deno.env.get('BASE44_APP_URL')}/admin-engineers" 
                 style="background: linear-gradient(135deg, #6B5D4F 0%, #C9A66B 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                مراجعة الحساب الآن
              </a>
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
      message: 'Notification sent to admin',
      engineer_email: engineer.email
    });

  } catch (error) {
    console.error('Error sending engineer notification:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});