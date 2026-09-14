import { base44 } from "@/api/base44Client";

const STATUS_LABELS = {
  compliant: "مطابق",
  compliant_with_notes: "مطابق مع ملاحظات",
  non_compliant: "غير مطابق"
};

/**
 * Generates a final technical review report using InvokeLLM and downloads it.
 * Falls back to a plain-text summary if LLM is unavailable.
 */
export async function downloadTechnicalReport({ project, consultant, review }) {
  const consultantName = consultant?.company_name || consultant?.full_name || "غير محدد";
  const reviewDate = review?.review_date
    ? new Date(review.review_date).toLocaleDateString("ar-SA")
    : new Date().toLocaleDateString("ar-SA");

  const llmPrompt = `أنت مستشار فني محترف. أنشئ تقريراً فنياً رسمياً ومفصلاً ومنسقاً باللغة العربية لمشروع هندسي يحتوي على الأقسام التالية:

— بيانات المشروع —
عنوان المشروع: ${project?.title || "—"}
التصنيف: ${project?.category || "—"}
الموقع: ${project?.location || "—"}

— بيانات المراجعة —
الاستشاري المعتمد: ${consultantName}
تاريخ المراجعة: ${reviewDate}
حالة المطابقة: ${STATUS_LABELS[review?.compliance_status] || "—"}

— محتوى المراجعة —
مطابقة الكود السعودي:
${review?.saudi_code_compliance || "—"}

توصيات التنفيذ:
${review?.implementation_recommendations || "—"}

تقييم الجودة:
${review?.quality_assessment || "—"}

ملاحظات فنية إضافية:
${review?.technical_notes || "—"}

اكتب التقرير بصيغة احترافية جاهزة للطباعة، مع عناوين واضحة لكل قسم، وقدم خلاصة وتوصية نهادية في النهاية. لا تضف أي ملاحظات خارج التقرير.`;

  try {
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: llmPrompt,
      model: "gemini_3_flash"
    });
    const reportText = typeof result === "string" ? result : result?.response || result?.text || JSON.stringify(result);
    triggerDownload(reportText, `التقرير_الفني_${project?.title || "مشروع"}.txt`);
  } catch (err) {
    console.error("LLM report generation failed, using fallback:", err);
    const fallback = buildFallbackReport({ project, consultantName, reviewDate, review });
    triggerDownload(fallback, `التقرير_الفني_${project?.title || "مشروع"}.txt`);
  }
}

function buildFallbackReport({ project, consultantName, reviewDate, review }) {
  return `
══════════════════════════════════════════
       التقرير الفني الرسمي للمشروع
══════════════════════════════════════════

عنوان المشروع: ${project?.title || "—"}
التصنيف: ${project?.category || "—"}
الموقع: ${project?.location || "—"}

──────────────────────────────────────────
الاستشاري المعتمد: ${consultantName}
تاريخ المراجعة: ${reviewDate}
حالة المطابقة: ${STATUS_LABELS[review?.compliance_status] || "—"}
──────────────────────────────────────────

مطابقة الكود السعودي:
${review?.saudi_code_compliance || "—"}

توصيات التنفيذ:
${review?.implementation_recommendations || "—"}

تقييم الجودة:
${review?.quality_assessment || "—"}

ملاحظات فنية إضافية:
${review?.technical_notes || "—"}

══════════════════════════════════════════
         نهاية التقرير
══════════════════════════════════════════
`.trim();
}

function triggerDownload(text, filename) {
  const blob = new Blob(["\uFEFF" + text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}