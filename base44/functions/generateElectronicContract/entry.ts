import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { proposal_id, proposalId, provider_type_override } = body;
    const pid = proposal_id || proposalId || body.event?.entity_id;

    if (!pid) return Response.json({ error: 'proposal_id is required' }, { status: 400 });

    // ── Fetch proposal ──────────────────────────────────────────────────
    const [proposal] = await base44.asServiceRole.entities.Proposal.filter({ id: pid });
    if (!proposal) return Response.json({ error: 'Proposal not found' }, { status: 404 });

    const providerType = provider_type_override || proposal.provider_type || 'engineer';

    // ── Fetch project ────────────────────────────────────────────────────
    const [project] = await base44.asServiceRole.entities.Project.filter({ id: proposal.project_id });
    if (!project) return Response.json({ error: 'Project not found' }, { status: 404 });

    // ── Fetch client ────────────────────────────────────────────────────
    const [client] = await base44.asServiceRole.entities.Client.filter({ id: project.client_id });
    const clientName = client?.full_name || client?.company_name || project.created_by || '—';
    const clientEmail = client?.email || project.created_by || '—';
    const clientPhone = client?.phone || '—';

    // ── Fetch provider (engineer OR contractor) ─────────────────────────
    let provider = null;
    let providerEntityName = '';

    if (providerType === 'contractor' && proposal.contractor_id) {
      const [c] = await base44.asServiceRole.entities.Contractor.filter({ id: proposal.contractor_id });
      provider = c;
      providerEntityName = 'Contractor';
    } else if (proposal.engineer_id) {
      const [e] = await base44.asServiceRole.entities.Engineer.filter({ id: proposal.engineer_id });
      provider = e;
      providerEntityName = 'Engineer';
    }

    if (!provider) return Response.json({ error: 'Provider not found' }, { status: 404 });

    // ── Authorization: caller must be the project owner or the provider ─
    const isCallerAdmin = user.role === 'admin';
    const isProjectOwner = project.created_by === user.email;
    const isProvider = provider?.email === user.email;
    if (!isCallerAdmin && !isProjectOwner && !isProvider) {
      return Response.json({ error: 'Forbidden: you are not authorized to generate a contract for this proposal' }, { status: 403 });
    }

    // ── Build provider display fields (engineer vs contractor) ───────────
    let providerName, providerEmail, providerPhone, providerLicense, providerSpecialization, providerIdField;

    if (providerEntityName === 'Contractor') {
      providerName = provider.company_name || '—';
      providerEmail = provider.email || '—';
      providerPhone = provider.phone || '—';
      providerLicense = provider.license_number || provider.commercial_registration || '—';
      providerSpecialization = provider.specialization || '—';
      providerIdField = { contractor_id: provider.id };
    } else {
      providerName = provider.full_name || '—';
      providerEmail = provider.email || '—';
      providerPhone = provider.phone || '—';
      providerLicense = provider.registration_number || provider.civil_engineering_license || '—';
      providerSpecialization = provider.specialization || '—';
      providerIdField = { engineer_id: provider.id };
    }

    // ── Check for duplicate contract ────────────────────────────────────
    const existingContracts = await base44.asServiceRole.entities.Contract.filter({
      project_id: project.id,
      ...providerIdField
    });
    if (existingContracts.length > 0) {
      return Response.json({
        message: 'Contract already exists for this project and provider',
        contract_id: existingContracts[0].id,
        already_exists: true
      });
    }

    // ── Try to load default template ────────────────────────────────────
    let defaultTemplate = null;
    try {
      const templates = await base44.asServiceRole.entities.ContractTemplate.filter({
        is_default: true,
        is_active: true
      });
      defaultTemplate = templates.length > 0 ? templates[0] : null;
    } catch (_) {}

    // ── Generate contract metadata ──────────────────────────────────────
    const contractNumber = `BYT-${Date.now().toString().slice(-8)}`;
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + (proposal.delivery_days || 30));
    const deliveryDateStr = deliveryDate.toISOString().split('T')[0];

    const paymentTerms = defaultTemplate?.default_payment_terms ||
      proposal.custom_milestones?.[0]?.payment_terms ||
      "30% دفعة مقدمة، 40% عند التصاميم الأولية، 30% عند التسليم النهائي";
    const additionalTerms = defaultTemplate?.default_terms || proposal.description || "";

    // ── Build milestones text ────────────────────────────────────────────
    const milestonesText = (proposal.custom_milestones?.length > 0)
      ? proposal.custom_milestones.map((m, i) =>
          `  ${i + 1}. ${m.title || m.name || ''}${m.amount ? ' — ' + Number(m.amount).toLocaleString() + ' ر.س' : ''}`
        ).join('\n')
      : '  (حسب المراحل الافتراضية للمشروع)';

    const providerLabel = providerEntityName === 'Contractor' ? 'المقاول' : 'المهندس';
    const providerEntityType = providerEntityName === 'Contractor' ? 'الجهة المنفذة (مقاول)' : 'الجهة المنفذة (مهندس)';

    // ── Generate full contract text ─────────────────────────────────────
    const contractText = `
عقد عمل رقمي ${providerEntityName === 'Contractor' ? 'للتوريد والتنفيذ' : 'لتقديم خدمات هندسية وتصميمية'}

رقم العقد: ${contractNumber}
تاريخ الإنشاء: ${todayStr}
نوع مقدم الخدمة: ${providerLabel}

══════════════════════════════════════════════════

إنه في يوم ${todayStr}، تم الاتفاق بين الطرفين المذكورين أدناه:

الطرف الأول (العميل):
  الاسم: ${clientName}
  البريد الإلكتروني: ${clientEmail}
  الهاتف: ${clientPhone}

الطرف الثاني (${providerEntityType}):
  ${providerEntityName === 'Contractor' ? 'اسم الشركة/المقاول' : 'الاسم'}: ${providerName}
  التخصص: ${providerSpecialization}
  ${providerEntityName === 'Contractor' ? 'رقم السجل التجاري/الترخيص' : 'رقم الترخيص/القيد المهني'}: ${providerLicense}
  البريد الإلكتروني: ${providerEmail}
  الهاتف: ${providerPhone}

══════════════════════════════════════════════════

المادة (1) — موضوع العقد:
  يقدم الطرف الثاني ${providerEntityName === 'Contractor' ? 'خدمات التوريد والتنفيذ' : 'خدمات هندسية وتصميمية'} للطرف الأول المتعلقة بالمشروع التالي:
  عنوان المشروع: ${project.title}
  وصف المشروع: ${project.description || '—'}
  نوع المشروع: ${project.category || '—'}
  موقع المشروع: ${project.location || '—'}

══════════════════════════════════════════════════

المادة (2) — القيمة الإجمالية وشروط الدفع:
  القيمة الإجمالية للعقد: ${Number(proposal.price || 0).toLocaleString()} ريال سعودي
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

المادة (7) — الضمانات والجودة:
  يضمن الطرف الثاني جودة العمل المنفذ وفقاً للمواصفات المعتمدة.
  ${providerEntityName === 'Contractor' ? 'يضمن المقاول جودة المواد المستخدمة وسلامة التنفيذ.' : 'يضمن المهندس مطابقة التصاميم للأكواد والمعايير الهندسية.'}

══════════════════════════════════════════════════

المادة (8) — حل النزاعات:
  في حال نشوء أي نزاع بين الطرفين، يتم حله عبر منصة بيتلي كوسيط أول.
  إذا لم يتم الحل، يُحال النزاع إلى التحكيم وفقاً لنظام التحكيم السعودي.

══════════════════════════════════════════════════

المادة (9) — السريّة:
  يلتزم كلا الطرفين بالحفاظ على سرية المعلومات المتبادلة وعدم الإفصاح
  عنها لأي طرف ثالث دون موافقة كتابية مسبقة.

══════════════════════════════════════════════════

المادة (10) — أحكام عامة:
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

الطرف الثاني (${providerLabel}):
  الاسم: ${providerName}
  التوقيع الإلكتروني: ☐ موافق
  التاريخ: ____________

══════════════════════════════════════════════════

تم إنشاء هذا العقد إلكترونياً عبر منصة بيتلي | www.mybytly.com
رقم مرجعي: ${contractNumber}
    `.trim();

    // ── Contract summary (max 1000 chars) ───────────────────────────────
    const contractSummary = `عقد رقمي ${contractNumber} بين ${clientName} (العميل) و${providerName} (${providerLabel}) للمشروع "${project.title}". القيمة: ${Number(proposal.price || 0).toLocaleString()} ر.س. المدة: ${proposal.delivery_days || 30} يوم. تاريخ التسليم المتوقع: ${deliveryDateStr}. تم توليده آلياً عند قبول العرض بتاريخ ${todayStr}.`.slice(0, 1000);

    // ── Create the Contract record ──────────────────────────────────────
    const contractData = {
      project_id: project.id,
      client_id: project.client_id,
      provider_type: providerType,
      ...providerIdField,
      contract_number: contractNumber,
      contract_type: defaultTemplate?.contract_type || "service_agreement",
      service_description: contractText,
      total_amount: proposal.price,
      start_date: todayStr,
      delivery_date: deliveryDateStr,
      payment_terms: paymentTerms,
      additional_terms: additionalTerms,
      milestones: proposal.custom_milestones || [],
      custom_clauses: defaultTemplate?.custom_clauses || [],
      description: contractSummary,
      status: "pending_signature",
      contract_version: 1,
      client_signature: false,
      engineer_signature: false
    };

    const contract = await base44.asServiceRole.entities.Contract.create(contractData);

    // ── Update proposal status ──────────────────────────────────────────
    await base44.asServiceRole.entities.Proposal.update(proposal.id, {
      status: "accepted"
    });

    // ── Update project status & assigned provider ───────────────────────
    const projectUpdate = {
      status: "in_progress"
    };
    if (providerType === 'contractor') {
      projectUpdate.assigned_engineer_id = proposal.contractor_id;
    } else {
      projectUpdate.assigned_engineer_id = proposal.engineer_id;
    }
    await base44.asServiceRole.entities.Project.update(project.id, projectUpdate);

    // ── Update template usage count ─────────────────────────────────────
    if (defaultTemplate) {
      try {
        await base44.asServiceRole.entities.ContractTemplate.update(defaultTemplate.id, {
          usage_count: (defaultTemplate.usage_count || 0) + 1
        });
      } catch (_) {}
    }

    // ── Save a copy as Document ────────────────────────────────────────
    try {
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
    } catch (_) {}

    // ── Notifications to both parties ───────────────────────────────────
    const notifyTitle = `عقد إلكتروني جاهز للتوقيع — ${contractNumber}`;
    const notifyClientMsg = `تم قبول ${providerType === 'contractor' ? 'عرض المقاول' : 'عرض المهندس'} ${providerName} لمشروع "${project.title}". تم إنشاء عقد إلكتروني رسمي بجميع التفاصيل تلقائياً. يرجى مراجعة العقد والتوقيع عليه لضمان حقوقك.`;
    const notifyProviderMsg = `تم قبول عرضك لمشروع "${project.title}" وإنشاء عقد إلكتروني رسمي (${contractNumber}) بجميع بيانات المشروع والطرفين تلقائياً. يرجى مراجعة العقد والتوقيع عليه.`;

    await Promise.all([
      base44.asServiceRole.entities.Notification.create({
        recipient_email: clientEmail,
        title: notifyTitle,
        message: notifyClientMsg,
        type: 'contract',
        related_project_id: project.id,
        related_entity_id: contract.id,
        action_url: '/MyContracts',
        priority: 'urgent'
      }),
      base44.asServiceRole.entities.Notification.create({
        recipient_email: providerEmail,
        title: notifyTitle,
        message: notifyProviderMsg,
        type: 'contract',
        related_project_id: project.id,
        related_entity_id: contract.id,
        action_url: '/MyContracts',
        priority: 'urgent'
      })
    ]);

    // ── Email to both parties ────────────────────────────────────────────
    const emailBody = (name, role) => `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width:600px; margin:0 auto;">
        <div style="background:linear-gradient(135deg,#6B5D4F,#C9A66B); padding:24px; border-radius:12px 12px 0 0; text-align:center;">
          <h1 style="color:white; margin:0; font-size:22px;">Bytly بيتلي</h1>
          <p style="color:rgba(255,255,255,0.8); margin:8px 0 0;">عقد إلكتروني رسمي</p>
        </div>
        <div style="background:#f8f9fa; padding:24px; border-radius:0 0 12px 12px;">
          <h2 style="color:#4A3F35;">مرحباً ${name}،</h2>
          <p style="color:#4a5568;">تم إنشاء عقد إلكتروني رسمي بعد قبول العرض، وتم ملء جميع بيانات المشروع والطرفين تلقائياً:</p>
          <div style="background:white; border-right:4px solid #C9A66B; padding:16px; border-radius:8px; margin:16px 0;">
            <p><strong>رقم العقد:</strong> ${contractNumber}</p>
            <p><strong>المشروع:</strong> ${project.title}</p>
            <p><strong>${role === 'client' ? providerLabel : 'العميل'}:</strong> ${role === 'client' ? providerName : clientName}</p>
            <p><strong>القيمة:</strong> ${Number(proposal.price || 0).toLocaleString()} ريال سعودي</p>
            <p><strong>مدة التنفيذ:</strong> ${proposal.delivery_days || 30} يوم</p>
            <p><strong>تاريخ التسليم المتوقع:</strong> ${deliveryDateStr}</p>
          </div>
          <p style="color:#718096; font-size:14px;">تم حفظ نسخة كاملة من العقد في سجل المشروع كمرجع قانوني. يرجى تسجيل الدخول للمنصة لمراجعة العقد والتوقيع عليه إلكترونياً لضمان حقوق الطرفين.</p>
          <p style="margin-top:24px;">
            <a href="https://mybytly.com/MyContracts"
               style="background:#6B5D4F; color:white; padding:12px 30px; text-decoration:none; border-radius:8px; display:inline-block;">
              مراجعة وتوقيع العقد
            </a>
          </p>
        </div>
        <p style="color:#999; font-size:12px; text-align:center; margin-top:16px;">منصة بيتلي - لمسة بيت</p>
      </div>`;

    try {
      if (clientEmail && clientEmail !== '—') {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: clientEmail,
          subject: `عقد إلكتروني رسمي جاهز للتوقيع - ${contractNumber}`,
          body: emailBody(clientName, 'client')
        });
      }
      if (providerEmail && providerEmail !== '—') {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: providerEmail,
          subject: `عقد إلكتروني رسمي جاهز للتوقيع - ${contractNumber}`,
          body: emailBody(providerName, 'provider')
        });
      }
    } catch (emailErr) {
      console.error('Failed to send contract emails:', emailErr);
    }

    // ── WhatsApp notification to client ─────────────────────────────────
    if (client?.phone) {
      try {
        await base44.asServiceRole.functions.invoke('sendWhatsappNotification', {
          type: "new_contract",
          to_phone: client.phone,
          to_name: clientName,
          contract_id: contract.id,
        });
      } catch (waErr) {
        console.error('WhatsApp contract notify failed:', waErr.message);
      }
    }

    return Response.json({
      success: true,
      contract_id: contract.id,
      contract_number: contractNumber,
      provider_type: providerType,
      message: `تم إنشاء عقد إلكتروني رسمي (${contractNumber}) بين العميل و${providerLabel} ${providerName} وملء جميع البيانات تلقائياً`
    });

  } catch (error) {
    console.error('generateElectronicContract error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});