import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const isAuthenticated = await base44.auth.isAuthenticated();
    if (!isAuthenticated) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const payload = await req.json();

    const proposalId = payload.proposalId || payload.event?.entity_id;

    if (!proposalId) {
      return Response.json({ error: 'Proposal ID is required' }, { status: 400 });
    }

    // Get proposal details
    const [proposal] = await base44.asServiceRole.entities.Proposal.filter({ id: proposalId });
    if (!proposal) {
      return Response.json({ error: 'Proposal not found' }, { status: 404 });
    }

    // Only generate contract if proposal was accepted
    if (proposal.status !== 'accepted') {
      return Response.json({ message: 'Proposal not accepted yet, skipping' });
    }

    // Get project details
    const [project] = await base44.asServiceRole.entities.Project.filter({ id: proposal.project_id });
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get client and engineer
    const [client] = await base44.asServiceRole.entities.Client.filter({ id: project.client_id });
    const [engineer] = await base44.asServiceRole.entities.Engineer.filter({ id: proposal.engineer_id });

    // ── Authorization check ────────────────────────────────────────────────
    // Only the project owner (client), the proposal engineer, or an admin
    // may trigger contract generation for this proposal.
    const currentUser = await base44.auth.me();
    const callerEmail = currentUser?.email;
    const isAdmin = currentUser?.role === 'admin';

    const isProjectOwner = client?.email === callerEmail || project.created_by === callerEmail;
    const isProposalEngineer = engineer?.email === callerEmail;

    if (!isAdmin && !isProjectOwner && !isProposalEngineer) {
      return Response.json({ error: 'Forbidden — not authorized to generate contract for this proposal' }, { status: 403 });
    }

    // Check if contract already exists for this project
    const existingContracts = await base44.asServiceRole.entities.Contract.filter({
      project_id: project.id
    });

    if (existingContracts.length > 0) {
      return Response.json({
        message: 'Contract already exists',
        contract_id: existingContracts[0].id
      });
    }

    // Get default template
    const templates = await base44.asServiceRole.entities.ContractTemplate.filter({
      is_default: true,
      is_active: true
    });
    const defaultTemplate = templates.length > 0 ? templates[0] : null;

    // Generate contract number
    const contractNumber = `BYT-${Date.now().toString().slice(-8)}`;
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Calculate delivery date
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + (proposal.delivery_days || 30));
    const deliveryDateStr = deliveryDate.toISOString().split('T')[0];

    const paymentTerms = defaultTemplate?.default_payment_terms ||
      "30% دفعة مقدمة، 40% عند التصاميم الأولية، 30% عند التسليم النهائي";
    const additionalTerms = defaultTemplate?.default_terms || "";

    const clientName = client?.full_name || project.client_id || '—';
    const clientEmail = client?.email || '—';
    const clientPhone = client?.phone || '—';
    const engineerName = engineer?.full_name || '—';
    const engineerEmail = engineer?.email || '—';
    const engineerPhone = engineer?.phone || '—';
    const engineerSpecialization = engineer?.specialization || '—';
    const engineerLicense = engineer?.registration_number || engineer?.civil_engineering_license || '—';

    // ── Generate full contract text (Arabic) ──────────────────────────────
    const milestonesText = (proposal.custom_milestones?.length > 0)
      ? proposal.custom_milestones.map((m, i) =>
          `  ${i + 1}. ${m.title || m.name || ''}${m.amount ? ' — ' + m.amount.toLocaleString() + ' ر.س' : ''}`
        ).join('\n')
      : '  (حسب المراحل الافتراضية للمشروع)';

    const contractText = `
عقد عمل رقمي لتقديم خدمات هندسية وتصميمية

رقم العقد: ${contractNumber}
تاريخ الإنشاء: ${todayStr}

══════════════════════════════════════════════════

إنه في يوم ${todayStr}، تم الاتفاق بين الطرفين المذكورين أدناه:

الطرف الأول (العميل):
  الاسم: ${clientName}
  البريد الإلكتروني: ${clientEmail}
  الهاتف: ${clientPhone}

الطرف الثاني (المهندس/الجهة المنفذة):
  الاسم: ${engineerName}
  التخصص: ${engineerSpecialization}
  رقم الترخيص/القيد: ${engineerLicense}
  البريد الإلكتروني: ${engineerEmail}
  الهاتف: ${engineerPhone}

══════════════════════════════════════════════════

المادة (1) — موضوع العقد:
  يقدم الطرف الثاني خدمات هندسية وتصميمية للطرف الأول المتعلقة بالمشروع التالي:
  عنوان المشروع: ${project.title}
  وصف المشروع: ${project.description || '—'}
  نوع المشروع: ${project.category || '—'}
  موقع المشروع: ${project.location || '—'}

══════════════════════════════════════════════════

المادة (2) — القيمة الإجمالية وشروط الدفع:
  القيمة الإجمالية للعقد: ${proposal.price?.toLocaleString() || 0} ريال سعودي
  شروط الدفع: ${paymentTerms}
  ${additionalTerms ? '\n  بنود إضافية: ' + additionalTerms : ''}

══════════════════════════════════════════════════

المادة (3) — المدة الزمنية والتسليم:
  تاريخ البدء: ${todayStr}
  مدة التنفيذ: ${proposal.delivery_days || 30} يوماً
  تاريخ التسليم المتوقع: ${deliveryDateStr}
  يلتزم الطرف الثاني بتسليم كافة المخرجات في الموعد المحدد.

══════════════════════════════════════════════════

المادة (4) — مراحل التنفيذ:
${milestonesText}

══════════════════════════════════════════════════

المادة (5) — حقوق الملكية الفكرية:
  تنتقل جميع حقوق الملكية الفكرية للتصاميم والمخططات والمخرجات النهائية
  إلى الطرف الأول (العميل) بعد استكمال الدفعات المستحقة بالكامل.
  يحتفظ الطرف الثاني بحق استخدام المخرجات في معرض أعماله دون الإفصاح
  عن بيانات العميل الخاصة.

══════════════════════════════════════════════════

المادة (6) — التعديلات والمراجعات:
  يحق للطرف الأول طلب تعديلات ضمن الحد المسموح به (${project.max_revisions || 3} مرات).
  أي تعديلات تتجاوز ذلك قد تخضع لرسوم إضافية يتم الاتفاق عليها مسبقاً.

══════════════════════════════════════════════════

المادة (7) — حل النزاعات:
  في حال نشوء أي نزاع بين الطرفين، يتم حله عبر منصة بيتلي كوسيط أول.
  إذا لم يتم الحل، يُحال النزاع إلى التحكيم وفقاً لنظام التحكيم السعودي.

══════════════════════════════════════════════════

المادة (8) — السريّة:
  يلتزم كلا الطرفين بالحفاظ على سرية المعلومات المتبادلة وعدم الإفصاح
  عنها لأي طرف ثالث دون موافقة كتابية مسبقة.

══════════════════════════════════════════════════

المادة (9) — أحكام عامة:
  • هذا العقد سري المفعول من تاريخ توقيع الطرفين.
  • يخضع هذا العقد للأنظمة والقوانين المعمول بها في المملكة العربية السعودية.
  • منصة بيتلي بمثابة وسيط رقمي لتوثيق هذا العقد ولا تتحمل مسؤولية
    التنفيذ المادي للأعمال.

══════════════════════════════════════════════════

التوقيعات:

الطرف الأول (العميل):
  الاسم: ${clientName}
  التوقيع الإلكتروني: ☐ موافق
  التاريخ: ____________

الطرف الثاني (المهندس):
  الاسم: ${engineerName}
  التوقيع الإلكتروني: ☐ موافق
  التاريخ: ____________

══════════════════════════════════════════════════

تم إنشاء هذا العقد إلكترونياً عبر منصة بيتلي | www.mybytly.com
رقم مرجعي: ${contractNumber}
    `.trim();

    // ── Contract summary (for the description field, max 1000 chars) ───────
    const contractSummary = `عقد رقمي ${contractNumber} بين ${clientName} (العميل) و${engineerName} (المهندس) للمشروع "${project.title}". القيمة: ${proposal.price?.toLocaleString() || 0} ر.س. المدة: ${proposal.delivery_days || 30} يوم. تاريخ التسليم المتوقع: ${deliveryDateStr}. تم توليده آلياً عند قبول العرض بتاريخ ${todayStr}.`;

    // ── Create the Contract record ────────────────────────────────────────
    const contractData = {
      project_id: project.id,
      client_id: project.client_id,
      engineer_id: proposal.engineer_id,
      contract_number: contractNumber,
      contract_type: defaultTemplate?.contract_type || "service_agreement",
      service_description: contractText,
      total_amount: proposal.price,
      start_date: todayStr,
      delivery_date: deliveryDateStr,
      payment_terms: paymentTerms,
      additional_terms: additionalTerms,
      custom_clauses: defaultTemplate?.custom_clauses || [],
      description: contractSummary,
      status: "pending_signature",
      contract_version: 1
    };

    const contract = await base44.asServiceRole.entities.Contract.create(contractData);

    // Update template usage count
    if (defaultTemplate) {
      await base44.asServiceRole.entities.ContractTemplate.update(defaultTemplate.id, {
        usage_count: (defaultTemplate.usage_count || 0) + 1
      });
    }

    // ── Save a copy of the contract as a Document in the project record ───
    const dataUrl = `data:text/plain;charset=utf-8,${encodeURIComponent(contractText)}`;

    const existingDocs = await base44.asServiceRole.entities.Document.filter({
      linked_to: "project",
      linked_id: project.id,
      name: `عقد-${contractNumber}`
    });

    if (existingDocs.length === 0) {
      await base44.asServiceRole.entities.Document.create({
        name: `عقد-${contractNumber}`,
        file_url: dataUrl,
        file_type: "txt",
        document_type: "contract",
        linked_to: "project",
        linked_id: project.id,
        description: contractText,
        uploaded_by: "النظام – بيتلي"
      });
    }

    // ── Send notifications to both parties ────────────────────────────────
    await base44.asServiceRole.entities.Notification.create({
      recipient_email: clientEmail,
      title: "عقد عمل رقمي جاهز للتوقيع",
      message: `تم إنشاء عقد رقمي (${contractNumber}) للمشروع "${project.title}" بمجرد قبول عرض المهندس ${engineerName}. يرجى مراجعة العقد والتوقيع عليه لبدء العمل. تم حفظ نسخة من العقد في سجل المشروع كمرجع قانوني.`,
      type: "project_update",
      related_project_id: project.id,
      priority: "high"
    });

    await base44.asServiceRole.entities.Notification.create({
      recipient_email: engineerEmail,
      title: "عقد عمل رقمي جاهز للتوقيع",
      message: `تم قبول عرضك للمشروع "${project.title}" وإنشاء عقد رقمي (${contractNumber}). يرجى مراجعة العقد والتوقيع عليه. تم حفظ نسخة من العقد في سجل المشروع كمرجع قانوني.`,
      type: "project_update",
      related_project_id: project.id,
      priority: "high"
    });

    // Send emails
    const emailBody = (name, role) => `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width:600px; margin:0 auto;">
        <div style="background:linear-gradient(135deg,#6B5D4F,#C9A66B); padding:24px; border-radius:12px 12px 0 0; text-align:center;">
          <h1 style="color:white; margin:0; font-size:22px;">Bytly بيتلي</h1>
          <p style="color:rgba(255,255,255,0.8); margin:8px 0 0;">منصة الهندسة والتصميم</p>
        </div>
        <div style="background:#f8f9fa; padding:24px; border-radius:0 0 12px 12px;">
          <h2 style="color:#4A3F35;">مرحباً ${name}،</h2>
          <p style="color:#4a5568;">تم إنشاء عقد عمل رقمي جديد بمجرد قبول العرض:</p>
          <div style="background:white; border-right:4px solid #C9A66B; padding:16px; border-radius:8px; margin:16px 0;">
            <p><strong>رقم العقد:</strong> ${contractNumber}</p>
            <p><strong>المشروع:</strong> ${project.title}</p>
            <p><strong>${role === 'client' ? 'المهندس' : 'العميل'}:</strong> ${role === 'client' ? engineerName : clientName}</p>
            <p><strong>القيمة:</strong> ${proposal.price?.toLocaleString()} ريال سعودي</p>
            <p><strong>مدة التنفيذ:</strong> ${proposal.delivery_days || 30} يوم</p>
          </div>
          <p style="color:#718096; font-size:14px;">تم حفظ نسخة من العقد في سجل المشروع كمرجع قانوني للطرفين. يرجى تسجيل الدخول للمنصة لمراجعة العقد والتوقيع عليه.</p>
        </div>
      </div>`;

    if (clientEmail && clientEmail !== '—') {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: clientEmail,
        subject: `عقد عمل رقمي جاهز للتوقيع - ${contractNumber}`,
        body: emailBody(clientName, 'client')
      });
    }

    if (engineerEmail && engineerEmail !== '—') {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: engineerEmail,
        subject: `عقد عمل رقمي جاهز للتوقيع - ${contractNumber}`,
        body: emailBody(engineerName, 'engineer')
      });
    }

    // WhatsApp notification to client
    if (client?.phone) {
      try {
        await base44.asServiceRole.functions.invoke('sendWhatsappNotification', {
          type: "new_contract",
          to_phone: client.phone,
          to_name: client.full_name || "",
          contract_id: contract.id,
        });
      } catch (waErr) {
        console.error("WhatsApp contract notify failed:", waErr.message);
      }
    }

    return Response.json({
      success: true,
      contract_id: contract.id,
      contract_number: contractNumber,
      message: "تم توليد العقد الرقمي وحفظ نسخة في سجل المشروع"
    });

  } catch (error) {
    console.error("Error generating contract:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});