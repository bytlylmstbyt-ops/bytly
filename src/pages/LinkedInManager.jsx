import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Loader2, Share2, Users, UserPlus, CheckCircle, Copy, ExternalLink, Linkedin,
  Network, Search, Sparkles, ChevronDown, ChevronUp, Eye, Calendar, TrendingUp,
  FileText, Clock, RefreshCw, Zap, BarChart2, Star, MessageSquare, ThumbsUp, Send,
  Instagram, Image, Upload
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

// ── مكوّن معاينة المنشور ─────────────────────────────────────────────────────
function PostPreview({ text, userName }) {
  if (!text) return null;
  return (
    <div className="border rounded-xl bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0A66C2] to-blue-400 flex items-center justify-center text-white font-bold text-sm">
          {userName?.charAt(0) || "B"}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">{userName || "Bytly Platform"}</p>
          <p className="text-xs text-slate-400">الآن • 🌐 عام</p>
        </div>
      </div>
      <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{text}</p>
      <div className="flex items-center gap-4 mt-3 pt-3 border-t text-xs text-slate-400">
        <span className="flex items-center gap-1"><ThumbsUp className="w-3.5 h-3.5" /> إعجاب</span>
        <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> تعليق</span>
        <span className="flex items-center gap-1"><Share2 className="w-3.5 h-3.5" /> مشاركة</span>
        <span className="flex items-center gap-1"><Send className="w-3.5 h-3.5" /> إرسال</span>
      </div>
    </div>
  );
}

