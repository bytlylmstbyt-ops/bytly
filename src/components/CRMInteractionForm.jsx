import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import MobileSelect from "@/components/mobile/MobileSelect";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles } from "lucide-react";

export default function CRMInteractionForm({ onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [sentiment, setSentiment] = useState(null);

  const [formData, setFormData] = useState({
    client_email: "",
    project_id: "",
    interaction_type: "note",
    title: "",
    content: "",
    follow_up_required: false,
    priority: "medium"
  });

  const handleAnalyzeSentiment = async () => {
    setAnalyzing(true);
    try {
      // Transparent local keyword heuristic; this is not an AI model.
      const text = String(formData.content || "").toLowerCase();
      const positiveWords = ["شكرا", "ممتاز", "راضي", "راضية", "سعيد", "سعيدة", "جيد", "ممتاز", "great", "thanks", "happy", "satisfied", "good", "excellent"];
      const negativeWords = ["شكوى", "سيئ", "سيء", "تأخير", "متأخر", "مشكلة", "غاضب", "غير راضي", "غير راضية", "bad", "delay", "problem", "complaint", "angry", "unhappy", "unsatisfied"];
      const urgencyWords = ["عاجل", "فوري", "تصعيد", "شكوى", "استرجاع", "urgent", "immediately", "escalation", "refund"];
      const positiveCount = positiveWords.reduce((count, word) => count + (text.includes(word) ? 1 : 0), 0);
      const negativeCount = negativeWords.reduce((count, word) => count + (text.includes(word) ? 1 : 0), 0);
      const urgentAction = urgencyWords.some(word => text.includes(word));
      const mood = positiveCount > negativeCount ? "positive" : negativeCount > positiveCount ? "negative" : "neutral";
      const score = Math.max(-1, Math.min(1, (positiveCount - negativeCount) / Math.max(1, positiveCount + negativeCount)));
      const concerns = negativeWords.filter(word => text.includes(word)).slice(0, 5);
      const result = {
        success: true,
        sentiment: mood,
        sentiment_score: score,
        urgentAction,
        concerns,
        suggestedAction: urgentAction ? "مؤشر كلمات يستدعي مراجعة بشرية عاجلة قبل اتخاذ إجراء." : mood === "negative" ? "راجع الملاحظة يدويًا وتواصل مع العميل عند الحاجة." : "تحقق من السياق يدويًا قبل اتخاذ أي قرار.",
        analysis_method: "local_keyword_heuristic"
      };
      setSentiment(result);
      if (urgentAction) setFormData(prev => ({ ...prev, follow_up_required: true, priority: "urgent" }));
    } catch (error) {
      console.error("Sentiment heuristic failed:", error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      const user = authData?.user;
      if (authError || !user) throw new Error("يرجى تسجيل الدخول قبل حفظ تفاعل العميل.");
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();
      if (profileError) throw profileError;
      if (String(profile?.role || user.app_metadata?.role || "").toLowerCase() !== "admin") {
        throw new Error("هذه الوظيفة متاحة لفريق الإدارة فقط.");
      }
      const normalizedEmail = formData.client_email.trim().toLowerCase();
      const { error: insertError } = await supabase.from("client_interactions").insert({
        client_email: normalizedEmail,
        project_id: formData.project_id.trim() || null,
        interaction_type: formData.interaction_type,
        title: formData.title.trim(),
        content: formData.content.trim(),
        follow_up_required: Boolean(formData.follow_up_required),
        priority: formData.priority,
        sentiment: sentiment?.sentiment || null,
        sentiment_score: Number.isFinite(Number(sentiment?.sentiment_score)) ? Number(sentiment.sentiment_score) : null,
        recorded_by: user.email || null,
        created_by: user.id,
        interaction_date: new Date().toISOString(),
        tags: [],
        attachments: [],
        status: "open"
      });
      if (insertError) throw insertError;
      onSuccess?.();
    } catch (error) {
      console.error("Failed to save CRM interaction:", error);
      window.alert(error?.message || "تعذر حفظ التفاعل. تحقق من صلاحيات الإدارة.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">بريد العميل</label>
          <Input
            required
            value={formData.client_email}
            onChange={(e) => setFormData(prev => ({ ...prev, client_email: e.target.value }))}
            placeholder="client@example.com"
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium">نوع التفاعل</label>
          <MobileSelect
            value={formData.interaction_type}
            onValueChange={v => setFormData(prev => ({ ...prev, interaction_type: v }))}
            label="نوع التفاعل"
            options={[
              { value: "call", label: "مكالمة" },
              { value: "email", label: "بريد إلكتروني" },
              { value: "meeting", label: "اجتماع" },
              { value: "message", label: "رسالة" },
              { value: "note", label: "ملاحظة" },
            ]}
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">العنوان</label>
        <Input
          required
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="ملخص التفاعل"
          className="mt-1"
        />
      </div>

      <div>
        <label className="text-sm font-medium">المحتوى</label>
        <Textarea
          required
          value={formData.content}
          onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
          placeholder="اكتب تفاصيل التفاعل..."
          className="mt-1 h-32"
        />
      </div>

      {sentiment && (
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 space-y-2">
          <div className="flex items-center gap-2">
            <Badge className={sentiment.sentiment === 'positive' ? 'bg-green-600' : sentiment.sentiment === 'negative' ? 'bg-red-600' : 'bg-gray-600'}>
              {sentiment.sentiment === 'positive' ? 'إيجابي' : sentiment.sentiment === 'negative' ? 'سلبي' : 'محايد'}
            </Badge>
            <span className="text-sm font-medium">مؤشر كلمات مبدئي (ليس تحليلًا بالذكاء الاصطناعي)</span>
          </div>
          <p className="text-sm text-slate-600">{sentiment.suggestedAction}</p>
          {sentiment.concerns?.length > 0 && (
            <div className="text-sm">
              <p className="font-medium">الاهتمامات:</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {sentiment.concerns.map((c, i) => (
                  <Badge key={i} variant="outline" className="text-xs">{c}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleAnalyzeSentiment}
          disabled={!formData.content || analyzing}
          className="gap-2"
        >
          {analyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              جاري التحليل...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              حلل المشاعر
            </>
          )}
        </Button>
        <Button type="submit" disabled={loading} className="gap-2 flex-1">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              جاري الحفظ...
            </>
          ) : (
            "حفظ التفاعل"
          )}
        </Button>
      </div>
    </form>
  );
}