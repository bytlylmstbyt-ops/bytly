/**
 * Smart Prompt Builder
 * Converts Arabic/English user requests into optimized AI image prompts
 */

const STYLE_MAP = {
  "مودرن": "ultra modern contemporary",
  "عصري": "ultra modern contemporary",
  "فاخر": "ultra luxury high-end",
  "فاخرة": "ultra luxury high-end",
  "luxury": "ultra luxury high-end",
  "نيوكلاسيك": "neoclassical elegant ornate",
  "كلاسيك": "classical traditional ornate",
  "إسكندنافي": "scandinavian minimalist natural",
  "بسيط": "minimalist clean simple",
  "صناعي": "industrial loft exposed materials",
  "عربي": "Arabic Islamic luxury traditional",
  "ياباني": "Japanese zen minimal natural",
  "بوهيمي": "bohemian eclectic colorful",
};

const ROOM_MAP = {
  "غرفة معيشة": "living room",
  "صالة": "living room",
  "غرفة نوم": "bedroom",
  "مطبخ": "kitchen",
  "حمام": "bathroom",
  "مكتب": "home office",
  "فيلا": "luxury villa interior",
  "مجلس": "Arabic majlis luxury seating",
  "كافيه": "modern cafe interior",
  "مطعم": "restaurant interior",
  "واجهة": "building facade exterior architectural",
  "حديقة": "garden landscape exterior",
  "غرفة أطفال": "children's bedroom",
  "دراسة": "study room library",
};

const COLOR_MAP = {
  "رخام أسود": "black marble surfaces",
  "رخام أبيض": "white marble surfaces",
  "ذهبي": "gold brass metallic accents",
  "فضي": "silver chrome metallic accents",
  "أبيض": "white tones",
  "بيج": "beige warm tones",
  "رمادي": "grey tones",
  "أزرق": "blue accents",
  "أخضر": "green natural tones",
  "بني": "brown wooden tones",
  "أسود": "black dark tones",
};

export function buildImagePrompt(userText, selectedStyle = null) {
  let enhanced = userText;

  // Detect room type
  let roomEn = "interior space";
  for (const [ar, en] of Object.entries(ROOM_MAP)) {
    if (userText.includes(ar)) {
      roomEn = en;
      break;
    }
  }

  // Detect style
  let styleEn = selectedStyle || "modern luxury";
  for (const [ar, en] of Object.entries(STYLE_MAP)) {
    if (userText.toLowerCase().includes(ar.toLowerCase())) {
      styleEn = en;
      break;
    }
  }

  // Detect colors/materials
  const colorParts = [];
  for (const [ar, en] of Object.entries(COLOR_MAP)) {
    if (userText.includes(ar)) {
      colorParts.push(en);
    }
  }

  const colorStr = colorParts.length > 0 ? colorParts.join(", ") + ", " : "";

  const basePrompt = `Ultra realistic ${styleEn} ${roomEn}, ${colorStr}professional architectural interior visualization, cinematic lighting, 8K photorealistic render, ultra detailed, luxury Saudi Gulf market aesthetic, award-winning interior design, depth of field, volumetric lighting`;

  return basePrompt;
}

export function shouldGenerateImage(userText) {
  const triggerKeywords = [
    "صمم", "صممي", "اريد تصميم", "أريد تصميم", "أبغى تصميم", "ابغى تصميم",
    "أبغى", "ابغى", "اعطني تصميم", "أعطني تصميم", "ولد", "انشئ", "أنشئ",
    "generate", "design", "create", "show me", "visualize",
    "غرفة", "مطبخ", "حمام", "فيلا", "مجلس", "واجهة", "حديقة", "مكتب",
    "صالة", "غرفة نوم", "كافيه", "مطعم",
    "dream villa", "luxury kitchen", "modern facade",
    "احلامي", "أحلامي", "تصميم داخلي", "ديكور",
  ];
  const lower = userText.toLowerCase();
  return triggerKeywords.some(k => lower.includes(k.toLowerCase()));
}

export const SMART_COMMANDS = [
  { label: "🏰 فيلا أحلامي", prompt: "صمم لي فيلا فاخرة بأسلوب نيوكلاسيك مع مسبح خارجي" },
  { label: "🛋️ غرفة معيشة فاخرة", prompt: "أريد غرفة معيشة فاخرة بالرخام الأبيض والإضاءة الذهبية" },
  { label: "👑 مجلس عربي", prompt: "مجلس عربي فاخر بأسلوب خليجي تقليدي مع أسقف عالية" },
  { label: "🍳 مطبخ مودرن", prompt: "مطبخ عصري فاخر بالرخام الأسود والإضاءة الذهبية" },
  { label: "🏢 واجهة فيلا", prompt: "واجهة فيلا فاخرة عصرية بالحجر الطبيعي والزجاج" },
  { label: "🌿 حديقة فاخرة", prompt: "حديقة فاخرة مع مسبح وإضاءة ليلية ونباتات استوائية" },
];