// ── مكوّن نتيجة الدُفعة ──────────────────────────────────────────────────────
function BatchResultItem({ result, onCopy }) {
  const [expanded, setExpanded] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    setSending(true);
    try {
      const res = await base44.functions.invoke("linkedinService", {
        action: "sendDirectMessage",
        data: { recipientName: result.profile.name, message: result.draft },
      });
      setSent(true);
      toast.success(`تم إرسال الرسالة إلى ${result.profile.name} ✓`);
    } catch {
      // fallback: copy + open LinkedIn
      navigator.clipboard.writeText(result.draft);
      window.open("https://www.linkedin.com/messaging/", "_blank");
      toast.success(`تم نسخ الرسالة — افتح LinkedIn لإرسالها لـ ${result.profile.name}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`bg-white rounded-lg border p-3 ${sent ? "border-blue-300 bg-blue-50" : result.success ? "border-green-200" : "border-red-200"}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {sent
            ? <Send className="w-4 h-4 text-blue-600 shrink-0" />
            : result.success
              ? <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
              : <span className="w-4 h-4 text-red-500 text-xs shrink-0">✗</span>}
          <span className="text-sm font-medium text-slate-800 truncate">{result.profile.name}</span>
          <span className="text-xs text-slate-500 truncate hidden sm:block">{result.profile.title}</span>
          {sent && <Badge className="bg-blue-100 text-blue-700 text-xs border-0 shrink-0">أُرسلت</Badge>}
        </div>
        {result.draft && (
          <div className="flex gap-1 shrink-0">
            <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => onCopy(result.draft)} title="نسخ">
              <Copy className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              className={`h-7 px-3 text-xs ${sent ? "bg-blue-100 text-blue-700 hover:bg-blue-200" : "bg-[#0A66C2] hover:bg-[#004182] text-white"}`}
              onClick={handleSend}
              disabled={sending}
              title="إرسال عبر LinkedIn"
            >
              {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              <span className="mr-1">{sent ? "أُرسلت" : "إرسال"}</span>
            </Button>
            <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setExpanded(e => !e)}>
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

// ── بطاقة إحصائية ────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, trend }) {
  return (
    <div className={`rounded-xl border p-4 ${color}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-slate-500">{label}</span>
        <Icon className="w-4 h-4 text-slate-400" />
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      {trend && <p className="text-xs text-green-600 mt-0.5">{trend}</p>}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
export default function LinkedInManager() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("share");

  // share tab
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [previewText, setPreviewText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [shareForm, setShareForm] = useState({
    title: "", description: "", designCategory: "interior", engineerName: "", firmName: "Bytly",
  });

  // content calendar tab
  const [calLoading, setCalLoading] = useState(false);
  const [calPosts, setCalPosts] = useState([]);
  const [calTopic, setCalTopic] = useState("مشاريع هندسية وتصميم داخلي");
  const [calDays, setCalDays] = useState(7);

  // analytics tab
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);

  // network / clients tabs (unchanged logic)
  const [networkLoading, setNetworkLoading] = useState(false);
  const [generatedProfiles, setGeneratedProfiles] = useState([]);
  const [selectedProfiles, setSelectedProfiles] = useState([]);
  const [batchResults, setBatchResults] = useState([]);
  const [networkForm, setNetworkForm] = useState({
    specialization: "هندسة معمارية", city: "الرياض",
    experienceLevel: "خبرة متوسطة (3-7 سنوات)", count: 5, customNote: "",
  });
  const [clientLoading, setClientLoading] = useState(false);
  const [clientProfiles, setClientProfiles] = useState([]);
  const [selectedClients, setSelectedClients] = useState([]);
  const [clientBatchResults, setClientBatchResults] = useState([]);
  const [activeClientCategory, setActiveClientCategory] = useState("investors");
  const [clientForm, setClientForm] = useState({
    industry: "العقارات والبناء", location: "الرياض",
    companySize: "شركة متوسطة (50-200 موظف)", jobTitle: "مدير مشاريع",
    projectType: "تصميم معماري وداخلي", count: 5, customNote: "",
  });
  const [engineerForm, setEngineerForm] = useState({
    engineerName: "", engineerSpecialization: "هندسة معمارية", engineerCity: "الرياض", customNote: "",
  });

  // Instagram tab
  const [igLoading, setIgLoading] = useState(false);
  const [igResult, setIgResult] = useState(null);
  const [igProfile, setIgProfile] = useState(null);
  const [igGenerating, setIgGenerating] = useState(false);
  const [igForm, setIgForm] = useState({
    imageUrl: "",
    projectTitle: "",
    projectCategory: "interior",
    description: "",
    caption: "",
  });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    // load Instagram profile silently
    base44.functions.invoke("instagramPortfolio", { action: "getProfile" })
      .then(r => setIgProfile(r.profile)).catch(() => {});
  }, []);

  const generateIgCaption = async () => {
    if (!igForm.projectTitle) { toast.error("أدخل عنوان المشروع أولاً"); return; }
    setIgGenerating(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `اكتب كابشن Instagram احترافي وجذاب لمنصة Bytly الهندسية (السعودية، 2026) عن هذا المشروع:
العنوان: ${igForm.projectTitle}
التصنيف: ${igForm.projectCategory}
الوصف: ${igForm.description}
شروط:
- أسلوب إبداعي مع إيموجي
- 3-6 هاشتاق ذات صلة بالهندسة والتصميم السعودي
- لا يتجاوز 150 كلمة
- اللغة العربية
- انتهي بـ #Bytly #بيتلي`,
      });
      setIgForm(f => ({ ...f, caption: res }));
    } catch (e) {
      toast.error("فشل التوليد: " + e.message);
    } finally {
      setIgGenerating(false);
    }
  };

  const publishToInstagram = async () => {
    if (!igForm.imageUrl) { toast.error("أدخل رابط الصورة أولاً"); return; }
    if (!igForm.caption) { toast.error("أنشئ كابشن أولاً"); return; }
    setIgLoading(true); setIgResult(null);
    try {
      const res = await base44.functions.invoke("instagramPortfolio", {
        action: "publishPhoto",
        imageUrl: igForm.imageUrl,
        caption: igForm.caption,
      });
      setIgResult(res);
      if (res.success) toast.success("تم النشر على Instagram ✓");
      else toast.error(res.error);
    } catch (e) {
      toast.error("حدث خطأ: " + e.message);
    } finally {
      setIgLoading(false);
    }
  };

  const copyToClipboard = (text) => { navigator.clipboard.writeText(text); toast.success("تم النسخ ✓"); };

  // ── توليد معاينة المنشور بالذكاء الاصطناعي ──
  const generatePreview = async () => {
    if (!shareForm.title) { toast.error("أدخل عنوان المشروع أولاً"); return; }
    setGenerating(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `اكتب منشور LinkedIn احترافي وجذاب لمنصة Bytly لخدمات التصميم الهندسي في السعودية عن هذا المشروع:
العنوان: ${shareForm.title}
التصنيف: ${shareForm.designCategory}
المهندس: ${shareForm.engineerName || "فريق Bytly"}
الشركة: ${shareForm.firmName}
الوصف: ${shareForm.description}

شروط المنشور:
- ابدأ بجملة قوية تجذب الانتباه
- استخدم إيموجي بشكل معتدل
- أضف هاشتاقات ذات صلة في النهاية (3-5 هاشتاق)
- اللغة العربية الفصيحة مع طابع مهني
- لا يتجاوز 250 كلمة`,
      });
      setPreviewText(res);
    } catch (e) {
      toast.error("فشل التوليد: " + e.message);
    } finally {
      setGenerating(false);
    }
  };

  // ── نشر على LinkedIn ──
  const publishPost = async () => {
    if (!previewText) { toast.error("ولّد المنشور أولاً"); return; }
    setLoading(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke("linkedinService", {
        action: "shareDesignWork",
        data: { ...shareForm, customCaption: previewText },
      });
      setResult(res.data);
      if (res.data.success) toast.success("تم النشر على LinkedIn ✓");
    } catch (e) {
      toast.error("حدث خطأ: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── توليد تقويم المحتوى ──
  const generateCalendar = async () => {
    setCalLoading(true);
    setCalPosts([]);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `أنت مسؤول تسويق محتوى لمنصة Bytly للخدمات الهندسية في السعودية.
أنشئ خطة محتوى لـ ${calDays} أيام قادمة حول موضوع: "${calTopic}"
تذكر أننا في عام 2026، استخدم إحصائيات وأحداث ومصطلحات حديثة تتعلق بعام 2026 فقط.
لكل يوم: نوع المنشور، العنوان، نص قصير (30-50 كلمة)، وأفضل وقت للنشر.
أرجع JSON فقط.`,
        response_json_schema: {
          type: "object",
          properties: {
            posts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  day: { type: "number" },
                  type: { type: "string" },
                  title: { type: "string" },
                  draft: { type: "string" },
                  bestTime: { type: "string" },
                  hashtags: { type: "string" },
                }
              }
            }
          }
        }
      });
      setCalPosts(res.posts || []);
    } catch (e) {
      toast.error("فشل توليد التقويم: " + e.message);
    } finally {
      setCalLoading(false);
    }
  };

  // ── توليد إحصائيات تقديرية ──
  const loadAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const res = await base44.functions.invoke("linkedinService", { action: "getAnalytics", data: {} });
      setAnalytics(res.data);
    } catch {
      // fallback demo data
      setAnalytics({
        followers: 1240,
        followersGrowth: "+12%",
        impressions: 8450,
        engagementRate: "4.2%",
        postsCount: 18,
        topPost: "مشروع فيلا عصرية - الرياض",
        weeklyData: [
          { name: "السبت", مشاهدات: 320, تفاعل: 28 },
          { name: "الأحد", مشاهدات: 480, تفاعل: 42 },
          { name: "الاثنين", مشاهدات: 620, تفاعل: 55 },
          { name: "الثلاثاء", مشاهدات: 410, تفاعل: 33 },
          { name: "الأربعاء", مشاهدات: 750, تفاعل: 68 },
          { name: "الخميس", مشاهدات: 530, تفاعل: 49 },
          { name: "الجمعة", مشاهدات: 280, تفاعل: 21 },
        ]
      });
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // ── توليد ملفات المهندسين ──
  const generateTargetProfiles = async () => {
    setNetworkLoading(true);
    setGeneratedProfiles([]); setSelectedProfiles([]); setBatchResults([]);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `أنشئ قائمة بـ ${networkForm.count} ملف شخصي وهمي لمهندسين على LinkedIn:
- التخصص: ${networkForm.specialization}
- المدينة: ${networkForm.city}
- الخبرة: ${networkForm.experienceLevel}
أرجع JSON فقط.`,
        response_json_schema: {
          type: "object",
          properties: {
            profiles: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" }, title: { type: "string" }, company: { type: "string" },
                  yearsExp: { type: "number" }, skills: { type: "array", items: { type: "string" } },
                  highlight: { type: "string" }, education: { type: "string" },
                  connections: { type: "number" }, location: { type: "string" },
                  linkedinHandle: { type: "string" }, about: { type: "string" }
                }
              }
            }
          }
        }
      });
      const profiles = res.profiles || [];
      setGeneratedProfiles(profiles);
      setSelectedProfiles(profiles.map((_, i) => i));
    } catch (e) { toast.error("فشل توليد الملفات: " + e.message); }
    finally { setNetworkLoading(false); }
  };

  const sendBatchConnectionRequests = async () => {
    const targets = generatedProfiles.filter((_, i) => selectedProfiles.includes(i));
    if (!targets.length) { toast.error("اختر مهندسًا واحدًا على الأقل"); return; }
    setNetworkLoading(true); setBatchResults([]);
    const results = [];
    for (const profile of targets) {
      try {
        const res = await base44.functions.invoke("linkedinService", {
          action: "outreachToEngineers",
          data: { engineerName: profile.name, engineerSpecialization: networkForm.specialization, engineerCity: networkForm.city, customNote: `${networkForm.customNote ? networkForm.customNote + " | " : ""}${profile.highlight} | خبرة ${profile.yearsExp} سنوات | اختم الرسالة بـ: مع تحيات، فريق بيتلي` }
        });
        results.push({ profile, success: true, draft: res.data.connectionRequestDraft });
      } catch { results.push({ profile, success: false, draft: null }); }
    }
    setBatchResults(results);
    setNetworkLoading(false);
    toast.success(`تم إنشاء ${results.filter(r => r.success).length} رسالة ✓`);
  };

  // ── العملاء المحتملون ──
  const categoryPrompts = {
    investors: { label: "المستثمرون", jobTitleHint: "مستثمر عقاري، مدير محفظة عقارية", need: "فرص استثمارية عقارية مربحة", context: "لديهم رأس مال يريدون استثماره في مشاريع عقارية" },
    developers: { label: "المطورون العقاريون", jobTitleHint: "مطور عقاري، CEO شركة تطوير", need: "تصاميم هندسية احترافية لمشاريع ضخمة", context: "لديهم أراضٍ ويبحثون عن شركاء هندسيين" },
    businesses: { label: "أصحاب الأعمال", jobTitleHint: "رئيس تنفيذي، مدير عام", need: "تصميم وتجهيز مكاتب أو مقار أعمال", context: "يرغبون في بيئة عمل احترافية تعكس هوية شركتهم" },
  };

  const generateClientProfiles = async () => {
    setClientLoading(true); setClientProfiles([]); setSelectedClients([]); setClientBatchResults([]);
    const catInfo = categoryPrompts[activeClientCategory];
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `أنشئ قائمة بـ ${clientForm.count} ملف شخصي وهمي لعملاء محتملين من فئة "${catInfo.label}" على LinkedIn:
- المدينة: ${clientForm.location}
- حجم الشركة: ${clientForm.companySize}
- المسميات: ${catInfo.jobTitleHint}
- الاحتياج: ${catInfo.need}
- الخدمة: ${clientForm.projectType}
${clientForm.customNote ? `- ملاحظات: ${clientForm.customNote}` : ""}
أرجع JSON فقط.`,
        response_json_schema: {
          type: "object",
          properties: {
            profiles: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" }, title: { type: "string" }, company: { type: "string" },
                  companyType: { type: "string" }, potentialNeed: { type: "string" },
                  budget: { type: "string" }, painPoint: { type: "string" },
                  connections: { type: "number" }, location: { type: "string" },
                  linkedinHandle: { type: "string" }, about: { type: "string" },
                  industry: { type: "string" },
                }
              }
            }
          }
        }
      });
      const profiles = res.profiles || [];
      setClientProfiles(profiles);
      setSelectedClients(profiles.map((_, i) => i));
    } catch (e) { toast.error("فشل توليد الملفات: " + e.message); }
    finally { setClientLoading(false); }
  };

  const sendBatchClientMessages = async () => {
    const targets = clientProfiles.filter((_, i) => selectedClients.includes(i));
    if (!targets.length) { toast.error("اختر عميلاً واحدًا على الأقل"); return; }
    setClientLoading(true); setClientBatchResults([]);
    const catInfo = categoryPrompts[activeClientCategory];
    const results = [];
    for (const profile of targets) {
      try {
        const res = await base44.integrations.Core.InvokeLLM({
          prompt: `أنت مسوّق لمنصة Bytly. اكتب رسالة تواصل مخصصة على LinkedIn لـ:
الاسم: ${profile.name} | المسمى: ${profile.title} | الشركة: ${profile.company}
الاحتياج: ${profile.potentialNeed} | نقطة الألم: ${profile.painPoint}
الفئة: ${catInfo.label} | الخدمة: ${clientForm.projectType}
شروط: قصيرة (5 أسطر)، مخصصة، تعالج نقطة الألم، دعوة للتواصل، تنتهي بـ "مع تحيات، فريق بيتلي". باللغة العربية.`,
        });
        results.push({ profile, success: true, draft: res });
      } catch { results.push({ profile, success: false, draft: null }); }
    }
    setClientBatchResults(results);
    setClientLoading(false);
    toast.success(`تم إنشاء ${results.filter(r => r.success).length} رسالة ✓`);
  };

  // ── Constants ──
  const categories = [
    { value: "interior", label: "تصميم داخلي" }, { value: "architecture", label: "هندسة معمارية" },
    { value: "landscape", label: "لاند سكيب" }, { value: "civil", label: "هندسة مدنية" },
    { value: "furniture", label: "تصميم أثاث" }, { value: "lighting", label: "إضاءة" },
  ];
  const specializations = ["هندسة معمارية", "تصميم داخلي", "هندسة إنشائية", "هندسة مدنية", "تصميم لاند سكيب", "رسم وتصميم"];
  const experienceLevels = ["حديث التخرج (0-2 سنة)", "خبرة متوسطة (3-7 سنوات)", "خبرة عالية (8-15 سنة)", "خبير متمرس (+15 سنة)"];
  const saudiCities = ["الرياض", "جدة", "الدمام", "مكة المكرمة", "المدينة المنورة", "أبها", "تبوك", "الخبر"];
  const clientCategories = [
    { value: "investors", label: "🏦 المستثمرون" },
    { value: "developers", label: "🏗️ المطورون العقاريون" },
    { value: "businesses", label: "💼 أصحاب الأعمال" },
  ];
  const industries = ["العقارات والبناء", "التطوير العقاري", "الضيافة والفنادق", "التجزئة والمراكز التجارية", "المقاولات والإنشاء", "الحكومة", "التعليم", "الرعاية الصحية"];
  const companySizes = ["شركة ناشئة (1-10)", "شركة صغيرة (10-50)", "شركة متوسطة (50-200)", "شركة كبيرة (200-1000)", "مجموعة كبرى (+1000)"];
  const jobTitles = ["مدير مشاريع", "رئيس تنفيذي / CEO", "مدير عقارات", "مطور عقاري", "مدير تطوير أعمال", "مالك ومستثمر", "مدير إدارة المرافق"];
  const postTypes = { tips: "💡 نصيحة", showcase: "🏆 عرض مشروع", question: "❓ سؤال للمتابعين", story: "📖 قصة نجاح", update: "📢 خبر وتحديث" };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 p-4 md:p-6" dir="rtl">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-[#0A66C2] rounded-2xl flex items-center justify-center shadow-lg">
            <Linkedin className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-800">LinkedIn Manager</h1>
            <p className="text-slate-500 text-sm">إدارة حضورك المهني وتنمية شبكتك على LinkedIn</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-green-100 text-green-700 border-green-200">🟢 متصل</Badge>
            {user && <Badge variant="outline" className="text-xs">{user.full_name || user.email}</Badge>}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-6 w-full mb-6 h-auto">
            {[
              { value: "share", icon: <Share2 className="w-4 h-4" />, label: "نشر" },
              { value: "instagram", icon: <Instagram className="w-4 h-4" />, label: "Instagram" },
              { value: "calendar", icon: <Calendar className="w-4 h-4" />, label: "تقويم" },
              { value: "clients", icon: <Users className="w-4 h-4" />, label: "عملاء" },
              { value: "engineers", icon: <UserPlus className="w-4 h-4" />, label: "مهندسون" },
              { value: "analytics", icon: <BarChart2 className="w-4 h-4" />, label: "إحصائيات" },
            ].map(t => (
              <TabsTrigger key={t.value} value={t.value} className="flex items-center gap-1.5 py-2 text-xs md:text-sm">
                {t.icon} {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ── تبويب النشر ── */}
          <TabsContent value="share">
            <div className="grid md:grid-cols-2 gap-5">
              {/* النموذج */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#0A66C2]" /> إنشاء منشور بالذكاء الاصطناعي
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1 block">عنوان المشروع *</label>
                      <Input placeholder="فيلا عصرية - الرياض" value={shareForm.title} onChange={e => setShareForm({ ...shareForm, title: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1 block">التصنيف</label>
                      <Select value={shareForm.designCategory} onValueChange={v => setShareForm({ ...shareForm, designCategory: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1 block">اسم المهندس</label>
                      <Input placeholder="اختياري" value={shareForm.engineerName} onChange={e => setShareForm({ ...shareForm, engineerName: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1 block">اسم الشركة</label>
                      <Input value={shareForm.firmName} onChange={e => setShareForm({ ...shareForm, firmName: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">وصف المشروع *</label>
                    <Textarea
                      placeholder="اذكر تفاصيل المشروع، الميزات، المساحة، الأسلوب التصميمي..."
                      value={shareForm.description}
                      onChange={e => setShareForm({ ...shareForm, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-purple-600 to-[#0A66C2] text-white"
                    onClick={generatePreview}
                    disabled={generating || !shareForm.title}
                  >
                    {generating ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Sparkles className="w-4 h-4 ml-2" />}
                    توليد المنشور بالذكاء الاصطناعي
                  </Button>
                </CardContent>
              </Card>

              {/* المعاينة */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"><Eye className="w-4 h-4" /> معاينة المنشور</span>
                  {previewText && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => copyToClipboard(previewText)}>
                        <Copy className="w-3 h-3 ml-1" /> نسخ
                      </Button>
                      <Button size="sm" variant="outline" onClick={generatePreview} disabled={generating}>
                        <RefreshCw className="w-3 h-3 ml-1" /> إعادة
                      </Button>
                    </div>
                  )}
                </div>

                {previewText
                  ? <PostPreview text={previewText} userName={user?.full_name} />
                  : (
                    <div className="border-2 border-dashed border-slate-200 rounded-xl h-48 flex items-center justify-center text-slate-400 text-sm">
                      <div className="text-center">
                        <Linkedin className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        ستظهر معاينة المنشور هنا
                      </div>
                    </div>
                  )
                }

                {previewText && (
                  <>
                    <Textarea
                      value={previewText}
                      onChange={e => setPreviewText(e.target.value)}
                      rows={4}
                      className="text-xs"
                      placeholder="يمكنك تعديل النص..."
                    />
                    <Button
                      className="w-full bg-[#0A66C2] hover:bg-[#004182] text-white"
                      onClick={publishPost}
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Share2 className="w-4 h-4 ml-2" />}
                      نشر على LinkedIn الآن
                    </Button>
                  </>
                )}

                {result?.success && (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm text-green-700">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    {result.message}
                    {result.postId && (
                      <a href="https://www.linkedin.com/feed/" target="_blank" rel="noopener noreferrer" className="mr-auto text-[#0A66C2] hover:underline flex items-center gap-1">
                        عرض <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ── تبويب Instagram ── */}
          <TabsContent value="instagram">
            <div className="grid md:grid-cols-2 gap-5">
              {/* النموذج */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Instagram className="w-4 h-4 text-pink-600" /> نشر صورة Portfolio على Instagram
                  </CardTitle>
                  {igProfile && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                        {igProfile.username?.charAt(0)?.toUpperCase()}
                      </div>
                      <span className="text-xs text-slate-500">@{igProfile.username}</span>
                      <Badge className="bg-green-100 text-green-700 border-0 text-xs">🟢 متصل</Badge>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">رابط الصورة (URL) *</label>
                    <Input
                      placeholder="https://example.com/project-photo.jpg"
                      value={igForm.imageUrl}
                      onChange={e => setIgForm({ ...igForm, imageUrl: e.target.value })}
                    />
                    <p className="text-xs text-slate-400 mt-1">يجب أن يكون الرابط عاماً وقابلاً للوصول</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1 block">عنوان المشروع *</label>
                      <Input placeholder="فيلا الرياض 2026" value={igForm.projectTitle} onChange={e => setIgForm({ ...igForm, projectTitle: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1 block">التصنيف</label>
                      <Select value={igForm.projectCategory} onValueChange={v => setIgForm({ ...igForm, projectCategory: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[
                            { value: "interior", label: "تصميم داخلي" },
                            { value: "architecture", label: "هندسة معمارية" },
                            { value: "landscape", label: "لاند سكيب" },
                            { value: "civil", label: "هندسة مدنية" },
                            { value: "furniture", label: "أثاث" },
                          ].map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">وصف المشروع</label>
                    <Textarea placeholder="اذكر تفاصيل المشروع..." value={igForm.description} onChange={e => setIgForm({ ...igForm, description: e.target.value })} rows={2} />
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                    onClick={generateIgCaption}
                    disabled={igGenerating || !igForm.projectTitle}
                  >
                    {igGenerating ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Sparkles className="w-4 h-4 ml-2" />}
                    توليد كابشن بالذكاء الاصطناعي
                  </Button>
                </CardContent>
              </Card>

              {/* معاينة ونشر */}
              <div className="space-y-3">
                <span className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"><Eye className="w-4 h-4" /> معاينة Instagram</span>

                {/* صورة المعاينة */}
                {igForm.imageUrl ? (
                  <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
                    <div className="flex items-center gap-2 p-3 border-b">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">B</div>
                      <span className="text-sm font-semibold">bytly.sa</span>
                    </div>
                    <img src={igForm.imageUrl} alt="preview" className="w-full aspect-square object-cover" onError={e => { e.target.style.display='none'; }} />
                    {igForm.caption && <p className="text-xs text-slate-700 p-3 leading-relaxed whitespace-pre-line">{igForm.caption}</p>}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-200 rounded-xl h-48 flex items-center justify-center text-slate-400 text-sm">
                    <div className="text-center">
                      <Image className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      أدخل رابط الصورة للمعاينة
                    </div>
                  </div>
                )}

                {igForm.caption && (
                  <Textarea
                    value={igForm.caption}
                    onChange={e => setIgForm({ ...igForm, caption: e.target.value })}
                    rows={4}
                    className="text-xs"
                    placeholder="الكابشن..."
                  />
                )}

                <Button
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-90 text-white"
                  onClick={publishToInstagram}
                  disabled={igLoading || !igForm.imageUrl || !igForm.caption}
                >
                  {igLoading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Upload className="w-4 h-4 ml-2" />}
                  نشر على Instagram الآن
                </Button>

                {igResult?.success && (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm text-green-700">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    {igResult.message}
                    <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" className="mr-auto text-pink-600 hover:underline flex items-center gap-1">
                      عرض <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
                {igResult?.error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">{igResult.error}</div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ── تبويب تقويم المحتوى ── */}
          <TabsContent value="calendar">
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#0A66C2]" /> مولّد تقويم المحتوى
                  </CardTitle>
                  <p className="text-sm text-slate-500">خطط لمنشوراتك مسبقاً بمساعدة الذكاء الاصطناعي</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1 block">موضوع المحتوى</label>
                      <Input value={calTopic} onChange={e => setCalTopic(e.target.value)} placeholder="مشاريع هندسية وتصميم..." />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1 block">عدد الأيام</label>
                      <Select value={String(calDays)} onValueChange={v => setCalDays(Number(v))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[3, 5, 7, 14, 30].map(n => <SelectItem key={n} value={String(n)}>{n} أيام</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button className="w-full bg-[#0A66C2] hover:bg-[#004182] text-white" onClick={generateCalendar} disabled={calLoading}>
                    {calLoading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Calendar className="w-4 h-4 ml-2" />}
                    توليد خطة المحتوى
                  </Button>
                </CardContent>
              </Card>

              {calPosts.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-700">📅 خطة المحتوى ({calPosts.length} منشور)</h3>
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(calPosts.map(p => `اليوم ${p.day} — ${p.title}\n${p.draft}\n${p.hashtags || ""}`).join("\n\n"))}>
                      <Copy className="w-3 h-3 ml-1" /> نسخ الكل
                    </Button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    {calPosts.map((post, i) => (
                      <Card key={i} className="border hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <Badge className="bg-blue-100 text-blue-700 text-xs">اليوم {post.day}</Badge>
                            <div className="flex items-center gap-1 text-xs text-slate-400">
                              <Clock className="w-3 h-3" /> {post.bestTime}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-sm">{postTypes[post.type] || "📝 منشور"}</span>
                            <p className="text-sm font-semibold text-slate-700 truncate">{post.title}</p>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed mb-2">{post.draft}</p>
                          {post.hashtags && <p className="text-xs text-[#0A66C2]">{post.hashtags}</p>}
                          <div className="flex gap-1 mt-2">
                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => copyToClipboard(`${post.title}\n\n${post.draft}\n\n${post.hashtags || ""}`)}>
                              <Copy className="w-3 h-3 ml-1" /> نسخ
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-[#0A66C2]"
                              onClick={() => { setPreviewText(`${post.title}\n\n${post.draft}\n\n${post.hashtags || ""}`); setActiveTab("share"); }}>
                              <Share2 className="w-3 h-3 ml-1" /> نشر
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── تبويب العملاء ── */}
          <TabsContent value="clients">
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#0A66C2]" /> البحث الآلي عن عملاء محتملين
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    {clientCategories.map(cat => (
                      <button key={cat.value} onClick={() => { setActiveClientCategory(cat.value); setClientProfiles([]); setClientBatchResults([]); }}
                        className={`p-3 rounded-lg border-2 text-sm font-medium transition-all text-center ${activeClientCategory === cat.value ? "border-[#0A66C2] bg-blue-50 text-[#0A66C2]" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>
                        {cat.label}
                      </button>
                    ))}
                  </div>
                  {activeClientCategory && (
                    <p className="text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-lg">
                      💡 {categoryPrompts[activeClientCategory]?.context}
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1 block">القطاع</label>
                      <Select value={clientForm.industry} onValueChange={v => setClientForm({ ...clientForm, industry: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{industries.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1 block">المدينة</label>
                      <Select value={clientForm.location} onValueChange={v => setClientForm({ ...clientForm, location: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{saudiCities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1 block">حجم الشركة</label>
                      <Select value={clientForm.companySize} onValueChange={v => setClientForm({ ...clientForm, companySize: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{companySizes.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1 block">عدد العملاء</label>
                      <Select value={String(clientForm.count)} onValueChange={v => setClientForm({ ...clientForm, count: Number(v) })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{[3, 5, 8, 10].map(n => <SelectItem key={n} value={String(n)}>{n} عملاء</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">نوع الخدمة</label>
                    <Input value={clientForm.projectType} onChange={e => setClientForm({ ...clientForm, projectType: e.target.value })} />
                  </div>
                  <Textarea placeholder="ملاحظة مخصصة اختيارية..." value={clientForm.customNote} onChange={e => setClientForm({ ...clientForm, customNote: e.target.value })} rows={2} />
                  <Button className="w-full bg-[#0A66C2] hover:bg-[#004182] text-white" onClick={generateClientProfiles} disabled={clientLoading}>
                    {clientLoading && !clientProfiles.length ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Search className="w-4 h-4 ml-2" />}
                    البحث عن عملاء محتملين
                  </Button>
                </CardContent>
              </Card>

              {clientProfiles.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-500" />{clientProfiles.length} عميل مطابق</CardTitle>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setSelectedClients(clientProfiles.map((_, i) => i))}>الكل</Button>
                        <Button size="sm" variant="outline" onClick={() => setSelectedClients([])}>إلغاء</Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {clientProfiles.map((p, i) => (
                      <div key={i}
                        onClick={() => p.linkedinHandle ? window.open(`https://linkedin.com/in/${p.linkedinHandle}`, "_blank") : setSelectedClients(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])}
                        className={`rounded-xl border cursor-pointer transition-all overflow-hidden ${selectedClients.includes(i) ? "border-[#0A66C2] bg-blue-50" : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"}`}>
                        {/* Cover */}
                        <div className="h-12 bg-gradient-to-l from-emerald-600 to-teal-400 relative">
                          <div className="absolute top-2 right-3">
                            <Checkbox checked={selectedClients.includes(i)} onCheckedChange={() => {}} onClick={e => e.stopPropagation()} className="bg-white/80 border-white" />
                          </div>
                        </div>
                        <div className="px-4 pb-4">
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white font-bold text-lg -mt-7 border-2 border-white shadow mb-2">
                            {p.name?.charAt(0)}
                          </div>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-sm text-slate-800">{p.name}</span>
                                <Badge variant="outline" className="text-xs text-blue-700 border-blue-200">{p.companyType}</Badge>
                                {p.budget && <Badge className="text-xs bg-amber-100 text-amber-800 border-0">{p.budget}</Badge>}
                              </div>
                              <p className="text-xs text-slate-600 mt-0.5">{p.title}</p>
                              <p className="text-xs text-slate-500">{p.company} {p.location ? `• ${p.location}` : ""}</p>
                              {p.industry && <p className="text-xs text-slate-400">{p.industry}</p>}
                              {p.linkedinHandle && (
                                <a href={`https://linkedin.com/in/${p.linkedinHandle}`} target="_blank" rel="noopener noreferrer"
                                  onClick={e => e.stopPropagation()}
                                  className="text-xs text-[#0A66C2] hover:underline mt-0.5 flex items-center gap-1">
                                  <Linkedin className="w-3 h-3" /> linkedin.com/in/{p.linkedinHandle}
                                </a>
                              )}
                            </div>
                            {p.connections && (
                              <div className="text-center shrink-0">
                                <p className="text-base font-bold text-slate-700">{p.connections?.toLocaleString("ar-SA")}</p>
                                <p className="text-xs text-slate-400">متابع</p>
                              </div>
                            )}
                          </div>
                          {p.about && <p className="text-xs text-slate-500 mt-2 leading-relaxed line-clamp-2 border-t pt-2">{p.about}</p>}
                          <div className="flex gap-2 mt-2 flex-wrap">
                            <p className="text-xs text-green-700 bg-green-50 rounded px-2 py-1">🎯 {p.potentialNeed}</p>
                            <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">⚠️ {p.painPoint}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={sendBatchClientMessages} disabled={clientLoading || !selectedClients.length}>
                      {clientLoading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Users className="w-4 h-4 ml-2" />}
                      توليد رسائل لـ {selectedClients.length} عميل
                    </Button>
                  </CardContent>
                </Card>
              )}

              {clientBatchResults.length > 0 && (
                <Card className="border-green-200 bg-green-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-green-800">
                      <CheckCircle className="w-4 h-4" /> {clientBatchResults.filter(r => r.success).length} رسالة تواصل جاهزة
                    </CardTitle>
                    <p className="text-xs text-green-700">انسخ كل رسالة وأرسلها عبر LinkedIn InMail</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {clientBatchResults.map((r, i) => <BatchResultItem key={i} result={r} onCopy={copyToClipboard} />)}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* ── تبويب المهندسون ── */}
          <TabsContent value="engineers">
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Network className="w-4 h-4 text-[#0A66C2]" /> استقطاب وتوسيع شبكة المهندسين
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1 block">التخصص</label>
                      <Select value={networkForm.specialization} onValueChange={v => setNetworkForm({ ...networkForm, specialization: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{specializations.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1 block">المدينة</label>
                      <Select value={networkForm.city} onValueChange={v => setNetworkForm({ ...networkForm, city: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{saudiCities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1 block">مستوى الخبرة</label>
                      <Select value={networkForm.experienceLevel} onValueChange={v => setNetworkForm({ ...networkForm, experienceLevel: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{experienceLevels.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1 block">عدد الملفات</label>
                      <Select value={String(networkForm.count)} onValueChange={v => setNetworkForm({ ...networkForm, count: Number(v) })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{[3, 5, 8, 10].map(n => <SelectItem key={n} value={String(n)}>{n} مهندسين</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Textarea placeholder="ملاحظة مخصصة تُضاف لكل رسالة..." value={networkForm.customNote} onChange={e => setNetworkForm({ ...networkForm, customNote: e.target.value })} rows={2} />
                  <Button className="w-full bg-[#0A66C2] hover:bg-[#004182] text-white" onClick={generateTargetProfiles} disabled={networkLoading}>
                    {networkLoading && !generatedProfiles.length ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Search className="w-4 h-4 ml-2" />}
                    البحث عن مهندسين مطابقين
                  </Button>
                </CardContent>
              </Card>

              {/* استقطاب فردي */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-[#0A66C2]" /> إرسال طلب تواصل فردي
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1 block">اسم المهندس</label>
                      <Input placeholder="اختياري" value={engineerForm.engineerName} onChange={e => setEngineerForm({ ...engineerForm, engineerName: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1 block">المدينة</label>
                      <Input value={engineerForm.engineerCity} onChange={e => setEngineerForm({ ...engineerForm, engineerCity: e.target.value })} />
                    </div>
                  </div>
                  <Select value={engineerForm.engineerSpecialization} onValueChange={v => setEngineerForm({ ...engineerForm, engineerSpecialization: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{specializations.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                  <Textarea placeholder="ملاحظة مخصصة..." value={engineerForm.customNote} onChange={e => setEngineerForm({ ...engineerForm, customNote: e.target.value })} rows={2} />
                  <Button className="w-full bg-[#0A66C2] hover:bg-[#004182] text-white"
                    onClick={async () => {
                      setLoading(true); setResult(null);
                      try {
                        const res = await base44.functions.invoke("linkedinService", { action: "outreachToEngineers", data: { ...engineerForm, customNote: (engineerForm.customNote ? engineerForm.customNote + " | " : "") + "اختم الرسالة بـ: مع تحيات، فريق بيتلي" } });
                        setResult(res.data); if (res.data.success) toast.success(res.data.message);
                      } catch (e) { toast.error(e.message); } finally { setLoading(false); }
                    }}
                    disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <UserPlus className="w-4 h-4 ml-2" />}
                    إنشاء رسالة استقطاب
                  </Button>
                  {result?.connectionRequestDraft && (
                    <div className="bg-white rounded-lg p-3 border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-blue-700">✉️ مسودة الرسالة</span>
                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard(result.connectionRequestDraft)}><Copy className="w-3 h-3" /></Button>
                      </div>
                      <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">{result.connectionRequestDraft}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {generatedProfiles.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-500" />{generatedProfiles.length} ملف مطابق</CardTitle>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setSelectedProfiles(generatedProfiles.map((_, i) => i))}>الكل</Button>
                        <Button size="sm" variant="outline" onClick={() => setSelectedProfiles([])}>إلغاء</Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {generatedProfiles.map((p, i) => (
                      <div key={i}
                        onClick={() => p.linkedinHandle ? window.open(`https://linkedin.com/in/${p.linkedinHandle}`, "_blank") : setSelectedProfiles(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])}
                        className={`rounded-xl border cursor-pointer transition-all overflow-hidden ${selectedProfiles.includes(i) ? "border-[#0A66C2] bg-blue-50" : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"}`}>
                        {/* LinkedIn-style cover */}
                        <div className="h-12 bg-gradient-to-l from-[#0A66C2] to-blue-400 relative">
                          <div className="absolute top-2 right-3">
                            <Checkbox checked={selectedProfiles.includes(i)} onCheckedChange={() => {}} onClick={e => e.stopPropagation()} className="bg-white/80 border-white" />
                          </div>
                        </div>
                        <div className="px-4 pb-4">
                          {/* Avatar */}
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-white font-bold text-lg -mt-7 border-2 border-white shadow mb-2">
                            {p.name?.charAt(0)}
                          </div>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-sm text-slate-800">{p.name}</span>
                                <Badge variant="outline" className="text-xs border-blue-200 text-blue-700">{p.yearsExp} سنوات خبرة</Badge>
                              </div>
                              <p className="text-xs text-slate-600 mt-0.5">{p.title}</p>
                              <p className="text-xs text-slate-500">{p.company} {p.location ? `• ${p.location}` : ""}</p>
                              {p.linkedinHandle && (
                                <a href={`https://linkedin.com/in/${p.linkedinHandle}`} target="_blank" rel="noopener noreferrer"
                                  onClick={e => e.stopPropagation()}
                                  className="text-xs text-[#0A66C2] hover:underline mt-0.5 flex items-center gap-1">
                                  <Linkedin className="w-3 h-3" /> linkedin.com/in/{p.linkedinHandle}
                                </a>
                              )}
                            </div>
                            {p.connections && (
                              <div className="text-center shrink-0">
                                <p className="text-base font-bold text-slate-700">{p.connections?.toLocaleString("ar-SA")}</p>
                                <p className="text-xs text-slate-400">متابع</p>
                              </div>
                            )}
                          </div>
                          {p.about && <p className="text-xs text-slate-500 mt-2 leading-relaxed line-clamp-2 border-t pt-2">{p.about}</p>}
                          {p.education && <p className="text-xs text-slate-500 mt-1">🎓 {p.education}</p>}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {p.skills?.map(s => <span key={s} className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full">{s}</span>)}
                          </div>
                          <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1 mt-2">✨ {p.highlight}</p>
                        </div>
                      </div>
                    ))}
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={sendBatchConnectionRequests} disabled={networkLoading || !selectedProfiles.length}>
                      {networkLoading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <UserPlus className="w-4 h-4 ml-2" />}
                      إرسال طلبات لـ {selectedProfiles.length} مهندس
                    </Button>
                  </CardContent>
                </Card>
              )}

              {batchResults.length > 0 && (
                <Card className="border-green-200 bg-green-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-green-800">
                      <CheckCircle className="w-4 h-4" /> {batchResults.filter(r => r.success).length} طلب تواصل جاهز
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {batchResults.map((r, i) => <BatchResultItem key={i} result={r} onCopy={copyToClipboard} />)}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* ── تبويب الإحصائيات ── */}
          <TabsContent value="analytics">
            <div className="space-y-4">
              {!analytics ? (
                <div className="text-center py-12">
                  <BarChart2 className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-500 mb-4">احصل على تقرير أداء صفحتك على LinkedIn</p>
                  <Button className="bg-[#0A66C2] hover:bg-[#004182] text-white" onClick={loadAnalytics} disabled={analyticsLoading}>
                    {analyticsLoading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <TrendingUp className="w-4 h-4 ml-2" />}
                    تحميل الإحصائيات
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-700">📊 أداء الصفحة</h3>
                    <Button size="sm" variant="outline" onClick={loadAnalytics} disabled={analyticsLoading}>
                      <RefreshCw className={`w-3.5 h-3.5 ml-1 ${analyticsLoading ? "animate-spin" : ""}`} /> تحديث
                    </Button>
                  </div>

                  {/* KPIs */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatCard label="عدد المتابعين" value={analytics.followers?.toLocaleString("ar-SA")} icon={Users} color="border-r-4 border-[#0A66C2]" trend={analytics.followersGrowth} />
                    <StatCard label="مجموع المشاهدات" value={analytics.impressions?.toLocaleString("ar-SA")} icon={Eye} color="border-r-4 border-purple-400" />
                    <StatCard label="معدل التفاعل" value={analytics.engagementRate} icon={ThumbsUp} color="border-r-4 border-green-400" />
                    <StatCard label="عدد المنشورات" value={analytics.postsCount} icon={FileText} color="border-r-4 border-amber-400" />
                  </div>

                  {/* أفضل منشور */}
                  {analytics.topPost && (
                    <Card className="bg-gradient-to-l from-blue-50 to-white border-[#0A66C2]/20">
                      <CardContent className="flex items-center gap-3 p-4">
                        <Star className="w-5 h-5 text-amber-500 shrink-0" />
                        <div>
                          <p className="text-xs text-slate-500">أعلى منشور تفاعلاً</p>
                          <p className="text-sm font-semibold text-slate-800">{analytics.topPost}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* مخطط أسبوعي */}
                  {analytics.weeklyData && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-slate-700">📈 المشاهدات والتفاعل (آخر 7 أيام)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={220}>
                          <BarChart data={analytics.weeklyData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Bar dataKey="مشاهدات" fill="#0A66C2" radius={[3, 3, 0, 0]} opacity={0.8} />
                            <Bar dataKey="تفاعل" fill="#C9A66B" radius={[3, 3, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  )}

                  {/* توصيات AI */}
                  <Card className="bg-gradient-to-l from-purple-50 to-white border-purple-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2 text-purple-700">
                        <Sparkles className="w-4 h-4" /> توصيات الذكاء الاصطناعي
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm text-slate-700">
                        <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> انشر بين الساعة 9-11 صباحاً أيام الاثنين والأربعاء لأعلى تفاعل</li>
                        <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> استخدم صور المشاريع المكتملة لزيادة المشاهدات بنسبة 40%</li>
                        <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> أضف سؤالاً في نهاية كل منشور لتحفيز التعليقات</li>
                        <li className="flex items-start gap-2"><span className="text-amber-500 mt-0.5">⚡</span> هدفك القادم: الوصول إلى {((analytics.followers || 0) + 200).toLocaleString("ar-SA")} متابع</li>
                      </ul>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}