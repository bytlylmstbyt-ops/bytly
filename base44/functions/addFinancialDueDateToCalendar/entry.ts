import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { event, data } = body;
    const entityName = event?.entity_name;
    const recordId = data?.id;

    if (!entityName || !recordId) {
      return Response.json({ skipped: true, reason: 'missing entity_name or record id' });
    }

    // Authorize: fetch the real record from the DB through the user-scoped client
    // so RLS enforces ownership. Reject forged payloads outright.
    const entityMap = {
      WithdrawalRequest: 'WithdrawalRequest',
      Invoice: 'Invoice',
    };
    const entityKey = entityMap[entityName];
    if (!entityKey) {
      return Response.json({ skipped: true, reason: 'unsupported entity: ' + entityName });
    }

    let record;
    try {
      const fetched = await base44.entities[entityKey].filter({ id: recordId });
      record = fetched[0];
    } catch (_e) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (!record) return Response.json({ error: 'Forbidden' }, { status: 403 });

    // Determine due date, amount, and label based on entity type
    let dueDate = null;
    let amount = 0;
    let title = '';
    let description = '';
    let providerEmail = null;
    let providerName = null;
    let providerType = null;
    let providerId = null;
    let colorId = '11'; // red for financial

    if (entityName === 'WithdrawalRequest') {
      dueDate = record.processing_date || record.request_date;
      amount = record.amount || 0;
      providerType = record.provider_type;
      providerId = record.contractor_id || record.supplier_id || record.engineer_id;

      const providerEntity = record.provider_type === 'contractor' ? 'Contractor'
        : record.provider_type === 'supplier' ? 'Supplier'
        : record.provider_type === 'firm' ? 'EngineeringFirm'
        : 'Engineer';

      const providers = await base44.asServiceRole.entities[providerEntity].filter({ id: providerId });
      if (providers[0]) {
        providerEmail = providers[0].email;
        providerName = providers[0].company_name || providers[0].full_name;
      }

      title = `💰 موعد سحب رصيد — ${providerName || providerType}`;
      description = `طلب سحب رصيد\nالمبلغ: ${amount.toLocaleString('ar-SA')} ر.س\nالحالة: ${record.status}\nIBAN: ${record.iban || '—'}\nالبنك: ${record.bank_name || '—'}\n\nتذكير تلقائي من منصة بيتلي`;
      colorId = '3'; // purple
    } else if (entityName === 'Invoice') {
      dueDate = record.due_date;
      amount = record.total_amount || record.amount || 0;

      // Fetch client for notification
      if (record.client_email) {
        providerEmail = record.client_email;
      }

      title = `🧾 فاتورة مستحقة — ${record.invoice_number || ''}`;
      description = `فاتورة رقم: ${record.invoice_number || '—'}\nالمبلغ: ${amount.toLocaleString('ar-SA')} ر.س\nالعميل: ${record.client_company || record.client_email || '—'}\nتاريخ الإصدار: ${record.issue_date || '—'}\n\nتذكير تلقائي من منصة بيتلي`;
      colorId = '11'; // red
    }

    if (!dueDate) {
      return Response.json({ skipped: true, reason: 'no due_date' });
    }

    console.log(`Adding financial calendar event for ${entityName}: ${record.id}, due: ${dueDate}`);

    // Get Google Calendar access token
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
    const authHeader = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

    // Build event date (due_date is YYYY-MM-DD or ISO)
    const dueDateStr = dueDate.split('T')[0];
    const nextDay = new Date(dueDateStr);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDayStr = nextDay.toISOString().split('T')[0];

    const attendees = [];
    if (providerEmail) attendees.push({ email: providerEmail });

    const eventBody = {
      summary: title,
      description,
      start: { date: dueDateStr },
      end: { date: nextDayStr },
      attendees,
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 * 3 },
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 60 },
        ]
      },
      colorId
    };

    // Create the calendar event
    const calendarRes = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      { method: 'POST', headers: authHeader, body: JSON.stringify(eventBody) }
    );

    if (!calendarRes.ok) {
      const errText = await calendarRes.text();
      console.error('Calendar API error:', errText);
      return Response.json({ error: 'Failed to create calendar event', details: errText }, { status: 500 });
    }

    const created = await calendarRes.json();
    const eventId = created.id;
    console.log(`Calendar event created: ${eventId}`);

    // Send in-app notification to the provider
    if (providerEmail) {
      const notifMsg = `📅 تم إضافة موعد مالي إلى تقويم جوجل: "${title}" بتاريخ ${dueDateStr}.`;
      await base44.asServiceRole.entities.Notification.create({
        recipient_email: providerEmail,
        title: '📅 موعد مالي في التقويم',
        message: notifMsg,
        type: 'payment',
        priority: 'high',
        related_entity_id: record.id
      });
    }

    return Response.json({ success: true, event_id: eventId, entity: entityName });
  } catch (error) {
    console.error('addFinancialDueDateToCalendar error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});