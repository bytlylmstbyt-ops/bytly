import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const FREE_LIMIT = 100;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Public endpoint — returns aggregate free-slot counts only (no PII).
    // Called on the public registration page before the visitor logs in.
    // Count ALL engineers regardless of status (service role for full visibility)
    // during the beta/trial period to measure market size.
    const allEngineers = await base44.asServiceRole.entities.Engineer.list('-created_date', 1000);
    const registeredCount = allEngineers.length;
    const remaining = Math.max(0, FREE_LIMIT - registeredCount);
    const isEligible = registeredCount < FREE_LIMIT;

    return Response.json({
      registered_count: registeredCount,
      free_limit: FREE_LIMIT,
      remaining_free_slots: remaining,
      is_eligible: isEligible
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});