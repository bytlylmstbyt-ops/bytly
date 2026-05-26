import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
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
      const response = await base44.functions.invoke("analyzeSentiment", {
        content: formData.content,
        interaction_type: formData.interaction_type
      });

      if (response.data.success) {
        setSentiment(response.data);
        if (response.data.urgentAction) {
          setFormData(prev => ({
            ...prev,
            follow_up_required: true,
            priority: "urgent"
          }));
        }
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await base44.entities.ClientInteraction.create({
        ...formData,
        sentiment: sentiment?.sentiment,
        sentiment_score: sentiment?.sentiment_score,
        interaction_date: new Date().toISOString()
      });

      if (formData.follow_up_required && sentiment) {
        await base44.functions.invoke("scheduleFollowUp", {
          client_email: formData.client_email,
          project_id: formData.project_id,
          sentiment_score: sentiment.sentiment_score,
          concerns: sentiment.concerns,
          interaction_type: formData.interaction_type
        });
      }

      onSuccess?.();
    } catch (error) {
      console.error("Error:", error);
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
            <span className="text-sm font-medium">تحليل المشاعر</span>
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