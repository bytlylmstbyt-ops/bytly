import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Share2, Users, UserPlus, CheckCircle, Copy, ExternalLink, Linkedin, Network, Search, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export default function LinkedInManager() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState("share");
  const [networkLoading, setNetworkLoading] = useState(false);
  const [generatedProfiles, setGeneratedProfiles] = useState([]);
  const [selectedProfiles, setSelectedProfiles] = useState([]);
  const [networkForm, setNetworkForm] = useState({
    specialization: "هندسة معمارية",
    city: "الرياض",
    experienceLevel: "خبرة متوسطة (3-7 سنوات)",
    count: 5,
    customNote: "",
  });
  const [batchResults, setBatchResults] = useState([]);

  // Form states
  const [shareForm, setShareForm] = useState({ title: "", description: "", designCategory: "interior", engineerName: "", firmName: "Bytly" });
  const [clientForm, setClientForm] = useState({ industry: "العقارات والبناء", location: "الرياض", projectType: "تصميم معماري وداخلي", customMessage: "" });
  const [engineerForm, setEngineerForm] = useState({ engineerName: "", engineerSpecialization: "هندسة معمارية", engineerCity: "الرياض", customNote: "" });

  const invoke = async (action, data) => {
    setLoading(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke("linkedinService", { action, data });
      setResult(res.data);
      if (res.data.success) {
        toast.success(res.data.message);
      }
    } catch (e) {
      toast.error("حدث خطأ: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("تم النسخ ✓");
  };

  const categories = [
    { value: "interior", label: "تصميم داخلي" },
    { value: "architecture", label: "هندسة معمارية" },
    { value: "landscape", label: "لاند سكيب" },
    { value: "civil", label: "هندسة مدنية" },
    { value: "furniture", label: "تصميم أثاث" },
    { value: "lighting", label: "إضاءة" },
  ];

  const specializations = [
    "هندسة معمارية",
    "تصميم داخلي",
    "هندسة إنشائية",
    "هندسة مدنية",
    "تصميم لاند سكيب",
    "رسم وتصميم",
  ];

  const experienceLevels = [
    "حديث التخرج (0-2 سنة)",
    "خبرة متوسطة (3-7 سنوات)",
    "خبرة عالية (8-15 سنة)",
    "خبير متمرس (+15 سنة)",
  ];

  const saudiCities = ["الرياض", "جدة", "الدمام", "مكة المكرمة", "المدينة المنورة", "أبها", "تبوك", "الخبر"];

  // Generate simulated engineer profiles based on criteria using AI
  const generateTargetProfiles = async () => {
    setNetworkLoading(true);
    setGeneratedProfiles([]);
    setSelectedProfiles([]);
    setBatchResults([]);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `أنشئ قائمة بـ ${networkForm.count} ملف شخصي وهمي (افتراضي) لمهندسين محترفين على LinkedIn وفق هذه المعايير:
- التخصص: ${networkForm.specialization}
- المدينة: ${networkForm.city}
- مستوى الخبرة: ${networkForm.experienceLevel}

أرجع JSON فقط بهذا الشكل بدون أي نص خارجه:
{
  "profiles": [
    {
      "name": "اسم المهندس",
      "title": "المسمى الوظيفي",
      "company": "اسم الشركة أو الجهة",
      "yearsExp": 5,
      "skills": ["مهارة 1", "مهارة 2", "مهارة 3"],
      "highlight": "إنجاز أو ميزة بارزة"
    }
  ]
}`,
        response_json_schema: {
          type: "object",
          properties: {
            profiles: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  title: { type: "string" },
                  company: { type: "string" },
                  yearsExp: { type: "number" },
                  skills: { type: "array", items: { type: "string" } },
                  highlight: { type: "string" }
                }
              }
            }
          }
        }
      });
      setGeneratedProfiles(res.profiles || []);
      setSelectedProfiles((res.profiles || []).map((_, i) => i)); // select all by default
    } catch (e) {
      toast.error("فشل توليد الملفات: " + e.message);
    } finally {
      setNetworkLoading(false);
    }
  };

  const toggleProfile = (idx) => {
    setSelectedProfiles(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const sendBatchConnectionRequests = async () => {
    const targets = generatedProfiles.filter((_, i) => selectedProfiles.includes(i));
    if (!targets.length) { toast.error("اختر مهندسًا واحدًا على الأقل"); return; }
    setNetworkLoading(true);
    setBatchResults([]);
    const results = [];
    for (const profile of targets) {
      try {
        const res = await base44.functions.invoke("linkedinService", {
          action: "outreachToEngineers",
          data: {
            engineerName: profile.name,
            engineerSpecialization: networkForm.specialization,
            engineerCity: networkForm.city,
            customNote: `${networkForm.customNote ? networkForm.customNote + ' | ' : ''}${profile.highlight} | خبرة ${profile.yearsExp} سنوات في ${profile.title}`
          }
        });
        results.push({ profile, success: true, draft: res.data.connectionRequestDraft });
      } catch {
        results.push({ profile, success: false, draft: null });
      }
    }
    setBatchResults(results);
    setNetworkLoading(false);
    toast.success(`تم إنشاء ${results.filter(r => r.success).length} رسالة تواصل ✓`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-6" dir="rtl">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-[#0A66C2] rounded-xl flex items-center justify-center">
            <Linkedin className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">LinkedIn Manager</h1>
            <p className="text-slate-500 text-sm">شارك أعمالك وتواصل مع العملاء والمهندسين عبر LinkedIn</p>
          </div>
          <Badge className="bg-green-100 text-green-700 mr-auto">متصل ✓</Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-full mb-6">
            <TabsTrigger value="share" className="flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              مشاركة أعمال
            </TabsTrigger>
            <TabsTrigger value="clients" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              استهداف عملاء
            </TabsTrigger>
            <TabsTrigger value="engineers" className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              استقطاب مهندسين
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: مشاركة أعمال تصميمية */}
          <TabsContent value="share">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-[#0A66C2]" />
                  مشاركة عمل تصميمي مكتمل
                </CardTitle>
                <p className="text-sm text-slate-500">انشر أعمالك التصميمية على ملفك الشخصي في LinkedIn تلقائيًا</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">عنوان المشروع *</label>
                    <Input
                      placeholder="مثال: فيلا عصرية - الرياض"
                      value={shareForm.title}
                      onChange={e => setShareForm({ ...shareForm, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">التصنيف</label>
                    <Select value={shareForm.designCategory} onValueChange={v => setShareForm({ ...shareForm, designCategory: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">اسم المهندس</label>
                    <Input
                      placeholder="اختياري"
                      value={shareForm.engineerName}
                      onChange={e => setShareForm({ ...shareForm, engineerName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">اسم الشركة</label>
                    <Input
                      value={shareForm.firmName}
                      onChange={e => setShareForm({ ...shareForm, firmName: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">وصف المشروع *</label>
                  <Textarea
                    placeholder="اذكر تفاصيل المشروع، الميزات، المساحة، الأسلوب التصميمي..."
                    value={shareForm.description}
                    onChange={e => setShareForm({ ...shareForm, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <Button
                  className="w-full bg-[#0A66C2] hover:bg-[#004182] text-white"
                  onClick={() => invoke("shareDesignWork", shareForm)}
                  disabled={loading || !shareForm.title || !shareForm.description}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Share2 className="w-4 h-4 ml-2" />}
                  نشر على LinkedIn الآن
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: استهداف عملاء */}
          <TabsContent value="clients">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#0A66C2]" />
                  البحث عن عملاء محتملين والتواصل معهم
                </CardTitle>
                <p className="text-sm text-slate-500">انشر منشورًا موجهًا للعملاء واحصل على مسودة رسالة تواصل جاهزة</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">القطاع المستهدف</label>
                    <Input
                      value={clientForm.industry}
                      onChange={e => setClientForm({ ...clientForm, industry: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">المدينة / المنطقة</label>
                    <Input
                      value={clientForm.location}
                      onChange={e => setClientForm({ ...clientForm, location: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">نوع المشروع المطلوب</label>
                  <Input
                    value={clientForm.projectType}
                    onChange={e => setClientForm({ ...clientForm, projectType: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">رسالة مخصصة (اختياري)</label>
                  <Textarea
                    placeholder="أضف أي تفاصيل إضافية تريد ذكرها..."
                    value={clientForm.customMessage}
                    onChange={e => setClientForm({ ...clientForm, customMessage: e.target.value })}
                    rows={2}
                  />
                </div>
                <Button
                  className="w-full bg-[#0A66C2] hover:bg-[#004182] text-white"
                  onClick={() => invoke("searchAndOutreachClients", clientForm)}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Users className="w-4 h-4 ml-2" />}
                  إنشاء منشور ورسالة تواصل
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: استقطاب مهندسين */}
          <TabsContent value="engineers">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-[#0A66C2]" />
                  إرسال طلبات تواصل للمهندسين المحترفين
                </CardTitle>
                <p className="text-sm text-slate-500">استقطب مهندسين محترفين للانضمام لمنصة Bytly</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">اسم المهندس</label>
                    <Input
                      placeholder="اختياري"
                      value={engineerForm.engineerName}
                      onChange={e => setEngineerForm({ ...engineerForm, engineerName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">المدينة</label>
                    <Input
                      value={engineerForm.engineerCity}
                      onChange={e => setEngineerForm({ ...engineerForm, engineerCity: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">التخصص</label>
                  <Select value={engineerForm.engineerSpecialization} onValueChange={v => setEngineerForm({ ...engineerForm, engineerSpecialization: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {specializations.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">ملاحظة مخصصة (اختياري)</label>
                  <Textarea
                    placeholder="أضف معلومات إضافية لتخصيص الرسالة..."
                    value={engineerForm.customNote}
                    onChange={e => setEngineerForm({ ...engineerForm, customNote: e.target.value })}
                    rows={2}
                  />
                </div>
                <Button
                  className="w-full bg-[#0A66C2] hover:bg-[#004182] text-white"
                  onClick={() => invoke("outreachToEngineers", engineerForm)}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <UserPlus className="w-4 h-4 ml-2" />}
                  إنشاء منشور ورسالة استقطاب
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Result Card */}
        {loading && (
          <Card className="mt-6 border-blue-200 bg-blue-50">
            <CardContent className="flex items-center gap-3 py-6">
              <Loader2 className="w-6 h-6 text-[#0A66C2] animate-spin" />
              <div>
                <p className="font-medium text-blue-800">جارٍ المعالجة...</p>
                <p className="text-sm text-blue-600">يتم توليد المحتوى والنشر على LinkedIn</p>
              </div>
            </CardContent>
          </Card>
        )}

        {result && result.success && (
          <Card className="mt-6 border-green-200 bg-green-50">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <CardTitle className="text-base text-green-800">{result.message}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">

              {/* المنشور المنشور */}
              {(result.caption || result.searchPost || result.recruitPost) && (
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">📢 المنشور على LinkedIn</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(result.caption || result.searchPost || result.recruitPost)}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">
                    {result.caption || result.searchPost || result.recruitPost}
                  </p>
                </div>
              )}

              {/* مسودة رسالة التواصل */}
              {(result.outreachMessageDraft || result.connectionRequestDraft || result.draft) && (
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-700">✉️ مسودة رسالة التواصل (InMail)</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(result.outreachMessageDraft || result.connectionRequestDraft || result.draft)}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">
                    {result.outreachMessageDraft || result.connectionRequestDraft || result.draft}
                  </p>
                  {result.tip && <p className="text-xs text-blue-500 mt-2 border-t pt-2">💡 {result.tip}</p>}
                </div>
              )}

              {result.postId && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <ExternalLink className="w-4 h-4" />
                  <span>تم النشر بنجاح • Post ID: <code className="bg-slate-100 px-1 rounded text-xs">{result.postId}</code></span>
                  <a href="https://www.linkedin.com/feed/" target="_blank" rel="noopener noreferrer" className="text-[#0A66C2] hover:underline mr-auto">
                    عرض على LinkedIn ←
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}