import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { answerDataQuestion } from '../_shared/dataCapabilities.ts';

// ════════════════════════════════════════════════════════════════════════
// platformDataAssistant — standalone READ-ONLY data-question endpoint.
//
// Kept for backwards compatibility; the unified platformAgent endpoint
// calls the exact same shared runner (answerDataQuestion in
// ../_shared/dataCapabilities.ts) so there is only ONE implementation of
// the capability registry and routing/answer logic — not two.
//
// Hard safety rules (do not relax these without a full architecture review):
//   • Every capability may only call .filter()/.list() on entities.
//   • The ONLY write is the AIAssistantQueryLog audit row.
//   • Admin-only. No financial, permission, or production mutation path
//     exists anywhere in this pipeline.
// ════════════════════════════════════════════════════════════════════════

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  let user;
  try {
    user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const body = await req.json();
    const question = (body?.question || '').trim();
    if (!question) return Response.json({ error: 'Missing question' }, { status: 400 });

    const result = await answerDataQuestion(base44, user, question);
    return Response.json(result);
  } catch (error) {
    console.error('platformDataAssistant error:', error);
    try {
      if (user) {
        await base44.asServiceRole.entities.AIAssistantQueryLog.create({
          question: '(unknown)',
          asked_by_email: user.email,
          asked_by_name: user.full_name || user.email,
          success: false,
          error_message: String(error?.message || error),
        });
      }
    } catch (_logErr) { /* logging failure must never mask the original error */ }
    return Response.json({ error: 'Something went wrong answering that question.' }, { status: 500 });
  }
});
