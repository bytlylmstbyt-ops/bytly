import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * trackUserActivity — نبضة (heartbeat) يستدعيها الواجهة كل 60 ثانية
 * لتتبع المستخدمين المسجلين النشطين الآن مع إيميلاتهم والصفحة الحالية.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ skipped: true });

    const body = await req.json().catch(() => ({}));
    const current_page = body.current_page || '';
    const now = new Date().toISOString();

    const existing = await base44.asServiceRole.entities.UserActivity.filter({ user_email: user.email });

    if (existing && existing.length > 0) {
      await base44.asServiceRole.entities.UserActivity.update(existing[0].id, {
        last_active_at: now,
        current_page,
        user_name: user.full_name || existing[0].user_name,
      });
    } else {
      await base44.asServiceRole.entities.UserActivity.create({
        user_email: user.email,
        user_name: user.full_name,
        user_id: user.id,
        last_active_at: now,
        current_page,
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('trackUserActivity error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});