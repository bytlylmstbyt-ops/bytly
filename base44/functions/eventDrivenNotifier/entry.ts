/**
 * eventDrivenNotifier — نظام تنبيهات مركزي قائم على الأحداث
 * يُستدعى من automations عند: قبول عرض، تحرير دفعة، قرب استحقاق مرحلة، رسالة جديدة
 *
 * Payload: { event_type, data, metadata }
 *
 * event_type values:
 *  - proposal_accepted       → data: { proposal, project, engineer, client }
 *  - payment_released        → data: { milestone, project, engineer, client }
 *  - milestone_due_soon      → data: { milestone, project, engineer, client, days_remaining }
 *  - new_project_message     → data: { message, project, sender, recipient }
 *  - milestone_submitted     → data: { milestone, project, engineer, client }
 *  - milestone_approved      → data: { milestone, project, engineer, client }
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const WHATSAPP_API_TOKEN = Deno.env.get("WHATSAPP_API_TOKEN");
const PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
const APP_URL = "https://mybytly.com";

// ─── HTML Email Template ──────────────────────────────────────────────────────
function buildEmailHtml({ title, bodyHtml, ctaText, ctaUrl, icon = "🔔" }) {
  return `
  <div dir="rtl" style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f5f0; padding: 20px;">
    <div style="background: linear-gradient(135deg, #1a1a2e 0%, #4A3F35 60%, #C9A66B 100%);
                padding: 32px 24px; border-radius: 16px 16px 0 0; text-align: center;">
      <div style="font-size: 36px; margin-bottom: 8px;">${icon}</div>
      <h1 style="color: white; margin: 0; font-size: 20px; font-weight: 700;">Bytly — لمسة بيت</h1>
    </div>
    <div style="background: white; padding: 32px 28px; border-radius: 0 0 16px 16px;
                border: 1px solid #e5e0d8; border-top: none;">
      <h2 style="color: #1a1a2e; font-size: 18px; margin-top: 0;">${title}</h2>
      ${bodyHtml}
      ${ctaUrl ? `
      <div style="text-align: center; margin-top: 28px;">
        <a href="${ctaUrl}"
           style="background: linear-gradient(135deg, #1a1a2e, #C9A66B); color: white;
                  padding: 14px 32px; border-radius: 10px; text-decoration: none;
                  font-weight: bold; font-size: 14px; display: inline-block;">
          ${ctaText || 'عرض التفاصيل'}
        </a>
      </div>` : ''}
      <hr style="margin: 28px 0; border: none; border-top: 1px solid #f0ece6;">
      <p style="color: #aaa; font-size: 11px; text-align: center; margin: 0;">
        فريق Bytly | <a href="mailto:info@mybytly.com" style="color:#C9A66B;">info@mybytly.com</a>
      </p>
    </div>
  </div>`;
}

// ─── WhatsApp Sender ──────────────────────────────────────────────────────────
async function sendWhatsApp(toPhone, message) {
  if (!WHATSAPP_API_TOKEN || !PHONE_NUMBER_ID || !toPhone) return null;
  const phone = toPhone.replace(/[\s\-\(\)]/g, '').replace(/^\+/, '');
  const res = await fetch(`https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${WHATSAPP_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: phone,
      type: "text",
      text: { body: message }
    })
  });
  const result = await res.json();
  if (!res.ok) console.error("WhatsApp error:", JSON.stringify(result));
  return result;
}

// ─── Multi-channel Notify Helper ──────────────────────────────────────────────
async function notifyAll(base44, { recipientEmail, recipientPhone, recipientName,
  title, message, notifType, relatedProjectId, priority = "high",
  emailSubject, emailBodyHtml, whatsappText, ctaUrl }) {

  const tasks = [];

  // 1. In-app notification
  tasks.push(
    base44.asServiceRole.entities.Notification.create({
      recipient_email: recipientEmail,
      title,
      message,
      type: notifType,
      related_project_id: relatedProjectId,
      is_read: false,
      email_sent: false,
      priority
    })
  );

  // 2. Email notification
  if (emailBodyHtml) {
    tasks.push(
      base44.asServiceRole.integrations.Core.SendEmail({
        to: recipientEmail,
        subject: emailSubject || `🔔 ${title} — Bytly`,
        body: emailBodyHtml
      }).catch(e => console.error("Email error:", e.message))
    );
  }

  // 3. WhatsApp notification
  if (recipientPhone && whatsappText) {
    tasks.push(
      sendWhatsApp(recipientPhone, whatsappText)
        .catch(e => console.error("WhatsApp error:", e.message))
    );
  }

  await Promise.all(tasks);
}

// ─── Event Handlers ───────────────────────────────────────────────────────────

async function handleProposalAccepted(base44, { proposal, project, engineer, client }) {
  const projectUrl = `${APP_URL}/ProjectDetails?id=${project.id}`;

  // Notify engineer
  await notifyAll(base44, {
    recipientEmail: engineer.email,
    recipientPhone: engineer.phone,
    recipientName: engineer.full_name,
    title: "🎉 تم قبول عرضك!",
    message: `تهانينا! تم قبول عرضك بقيمة ${proposal.price?.toLocaleString()} ريال على مشروع "${project.title}"`,
    notifType: "approval",
    relatedProjectId: project.id,
    priority: "urgent",
    emailSubject: `🎉 تم قبول عرضك على مشروع ${project.title}`,
    emailBodyHtml: buildEmailHtml({
      icon: "🎉",
      title: "تهانينا! تم قبول عرضك",
      bodyHtml: `
        <p style="color:#374151;">مرحباً <strong>${engineer.full_name}</strong>،</p>
        <p style="color:#374151;">يسعدنا إخبارك بأن العميل قبل عرضك على المشروع التالي:</p>
        <div style="background:#f0fdf4; border-right: 4px solid #22c55e; padding:16px; border-radius:8px; margin:16px 0;">
          <p style="margin:0;"><strong>المشروع:</strong> ${project.title}</p>
          <p style="margin:8px 0 0;"><strong>قيمة العرض:</strong> <span style="color:#16a34a; font-size:18px;">${proposal.price?.toLocaleString()} ريال</span></p>
          <p style="margin:8px 0 0;"><strong>مدة التسليم:</strong> ${proposal.delivery_days} يوم</p>
        </div>
        <p style="color:#6b7280; font-size:14px;">يمكنك الآن البدء بالعمل والتواصل مع العميل عبر المنصة.</p>
      `,
      ctaText: "عرض تفاصيل المشروع",
      ctaUrl: projectUrl
    }),
    whatsappText: `🎉 *Bytly — تم قبول عرضك!*\n\nمرحباً ${engineer.full_name}،\nتهانينا! قبل العميل عرضك على مشروع *"${project.title}"*.\n💰 القيمة: *${proposal.price?.toLocaleString()} ريال*\n\n👉 تابع المشروع: ${projectUrl}`
  });

  // Notify client too (confirmation)
  if (client?.email) {
    await notifyAll(base44, {
      recipientEmail: client.email,
      recipientPhone: client.phone,
      recipientName: client.full_name || client.name,
      title: "✅ تم تأكيد قبول العرض",
      message: `تم قبول عرض ${engineer.full_name} على مشروع "${project.title}". سيبدأ العمل قريباً.`,
      notifType: "approval",
      relatedProjectId: project.id,
      priority: "high",
      emailSubject: `✅ تم تأكيد قبول عرض ${engineer.full_name}`,
      emailBodyHtml: buildEmailHtml({
        icon: "✅",
        title: "تأكيد قبول العرض",
        bodyHtml: `
          <p style="color:#374151;">مرحباً،</p>
          <p style="color:#374151;">تم تأكيد قبولك لعرض المهندس <strong>${engineer.full_name}</strong> على مشروعك.</p>
          <div style="background:#eff6ff; border-right:4px solid #3b82f6; padding:16px; border-radius:8px; margin:16px 0;">
            <p style="margin:0;"><strong>المشروع:</strong> ${project.title}</p>
            <p style="margin:8px 0 0;"><strong>المهندس:</strong> ${engineer.full_name}</p>
            <p style="margin:8px 0 0;"><strong>القيمة المتفق عليها:</strong> ${proposal.price?.toLocaleString()} ريال</p>
          </div>
        `,
        ctaText: "عرض المشروع",
        ctaUrl: projectUrl
      }),
      whatsappText: `✅ *Bytly — تأكيد قبول العرض*\n\nتم قبول عرض المهندس *${engineer.full_name}* على مشروع *"${project.title}"*.\n💰 القيمة: *${proposal.price?.toLocaleString()} ريال*\n\n👉 ${projectUrl}`
    });
  }
}

async function handlePaymentReleased(base44, { milestone, project, engineer, client }) {
  const walletUrl = `${APP_URL}/Wallet`;
  const projectUrl = `${APP_URL}/ProjectDetails?id=${project.id}`;

  // Notify engineer about payment
  await notifyAll(base44, {
    recipientEmail: engineer.email,
    recipientPhone: engineer.phone,
    recipientName: engineer.full_name,
    title: "💰 تم تحرير دفعة مالية لك",
    message: `تم تحرير دفعة بقيمة ${milestone.amount?.toLocaleString()} ريال للمرحلة "${milestone.title}" في مشروع "${project.title}"`,
    notifType: "payment",
    relatedProjectId: project.id,
    priority: "urgent",
    emailSubject: `💰 تم تحرير دفعتك — ${milestone.title}`,
    emailBodyHtml: buildEmailHtml({
      icon: "💰",
      title: "تم تحرير دفعتك المالية",
      bodyHtml: `
        <p style="color:#374151;">مرحباً <strong>${engineer.full_name}</strong>،</p>
        <p style="color:#374151;">تمت الموافقة على صرف دفعتك المالية للمرحلة التالية:</p>
        <div style="background:#fefce8; border-right:4px solid #eab308; padding:16px; border-radius:8px; margin:16px 0;">
          <p style="margin:0;"><strong>المشروع:</strong> ${project.title}</p>
          <p style="margin:8px 0 0;"><strong>المرحلة:</strong> ${milestone.title}</p>
          <p style="margin:8px 0 0;"><strong>قيمة الدفعة:</strong> <span style="color:#b45309; font-size:20px; font-weight:bold;">${milestone.amount?.toLocaleString()} ريال</span></p>
        </div>
        <p style="color:#6b7280; font-size:14px;">يمكنك متابعة رصيدك من محفظتك في المنصة.</p>
      `,
      ctaText: "عرض المحفظة",
      ctaUrl: walletUrl
    }),
    whatsappText: `💰 *Bytly — تم تحرير دفعتك!*\n\nمرحباً ${engineer.full_name}،\nتم تحرير دفعة بقيمة *${milestone.amount?.toLocaleString()} ريال*\nللمرحلة: *${milestone.title}*\nالمشروع: *${project.title}*\n\n👉 محفظتك: ${walletUrl}`
  });

  // Notify client about release confirmation
  if (client?.email) {
    await notifyAll(base44, {
      recipientEmail: client.email,
      recipientPhone: client.phone,
      recipientName: client.full_name || client.name,
      title: "✅ تم صرف الدفعة للمهندس",
      message: `تم صرف دفعة ${milestone.amount?.toLocaleString()} ريال للمهندس ${engineer.full_name} للمرحلة "${milestone.title}"`,
      notifType: "payment",
      relatedProjectId: project.id,
      priority: "medium",
      emailSubject: `✅ تأكيد صرف الدفعة — ${milestone.title}`,
      emailBodyHtml: buildEmailHtml({
        icon: "✅",
        title: "تأكيد صرف الدفعة",
        bodyHtml: `
          <p style="color:#374151;">مرحباً،</p>
          <p>تم صرف الدفعة المالية للمهندس <strong>${engineer.full_name}</strong> للمرحلة المكتملة:</p>
          <div style="background:#f0fdf4; border-right:4px solid #22c55e; padding:16px; border-radius:8px; margin:16px 0;">
            <p style="margin:0;"><strong>المشروع:</strong> ${project.title}</p>
            <p style="margin:8px 0 0;"><strong>المرحلة:</strong> ${milestone.title}</p>
            <p style="margin:8px 0 0;"><strong>المبلغ:</strong> ${milestone.amount?.toLocaleString()} ريال</p>
          </div>
        `,
        ctaText: "عرض المشروع",
        ctaUrl: projectUrl
      }),
      whatsappText: null // No WhatsApp for client payment confirmation (low priority)
    });
  }
}

async function handleMilestoneDueSoon(base44, { milestone, project, engineer, client, days_remaining }) {
  const projectUrl = `${APP_URL}/ProjectDetails?id=${project.id}`;
  const urgencyLabel = days_remaining <= 1 ? "⚠️ عاجل جداً" : days_remaining <= 3 ? "⚠️ قريباً" : "📅 تذكير";
  const priority = days_remaining <= 1 ? "urgent" : days_remaining <= 3 ? "high" : "medium";

  // Notify engineer
  await notifyAll(base44, {
    recipientEmail: engineer.email,
    recipientPhone: engineer.phone,
    recipientName: engineer.full_name,
    title: `${urgencyLabel} موعد استحقاق مرحلة خلال ${days_remaining} يوم`,
    message: `تنتهي مرحلة "${milestone.title}" في مشروع "${project.title}" خلال ${days_remaining} يوم (${milestone.due_date})`,
    notifType: "project_update",
    relatedProjectId: project.id,
    priority,
    emailSubject: `${urgencyLabel} موعد استحقاق: ${milestone.title} — ${days_remaining} يوم متبقٍ`,
    emailBodyHtml: buildEmailHtml({
      icon: days_remaining <= 2 ? "⚠️" : "📅",
      title: `${urgencyLabel}: موعد استحقاق المرحلة خلال ${days_remaining} يوم`,
      bodyHtml: `
        <p style="color:#374151;">مرحباً <strong>${engineer.full_name}</strong>،</p>
        <p style="color:#374151;">تذكير بأن موعد استحقاق المرحلة التالية يقترب:</p>
        <div style="background:${days_remaining <= 2 ? '#fef2f2' : '#fffbeb'}; 
             border-right:4px solid ${days_remaining <= 2 ? '#ef4444' : '#f59e0b'}; 
             padding:16px; border-radius:8px; margin:16px 0;">
          <p style="margin:0;"><strong>المشروع:</strong> ${project.title}</p>
          <p style="margin:8px 0 0;"><strong>المرحلة:</strong> ${milestone.title}</p>
          <p style="margin:8px 0 0;"><strong>تاريخ الاستحقاق:</strong> ${milestone.due_date}</p>
          <p style="margin:8px 0 0; color:${days_remaining <= 2 ? '#dc2626' : '#d97706'}; font-weight:bold;">
            ⏰ متبقٍ: ${days_remaining} يوم فقط
          </p>
        </div>
        <p style="color:#6b7280; font-size:14px;">يرجى التأكد من إتمام المرحلة في الوقت المحدد لتجنب أي تأخير.</p>
      `,
      ctaText: "عرض المشروع وتقديم المرحلة",
      ctaUrl: projectUrl
    }),
    whatsappText: `${urgencyLabel} *Bytly — تذكير موعد استحقاق*\n\nمرحباً ${engineer.full_name}،\nمتبقٍ *${days_remaining} يوم* لموعد تسليم مرحلة:\n📌 *${milestone.title}*\n📁 المشروع: *${project.title}*\n📅 الاستحقاق: ${milestone.due_date}\n\n👉 قدّم المرحلة: ${projectUrl}`
  });

  // Notify client (awareness only)
  if (client?.email) {
    await notifyAll(base44, {
      recipientEmail: client.email,
      recipientPhone: null, // Don't WhatsApp client for this
      recipientName: client.full_name || client.name,
      title: `📅 موعد استحقاق مرحلة خلال ${days_remaining} يوم`,
      message: `مرحلة "${milestone.title}" في مشروعك ستنتهي خلال ${days_remaining} يوم`,
      notifType: "project_update",
      relatedProjectId: project.id,
      priority,
      emailSubject: null,
      emailBodyHtml: null, // In-app only for client
      whatsappText: null
    });
  }
}

async function handleNewProjectMessage(base44, { message, project, sender_name, recipient_email, recipient_phone, recipient_name }) {
  const chatUrl = `${APP_URL}/ProjectChat?id=${project.id}`;

  await notifyAll(base44, {
    recipientEmail: recipient_email,
    recipientPhone: recipient_phone,
    recipientName: recipient_name,
    title: `💬 رسالة جديدة في مشروع ${project.title}`,
    message: `${sender_name}: ${message?.substring(0, 80)}${message?.length > 80 ? '...' : ''}`,
    notifType: "project_update",
    relatedProjectId: project.id,
    priority: "high",
    emailSubject: `💬 رسالة جديدة من ${sender_name} — ${project.title}`,
    emailBodyHtml: buildEmailHtml({
      icon: "💬",
      title: `رسالة جديدة من ${sender_name}`,
      bodyHtml: `
        <p style="color:#374151;">مرحباً <strong>${recipient_name}</strong>،</p>
        <p>لديك رسالة جديدة في مشروع <strong>${project.title}</strong>:</p>
        <div style="background:#f8fafc; border-right:4px solid #64748b; padding:16px; border-radius:8px; margin:16px 0;">
          <p style="margin:0; color:#475569; font-style:italic;">"${message?.substring(0, 200)}${message?.length > 200 ? '...' : ''}"</p>
          <p style="margin:8px 0 0; color:#94a3b8; font-size:12px;">— ${sender_name}</p>
        </div>
      `,
      ctaText: "الرد على الرسالة",
      ctaUrl: chatUrl
    }),
    whatsappText: `💬 *Bytly — رسالة جديدة*\n\nمرحباً ${recipient_name}،\nرسالة من *${sender_name}* في مشروع *"${project.title}"*:\n\n"${message?.substring(0, 120)}${message?.length > 120 ? '...' : ''}"\n\n👉 رد الآن: ${chatUrl}`
  });
}

async function handleMilestoneSubmitted(base44, { milestone, project, engineer, client }) {
  const projectUrl = `${APP_URL}/ProjectDetails?id=${project.id}`;

  if (!client?.email) return;

  await notifyAll(base44, {
    recipientEmail: client.email,
    recipientPhone: client.phone,
    recipientName: client.full_name || client.name,
    title: "📦 المهندس سلّم مرحلة — مراجعتك مطلوبة",
    message: `قدّم ${engineer.full_name} مرحلة "${milestone.title}" في مشروع "${project.title}" وهي بانتظار موافقتك`,
    notifType: "approval",
    relatedProjectId: project.id,
    priority: "high",
    emailSubject: `📦 مرحلة جاهزة للمراجعة: ${milestone.title}`,
    emailBodyHtml: buildEmailHtml({
      icon: "📦",
      title: "مرحلة جاهزة لمراجعتك",
      bodyHtml: `
        <p style="color:#374151;">مرحباً،</p>
        <p>قدّم المهندس <strong>${engineer.full_name}</strong> مرحلة لمراجعتك وموافقتك:</p>
        <div style="background:#eff6ff; border-right:4px solid #3b82f6; padding:16px; border-radius:8px; margin:16px 0;">
          <p style="margin:0;"><strong>المشروع:</strong> ${project.title}</p>
          <p style="margin:8px 0 0;"><strong>المرحلة:</strong> ${milestone.title}</p>
          ${milestone.submission_notes ? `<p style="margin:8px 0 0; color:#6b7280;"><strong>ملاحظات المهندس:</strong> ${milestone.submission_notes}</p>` : ''}
        </div>
        <p style="color:#6b7280; font-size:14px;">يرجى مراجعة المرحلة والموافقة عليها لتحرير الدفعة المالية للمهندس.</p>
      `,
      ctaText: "مراجعة المرحلة والموافقة",
      ctaUrl: projectUrl
    }),
    whatsappText: `📦 *Bytly — مرحلة جاهزة للمراجعة*\n\nقدّم المهندس *${engineer.full_name}* مرحلة *"${milestone.title}"* في مشروع *"${project.title}"*.\n\nالرجاء مراجعتها والموافقة عليها لصرف الدفعة.\n\n👉 ${projectUrl}`
  });
}

async function handleMilestoneApproved(base44, { milestone, project, engineer, client }) {
  const projectUrl = `${APP_URL}/ProjectDetails?id=${project.id}`;

  await notifyAll(base44, {
    recipientEmail: engineer.email,
    recipientPhone: engineer.phone,
    recipientName: engineer.full_name,
    title: "✅ وافق العميل على مرحلتك",
    message: `وافق العميل على مرحلة "${milestone.title}" في مشروع "${project.title}" — سيتم صرف الدفعة قريباً`,
    notifType: "approval",
    relatedProjectId: project.id,
    priority: "high",
    emailSubject: `✅ موافقة العميل على مرحلة ${milestone.title}`,
    emailBodyHtml: buildEmailHtml({
      icon: "✅",
      title: "وافق العميل على مرحلتك",
      bodyHtml: `
        <p style="color:#374151;">مرحباً <strong>${engineer.full_name}</strong>،</p>
        <p>وافق العميل على مرحلتك وسيتم صرف الدفعة المالية قريباً:</p>
        <div style="background:#f0fdf4; border-right:4px solid #22c55e; padding:16px; border-radius:8px; margin:16px 0;">
          <p style="margin:0;"><strong>المشروع:</strong> ${project.title}</p>
          <p style="margin:8px 0 0;"><strong>المرحلة المعتمدة:</strong> ${milestone.title}</p>
          <p style="margin:8px 0 0;"><strong>الدفعة المستحقة:</strong> <span style="color:#16a34a; font-weight:bold;">${milestone.amount?.toLocaleString()} ريال</span></p>
        </div>
      `,
      ctaText: "عرض المشروع",
      ctaUrl: projectUrl
    }),
    whatsappText: `✅ *Bytly — موافقة على مرحلتك!*\n\nوافق العميل على مرحلة *"${milestone.title}"* في مشروع *"${project.title}"*.\n💰 الدفعة المستحقة: *${milestone.amount?.toLocaleString()} ريال*\n\n👉 ${projectUrl}`
  });
}

// ─── Main Handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const isAuthenticated = await base44.auth.isAuthenticated();
    if (!isAuthenticated) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const payload = await req.json();

    // Support both direct calls and automation entity events
    let event_type = payload.event_type;
    let data = payload.data || {};

    // If called from an entity automation, resolve data from entity
    if (!event_type && payload.event) {
      const { type: evtType, entity_name, entity_id } = payload.event;
      const entityData = payload.data;
      const oldData = payload.old_data;
      const changedFields = payload.changed_fields || [];

      // Proposal accepted
      if (entity_name === "Proposal" && evtType === "update" && changedFields.includes("status") && entityData.status === "accepted") {
        event_type = "proposal_accepted";
        data = { proposal_id: entity_id, proposal: entityData };
      }
      // Milestone payment released
      else if (entity_name === "ProjectMilestone" && evtType === "update" && changedFields.includes("payment_released") && entityData.payment_released === true) {
        event_type = "payment_released";
        data = { milestone_id: entity_id, milestone: entityData };
      }
      // Milestone submitted
      else if (entity_name === "ProjectMilestone" && evtType === "update" && changedFields.includes("status") && entityData.status === "submitted") {
        event_type = "milestone_submitted";
        data = { milestone_id: entity_id, milestone: entityData };
      }
      // Milestone client approved
      else if (entity_name === "ProjectMilestone" && evtType === "update" && changedFields.includes("client_approved") && entityData.client_approved === true) {
        event_type = "milestone_approved";
        data = { milestone_id: entity_id, milestone: entityData };
      }
      else {
        return Response.json({ ok: true, skipped: true });
      }
    }

    if (!event_type) {
      return Response.json({ error: "event_type required" }, { status: 400 });
    }

    // ─── Resolve related entities ─────────────────────────────────────────────
    let project = data.project;
    let engineer = data.engineer;
    let client = data.client;
    let milestone = data.milestone;

    if (!project && data.milestone?.project_id) {
      const res = await base44.asServiceRole.entities.Project.filter({ id: data.milestone.project_id });
      project = res[0];
    }
    if (!project && data.proposal?.project_id) {
      const res = await base44.asServiceRole.entities.Project.filter({ id: data.proposal.project_id });
      project = res[0];
    }
    if (!project) return Response.json({ error: "project not found", event_type }, { status: 404 });

    if (!engineer && project.assigned_engineer_id) {
      const res = await base44.asServiceRole.entities.Engineer.filter({ id: project.assigned_engineer_id });
      engineer = res[0];
    }
    if (!engineer && data.proposal?.engineer_id) {
      const res = await base44.asServiceRole.entities.Engineer.filter({ id: data.proposal.engineer_id });
      engineer = res[0];
    }

    if (!client && project.client_id) {
      const res = await base44.asServiceRole.entities.Client.filter({ id: project.client_id });
      client = res[0];
    }

    // ─── Route to handler ─────────────────────────────────────────────────────
    switch (event_type) {
      case "proposal_accepted":
        if (!engineer) return Response.json({ error: "engineer not found" }, { status: 404 });
        await handleProposalAccepted(base44, { proposal: data.proposal, project, engineer, client });
        break;

      case "payment_released":
        milestone = data.milestone;
        if (!engineer) return Response.json({ error: "engineer not found" }, { status: 404 });
        await handlePaymentReleased(base44, { milestone, project, engineer, client });
        break;

      case "milestone_due_soon":
        milestone = data.milestone;
        const days_remaining = data.days_remaining ?? 3;
        if (!engineer) return Response.json({ error: "engineer not found" }, { status: 404 });
        await handleMilestoneDueSoon(base44, { milestone, project, engineer, client, days_remaining });
        break;

      case "new_project_message":
        await handleNewProjectMessage(base44, {
          message: data.message,
          project,
          sender_name: data.sender_name,
          recipient_email: data.recipient_email,
          recipient_phone: data.recipient_phone,
          recipient_name: data.recipient_name
        });
        break;

      case "milestone_submitted":
        milestone = data.milestone;
        if (!engineer) return Response.json({ error: "engineer not found" }, { status: 404 });
        await handleMilestoneSubmitted(base44, { milestone, project, engineer, client });
        break;

      case "milestone_approved":
        milestone = data.milestone;
        if (!engineer) return Response.json({ error: "engineer not found" }, { status: 404 });
        await handleMilestoneApproved(base44, { milestone, project, engineer, client });
        break;

      default:
        return Response.json({ error: `Unknown event_type: ${event_type}` }, { status: 400 });
    }

    console.log(`[eventDrivenNotifier] ✅ ${event_type} handled for project ${project.id}`);
    return Response.json({ ok: true, event_type, project_id: project.id });

  } catch (error) {
    console.error("[eventDrivenNotifier] Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});