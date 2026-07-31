import { createClientFromRequest } from 'npm:@base44/sdk@0.8.41';

function escapeHtml(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, data } = body;

    switch (action) {

      // 1. إرسال تحديثات المشروع للعملاء
      case 'sendProjectUpdate': {
        const { clientEmail, clientName, projectTitle, updateMessage, milestoneTitle, status } = data;
        const statusAr = {
          in_progress: 'قيد التنفيذ',
          completed: 'مكتمل',
          submitted: 'تم التسليم',
          approved: 'معتمد',
          revision_requested: 'يحتاج مراجعة'
        }[status] || status;

        await base44.integrations.Core.SendEmail({
          to: clientEmail,
          subject: `تحديث مشروعك: ${escapeHtml(projectTitle)}`,
          body: `
            <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #6B5D4F, #C9A66B); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">Bytly - لمسة بيت</h1>
              </div>
              <div style="background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
                <h2 style="color: #4A3F35;">مرحباً ${escapeHtml(clientName)}،</h2>
                <p style="color: #6B7280;">لديك تحديث جديد على مشروعك:</p>
                <div style="background: #FFF8F0; border-right: 4px solid #C9A66B; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <strong style="color: #4A3F35;">المشروع:</strong> ${escapeHtml(projectTitle)}<br/>
                  ${milestoneTitle ? `<strong style="color: #4A3F35;">المرحلة:</strong> ${escapeHtml(milestoneTitle)}<br/>` : ''}
                  <strong style="color: #4A3F35;">الحالة:</strong> <span style="color: #C9A66B;">${statusAr}</span>
                </div>
                <p style="color: #374151;">${escapeHtml(updateMessage)}</p>
                <div style="text-align: center; margin-top: 30px;">
                  <a href="https://mybytly.com" style="background: linear-gradient(135deg, #6B5D4F, #C9A66B); color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">عرض المشروع</a>
                </div>
                <p style="color: #9CA3AF; font-size: 12px; margin-top: 30px; text-align: center;">فريق Bytly | info@mybytly.com</p>
              </div>
            </div>
          `
        });
        return Response.json({ success: true, message: 'تم إرسال تحديث المشروع للعميل' });
      }

      // 2. إبلاغ المهندسين/المصممين بمشاريع جديدة
      case 'notifyEngineerNewProject': {
        const { engineerEmail, engineerName, projectTitle, projectDescription, projectBudget, projectCategory, projectId } = data;
        const categoryAr = {
          interior: 'تصميم داخلي',
          architecture: 'معماري',
          painting: 'رسم',
          landscape: 'مناظر طبيعية',
          furniture: 'أثاث',
          lighting: 'إضاءة'
        }[projectCategory] || projectCategory;

        await base44.integrations.Core.SendEmail({
          to: engineerEmail,
          subject: `🆕 مشروع جديد يناسب تخصصك: ${escapeHtml(projectTitle)}`,
          body: `
            <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #6B5D4F, #C9A66B); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">Bytly - لمسة بيت</h1>
              </div>
              <div style="background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
                <h2 style="color: #4A3F35;">مرحباً ${escapeHtml(engineerName)}،</h2>
                <p style="color: #6B7280;">يوجد مشروع جديد قد يناسب تخصصك!</p>
                <div style="background: #FFF8F0; border: 1px solid #E5D4B8; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #4A3F35; margin: 0 0 10px 0;">${escapeHtml(projectTitle)}</h3>
                  <p style="color: #6B7280; margin: 5px 0;">📂 التصنيف: ${categoryAr}</p>
                  ${projectBudget ? `<p style="color: #6B7280; margin: 5px 0;">💰 الميزانية: ${projectBudget} ريال</p>` : ''}
                  <p style="color: #374151; margin-top: 10px;">${escapeHtml(projectDescription)}</p>
                </div>
                <div style="text-align: center; margin-top: 30px;">
                  <a href="https://mybytly.com/projects" style="background: linear-gradient(135deg, #6B5D4F, #C9A66B); color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">تقديم عرض الآن</a>
                </div>
                <p style="color: #9CA3AF; font-size: 12px; margin-top: 30px; text-align: center;">فريق Bytly | info@mybytly.com</p>
              </div>
            </div>
          `
        });
        return Response.json({ success: true, message: 'تم إبلاغ المهندس بالمشروع الجديد' });
      }

      // 3. صياغة وإرسال رسائل متابعة للمقترحات
      case 'sendProposalFollowup': {
        const { recipientEmail, recipientName, proposalTitle, proposalAmount, daysSinceSubmission, senderRole } = data;

        // صياغة تلقائية بالذكاء الاصطناعي
        const aiDraft = await base44.integrations.Core.InvokeLLM({
          prompt: `اكتب رسالة بريد إلكتروني متابعة احترافية باللغة العربية لمقترح مشروع هندسي.
المعطيات:
- اسم المستلم: ${recipientName}
- عنوان المقترح: ${proposalTitle}
- قيمة المقترح: ${proposalAmount} ريال
- مضى على تقديم المقترح: ${daysSinceSubmission} يوم
- المرسل: ${senderRole === 'engineer' ? 'مهندس' : 'عميل'}

اكتب رسالة قصيرة ومهنية ودافئة (3-4 جمل فقط) تذكر المستلم بالمقترح وتطلب الرد. بدون مقدمات أو تحيات إضافية، فقط نص الرسالة.`
        });

        await base44.integrations.Core.SendEmail({
          to: recipientEmail,
          subject: `متابعة: ${escapeHtml(proposalTitle)}`,
          body: `
            <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #6B5D4F, #C9A66B); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">Bytly - لمسة بيت</h1>
              </div>
              <div style="background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
                <h2 style="color: #4A3F35;">مرحباً ${escapeHtml(recipientName)}،</h2>
                <p style="color: #374151; line-height: 1.8;">${escapeHtml(aiDraft)}</p>
                <div style="background: #FFF8F0; border-right: 4px solid #C9A66B; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <strong style="color: #4A3F35;">المقترح:</strong> ${escapeHtml(proposalTitle)}<br/>
                  <strong style="color: #4A3F35;">القيمة:</strong> ${proposalAmount} ريال
                </div>
                <div style="text-align: center; margin-top: 30px;">
                  <a href="https://mybytly.com" style="background: linear-gradient(135deg, #6B5D4F, #C9A66B); color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">الرد على المقترح</a>
                </div>
                <p style="color: #9CA3AF; font-size: 12px; margin-top: 30px; text-align: center;">فريق Bytly | info@mybytly.com</p>
              </div>
            </div>
          `
        });
        return Response.json({ success: true, message: 'تم إرسال رسالة المتابعة', draft: aiDraft });
      }

      // 4. قراءة رسائل العملاء للاطلاع على تفاصيل المشروع
      case 'extractProjectFromEmail': {
        const { emailSubject, emailBody, clientEmail } = data;

        const extracted = await base44.integrations.Core.InvokeLLM({
          prompt: `استخرج تفاصيل المشروع من رسالة البريد الإلكتروني التالية وأعد JSON منظم.

الموضوع: ${emailSubject}
المحتوى: ${emailBody}

استخرج:
- project_title: عنوان المشروع (أو null)
- project_type: نوع المشروع (interior/architecture/painting/landscape/furniture/lighting أو null)
- budget: الميزانية كرقم (أو null)
- location: الموقع (أو null)
- description: وصف المشروع
- deadline: الموعد النهائي كنص (أو null)
- client_requirements: قائمة بالمتطلبات الرئيسية
- urgency: مستوى الأهمية (low/medium/high)
- summary: ملخص قصير بالعربية`,
          response_json_schema: {
            type: "object",
            properties: {
              project_title: { type: "string" },
              project_type: { type: "string" },
              budget: { type: "number" },
              location: { type: "string" },
              description: { type: "string" },
              deadline: { type: "string" },
              client_requirements: { type: "array", items: { type: "string" } },
              urgency: { type: "string" },
              summary: { type: "string" }
            }
          }
        });

        return Response.json({ success: true, extracted });
      }

      default:
        return Response.json({ error: 'Action غير معروف' }, { status: 400 });
    }

  } catch (error) {
    console.error('Email service error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});