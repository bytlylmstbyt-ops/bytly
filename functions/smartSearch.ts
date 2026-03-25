import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { type, filters, items } = payload;

    if (!type || !filters || !items) {
      return Response.json({ 
        error: 'type, filters, and items are required' 
      }, { status: 400 });
    }

    // Build the search context
    let searchContext = `أنت نظام بحث ذكي لمنصة بيتلي. المستخدم يبحث عن ${type === 'engineers' ? 'مهندسين' : 'مشاريع'}.\n\n`;
    searchContext += `استعلام البحث: "${filters.query}"\n\n`;
    
    if (type === 'engineers') {
      searchContext += `معايير التصفية:\n`;
      if (filters.specialization && filters.specialization !== 'all') {
        searchContext += `- التخصص: ${filters.specialization}\n`;
      }
      if (filters.location) {
        searchContext += `- الموقع: ${filters.location}\n`;
      }
      if (filters.minRating > 0) {
        searchContext += `- التقييم الأدنى: ${filters.minRating}\n`;
      }
    } else {
      searchContext += `معايير التصفية:\n`;
      if (filters.category && filters.category !== 'all') {
        searchContext += `- التصنيف: ${filters.category}\n`;
      }
      if (filters.status && filters.status !== 'all') {
        searchContext += `- الحالة: ${filters.status}\n`;
      }
      if (filters.location) {
        searchContext += `- الموقع: ${filters.location}\n`;
      }
      if (filters.minBudget || filters.maxBudget) {
        searchContext += `- الميزانية: ${filters.minBudget || 0} - ${filters.maxBudget || 'غير محدد'}\n`;
      }
    }

    searchContext += `\nعدد النتائج المتاحة: ${items.length}\n\n`;
    searchContext += `المطلوب: قم بتحليل النتائج وترتيبها حسب الصلة بالبحث. قيّم كل عنصر من 0-100 حسب مدى توافقه مع معايير البحث.\n\n`;

    const itemsData = items.map((item, index) => {
      if (type === 'engineers') {
        return `${index + 1}. ID: ${item.id}\n   الاسم: ${item.full_name}\n   التخصص: ${item.specialization}\n   المدينة: ${item.city || 'غير محدد'}\n   التقييم: ${item.rating || 0}\n   سنوات الخبرة: ${item.years_experience || 0}\n   النبذة: ${item.bio || 'لا يوجد'}\n`;
      } else {
        return `${index + 1}. ID: ${item.id}\n   العنوان: ${item.title}\n   التصنيف: ${item.category}\n   الموقع: ${item.location || 'غير محدد'}\n   الميزانية: ${item.budget_min}-${item.budget_max}\n   الحالة: ${item.status}\n   الوصف: ${item.description?.substring(0, 150) || 'لا يوجد'}\n`;
      }
    }).join('\n');

    searchContext += itemsData;

    // Use LLM to score and rank results
    const response = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: searchContext,
      response_json_schema: {
        type: "object",
        properties: {
          rankings: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                relevance_score: { type: "number" },
                reason: { type: "string" }
              }
            }
          }
        }
      }
    });

    // Sort items by relevance score
    const rankings = response.rankings || [];
    const sortedItems = items
      .map(item => {
        const ranking = rankings.find(r => r.id === item.id);
        return {
          ...item,
          relevance_score: ranking?.relevance_score || 0,
          relevance_reason: ranking?.reason || ''
        };
      })
      .sort((a, b) => b.relevance_score - a.relevance_score);

    return Response.json({
      success: true,
      results: sortedItems,
      total: sortedItems.length
    });

  } catch (error) {
    console.error('Smart search error:', error);
    return Response.json({ 
      error: error.message,
      // Fallback to original order
      results: [],
      fallback: true 
    }, { status: 500 });
  }
});