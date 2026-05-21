import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Linkedin, Sparkles, Send, RefreshCw, CheckCircle, 
  Users, Briefcase, Share2, MessageSquare, Loader2, Copy, Check,
  Twitter, Facebook
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const PLATFORMS = [
  { id: "linkedin", label: "LinkedIn", icon: Linkedin, color: "#0077B5", bg: "bg-[#0077B5]", function: "linkedinService" },
  { id: "twitter", label: "X / Twitter", icon: Twitter, color: "#000000", bg: "bg-black", function: "twitterService" },
  { id: "facebook", label: "Facebook", icon: Facebook, color: "#1877F2", bg: "bg-[#1877F2]", function: "facebookService" },
];

const ACTIONS = [
  {
    id: "shareDesignWork",
    label: "مشاركة عمل تصميمي",
    icon: Share2,
    color: "bg-blue-50 border-blue-200",
    iconColor: "text-blue-600",
    // Twitter/FB action mapping
    twitterAction: "share_design",
    facebookAction: "share_design",
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
    twitterAction: "searchAndOutreachClients",
    facebookAction: "searchAndOutreachClients",
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
    twitterAction: "engineer_recruitment",
    facebookAction: "engineer_recruitment",
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
    twitterAction: "draftOutreachMessage",
    facebookAction: "draftOutreachMessage",
    fields: [
      { key: "recipientName", label: "اسم المستلم", placeholder: "م. سارة الأحمدي" },
      { key: "recipientRole", label: "الدور", placeholder: "client أو engineer" },
      { key: "purpose", label: "الهدف من الرسالة", placeholder: "دعوة للانضمام لمنصة Bytly" },
    ]
  }
];

export default function MarketingHub() {
  const [selectedAction, setSelectedAction] = useState(ACTIONS[0]);
  const [selectedPlatform, setSelectedPlatform] = useState(PLATFORMS[0]);
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

  const handlePlatformChange = (platform) => {
    setSelectedPlatform(platform);
    setResult(null);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setResult(null);
    try {
      let response;
      if (selectedPlatform.id === "linkedin") {
        response = await base44.functions.invoke("linkedinService", {
          action: selectedAction.id,
          data: formData
        });
        setResult(response.data);
        toast({
          title: response.data.success ? "تم النشر على LinkedIn ✅" : "حدث خطأ",
          description: response.data.message || response.data.error,
          variant: response.data.success ? "default" : "destructive"
        });
      } else if (selectedPlatform.id === "twitter") {
        response = await base44.functions.invoke("twitterService", {
          action: selectedAction.twitterAction,
          ...formData
        });
        setResult({ ...response.data, platform: "twitter" });
        toast({
          title: response.data.success ? "تم النشر على X / Twitter ✅" : "حدث خطأ",
          description: response.data.success ? `تغريدة منشورة بنجاح` : response.data.error,
          variant: response.data.success ? "default" : "destructive"
        });
      } else if (selectedPlatform.id === "facebook") {
        response = await base44.functions.invoke("facebookService", {
          action: selectedAction.facebookAction,
          ...formData
        });
        setResult({ ...response.data, platform: "facebook" });
        toast({
          title: response.data.success ? "تم النشر على Facebook ✅" : "حدث خطأ",
          description: response.data.success ? `منشور فيسبوك بنجاح` : response.data.error,
          variant: response.data.success ? "default" : "destructive"
        });
      }
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

  const platformColor = selectedPlatform.color;
  const PlatformIcon = selectedPlatform.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 py-8 px-4" dir="rtl">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: platformColor }}>
              <PlatformIcon className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">مركز التسويق</h1>
          </div>
          <p className="text-slate-500 text-sm">توليد ونشر المحتوى التسويقي بالذكاء الاصطناعي على منصات التواصل الاجتماعي</p>
        </div>

        {/* Platform Selector */}
        <div className="flex gap-3 mb-6 flex-wrap">
          {PLATFORMS.map((platform) => {
            const Icon = platform.icon;
            const isActive = selectedPlatform.id === platform.id;
            return (
              <button
                key={platform.id}
                onClick={() => handlePlatformChange(platform)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 font-medium text-sm transition-all ${
                  isActive
                    ? "border-transparent text-white shadow-md"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
                style={isActive ? { backgroundColor: platform.color } : {}}
              >
                <Icon className="w-4 h-4" />
                {platform.label}
              </button>
            );
          })}
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
                      ? "shadow-sm" 
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                  style={isSelected ? { borderColor: platformColor, backgroundColor: `${platformColor}0d` } : {}}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${action.color}`}>
                    <Icon className={`w-4 h-4 ${action.iconColor}`} />
                  </div>
                  <span className="text-sm font-medium" style={isSelected ? { color: platformColor } : { color: "#374151" }}>
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
                  <Badge className="mr-auto text-xs font-medium text-white border-0" style={{ backgroundColor: platformColor }}>
                    {selectedPlatform.label}
                  </Badge>
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
                  className="w-full text-white gap-2"
                  style={{ backgroundColor: platformColor }}
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> جارٍ التوليد والنشر...</>
                  ) : (
                    <><Send className="w-4 h-4" /> توليد ونشر على {selectedPlatform.label}</>
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
                      {result.success
                        ? `تم النشر على ${selectedPlatform.label} بنجاح`
                        : result.error || "حدث خطأ"}
                    </span>
                  </div>

                  {/* Content display (Twitter/Facebook) */}
                  {result.content && (
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-500">المحتوى المنشور</span>
                        <button onClick={() => handleCopy(result.content)} className="text-slate-400 hover:text-slate-600">
                          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{result.content}</p>
                    </div>
                  )}

                  {/* LinkedIn specific fields */}
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

                  {/* Post links */}
                  {result.tweet_url && (
                    <a href={result.tweet_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-slate-500 hover:text-black transition-colors">
                      <Twitter className="w-3.5 h-3.5" />
                      <span>عرض التغريدة على X</span>
                    </a>
                  )}
                  {result.post_url && (
                    <a href={result.post_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-slate-500 hover:text-[#1877F2] transition-colors">
                      <Facebook className="w-3.5 h-3.5" />
                      <span>عرض المنشور على Facebook</span>
                    </a>
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