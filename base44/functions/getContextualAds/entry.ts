import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Allowed industry categories only
const ALLOWED_CATEGORIES = [
  'engineering', 'contracting', 'decor', 'building_materials',
  'furniture', 'consulting_office', 'concrete_supply', 'electrical', 'plumbing', 'landscape'
];

// Tag-to-category contextual mapping
const TAG_CATEGORY_MAP = {
  'تصميم معماري': ['engineering', 'consulting_office', 'concrete_supply'],
  'تصميم داخلي': ['decor', 'furniture', 'electrical'],
  'ديكور': ['decor', 'furniture'],
  'مدني': ['contracting', 'concrete_supply', 'building_materials'],
  'إنشائي': ['contracting', 'concrete_supply', 'building_materials'],
  'حدائق': ['landscape', 'building_materials'],
  'كهرباء': ['electrical', 'engineering'],
  'سباكة': ['plumbing', 'building_materials'],
  'أثاث': ['furniture', 'decor'],
  'مواد بناء': ['building_materials', 'contracting'],
  'رسومات تنفيذية': ['engineering', 'consulting_office'],
  'interior': ['decor', 'furniture', 'electrical'],
  'architecture': ['engineering', 'consulting_office', 'concrete_supply'],
  'painting': ['decor', 'building_materials'],
  'landscape': ['landscape', 'building_materials'],
  'furniture': ['furniture', 'decor'],
  'lighting': ['electrical', 'decor'],
  'civil_engineering': ['contracting', 'concrete_supply', 'engineering'],
  'structural_design': ['engineering', 'contracting', 'concrete_supply'],
  'executive_drawing': ['engineering', 'consulting_office'],
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { placement, tags, limit = 3 } = await req.json();

    if (!placement) {
      return Response.json({ error: 'placement is required' }, { status: 400 });
    }

    // Determine relevant categories from tags
    const relevantCategories = new Set();
    if (tags && Array.isArray(tags)) {
      for (const tag of tags) {
        const cats = TAG_CATEGORY_MAP[tag] || [];
        cats.forEach(c => relevantCategories.add(c));
      }
    }

    // Build filter
    const today = new Date().toISOString().split('T')[0];

    // Fetch all active ads for this placement
    const allAds = await base44.asServiceRole.entities.Advertisement.filter({
      is_active: true
    });

    // Filter: allowed categories only, placement match, not expired
    let filtered = allAds.filter(ad => {
      if (!ALLOWED_CATEGORIES.includes(ad.category)) return false;
      if (ad.placement !== 'both' && ad.placement !== placement) return false;
      if (ad.end_date && ad.end_date < today) return false;
      if (ad.start_date && ad.start_date > today) return false;
      return true;
    });

    // Sort: contextual match first, then verified advertisers, then by impressions (least shown first)
    filtered.sort((a, b) => {
      const aMatch = relevantCategories.has(a.category) || (a.target_tags || []).some(t => tags?.includes(t));
      const bMatch = relevantCategories.has(b.category) || (b.target_tags || []).some(t => tags?.includes(t));
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
      if (a.is_verified_advertiser && !b.is_verified_advertiser) return -1;
      if (!a.is_verified_advertiser && b.is_verified_advertiser) return 1;
      return (a.impressions || 0) - (b.impressions || 0);
    });

    const ads = filtered.slice(0, limit);

    // Async impression tracking (fire and forget)
    for (const ad of ads) {
      base44.asServiceRole.entities.Advertisement.update(ad.id, {
        impressions: (ad.impressions || 0) + 1
      }).catch(() => {});
    }

    return Response.json({ success: true, ads });
  } catch (error) {
    console.error('getContextualAds error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});