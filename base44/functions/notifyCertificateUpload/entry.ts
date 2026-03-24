import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    
    const review_id = payload.data?.id || payload.review_id;
    
    if (!review_id) {
      return Response.json({ error: 'review_id is required' }, { status: 400 });
    }

    // Get technical review details
    const reviews = await base44.asServiceRole.entities.TechnicalReview.filter({ id: review_id });
    const review = reviews[0];

    if (!review) {
      return Response.json({ error: 'Review not found' }, { status: 404 });
    }

    // Only send notification if certificate is uploaded
    if (!review.certificate_url) {
      return Response.json({ 
        message: 'No certificate uploaded yet, skipping notification',
        skipped: true 
      });
    }

    // Get project details
    const projects = await base44.asServiceRole.entities.Project.filter({ id: review.project_id });
    const project = projects[0];

    // Get consultant details
    const consultants = await base44.asServiceRole.entities.Consultant.filter({ id: review.consultant_id });
    const consultant = consultants[0];

    // Send email to admin
    await base44.asServiceRole.integrations.Core.SendEmail({
      from_name: 'منصة بيتلي',
      to: 'bytlylmstbyt@gmail.com',
      subject: '📜 تم رفع شهادة جودة واعتماد جديدة',
      body: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
          <div style="background: linear-gradient(135deg, #6B5D4F 0%, #C9A66B 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">بيتلي</h1>
            <p style="color: #E5D4B8; margin: 5px 0 0 0; font-size: 14px;">لمسة بيت</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #6B5D4F; margin-top: 0; font-size: 22px;">شهادة جودة جديدة</h2>
            
            <p style="color: #666; font-size: 16px;">تم رفع شهادة جودة واعتماد لأحد المشاريع:</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #C9A66B;">
              <p style="margin: 5px 0;"><strong style="color: #6B5D4F;">المشروع:</strong> ${project?.title || 'غير معروف'}</p>
              <p style="margin: 5px 0;"><strong style="color: #6B5D4F;">المستشار الفني:</strong> ${consultant?.full_name || 'غير معروف'}</p>
              <p style="margin: 5px 0;"><strong style="color: #6B5D4F;">تاريخ المراجعة:</strong> ${new Date(review.review_date).toLocaleDateString('ar-SA')}</p>
              <p style="margin: 5px 0;"><strong style="color: #6B5D4F;">النتيجة:</strong> <span style="color: ${review.result === 'approved' ? '#28a745' : '#dc3545'};">${review.result === 'approved' ? 'معتمد ✓' : 'يحتاج تعديلات'}</span></p>
            </div>

            ${review.comments ? `<div style="background: #e8f4f8; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p style="margin: 0; color: #555;"><strong>ملاحظات المستشار:</strong></p>
              <p style="margin: 5px 0 0 0; color: #666;">${review.comments}</p>
            </div>` : ''}

            <div style="text-align: center; margin: 30px 0;">
              <a href="${review.certificate_url}" 
                 style="background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; margin-left: 10px;">
                تحميل الشهادة
              </a>
              <a href="${Deno.env.get('BASE44_APP_URL')}/all-certifications" 
                 style="background: linear-gradient(135deg, #6B5D4F 0%, #C9A66B 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                عرض كل الشهادات
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
      message: 'Certificate notification sent to admin'
    });

  } catch (error) {
    console.error('Error sending certificate notification:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});