import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { contract_id, project_id } = await req.json();

    if (!contract_id || !project_id) {
      return Response.json({ error: 'contract_id and project_id are required' }, { status: 400 });
    }

    // Fetch all needed data using service role
    const [contracts, projects, clients, engineers] = await Promise.all([
      base44.asServiceRole.entities.Contract.filter({ id: contract_id }),
      base44.asServiceRole.entities.Project.filter({ id: project_id }),
      base44.asServiceRole.entities.Client.list(),
      base44.asServiceRole.entities.Engineer.list(),
    ]);

    const contract  = contracts[0];
    const project   = projects[0];
    if (!contract || !project) {
      return Response.json({ error: 'Contract or project not found' }, { status: 404 });
    }

    const client   = clients.find(c => c.id === contract.client_id);
    const engineer = engineers.find(e => e.id === contract.engineer_id);

    // Build a plain-text representation (stored as notes for audit)
    const contractText = `
عقد رقم: ${contract.contract_number}
تاريخ الإنشاء: ${new Date(contract.created_date).toLocaleDateString('ar')}
المشروع: ${project.title}

الطرف الأول (العميل): ${client?.full_name || '—'} — ${client?.email || '—'}
الطرف الثاني (المهندس): ${engineer?.full_name || '—'} — ${engineer?.email || '—'}

القيمة الإجمالية: ${contract.total_amount?.toLocaleString()} ريال سعودي
شروط الدفع: ${contract.payment_terms || '—'}
تاريخ البدء: ${contract.start_date || '—'}
تاريخ التسليم: ${contract.delivery_date || '—'}

توقيع العميل: ${contract.client_signature ? '✓ موقّع في ' + new Date(contract.client_signature_date).toLocaleDateString('ar') : 'لم يُوقَّع'}
توقيع المهندس: ${contract.engineer_signature ? '✓ موقّع في ' + new Date(contract.engineer_signature_date).toLocaleDateString('ar') : 'لم يُوقَّع'}

وثيقة صادرة عن منصة بيتلي | www.mybytly.com
    `.trim();

    // Store the contract snapshot as a Document linked to the project
    const existingDocs = await base44.asServiceRole.entities.Document.filter({
      project_id: project_id,
      title: `عقد-${contract.contract_number}`,
    });

    if (existingDocs.length === 0) {
      await base44.asServiceRole.entities.Document.create({
        project_id: project_id,
        title: `عقد-${contract.contract_number}`,
        content: contractText,
        document_type: 'contract',
        status: 'final',
        created_by_name: 'النظام – بيتلي',
        related_contract_id: contract_id,
      });
    } else {
      await base44.asServiceRole.entities.Document.update(existingDocs[0].id, {
        content: contractText,
        status: 'final',
      });
    }

    // Send email notifications to both parties
    const notifyParty = async (email, name) => {
      if (!email) return;
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: email,
        subject: `✅ عقد موقّع – ${project.title}`,
        body: `
<div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #1a1a2e, #d4a574); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 22px;">Bytly بيتلي</h1>
    <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">منصة الهندسة والتصميم</p>
  </div>
  <div style="background: #f8f9fa; padding: 24px; border-radius: 0 0 12px 12px;">
    <h2 style="color: #1a1a2e;">مرحباً ${name || ''}،</h2>
    <p style="color: #4a5568;">تم توقيع عقد المشروع التالي من قبل الطرفين وأصبح سارياً:</p>
    <div style="background: white; border-right: 4px solid #d4a574; padding: 16px; border-radius: 8px; margin: 16px 0;">
      <p><strong>المشروع:</strong> ${project.title}</p>
      <p><strong>رقم العقد:</strong> ${contract.contract_number}</p>
      <p><strong>القيمة:</strong> ${contract.total_amount?.toLocaleString()} ريال سعودي</p>
    </div>
    <p style="color: #718096; font-size: 14px;">يمكنك الاطلاع على العقد كاملاً من خلال تطبيق بيتلي.</p>
  </div>
</div>`,
      });
    };

    await Promise.all([
      notifyParty(client?.email, client?.full_name),
      notifyParty(engineer?.email, engineer?.full_name),
    ]);

    return Response.json({ success: true, message: 'Contract saved to project files and emails sent' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});