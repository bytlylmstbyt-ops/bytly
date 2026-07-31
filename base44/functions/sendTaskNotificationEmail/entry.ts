import { createClientFromRequest } from 'npm:@base44/sdk@0.8.41';

function escapeHtml(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}

const PRIORITY_LABELS = { low: 'منخفضة', medium: 'متوسطة', high: 'مرتفعة', urgent: 'عاجلة 🚨' };
const PRIORITY_COLORS = { low: '#94a3b8', medium: '#3b82f6', high: '#f59e0b', urgent: '#ef4444' };
const STATUS_LABELS   = { todo: 'قيد الانتظار', in_progress: 'قيد التنفيذ', on_hold: 'معلقة', completed: 'مكتملة ✅' };
const STATUS_COLORS   = { todo: '#94a3b8', in_progress: '#3b82f6', on_hold: '#f59e0b', completed: '#22c55e' };

function buildTaskEmailHtml({ task, projectName, assigneeName, recipientName, alertType, daysLeft, appUrl }) {
  const priorityColor = PRIORITY_COLORS[task.priority] || '#3b82f6';
  const statusColor   = STATUS_COLORS[task.status]    || '#94a3b8';
  const priorityLabel = PRIORITY_LABELS[task.priority] || task.priority;
  const statusLabel   = STATUS_LABELS[task.status]    || task.status;

  // Alert banner config
  const bannerConfig = {
    overdue:    { bg: '#FEF2F2', border: '#FECACA', icon: '🚨', color: '#DC2626', label: `متأخرة بـ ${Math.abs(daysLeft)} يوم` },
    today:      { bg: '#FFFBEB', border: '#FDE68A', icon: '⏰', color: '#D97706', label: 'تستحق اليوم!' },
    soon:       { bg: '#EFF6FF', border: '#BFDBFE', icon: '🔔', color: '#2563EB', label: `تستحق خلال ${daysLeft} يوم` },
    assigned:   { bg: '#F0FDF4', border: '#BBF7D0', icon: '📋', color: '#16A34A', label: 'تم تعيين مهمة جديدة لك' },
    completed:  { bg: '#F0FDF4', border: '#BBF7D0', icon: '✅', color: '#16A34A', label: 'تم اكتمال المهمة' },
    reminder:   { bg: '#EFF6FF', border: '#BFDBFE', icon: '📌', color: '#2563EB', label: 'تذكير بمهمة قادمة' },
  };
  const banner = bannerConfig[alertType] || bannerConfig.reminder;

  // Quick action buttons
  const viewUrl   = `${appUrl}?page=TaskManager`;
  const markDoneUrl = `${appUrl}?page=TaskManager&action=markDone&taskId=${task.id}`;

  const dueDateStr = task.due_date
    ? new Date(task.due_date).toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : null;
  const startDateStr = task.start_date
    ? new Date(task.start_date).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>إشعار مهمة</title></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:30px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <!-- Header -->
  <tr><td style="background:linear-gradient(135deg,#1e293b 0%,#334155 100%);border-radius:16px 16px 0 0;padding:28px 32px;text-align:center;">
    <div style="font-size:28px;font-weight:900;color:#fff;letter-spacing:-0.5px;">إدارة المهام</div>
    <div style="font-size:13px;color:#94a3b8;margin-top:4px;">نظام تتبع المشاريع والمهام</div>
  </td></tr>

  <!-- Alert Banner -->
  <tr><td style="background:${banner.bg};border:1px solid ${banner.border};border-top:none;padding:16px 32px;">
    <div style="display:flex;align-items:center;gap:10px;">
      <span style="font-size:22px;">${banner.icon}</span>
      <div>
        <div style="font-size:15px;font-weight:700;color:${banner.color};">${banner.label}</div>
        <div style="font-size:12px;color:#64748b;margin-top:2px;">مرحباً ${escapeHtml(recipientName)}، لديك إشعار يتطلب انتباهك</div>
      </div>
    </div>
  </td></tr>

  <!-- Body -->
  <tr><td style="background:#ffffff;border:1px solid #e2e8f0;border-top:none;padding:32px;">

    <!-- Task Title -->
    <div style="margin-bottom:24px;">
      <div style="font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">المهمة</div>
      <div style="font-size:22px;font-weight:800;color:#0f172a;line-height:1.3;">${escapeHtml(task.title)}</div>
      ${task.description ? `<div style="font-size:14px;color:#64748b;margin-top:8px;line-height:1.7;border-right:3px solid #e2e8f0;padding-right:12px;">${escapeHtml(task.description)}</div>` : ''}
    </div>

    <!-- Details Grid -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px;">

      <!-- Project -->
      <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:14px;">
        <div style="font-size:11px;font-weight:600;color:#94a3b8;margin-bottom:6px;">📁 المشروع</div>
        <div style="font-size:14px;font-weight:700;color:#1e293b;">${escapeHtml(projectName || '—')}</div>
      </div>

      <!-- Assignee -->
      <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:14px;">
        <div style="font-size:11px;font-weight:600;color:#94a3b8;margin-bottom:6px;">👤 المكلَّف</div>
        <div style="font-size:14px;font-weight:700;color:#1e293b;">${escapeHtml(assigneeName || task.assigned_to || 'غير محدد')}</div>
      </div>

      <!-- Priority -->
      <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:14px;">
        <div style="font-size:11px;font-weight:600;color:#94a3b8;margin-bottom:6px;">🎯 الأولوية</div>
        <div style="display:inline-block;background:${priorityColor}20;color:${priorityColor};font-size:13px;font-weight:700;padding:3px 10px;border-radius:20px;border:1px solid ${priorityColor}44;">${priorityLabel}</div>
      </div>

      <!-- Status -->
      <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:14px;">
        <div style="font-size:11px;font-weight:600;color:#94a3b8;margin-bottom:6px;">📊 الحالة</div>
        <div style="display:inline-block;background:${statusColor}20;color:${statusColor};font-size:13px;font-weight:700;padding:3px 10px;border-radius:20px;border:1px solid ${statusColor}44;">${statusLabel}</div>
      </div>

      ${startDateStr ? `
      <!-- Start Date -->
      <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:14px;">
        <div style="font-size:11px;font-weight:600;color:#94a3b8;margin-bottom:6px;">🗓️ تاريخ البدء</div>
        <div style="font-size:13px;font-weight:600;color:#1e293b;">${startDateStr}</div>
        ${task.start_time ? `<div style="font-size:12px;color:#64748b;margin-top:2px;">🕐 ${task.start_time}</div>` : ''}
      </div>` : ''}

      ${dueDateStr ? `
      <!-- Due Date -->
      <div style="background:${daysLeft < 0 ? '#FEF2F2' : '#F8FAFC'};border:1px solid ${daysLeft < 0 ? '#FECACA' : '#E2E8F0'};border-radius:10px;padding:14px;">
        <div style="font-size:11px;font-weight:600;color:#94a3b8;margin-bottom:6px;">📅 الاستحقاق</div>
        <div style="font-size:13px;font-weight:700;color:${daysLeft < 0 ? '#DC2626' : '#1e293b'};">${dueDateStr}</div>
        ${task.due_time ? `<div style="font-size:12px;color:${daysLeft < 0 ? '#DC2626' : '#64748b'};margin-top:2px;">🕐 ${task.due_time}</div>` : ''}
      </div>` : ''}

    </div>

    ${task.progress > 0 ? `
    <!-- Progress Bar -->
    <div style="margin-bottom:24px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <div style="font-size:12px;font-weight:600;color:#64748b;">نسبة الإنجاز</div>
        <div style="font-size:14px;font-weight:800;color:#1e293b;">${task.progress}%</div>
      </div>
      <div style="background:#E2E8F0;border-radius:99px;height:10px;overflow:hidden;">
        <div style="width:${task.progress}%;height:100%;background:linear-gradient(90deg,#3b82f6,#6366f1);border-radius:99px;"></div>
      </div>
    </div>` : ''}

    <!-- Quick Action Buttons -->
    <div style="margin-top:28px;">
      <div style="font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:14px;text-transform:uppercase;letter-spacing:1px;">إجراءات سريعة</div>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding-left:6px;">
            <a href="${viewUrl}" style="display:block;text-align:center;background:linear-gradient(135deg,#1e293b,#334155);color:#fff;font-size:14px;font-weight:700;padding:14px 20px;border-radius:10px;text-decoration:none;">
              👁️ عرض المهمة
            </a>
          </td>
          ${task.status !== 'completed' ? `
          <td style="padding-right:6px;">
            <a href="${markDoneUrl}" style="display:block;text-align:center;background:linear-gradient(135deg,#16a34a,#22c55e);color:#fff;font-size:14px;font-weight:700;padding:14px 20px;border-radius:10px;text-decoration:none;">
              ✅ تحديد كمكتملة
            </a>
          </td>` : ''}
        </tr>
      </table>
    </div>

  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#F1F5F9;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;">
    <div style="font-size:12px;color:#94a3b8;">
      تم إرسال هذا الإشعار تلقائياً من نظام إدارة المهام.<br/>
      للتوقف عن استقبال هذه الإشعارات، قم بتغيير إعدادات الإشعارات من حسابك.
    </div>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });
    const body = await req.json();
    const { taskId, recipientEmail, recipientName, alertType, appUrl } = body;

    if (!taskId || !recipientEmail) {
      return Response.json({ error: 'taskId و recipientEmail مطلوبان' }, { status: 400 });
    }

    // Fetch task details
    const task = await base44.asServiceRole.entities.Task.filter({ id: taskId });
    if (!task || task.length === 0) {
      return Response.json({ error: 'المهمة غير موجودة' }, { status: 404 });
    }
    const taskData = task[0];

    // Fetch project name
    let projectName = null;
    if (taskData.project_id) {
      const projects = await base44.asServiceRole.entities.TaskProject.filter({ id: taskData.project_id });
      projectName = projects?.[0]?.name || null;
    }

    // Calculate daysLeft
    let daysLeft = 0;
    if (taskData.due_date) {
      daysLeft = Math.floor((new Date(taskData.due_date) - new Date()) / (1000 * 60 * 60 * 24));
    }

    // Determine subject
    const subjectMap = {
      overdue:   `🚨 مهمة متأخرة: ${taskData.title}`,
      today:     `⏰ مهمة تستحق اليوم: ${taskData.title}`,
      soon:      `🔔 تذكير: ${taskData.title} تستحق خلال ${daysLeft} يوم`,
      assigned:  `📋 تم تعيين مهمة جديدة لك: ${taskData.title}`,
      completed: `✅ اكتملت المهمة: ${taskData.title}`,
      reminder:  `📌 تذكير بمهمة: ${taskData.title}`,
    };
    const subject = subjectMap[alertType] || `إشعار مهمة: ${taskData.title}`;

    const html = buildTaskEmailHtml({
      task: taskData,
      projectName,
      assigneeName: taskData.assigned_to,
      recipientName: recipientName || taskData.assigned_to || 'المستخدم',
      alertType: alertType || 'reminder',
      daysLeft,
      appUrl: appUrl || 'https://app.base44.com',
    });

    await base44.integrations.Core.SendEmail({
      to: recipientEmail,
      subject,
      body: html,
    });

    console.log(`Task notification email sent to ${recipientEmail} for task "${taskData.title}" (type: ${alertType})`);
    return Response.json({ success: true, subject, taskTitle: taskData.title });

  } catch (error) {
    console.error('sendTaskNotificationEmail error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});