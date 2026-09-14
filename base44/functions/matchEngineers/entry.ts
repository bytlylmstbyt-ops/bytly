import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { project_type, budget, location, specialization, years_experience_min } = await req.json();

    // Fetch all approved engineers
    const engineers = await base44.asServiceRole.entities.Engineer.filter({ status: "approved" }, "-rating", 100);

    const scored = engineers.map(eng => {
      let score = 0;
      const breakdown = [];

      // 1. Specialization / user_type match (35 pts)
      const typeMap = {
        residential: ["engineer", "architect", "civil"],
        commercial: ["architect", "civil", "engineer"],
        industrial: ["civil", "engineer"],
        renovation: ["engineer", "architect", "painter"],
        interior: ["engineer", "painter"],
        landscape: ["architect", "painter"],
        other: ["engineer", "architect", "civil", "painter"],
      };
      const matchedTypes = typeMap[project_type] || [];
      if (matchedTypes.includes(eng.user_type)) {
        score += 35;
        breakdown.push({ label: "نوع المشروع", score: 35, max: 35 });
      } else {
        breakdown.push({ label: "نوع المشروع", score: 0, max: 35 });
      }

      // Also check specialization text match (bonus up to 10)
      const specKeywords = {
        residential: ["سكني", "معماري", "داخلي", "residential"],
        commercial: ["تجاري", "معماري", "commercial"],
        industrial: ["صناعي", "مدني", "industrial"],
        renovation: ["ترميم", "ديكور", "renovation"],
        interior: ["داخلي", "ديكور", "interior"],
        landscape: ["حدائق", "landscape", "مناظر"],
        other: [],
      };
      const keywords = specKeywords[project_type] || [];
      const specText = (eng.specialization || "").toLowerCase();
      const bioText = (eng.bio || "").toLowerCase();
      const keywordHit = keywords.some(k => specText.includes(k.toLowerCase()) || bioText.includes(k.toLowerCase()));
      if (keywordHit) {
        score += 10;
        breakdown.push({ label: "تخصص دقيق", score: 10, max: 10 });
      } else {
        breakdown.push({ label: "تخصص دقيق", score: 0, max: 10 });
      }

      // 2. Location match (20 pts)
      const engCity = (eng.city || "").toLowerCase();
      const reqLocation = (location || "").toLowerCase();
      if (reqLocation && engCity && engCity.includes(reqLocation)) {
        score += 20;
        breakdown.push({ label: "الموقع الجغرافي", score: 20, max: 20 });
      } else if (reqLocation && engCity) {
        // Partial: same region heuristic (broad match)
        const sameRegion = (engCity.includes("رياض") && reqLocation.includes("رياض")) ||
          (engCity.includes("جدة") && reqLocation.includes("جدة")) ||
          (engCity.includes("مكة") && reqLocation.includes("مكة")) ||
          (engCity.includes("دمام") && reqLocation.includes("دمام"));
        if (sameRegion) {
          score += 10;
          breakdown.push({ label: "الموقع الجغرافي", score: 10, max: 20 });
        } else {
          breakdown.push({ label: "الموقع الجغرافي", score: 0, max: 20 });
        }
      } else {
        breakdown.push({ label: "الموقع الجغرافي", score: 0, max: 20 });
      }

      // 3. Budget compatibility via services_offered (15 pts)
      const services = eng.services_offered || [];
      let budgetScore = 0;
      if (budget && services.length > 0) {
        // Try to parse price ranges and see if budget fits
        const budgetNum = parseFloat(budget);
        const hasCompatible = services.some(s => {
          const pr = s.price_range || "";
          const nums = pr.match(/[\d,]+/g);
          if (!nums) return true; // no price info, assume compatible
          const prices = nums.map(n => parseFloat(n.replace(/,/g, "")));
          const minPrice = Math.min(...prices);
          return budgetNum >= minPrice;
        });
        if (hasCompatible) {
          budgetScore = 15;
        } else {
          budgetScore = 5; // partial
        }
      } else {
        budgetScore = 8; // no info = neutral
      }
      score += budgetScore;
      breakdown.push({ label: "الميزانية", score: budgetScore, max: 15 });

      // 4. Rating (10 pts)
      const rating = eng.rating || 0;
      const ratingScore = Math.round((rating / 5) * 10);
      score += ratingScore;
      breakdown.push({ label: "التقييم", score: ratingScore, max: 10 });

      // 5. Experience (10 pts)
      const exp = eng.years_experience || 0;
      const expMinReq = years_experience_min || 0;
      let expScore = 0;
      if (exp >= expMinReq) {
        expScore = Math.min(10, Math.round((exp / 10) * 10));
      } else {
        expScore = Math.round((exp / 10) * 5);
      }
      score += expScore;
      breakdown.push({ label: "سنوات الخبرة", score: expScore, max: 10 });

      // Cap at 100
      const percentage = Math.min(100, score);

      return {
        ...eng,
        match_percentage: percentage,
        match_breakdown: breakdown,
      };
    });

    // Sort by match and return top 10
    const results = scored
      .filter(e => e.match_percentage >= 20)
      .sort((a, b) => b.match_percentage - a.match_percentage)
      .slice(0, 10);

    return Response.json({ results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});