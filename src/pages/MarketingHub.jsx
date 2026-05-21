import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Linkedin, Sparkles, Send, RefreshCw, CheckCircle, 
  Users, Briefcase, Share2, MessageSquare, Loader2, Copy, Check
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const ACTIONS = [
  {
    id: "shareDesignWork",
    label: "مشاركة عمل تصميمي",
    icon: Share2,
    color: "bg-blue-50 border-blue-200",
    iconColor: "text-blue-600",
    fields: [
      { key: "title", label: "عنوان العمل", placeholder: "مشروع فيلا سكنية" },
      { key: "description", label: "الوصف", placeholder: "وصف العمل التصميمي...", multiline: true },
      { key: "designCategory", label: "التصنيف", placeholder: "تصميم داخلي" },
      { key: "engineerName", label: "اسم المهندس", placeholder: "م. أحمد العمري" },
    ]
  },
  {
    id: "searchAndOutreachClients",
    label: "جذب عملاء محتملين",
    icon: Users,
    color: "bg-green-50 border-green-200",
    iconColor: "text-green-600",
    fields: [
      { key: "industry", label: "القطاع المستهدف", placeholder: "البناء والتطوير العقاري" },
      { key: "location", label: "المنطقة", placeholder: "الرياض، جدة" },
      { key: "projectType", label: "نوع المشروع", placeholder: "تصميم معماري وداخلي" },
    ]
  },
  {
    id: "outreachToEngineers",
    label: "استقطاب مهندسين",
    icon: Briefcase,
    color: "bg-purple-50 border-purple-200",
    iconColor: "text-purple-600",
    fields: [
      { key: "engineerSpecialization", label: "التخصص", placeholder: "هندسة معمارية" },
      { key: "engineerCity", label: "المدينة", placeholder: "الرياض" },
    ]
  },
  {
    id: "draftOutreachMessage",
    label: "صياغة رسالة تواصل",
    icon: MessageSquare,
    color: "bg-amber-50 border-amber-200",
    iconColor: "text-amber-600",
    fields: [
      { key: "recipientName", label: "اسم المستلم", placeholder: "م. سارة الأحمدي" },
      { key: "recipientRole", label: "الدور", placeholder: "client أو engineer" },
      { key: "purpose", label: "الهدف من الرسالة", placeholder: "دعوة للانضمام لمنصة Bytly" },
    ]
  }
];

export default function MarketingHub() {
  const [selectedAction, setSelectedAction] = useState(ACTIONS[0]);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleActionChange = (action) => {
    setSelectedAction(action);
    setFormData({});
    setResult(null);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setResult(null);
    try {
      const response = await base44.functions.invoke("linkedinService", {
        action: selectedAction.id,
        data: formData
      });
      setResult(response.data);
      toast({
        title: response.data.success ? "تم بنجاح ✅" : "حدث خطأ",
        description: response.data.message || response.data.error,
        variant: response.data.success ? "default" : "destructive"
      });
    } catch (e) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 py-8 px-4" dir="rtl">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#0077B5] rounded-xl flex items-center justify-center">
              <Linkedin className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">مركز التسويق</h1>
            <Badge className="bg-[#0077B5]/10 text-[#0077B5] border-0">LinkedIn</Badge>
          </div>
          <p className="text-slate-500 text-sm">توليد ونشر المحتوى التسويقي بالذكاء الاصطناعي مباشرةً على LinkedIn</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Action Selector */}
          <div className="lg:col-span-1 space-y-3">
            <h2 className="text-sm font-semibold text-slate-600 mb-3">اختر نوع المنشور</h2>
            {ACTIONS.map((action) => {
              const Icon = action.icon;
              const isSelected = selectedAction.id === action.id;
              return (
                <button
                  key={action.id}
                  onClick={() => handleActionChange(action)}
                  className={`w-full text-right p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                    isSelected 
                      ? "border-[#0077B5] bg-[#0077B5]/5 shadow-sm" 
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${action.color}`}>
                    <Icon className={`w-4 h-4 ${action.iconColor}`} />
                  </div>
                  <span className={`text-sm font-medium ${isSelected ? "text-[#0077B5]" : "text-slate-700"}`}>
                    {action.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Form & Result */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Form */}
            <Card className="border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#C9A66B]" />
                  {selectedAction.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedAction.fields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">{field.label}</label>
                    {field.multiline ? (
                      <Textarea
                        placeholder={field.placeholder}
                        value={formData[field.key] || ""}
                        onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                        className="resize-none"
                        rows={3}
                      />
                    ) : (
                      <Input
                        placeholder={field.placeholder}
                        value={formData[field.key] || ""}
                        onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                      />
                    )}
                  </div>
                ))}

                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full bg-[#0077B5] hover:bg-[#005983] text-white gap-2"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> جارٍ التوليد والنشر...</>
                  ) : (
                    <><Send className="w-4 h-4" /> توليد ونشر على LinkedIn</>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Result */}
            {result && (
              <Card className={`border-2 ${result.success ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/50"}`}>
                <CardContent className="pt-4 space-y-4">
                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <RefreshCw className="w-5 h-5 text-red-500" />
                    )}
                    <span className={`font-semibold text-sm ${result.success ? "text-green-700" : "text-red-600"}`}>
                      {result.message || result.error}
                    </span>
                  </div>

                  {result.caption && (
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-500">المنشور المنشور</span>
                        <button onClick={() => handleCopy(result.caption)} className="text-slate-400 hover:text-slate-600">
                          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{result.caption}</p>
                    </div>
                  )}

                  {result.searchPost && (
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-500">المنشور المنشور</span>
                        <button onClick={() => handleCopy(result.searchPost)} className="text-slate-400 hover:text-slate-600">
                          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{result.searchPost}</p>
                    </div>
                  )}

                  {result.recruitPost && (
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-500">منشور الاستقطاب</span>
                        <button onClick={() => handleCopy(result.recruitPost)} className="text-slate-400 hover:text-slate-600">
                          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{result.recruitPost}</p>
                    </div>
                  )}

                  {(result.outreachMessageDraft || result.connectionRequestDraft || result.draft) && (
                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-500">مسودة الرسالة (للإرسال يدويًا)</span>
                        <button onClick={() => handleCopy(result.outreachMessageDraft || result.connectionRequestDraft || result.draft)} className="text-slate-400 hover:text-slate-600">
                          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {result.outreachMessageDraft || result.connectionRequestDraft || result.draft}
                      </p>
                      {result.tip && (
                        <p className="text-xs text-blue-600 mt-2 font-medium">💡 {result.tip}</p>
                      )}
                    </div>
                  )}

                  {result.postId && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Linkedin className="w-3.5 h-3.5 text-[#0077B5]" />
                      <span>تم النشر • Post ID: {result.postId}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}