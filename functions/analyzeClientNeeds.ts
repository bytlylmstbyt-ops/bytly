import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { client_description, budget, timeline } = await req.json();

    if (!client_description) {
      return Response.json({ error: 'Missing client_description' }, { status: 400 });
    }

    const prompt = `أنت محلل متخصص في مشاريع التصميم والعمارة. حلل احتياجات العميل التالية:

وصف المشروع: "${client_description}"
الميزانية المتاحة: ${budget || 'لم يتم التحديد'} ريال
الجدول الزمني: ${timeline || 'لم يتم التحديد'} يوم

قدم التحليل كـ JSON مع الحقول التالية:
{
  "project_category": "interior|architecture|painting|landscape|furniture|lighting|civil_engineering|structural_design|executive_drawing",
  "project_type": "سكني|تجاري|صناعي",
  "key_requirements": ["requirement1", "requirement2", ...],
  "recommended_styles": ["style1", "style2"],
  "estimated_budget_range": {
    "min": number,
    "max": number
  },
  "skills_needed": ["skill1", "skill2"],
  "project_complexity": "simple|moderate|complex",
  "summary": "وصف موجز للمشروع والاحتياجات"
}`;

    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: false,
      response_json_schema: {
        type: "object",
        properties: {
          project_category: { type: "string" },
          project_type: { type: "string" },
          key_requirements: { type: "array", items: { type: "string" } },
          recommended_styles: { type: "array", items: { type: "string" } },
          estimated_budget_range: {
            type: "object",
            properties: {
              min: { type: "number" },
              max: { type: "number" }
            }
          },
          skills_needed: { type: "array", items: { type: "string" } },
          project_complexity: { type: "string" },
          summary: { type: "string" }
        }
      }
    });

    return Response.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});