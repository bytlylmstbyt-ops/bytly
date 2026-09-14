/**
 * checkMilestoneDueDates — يُشغَّل يومياً للبحث عن مراحل تستحق خلال 1، 3، أو 7 أيام
 * ويستدعي eventDrivenNotifier لإرسال التنبيهات المناسبة
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Admin-only: this is a scheduled/system function
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch all in-progress milestones with a due_date that haven't been completed
    const milestones = await base44.asServiceRole.entities.ProjectMilestone.filter({
      status: "in_progress"
    }, "-due_date", 200);

    const thresholds = [1, 3, 7]; // days to warn before due
    let processed = 0;
    let skipped = 0;

    for (const milestone of milestones) {
      if (!milestone.due_date) { skipped++; continue; }

      const dueDate = new Date(milestone.due_date);
      dueDate.setHours(0, 0, 0, 0);
      const diffMs = dueDate - today;
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      // Only trigger for exact threshold days (to avoid duplicate notifications)
      if (!thresholds.includes(diffDays)) { skipped++; continue; }

      console.log(`[checkMilestoneDueDates] Milestone "${milestone.title}" due in ${diffDays} days`);

      // Fire eventDrivenNotifier
      await base44.asServiceRole.functions.invoke("eventDrivenNotifier", {
        event_type: "milestone_due_soon",
        data: {
          milestone,
          days_remaining: diffDays
        }
      });

      processed++;
    }

    console.log(`[checkMilestoneDueDates] Done. Processed: ${processed}, Skipped: ${skipped}`);
    return Response.json({ ok: true, processed, skipped, total: milestones.length });

  } catch (error) {
    console.error("[checkMilestoneDueDates] Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});