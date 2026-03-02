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

function BatchResultItem({ result, onCopy }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={`bg-white rounded-lg border p-3 ${result.success ? 'border-green-200' : 'border-red-200'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {result.success
            ? <CheckCircle className="w-4 h-4 text-green-600" />
            : <span className="w-4 h-4 text-red-500 text-xs">✗</span>
          }
          <span className="text-sm font-medium text-slate-800">{result.profile.name}</span>
          <span className="text-xs text-slate-500">{result.profile.title}</span>
        </div>
        {result.draft && (
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={() => onCopy(result.draft)}><Copy className="w-3 h-3" /></Button>
            <Button size="sm" variant="ghost" onClick={() => setExpanded(e => !e)}>
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </Button>
          </div>
        )}
      </div>
      {expanded && result.draft && (
        <p className="text-xs text-slate-600 mt-2 whitespace-pre-line bg-slate-50 p-2 rounded border leading-relaxed">
          {result.draft}
        </p>
      )}
    </div>
  );
}

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
  const [engineerForm, setEngineerForm] = useState({ engineerName: "", engineerSpecialization: "هندسة معمارية", engineerCity: "الرياض", customNote: "" });

  // Client targeting state
  const [clientLoading, setClientLoading] = useState(false);
  const [clientProfiles, setClientProfiles] = useState([]);
  const [selectedClients, setSelectedClients] = useState([]);
  const [clientBatchResults, setClientBatchResults] = useState([]);
  const [activeClientCategory, setActiveClientCategory] = useState("investors");
  const [clientForm, setClientForm] = useState({
    industry: "العقارات والبناء",
    location: "الرياض",
    companySize: "شركة متوسطة (50-200 موظف)",
    jobTitle: "مدير مشاريع",
    projectType: "تصميم معماري وداخلي",
    count: 5,
    customNote: "",
  });

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

  const clientCategories = [
    { value: "investors", label: "🏦 المستثمرون", color: "bg-purple-100 text-purple-800" },
    { value: "developers", label: "🏗️ المطورون العقاريون", color: "bg-blue-100 text-blue-800" },
    { value: "businesses", label: "💼 أصحاب الأعمال والشركات", color: "bg-amber-100 text-amber-800" },
  ];

  const industries = [
    "العقارات والبناء",
    "التطوير العقاري",
    "الضيافة والفنادق",
    "التجزئة والمراكز التجارية",
    "المكاتب والشركات",
    "المقاولات والإنشاء",
    "الحكومة والمشاريع الحكومية",
    "التعليم والمدارس",
    "الرعاية الصحية والمستشفيات",
  ];

  const companySizes = [
    "شركة ناشئة (1-10 موظفين)",
    "شركة صغيرة (10-50 موظف)",
    "شركة متوسطة (50-200 موظف)",
    "شركة كبيرة (200-1000 موظف)",
    "مجموعة كبرى (+1000 موظف)",
  ];

  const jobTitles = [
    "مدير مشاريع",
    "رئيس تنفيذي / CEO",
    "مدير عقارات",
    "مطور عقاري",
    "مدير تطوير أعمال",
    "مالك ومستثمر",
    "مدير إدارة المرافق",
    "مدير البناء والتشييد",
  ];

  const categoryPrompts = {
    investors: {
      label: "المستثمرون",
      jobTitleHint: "مستثمر عقاري، رئيس صندوق استثماري، شريك في صندوق رأس مال مخاطر، مدير محفظة عقارية",
      need: "يبحثون عن فرص استثمارية عقارية مربحة ومشاريع قابلة للتطوير والتأجير",
      context: "لديهم رأس مال يريدون استثماره في مشاريع عقارية أو توسيع محفظتهم العقارية",
    },
    developers: {
      label: "المطورون العقاريون",
      jobTitleHint: "مطور عقاري، رئيس مشاريع التطوير، مدير تطوير عقاري، CEO شركة تطوير",
      need: "يحتاجون تصاميم معمارية وهندسية احترافية لمشاريع سكنية وتجارية ضخمة",
      context: "لديهم أراضٍ أو مشاريع قيد التطوير ويبحثون عن شركاء هندسيين موثوقين",
    },
    businesses: {
      label: "أصحاب الأعمال والشركات",
      jobTitleHint: "رئيس تنفيذي، مدير عام، صاحب شركة، مؤسس شركة",
      need: "يبحثون عن تصميم وتجهيز مكاتبهم أو مقار أعمالهم أو فروعهم الجديدة",
      context: "يرغبون في تجهيز بيئة عمل احترافية تعكس هوية شركتهم وتعزز إنتاجية موظفيهم",
    },
  };

  const generateClientProfiles = async () => {
    setClientLoading(true);
    setClientProfiles([]);
    setSelectedClients([]);
    setClientBatchResults([]);
    const catInfo = categoryPrompts[activeClientCategory];
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `أنشئ قائمة بـ ${clientForm.count} ملف شخصي وهمي لعملاء محتملين من فئة "${catInfo.label}" على LinkedIn وفق هذه المعايير:
- المدينة: ${clientForm.location}
- حجم الشركة / الكيان: ${clientForm.companySize}
- المسميات الوظيفية الممكنة: ${catInfo.jobTitleHint}
- احتياجهم: ${catInfo.need}
- السياق: ${catInfo.context}
- نوع الخدمة: ${clientForm.projectType}
${clientForm.customNote ? `- ملاحظات إضافية: ${clientForm.customNote}` : ""}

أنشئ ملفات واقعية جداً مع احتياجات محددة ونقاط ألم واضحة لكل شخص.
أرجع JSON فقط:`,
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
                  companyType: { type: "string" },
                  potentialNeed: { type: "string" },
                  budget: { type: "string" },
                  painPoint: { type: "string" },
                }
              }
            }
          }
        }
      });
      const profiles = res.profiles || [];
      setClientProfiles(profiles);
      setSelectedClients(profiles.map((_, i) => i));
    } catch (e) {
      toast.error("فشل توليد الملفات: " + e.message);
    } finally {
      setClientLoading(false);
    }
  };

  const toggleClient = (idx) => {
    setSelectedClients(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const sendBatchClientMessages = async () => {
    const targets = clientProfiles.filter((_, i) => selectedClients.includes(i));
    if (!targets.length) { toast.error("اختر عميلاً واحدًا على الأقل"); return; }
    setClientLoading(true);
    setClientBatchResults([]);
    const results = [];
    for (const profile of targets) {
      try {
        const res = await base44.integrations.Core.InvokeLLM({
          prompt: `أنت مسوّق لمنصة Bytly لخدمات التصميم الهندسي والبناء في السعودية.

اكتب رسالة تواصل مخصصة على LinkedIn لهذا العميل المحتمل:
- الاسم: ${profile.name}
- المسمى الوظيفي: ${profile.title}
- الشركة: ${profile.company} (${profile.companyType})
- الاحتياج المتوقع: ${profile.potentialNeed}
- نقطة الألم: ${profile.painPoint}
- نوع الخدمة: ${clientForm.projectType}
${clientForm.customNote ? `- ملاحظات إضافية: ${clientForm.customNote}` : ""}

شروط الرسالة:
- قصيرة ومباشرة (لا تتجاوز 5 أسطر)
- شخصية وتشير إلى احتياجهم تحديدًا
- تذكر ميزة Bytly (منصة متكاملة، مهندسون معتمدون، ضمان الجودة)
- تنتهي بدعوة واضحة للتواصل أو الاستفسار
- باللغة العربية الفصيحة`,
        });
        results.push({ profile, success: true, draft: res });
      } catch {
        results.push({ profile, success: false, draft: null });
      }
    }
    setClientBatchResults(results);
    setClientLoading(false);
    toast.success(`تم إنشاء ${results.filter(r => r.success).length} رسالة تواصل ✓`);
  };

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
          <TabsList className="grid grid-cols-4 w-full mb-6">
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
            <TabsTrigger value="network" className="flex items-center gap-2">
              <Network className="w-4 h-4" />
              توسيع الشبكة
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
            <div className="space-y-4">
              {/* Search Criteria */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#0A66C2]" />
                    البحث الآلي عن عملاء محتملين
                  </CardTitle>
                  <p className="text-sm text-slate-500">حدد معايير العميل المثالي وسيقوم الذكاء الاصطناعي بتوليد قائمة مستهدفة مع رسائل تواصل مخصصة</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">القطاع / الصناعة</label>
                      <Select value={clientForm.industry} onValueChange={v => setClientForm({ ...clientForm, industry: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {industries.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">المدينة</label>
                      <Select value={clientForm.location} onValueChange={v => setClientForm({ ...clientForm, location: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {saudiCities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">حجم الشركة</label>
                      <Select value={clientForm.companySize} onValueChange={v => setClientForm({ ...clientForm, companySize: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {companySizes.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">المسمى الوظيفي المستهدف</label>
                      <Select value={clientForm.jobTitle} onValueChange={v => setClientForm({ ...clientForm, jobTitle: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {jobTitles.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">نوع الخدمة المقدمة</label>
                      <Input
                        value={clientForm.projectType}
                        onChange={e => setClientForm({ ...clientForm, projectType: e.target.value })}
                        placeholder="تصميم معماري وداخلي..."
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">عدد العملاء المستهدفين</label>
                      <Select value={String(clientForm.count)} onValueChange={v => setClientForm({ ...clientForm, count: Number(v) })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[3, 5, 8, 10].map(n => <SelectItem key={n} value={String(n)}>{n} عملاء</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">ملاحظة مخصصة للرسائل (اختياري)</label>
                    <Textarea
                      placeholder="مثال: نركز على المشاريع الفاخرة بميزانية +500,000 ريال..."
                      value={clientForm.customNote}
                      onChange={e => setClientForm({ ...clientForm, customNote: e.target.value })}
                      rows={2}
                    />
                  </div>
                  <Button
                    className="w-full bg-[#0A66C2] hover:bg-[#004182] text-white"
                    onClick={generateClientProfiles}
                    disabled={clientLoading}
                  >
                    {clientLoading && !clientProfiles.length
                      ? <Loader2 className="w-4 h-4 animate-spin ml-2" />
                      : <Search className="w-4 h-4 ml-2" />}
                    البحث عن عملاء محتملين
                  </Button>
                </CardContent>
              </Card>

              {/* Client Profiles List */}
              {clientProfiles.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        {clientProfiles.length} عميل محتمل مطابق للمعايير
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setSelectedClients(clientProfiles.map((_, i) => i))}>تحديد الكل</Button>
                        <Button size="sm" variant="outline" onClick={() => setSelectedClients([])}>إلغاء الكل</Button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">اختر العملاء الذين تريد إرسال رسائل تواصل مخصصة لهم</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {clientProfiles.map((p, i) => (
                      <div
                        key={i}
                        onClick={() => toggleClient(i)}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedClients.includes(i)
                            ? "border-[#0A66C2] bg-blue-50"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <Checkbox
                          checked={selectedClients.includes(i)}
                          onCheckedChange={() => toggleClient(i)}
                          onClick={e => e.stopPropagation()}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-slate-800 text-sm">{p.name}</span>
                            <Badge variant="outline" className="text-xs text-blue-700 border-blue-200">{p.companyType}</Badge>
                            {p.budget && <Badge className="text-xs bg-amber-100 text-amber-800 border-0">{p.budget}</Badge>}
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5">{p.title} • {p.company}</p>
                          <p className="text-xs text-green-700 mt-1">🎯 {p.potentialNeed}</p>
                          <p className="text-xs text-red-600 mt-0.5">⚠️ {p.painPoint}</p>
                        </div>
                      </div>
                    ))}
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      onClick={sendBatchClientMessages}
                      disabled={clientLoading || !selectedClients.length}
                    >
                      {clientLoading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Users className="w-4 h-4 ml-2" />}
                      توليد رسائل مخصصة لـ {selectedClients.length} عميل
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Batch Client Results */}
              {clientBatchResults.length > 0 && (
                <Card className="border-green-200 bg-green-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2 text-green-800">
                      <CheckCircle className="w-5 h-5" />
                      رسائل التواصل المولّدة ({clientBatchResults.filter(r => r.success).length} ناجحة)
                    </CardTitle>
                    <p className="text-xs text-green-700">انسخ كل رسالة وأرسلها مباشرة عبر LinkedIn InMail</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {clientBatchResults.map((r, i) => (
                      <BatchResultItem key={i} result={r} onCopy={copyToClipboard} />
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
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
          {/* Tab 4: توسيع الشبكة المهنية */}
          <TabsContent value="network">
            <div className="space-y-4">
              {/* Criteria Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Network className="w-5 h-5 text-[#0A66C2]" />
                    توسيع شبكة المهندسين المحترفين
                  </CardTitle>
                  <p className="text-sm text-slate-500">حدد معايير المهندسين المستهدفين وأرسل طلبات تواصل مخصصة دفعةً واحدة</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Criteria */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">التخصص المستهدف</label>
                      <Select value={networkForm.specialization} onValueChange={v => setNetworkForm({ ...networkForm, specialization: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {specializations.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">المدينة</label>
                      <Select value={networkForm.city} onValueChange={v => setNetworkForm({ ...networkForm, city: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {saudiCities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">مستوى الخبرة</label>
                      <Select value={networkForm.experienceLevel} onValueChange={v => setNetworkForm({ ...networkForm, experienceLevel: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {experienceLevels.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">عدد الملفات المستهدفة</label>
                      <Select value={String(networkForm.count)} onValueChange={v => setNetworkForm({ ...networkForm, count: Number(v) })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[3, 5, 8, 10].map(n => <SelectItem key={n} value={String(n)}>{n} مهندسين</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">ملاحظة مخصصة تُضاف لكل رسالة (اختياري)</label>
                    <Textarea
                      placeholder="مثال: نحن نبحث عن مهندسين لمشاريع فلل فاخرة في الرياض..."
                      value={networkForm.customNote}
                      onChange={e => setNetworkForm({ ...networkForm, customNote: e.target.value })}
                      rows={2}
                    />
                  </div>
                  <Button
                    className="w-full bg-[#0A66C2] hover:bg-[#004182] text-white"
                    onClick={generateTargetProfiles}
                    disabled={networkLoading}
                  >
                    {networkLoading && !generatedProfiles.length ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Search className="w-4 h-4 ml-2" />}
                    البحث عن مهندسين مطابقين
                  </Button>
                </CardContent>
              </Card>

              {/* Generated Profiles */}
              {generatedProfiles.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        {generatedProfiles.length} ملف مطابق للمعايير
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setSelectedProfiles(generatedProfiles.map((_, i) => i))}>
                          تحديد الكل
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setSelectedProfiles([])}>
                          إلغاء الكل
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">اختر المهندسين الذين تريد إرسال طلب تواصل لهم</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {generatedProfiles.map((p, i) => (
                      <div
                        key={i}
                        onClick={() => toggleProfile(i)}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedProfiles.includes(i)
                            ? "border-[#0A66C2] bg-blue-50"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <Checkbox
                          checked={selectedProfiles.includes(i)}
                          onCheckedChange={() => toggleProfile(i)}
                          onClick={e => e.stopPropagation()}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-slate-800 text-sm">{p.name}</span>
                            <Badge variant="outline" className="text-xs">{p.yearsExp} سنوات خبرة</Badge>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5">{p.title} • {p.company}</p>
                          <p className="text-xs text-blue-600 mt-1">✨ {p.highlight}</p>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {p.skills?.map(s => (
                              <span key={s} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{s}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}

                    <Button
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      onClick={sendBatchConnectionRequests}
                      disabled={networkLoading || !selectedProfiles.length}
                    >
                      {networkLoading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <UserPlus className="w-4 h-4 ml-2" />}
                      إرسال طلبات تواصل لـ {selectedProfiles.length} مهندس
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Batch Results */}
              {batchResults.length > 0 && (
                <Card className="border-green-200 bg-green-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2 text-green-800">
                      <CheckCircle className="w-5 h-5" />
                      نتائج إرسال طلبات التواصل
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {batchResults.map((r, i) => (
                      <BatchResultItem key={i} result={r} onCopy={copyToClipboard} />
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
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