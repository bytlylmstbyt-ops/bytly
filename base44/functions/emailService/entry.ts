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

      // 1. إرسال تحديثات المشروع للعملاء — recipient derived from verified DB records
      case 'sendProjectUpdate': {
        const { projectId, updateMessage, milestoneTitle, status } = data;
        if (!projectId) {
          return Response.json({ error: 'projectId is required' }, { status: 400 });
        }

        const [project] = await base44.asServiceRole.entities.Project.filter({ id: projectId });
        if (!project) {
          return Response.json({ error: 'Project not found' }, { status: 404 });
        }

        // Verify the caller is a project participant or admin
        const isOwner = project.created_by === user.email;
        const isAdmin = user.role === 'admin';
        let isAssignedEngineer = false;
        if (project.assigned_engineer_id) {
          const [eng] = await base44.asServiceRole.entities.Engineer.filter({ id: project.assigned_engineer_id });
          isAssignedEngineer = eng?.email === user.email;
        }
        if (!isOwner && !isAdmin && !isAssignedEngineer) {
          return Response.json({ error: 'Forbidden: you are not a participant of this project' }, { status: 403 });
        }

        // Derive the recipient email from the verified Client record
        if (!project.client_id) {
          return Response.json({ error: 'Project has no associated client' }, { status: 400 });
        }
        const [client] = await base44.asServiceRole.entities.Client.filter({ id: project.client_id });
        if (!client?.email) {
          return Response.json({ error: 'Client email not found' }, { status: 404 });
        }

        const clientEmail = client.email;
        const clientName = client.full_name || 'عميلنا العزيز';
        const projectTitle = project.title || 'مشروع بيتلي';
        const statusAr = {
          in_progress: 'قيد التنفيذ',
          completed: 'مكتمل',
          submitted: 'تم التسليم',
          approved: 'معتمد',
          revision_requested: 'يحتاج مراجعة'
        }[status] || status;

        await base44.asServiceRole.integrations.Core.SendEmail({
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

      // 2. إبلاغ المهندسين/المصممين بمشاريع جديدة — recipient derived from verified Engineer record
      case 'notifyEngineerNewProject': {
        const { engineerId, projectId } = data;
        if (!projectId || !engineerId) {
          return Response.json({ error: 'projectId and engineerId are required' }, { status: 400 });
        }

        const [project] = await base44.asServiceRole.entities.Project.filter({ id: projectId });
        if (!project) {
          return Response.json({ error: 'Project not found' }, { status: 404 });
        }

        // Only the project owner or an admin may notify engineers about a project
        const isOwner = project.created_by === user.email;
        const isAdmin = user.role === 'admin';
        if (!isOwner && !isAdmin) {
          return Response.json({ error: 'Forbidden: only the project owner or admin may notify engineers' }, { status: 403 });
        }

        // Derive the recipient email from the verified Engineer record
        const [engineer] = await base44.asServiceRole.entities.Engineer.filter({ id: engineerId });
        if (!engineer?.email) {
          return Response.json({ error: 'Engineer not found' }, { status: 404 });
        }

        const engineerEmail = engineer.email;
        const engineerName = engineer.full_name || 'مهندسنا العزيز';
        const projectTitle = project.title || 'مشروع بيتلي';
        const projectDescription = project.description || '';
        const projectBudget = project.budget_min ? `${project.budget_min}${project.budget_max ? ` - ${project.budget_max}` : ''}` : '';
        const projectCategory = project.category || '';
        const categoryAr = {
          interior: 'تصميم داخلي',
          architecture: 'معماري',
          painting: 'رسم',
          landscape: 'مناظر طبيعية',
          furniture: 'أثاث',
          lighting: 'إضاءة'
        }[projectCategory] || projectCategory;

        await base44.asServiceRole.integrations.Core.SendEmail({
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

      // 3. صياغة وإرسال رسائل متابعة للمقترحات — recipient derived from verified Proposal/Project records
      case 'sendProposalFollowup': {
        const { proposalId, daysSinceSubmission } = data;
        if (!proposalId) {
          return Response.json({ error: 'proposalId is required' }, { status: 400 });
        }

        const [proposal] = await base44.asServiceRole.entities.Proposal.filter({ id: proposalId });
        if (!proposal) {
          return Response.json({ error: 'Proposal not found' }, { status: 404 });
        }

        const [project] = await base44.asServiceRole.entities.Project.filter({ id: proposal.project_id });
        if (!project) {
          return Response.json({ error: 'Project not found' }, { status: 404 });
        }

        // Determine the caller's role and the authorized recipient (the "other party")
        const isAdmin = user.role === 'admin';
        const isProposalSubmitter = proposal.created_by === user.email;
        const isProjectOwner = project.created_by === user.email;
        if (!isAdmin && !isProposalSubmitter && !isProjectOwner) {
          return Response.json({ error: 'Forbidden: you are not a participant of this proposal' }, { status: 403 });
        }

        let recipientEmail: string;
        let recipientName: string;
        let senderRole: string;

        if (isProposalSubmitter || (isAdmin && !isProjectOwner)) {
          // Sender is the engineer → recipient is the project owner (client)
          senderRole = 'engineer';
          recipientEmail = project.created_by;
          recipientName = 'عميلنا العزيز';
        } else {
          // Sender is the client → recipient is the engineer who submitted the proposal
          senderRole = 'client';
          if (!proposal.engineer_id) {
            return Response.json({ error: 'Proposal has no associated engineer' }, { status: 400 });
          }
          const [engineer] = await base44.asServiceRole.entities.Engineer.filter({ id: proposal.engineer_id });
          if (!engineer?.email) {
            return Response.json({ error: 'Engineer email not found' }, { status: 404 });
          }
          recipientEmail = engineer.email;
          recipientName = engineer.full_name || 'مهندسنا العزيز';
        }

        if (!recipientEmail) {
          return Response.json({ error: 'Recipient email could not be resolved' }, { status: 400 });
        }

        const proposalTitle = project.title || 'مشروع بيتلي';
        const proposalAmount = proposal.price || 0;

        // صياغة تلقائية بالذكاء الاصطناعي
        const aiDraft = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `اكتب رسالة بريد إلكتروني متابعة احترافية باللغة العربية لمقترح مشروع هندسي.
المعطيات:
- اسم المستلم: ${recipientName}
- عنوان المقترح: ${proposalTitle}
- قيمة المقترح: ${proposalAmount} ريال
- مضى على تقديم المقترح: ${daysSinceSubmission} يوم
- المرسل: ${senderRole === 'engineer' ? 'مهندس' : 'عميل'}

اكتب رسالة قصيرة ومهنية ودافئة (3-4 جمل فقط) تذكر المستلم بالمقترح وتطلب الرد. بدون مقدمات أو تحيات إضافية، فقط نص الرسالة.`
        });

        await base44.asServiceRole.integrations.Core.SendEmail({
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

        const extracted = await base44.asServiceRole.integrations.Core.InvokeLLM({
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