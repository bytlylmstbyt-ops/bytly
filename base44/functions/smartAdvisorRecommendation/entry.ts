import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { client_description, budget, timeline, location } = await req.json();

    if (!client_description) {
      return Response.json({ error: 'Missing client_description' }, { status: 400 });
    }

    // ── Step 1: Analyze client needs via LLM ───────────────────────────
    const analysisPrompt = `أنت محلل متخصص في مشاريع التصميم والعمارة في السعودية. حلل احتياجات العميل التالية:

وصف المشروع: "${client_description}"
الميزانية المتاحة: ${budget || 'لم يتم التحديد'} ريال
الجدول الزمني: ${timeline || 'لم يتم التحديد'} يوم
الموقع: ${location || 'لم يتم التحديد'}

قدم التحليل كـ JSON مع الحقول التالية:
{
  "project_category": "interior|architecture|painting|landscape|furniture|lighting|civil_engineering|structural_design|executive_drawing|villa|apartment|facade|commercial",
  "project_type": "سكني|تجاري|صناعي",
  "key_requirements": ["requirement1", "requirement2"],
  "recommended_styles": ["style1", "style2"],
  "estimated_budget_range": { "min": number, "max": number },
  "skills_needed": ["skill1", "skill2"],
  "project_complexity": "simple|moderate|complex",
  "summary": "وصف موجز للمشروع والاحتياجات"
}`;

    const analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: analysisPrompt,
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

    // ── Step 2: Fetch matching engineers from database ────────────────
    const allEngineers = await base44.asServiceRole.entities.Engineer.filter({
      status: "approved"
    }, "-rating", 100);

    // Map project categories to engineer types
    const categoryToTypeMap = {
      interior: ["engineer", "architect", "painter"],
      architecture: ["architect", "engineer", "civil"],
      painting: ["painter", "engineer"],
      landscape: ["architect", "painter"],
      furniture: ["engineer", "architect"],
      lighting: ["engineer", "architect"],
      civil_engineering: ["civil", "engineer"],
      structural_design: ["civil", "engineer"],
      executive_drawing: ["engineer", "architect"],
      villa: ["architect", "engineer", "civil"],
      apartment: ["engineer", "architect"],
      facade: ["architect", "engineer"],
      commercial: ["architect", "civil", "engineer"]
    };

    const matchedTypes = categoryToTypeMap[analysis.project_category] || ["engineer", "architect", "civil"];
    const budgetNum = parseFloat(budget) || 0;

    const scoredEngineers = allEngineers.map(eng => {
      let score = 0;
      const reasons = [];

      // Type match (35 pts)
      if (matchedTypes.includes(eng.user_type)) {
        score += 35;
        reasons.push("تخصص مطابق لنوع المشروع");
      }

      // Location match (25 pts)
      const engCity = (eng.city || "").toLowerCase();
      const reqLocation = (location || "").toLowerCase();
      if (reqLocation && engCity) {
        if (engCity.includes(reqLocation) || reqLocation.includes(engCity)) {
          score += 25;
          reasons.push(`موجود في ${eng.city}`);
        } else {
          const sameRegion = (engCity.includes("رياض") && reqLocation.includes("رياض")) ||
            (engCity.includes("جدة") && reqLocation.includes("جدة")) ||
            (engCity.includes("مكة") && reqLocation.includes("مكة")) ||
            (engCity.includes("دمام") && reqLocation.includes("دمام"));
          if (sameRegion) {
            score += 12;
            reasons.push(`نفس المنطقة (${eng.city})`);
          }
        }
      }

      // Budget compatibility via services_offered (15 pts)
      const services = eng.services_offered || [];
      if (budgetNum > 0 && services.length > 0) {
        const hasCompatible = services.some(s => {
          const pr = s.price_range || "";
          const nums = pr.match(/[\d,]+/g);
          if (!nums) return true;
          const prices = nums.map(n => parseFloat(n.replace(/,/g, "")));
          return budgetNum >= Math.min(...prices);
        });
        if (hasCompatible) {
          score += 15;
          reasons.push("أسعار الخدمات تناسب ميزانيتك");
        } else {
          score += 5;
        }
      } else {
        score += 8;
      }

      // Rating (15 pts)
      const ratingScore = Math.round((eng.rating || 0) / 5 * 15);
      score += ratingScore;
      if (eng.rating >= 4.5) reasons.push(`تقييم عالي (${eng.rating}/5)`);

      // Experience (10 pts)
      const expScore = Math.min(10, Math.round((eng.years_experience || 0) / 10 * 10));
      score += expScore;
      if (eng.years_experience >= 10) reasons.push(`${eng.years_experience} سنة خبرة`);

      return {
        id: eng.id,
        full_name: eng.full_name,
        user_type: eng.user_type,
        specialization: eng.specialization,
        city: eng.city,
        rating: eng.rating,
        years_experience: eng.years_experience,
        completed_projects: eng.completed_projects,
        profile_image: eng.profile_image,
        match_percentage: Math.min(100, score),
        match_reasons: reasons,
        services_count: services.length
      };
    });

    const topEngineers = scoredEngineers
      .filter(e => e.match_percentage >= 25)
      .sort((a, b) => b.match_percentage - a.match_percentage)
      .slice(0, 5);

    // ── Step 3: Fetch matching ready-made designs ─────────────────────
    let designSuggestions = [];
    try {
      // Map analysis category to ReadyMadeDesign category
      const designCategoryMap = {
        interior: "interior",
        architecture: "villa",
        villa: "villa",
        apartment: "apartment",
        facade: "facade",
        commercial: "commercial",
        landscape: "landscape"
      };
      const designCategory = designCategoryMap[analysis.project_category] || "villa";

      const designs = await base44.asServiceRole.entities.ReadyMadeDesign.filter({
        status: "active",
        category: designCategory
      }, "-rating", 20);

      // Filter by budget and score
      designSuggestions = designs
        .map(d => {
          let designScore = 0;
          const reasons = [];

          // Budget fit (50 pts)
          if (budgetNum > 0) {
            if (d.price <= budgetNum) {
              designScore += 50;
              reasons.push(`السعر (${d.price.toLocaleString()} ريال) ضمن ميزانيتك`);
            } else if (d.price <= budgetNum * 1.2) {
              designScore += 30;
              reasons.push("السعر قريب من ميزانيتك");
            } else {
              designScore += 10;
            }
          } else {
            designScore += 25;
          }

          // Rating (30 pts)
          const dRatingScore = Math.round((d.rating || 0) / 5 * 30);
          designScore += dRatingScore;
          if (d.rating >= 4.5) reasons.push(`تقييم عالي (${d.rating}/5)`);

          // Popularity (20 pts)
          const popularScore = Math.min(20, (d.total_purchases || 0) * 4);
          designScore += popularScore;
          if (d.total_purchases >= 5) reasons.push(`تصميم مطلوب (${d.total_purchases} مبيعة)`);

          return {
            id: d.id,
            title: d.title,
            category: d.category,
            design_style: d.design_style,
            price: d.price,
            preview_image: d.preview_images?.[0] || null,
            area_sqm: d.area_sqm,
            floors: d.floors,
            bedrooms: d.bedrooms,
            bathrooms: d.bathrooms,
            seller_name: d.seller_name,
            seller_type: d.seller_type,
            rating: d.rating,
            total_purchases: d.total_purchases,
            modification_available: d.modification_available,
            match_percentage: Math.min(100, designScore),
            match_reasons: reasons
          };
        })
        .filter(d => d.match_percentage >= 30)
        .sort((a, b) => b.match_percentage - a.match_percentage)
        .slice(0, 4);
    } catch (designErr) {
      console.error("Design fetch error:", designErr.message);
    }

    // ── Step 4: Generate smart recommendation text via LLM ────────────
    const recommendationPrompt = `أنت مستشار هندسي ذكي في منصة بيتلي. بناءً على التحليل التالي، اكتب توصية احترافية ومخصصة للعميل:

تحليل المشروع:
- الفئة: ${analysis.project_category}
- النوع: ${analysis.project_type}
- التعقيد: ${analysis.project_complexity}
- المتطلبات: ${analysis.key_requirements?.join('، ')}
- الأنماط المقترحة: ${analysis.recommended_styles?.join('، ')}
- نطاق الميزانية: ${analysis.estimated_budget_range?.min?.toLocaleString() || '?'} - ${analysis.estimated_budget_range?.max?.toLocaleString() || '?'} ريال

أفضل المهندسين المطابقين:
${topEngineers.map((e, i) => `${i + 1}. ${e.full_name} (${e.user_type}) - تطابق ${e.match_percentage}% - ${e.match_reasons.join('، ')}`).join('\n')}

تصاميم جاهزة مقترحة:
${designSuggestions.length > 0 ? designSuggestions.map((d, i) => `${i + 1}. ${d.title} - ${d.price.toLocaleString()} ريال - ${d.match_reasons.join('، ')}`).join('\n') : 'لا توجد تصاميم جاهزة مطابقة حالياً'}

اكتب توصية احترافية باللغة العربية (3-4 فقرات) تشمل:
1. ملخص فهمك لاحتياج العميل
2. توصية بأفضل المهندسين (أذكر الأسماء) ولماذا
3. إن وجدت تصاميم جاهزة مناسبة، اقترحها كخيار سريع واقتصادي
4. نصيحة حول الخطوة التالية

كن ودوداً ومهنياً. استخدم تنسيق Markdown مناسب.`;

    const recommendationText = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: recommendationPrompt,
      add_context_from_internet: false
    });

    return Response.json({
      success: true,
      analysis,
      matched_engineers: topEngineers,
      design_suggestions: designSuggestions,
      recommendation_text: recommendationText
    });

  } catch (error) {
    console.error('smartAdvisorRecommendation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});