import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    
    const engineer_id = payload.data?.id || payload.engineer_id;
    const old_data = payload.old_data;
    const new_data = payload.data;
    
    if (!engineer_id || !new_data) {
      return Response.json({ error: 'engineer_id and data are required' }, { status: 400 });
    }

    // Check if status changed from pending to approved
    const statusChanged = old_data?.status === 'pending' && new_data.status === 'approved';
    
    if (!statusChanged) {
      return Response.json({ 
        message: 'Status did not change to approved, skipping notification',
        skipped: true 
      });
    }

    // Get full engineer details
    const engineers = await base44.asServiceRole.entities.Engineer.filter({ id: engineer_id });
    const engineer = engineers[0];

    if (!engineer) {
      return Response.json({ error: 'Engineer not found' }, { status: 404 });
    }

    // Send welcome email to the approved engineer
    await base44.asServiceRole.integrations.Core.SendEmail({
      from_name: 'منصة بيتلي',
      to: engineer.email,
      subject: '🎉 أهلاً بك في عائلة "بيتلي" – تم اعتماد ملفك المهني بنجاح! 🏠✨',
      body: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #6B5D4F 0%, #C9A66B 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 32px; font-weight: bold; letter-spacing: 1px;">بيتلي</h1>
            <p style="color: #E5D4B8; margin: 8px 0 0 0; font-size: 16px; font-weight: 500;">لمسة بيت.. بروح هندسية</p>
          </div>
          
          <div style="background: white; padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="display: inline-block; background: linear-gradient(135deg, #6B5D4F 0%, #C9A66B 100%); padding: 15px 30px; border-radius: 50px;">
                <h2 style="color: white; margin: 0; font-size: 24px;">🎊 مبروك! تم اعتماد حسابك 🎊</h2>
              </div>
            </div>

            <p style="color: #333; font-size: 17px; line-height: 1.8; margin: 25px 0;">
              عزيزي المهندس/المصمم <strong style="color: #6B5D4F;">${engineer.full_name}</strong>،
            </p>

            <p style="color: #555; font-size: 16px; line-height: 1.8; margin: 20px 0;">
              يسعدنا إبلاغك بأنه قد تمت <strong>مراجعة ملفك الشخصي</strong> من قبل الإدارة والمستشار القانوني لمنصة <strong style="color: #C9A66B;">بيتلي (bytly)</strong>، وتمت <strong style="color: #28a745;">الموافقة على انضمامك</strong> كشريك إبداعي معنا.
            </p>

            <div style="background: linear-gradient(135deg, #E8F4F8 0%, #F0E8D8 100%); padding: 30px; border-radius: 12px; margin: 30px 0; border-right: 5px solid #C9A66B;">
              <h3 style="color: #6B5D4F; margin: 0 0 20px 0; font-size: 20px; display: flex; align-items: center; gap: 10px;">
                ✨ ما هي خطوتك القادمة؟
              </h3>
              <div style="space-y: 15px;">
                <div style="display: flex; align-items: start; gap: 12px; margin-bottom: 15px;">
                  <div style="background: #C9A66B; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0;">1</div>
                  <p style="margin: 0; color: #555; font-size: 15px;">يمكنك الآن الدخول إلى <strong>لوحة التحكم الخاصة بك</strong> وتحديث <strong>'معرض أعمالك'</strong>.</p>
                </div>
                <div style="display: flex; align-items: start; gap: 12px; margin-bottom: 15px;">
                  <div style="background: #C9A66B; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0;">2</div>
                  <p style="margin: 0; color: #555; font-size: 15px;">البدء في <strong>استقبال طلبات العملاء</strong> والرسومات التنفيذية.</p>
                </div>
                <div style="display: flex; align-items: start; gap: 12px;">
                  <div style="background: #C9A66B; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0;">3</div>
                  <p style="margin: 0; color: #555; font-size: 15px;">تأكد من مراجعة <strong>'شروط وأحكام الجودة'</strong> لضمان صدور شهادات الاعتماد لمشاريعك بسلاسة.</p>
                </div>
              </div>
            </div>

            <p style="color: #555; font-size: 16px; line-height: 1.8; margin: 25px 0;">
              نحن <strong style="color: #C9A66B;">متحمسون</strong> لرؤية إبداعاتك تساهم في تحويل المنازل إلى <strong>تحف فنية</strong>.
            </p>

            <div style="text-align: center; margin: 40px 0 30px 0;">
              <a href="${Deno.env.get('BASE44_APP_URL')}/dashboard" 
                 style="display: inline-block; background: linear-gradient(135deg, #6B5D4F 0%, #C9A66B 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(107, 93, 79, 0.3); transition: transform 0.2s;">
                🚀 ابدأ الآن - انتقل للوحة التحكم
              </a>
            </div>

            <div style="background: #f8f9fa; padding: 25px; border-radius: 10px; margin: 30px 0; text-align: center;">
              <p style="color: #666; font-size: 15px; margin: 0 0 10px 0;">
                نتطلع لتعاون مثمر معك
              </p>
              <p style="color: #6B5D4F; font-size: 16px; font-weight: bold; margin: 0;">
                مع تحيات، إدارة منصة بيتلي (bytly)
              </p>
              <p style="color: #C9A66B; font-size: 14px; font-style: italic; margin: 10px 0 0 0;">
                لمسة بيت.. بروح هندسية ✨
              </p>
            </div>

            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
            
            <div style="text-align: center; color: #999; font-size: 12px;">
              <p style="margin: 5px 0;">منصة بيتلي - لمسة بيت © ${new Date().getFullYear()}</p>
              <p style="margin: 5px 0;">البريد الإلكتروني: bytlylmstbyt@gmail.com</p>
              <p style="margin: 5px 0;">Instagram: @bytlylmstbyt</p>
            </div>
          </div>
        </div>
      `
    });

    return Response.json({
      success: true,
      message: 'Welcome email sent to approved engineer',
      engineer_email: engineer.email
    });

  } catch (error) {
    console.error('Error sending approval notification:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});