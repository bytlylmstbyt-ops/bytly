import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reason } = await req.json().catch(() => ({}));

    // Delete engineer/client profile records
    const [engineerData, clientData] = await Promise.all([
      base44.entities.Engineer.filter({ email: user.email }),
      base44.entities.Client.filter({ email: user.email }),
    ]);

    for (const eng of engineerData) {
      await base44.entities.Engineer.update(eng.id, {
        status: 'deleted',
        deletion_reason: reason || 'user_requested',
        deletion_date: new Date().toISOString(),
      });
    }

    for (const client of clientData) {
      await base44.entities.Client.update(client.id, {
        status: 'deleted',
        deletion_reason: reason || 'user_requested',
        deletion_date: new Date().toISOString(),
      });
    }

    // Mark notification settings as deleted
    const notifSettings = await base44.entities.NotificationSettings.filter({ user_email: user.email });
    for (const ns of notifSettings) {
      await base44.entities.NotificationSettings.update(ns.id, {
        email_notifications: false,
        in_app_notifications: false,
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});