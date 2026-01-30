import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { project_id } = await req.json();

    if (!project_id) {
      return Response.json({ error: 'Missing project_id' }, { status: 400 });
    }

    // Fetch all project communications
    const messages = await base44.asServiceRole.entities.Message.filter({ project_id });
    const reviews = await base44.asServiceRole.entities.Review.filter({ project_id });
    const complaints = await base44.asServiceRole.entities.Complaint.filter({ project_id });

    // Extract conversation text
    const conversationText = messages
      .map(m => `${m.sender_name}: ${m.content}`)
      .join('\n');

    const prompt = `أنت محلل متخصص في قياس رضا العملاء. حلل سجل المحادثات التالي وقدم:

1. درجة رضا العميل من 1-10
2. المشاعر الإيجابية المكتشفة
3. المشاعر السلبية أو المخاوف
4. التوصيات لتحسين العلاقة

سجل المحادثات:
${conversationText || 'لا توجد رسائل'}

عدد التقييمات: ${reviews.length}
عدد الشكاوى: ${complaints.length}

قدم التحليل بصيغة JSON مع الحقول:
{
  "satisfaction_score": <1-10>,
  "positive_sentiments": [<array>],
  "negative_sentiments": [<array>],
  "recommendations": [<array>],
  "summary": "<ملخص>"
}`;

    const analysisText = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: false,
      response_json_schema: {
        type: "object",
        properties: {
          satisfaction_score: { type: "number" },
          positive_sentiments: { type: "array", items: { type: "string" } },
          negative_sentiments: { type: "array", items: { type: "string" } },
          recommendations: { type: "array", items: { type: "string" } },
          summary: { type: "string" }
        }
      }
    });

    return Response.json({
      success: true,
      analysis: analysisText,
      data_points: {
        messages_count: messages.length,
        reviews_count: reviews.length,
        complaints_count: complaints.length
      }
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});