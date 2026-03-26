import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { category, skills_needed, budget, timeline, location } = await req.json();

    if (!category || !skills_needed) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch approved and verified engineers
    const engineers = await base44.asServiceRole.entities.Engineer.filter({
      status: 'approved',
      is_verified: true
    });

    // Get portfolios for engineers
    const portfolios = await base44.asServiceRole.entities.Portfolio.filter({
      category: category
    });

    // Build engineer suggestions with matching logic
    const prompt = `أنت خبير في مطابقة العملاء مع المهندسين والمصممين.
    
معايير المشروع:
- الفئة: ${category}
- المهارات المطلوبة: ${skills_needed.join(', ')}
- الميزانية: ${budget || 'مرنة'} ريال
- الجدول الزمني: ${timeline || 'مرن'} يوم
- الموقع: ${location || 'أي موقع'}

المهندسون المتاحون:
${engineers.slice(0, 10).map(e => `
- ${e.full_name} (${e.user_type}): ${e.specialization}
  الخبرة: ${e.years_experience} سنة | التقييم: ${e.rating}/5 | المشاريع المكتملة: ${e.completed_projects}
`).join('')}

قدم توصيات مطابقة كـ JSON:
{
  "top_matches": [
    {
      "engineer_name": "الاسم",
      "match_score": 0-100,
      "reason": "السبب في الاختيار",
      "strengths": ["قوة1", "قوة2"],
      "portfolio_highlights": ["عمل1", "عمل2"]
    }
  ],
  "matching_criteria": ["معيار1", "معيار2"]
}`;

    const suggestions = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: false,
      response_json_schema: {
        type: "object",
        properties: {
          top_matches: {
            type: "array",
            items: {
              type: "object",
              properties: {
                engineer_name: { type: "string" },
                match_score: { type: "number" },
                reason: { type: "string" },
                strengths: { type: "array", items: { type: "string" } },
                portfolio_highlights: { type: "array", items: { type: "string" } }
              }
            }
          },
          matching_criteria: { type: "array", items: { type: "string" } }
        }
      }
    });

    // Match with actual engineers
    const matchedEngineers = suggestions.top_matches
      .map(suggestion => {
        const engineer = engineers.find(e => e.full_name === suggestion.engineer_name);
        return engineer ? { ...engineer, ...suggestion } : null;
      })
      .filter(Boolean)
      .slice(0, 5);

    return Response.json({
      success: true,
      suggestions: matchedEngineers,
      matching_criteria: suggestions.matching_criteria
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});