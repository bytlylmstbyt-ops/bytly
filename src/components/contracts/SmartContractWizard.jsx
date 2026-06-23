import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import {
  Sparkles, Search, MapPin, DollarSign, Calendar, ArrowRight,
  CheckCircle2, User, Star, Loader2, FileText, Zap, Brain, ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function SmartContractWizard({ projects, onContractCreated, onClose }) {
  const [step, setStep] = useState(1); // 1=describe, 2=results, 3=confirm
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [timeline, setTimeline] = useState("");
  const [location, setLocation] = useState("");
  const [results, setResults] = useState(null);
  const [selectedEngineer, setSelectedEngineer] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [useNewProject, setUseNewProject] = useState(true);

  const handleAnalyze = async () => {
    if (!description.trim()) return;
    setLoading(true);
    try {
      const res = await base44.functions.invoke('smartAdvisorRecommendation', {
        client_description: description,
        budget: budget || undefined,
        timeline: timeline || undefined,
        location: location || undefined,
      });
      setResults(res.data);
      setStep(2);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleSelectEngineer = (eng) => {
    setSelectedEngineer(eng);
    setStep(3);
  };

  const handleCreateContract = async () => {
    if (!selectedEngineer) return;
    setCreating(true);
    try {
      let projectId = selectedProjectId;
      let clientId = "";
      let projectTitle = "";

      if (useNewProject) {
        // Create a new project from the smart match
        const project = await base44.entities.Project.create({
          title: `مشروع من المسار الذكي — ${selectedEngineer.full_name}`,
          description: description,
          category: results?.analysis?.project_category || "architecture",
          budget_min: results?.analysis?.estimated_budget_range?.min || 0,
          budget_max: results?.analysis?.estimated_budget_range?.max || Number(budget) || 0,
          location: location || "",
          deadline: timeline ? new Date(Date.now() + timeline * 86400000).toISOString().split('T')[0] : undefined,
          assigned_engineer_id: selectedEngineer.id,
          status: "in_progress",
        });
        projectId = project.id;
        projectTitle = project.title;
        clientId = project.client_id || "";
      } else {
        const p = projects.find(p => p.id === selectedProjectId);
        if (p) {
          projectTitle = p.title;
          clientId = p.client_id || "";
          // Assign the engineer to the existing project
          await base44.entities.Project.update(p.id, {
            assigned_engineer_id: selectedEngineer.id,
            status: p.status === "open" ? "in_progress" : p.status,
          });
        }
      }

      // Create the contract
      const contractNumber = `CNT-SMART-${Date.now()}`;
      const contract = await base44.entities.Contract.create({
        project_id: projectId,
        client_id: clientId,
        engineer_id: selectedEngineer.id,
        contract_type: "project_start",
        contract_number: contractNumber,
        service_description: `${description}\n\nالمسار الذكي: ${results?.recommendation_text?.substring(0, 200) || ''}`,
        total_amount: Number(budget) || results?.analysis?.estimated_budget_range?.max || 0,
        payment_terms: "50% مقدماً، 50% عند التسليم",
        start_date: new Date().toISOString().split('T')[0],
        delivery_date: timeline ? new Date(Date.now() + timeline * 86400000).toISOString().split('T')[0] : undefined,
        additional_terms: `تم إنشاء هذا العقد عبر المسار الذكي — المهندس: ${selectedEngineer.full_name} (${selectedEngineer.match_percentage}% مطابقة)`,
        status: "draft",
      });

      onContractCreated(contract);
    } catch (err) {
      console.error(err);
    }
    setCreating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-l from-[#4A3F35] to-[#C9A66B] text-white px-6 py-5 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/15 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">المسار الذكي — من التوصية إلى عقد</h2>
              <p className="text-white/70 text-sm">صف مشروعك وسنطابقك مع أفضل مهندس وننشئ العقد تلقائياً</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white text-xl">✕</button>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-2 px-6 py-3 border-b bg-slate-50">
          {[
            { n: 1, label: "وصف المشروع", icon: FileText },
            { n: 2, label: "المهندسون المطابقون", icon: Brain },
            { n: 3, label: "إنشاء العقد", icon: ShieldCheck },
          ].map((s, i) => (
            <React.Fragment key={s.n}>
              <div className={`flex items-center gap-1.5 ${step >= s.n ? "text-[#6B5D4F]" : "text-slate-400"}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= s.n ? "bg-[#C9A66B] text-white" : "bg-slate-200"}`}>
                  {step > s.n ? <CheckCircle2 className="w-4 h-4" /> : s.n}
                </div>
                <span className="text-xs font-medium hidden sm:inline">{s.label}</span>
              </div>
              {i < 2 && <div className={`flex-1 h-0.5 ${step > s.n ? "bg-[#C9A66B]" : "bg-slate-200"}`} />}
            </React.Fragment>
          ))}
        </div>

        <div className="p-6">
          {/* Step 1: Describe project */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label className="mb-1.5 block">صف مشروعك بالتفصيل *</Label>
                <Textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={4}
                  placeholder="مثال: أريد تصميم فيلا سكنية بمساحة 400م²، طابقين، 4 غرف نوم، طراز حديث..."
                  className="resize-none"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label className="mb-1 block text-xs flex items-center gap-1"><DollarSign className="w-3 h-3" /> الميزانية (ريال)</Label>
                  <Input type="number" value={budget} onChange={e => setBudget(e.target.value)} placeholder="50000" />
                </div>
                <div>
                  <Label className="mb-1 block text-xs flex items-center gap-1"><Calendar className="w-3 h-3" /> المدة (أيام)</Label>
                  <Input type="number" value={timeline} onChange={e => setTimeline(e.target.value)} placeholder="30" />
                </div>
                <div>
                  <Label className="mb-1 block text-xs flex items-center gap-1"><MapPin className="w-3 h-3" /> الموقع</Label>
                  <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="الرياض" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={onClose}>إلغاء</Button>
                <Button
                  onClick={handleAnalyze}
                  disabled={!description.trim() || loading}
                  className="bg-gradient-to-l from-[#6B5D4F] to-[#C9A66B] text-white gap-2"
                >
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> جارٍ التحليل...</> : <><Zap className="w-4 h-4" /> تحليل وعرض المهندسين</>}
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Matched engineers */}
          {step === 2 && results && (
            <div className="space-y-4">
              {/* Analysis summary */}
              {results.analysis && (
                <Card className="border-[#C9A66B]/30 bg-amber-50/50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-2">
                      <Brain className="w-5 h-5 text-[#C9A66B] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-[#4A3F35] mb-1">تحليل المشروع</p>
                        <p className="text-xs text-slate-600">{results.analysis.summary}</p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <Badge variant="outline" className="text-xs">{results.analysis.project_type}</Badge>
                          <Badge variant="outline" className="text-xs">التعقيد: {results.analysis.project_complexity}</Badge>
                          {results.analysis.estimated_budget_range && (
                            <Badge variant="outline" className="text-xs">
                              {results.analysis.estimated_budget_range.min?.toLocaleString()} - {results.analysis.estimated_budget_range.max?.toLocaleString()} ريال
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                <User className="w-4 h-4 text-[#C9A66B]" />
                أفضل المهندسين المطابقين ({results.matched_engineers?.length || 0})
              </p>

              <div className="space-y-2">
                {results.matched_engineers?.map((eng, i) => (
                  <motion.div key={eng.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                    <Card className={`cursor-pointer transition-all hover:shadow-md ${selectedEngineer?.id === eng.id ? "border-[#C9A66B] ring-2 ring-[#C9A66B]/30" : "border-slate-200"}`}
                      onClick={() => handleSelectEngineer(eng)}>
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] text-white flex items-center justify-center font-bold shrink-0">
                          {eng.full_name?.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-slate-800 text-sm">{eng.full_name}</span>
                            <Badge variant="outline" className="text-xs">{eng.user_type}</Badge>
                            {eng.rating > 0 && (
                              <span className="flex items-center gap-0.5 text-xs text-amber-500">
                                <Star className="w-3 h-3 fill-current" /> {eng.rating}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{eng.specialization || eng.city || "—"}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {eng.match_reasons?.slice(0, 2).map((r, j) => (
                              <span key={j} className="text-xs bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded">{r}</span>
                            ))}
                          </div>
                        </div>
                        <div className="text-center shrink-0">
                          <div className="relative w-14 h-14">
                            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                              <circle cx="28" cy="28" r="24" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                              <circle cx="28" cy="28" r="24" fill="none" stroke="#C9A66B" strokeWidth="4"
                                strokeDasharray={`${(eng.match_percentage / 100) * 150.8} 150.8`} strokeLinecap="round" />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-[#4A3F35]">{eng.match_percentage}%</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {results.matched_engineers?.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <User className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">لا يوجد مهندسون مطابقون حالياً</p>
                </div>
              )}

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep(1)}>رجوع</Button>
              </div>
            </div>
          )}

          {/* Step 3: Confirm & create */}
          {step === 3 && selectedEngineer && (
            <div className="space-y-4">
              <Card className="border-emerald-200 bg-emerald-50/50">
                <CardContent className="p-4 flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-800">{selectedEngineer.full_name}</p>
                    <p className="text-xs text-slate-500">نسبة المطابقة: {selectedEngineer.match_percentage}%</p>
                  </div>
                </CardContent>
              </Card>

              <div>
                <Label className="mb-2 block text-sm font-semibold">كيف تريد ربط العقد؟</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setUseNewProject(true)}
                    className={`p-3 rounded-xl border-2 text-right transition-all ${useNewProject ? "border-[#C9A66B] bg-amber-50" : "border-slate-200"}`}
                  >
                    <FileText className="w-4 h-4 text-[#C9A66B] mb-1" />
                    <p className="text-sm font-semibold text-slate-700">إنشاء مشروع جديد</p>
                    <p className="text-xs text-slate-400">مشروع جديد مع العقد</p>
                  </button>
                  <button
                    onClick={() => setUseNewProject(false)}
                    className={`p-3 rounded-xl border-2 text-right transition-all ${!useNewProject ? "border-[#C9A66B] bg-amber-50" : "border-slate-200"}`}
                  >
                    <Search className="w-4 h-4 text-[#C9A66B] mb-1" />
                    <p className="text-sm font-semibold text-slate-700">مشروع موجود</p>
                    <p className="text-xs text-slate-400">اربط بمشروع قائم</p>
                  </button>
                </div>
              </div>

              {!useNewProject && (
                <div>
                  <Label className="mb-1 block text-xs">اختر المشروع</Label>
                  <select
                    value={selectedProjectId}
                    onChange={e => setSelectedProjectId(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A66B]"
                  >
                    <option value="">-- اختر مشروعاً --</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Contract preview */}
              <Card className="border-slate-200">
                <CardContent className="p-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">رقم العقد</span>
                    <span className="font-mono text-slate-700">CNT-SMART-{Date.now().toString().slice(-6)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">المبلغ</span>
                    <span className="font-bold text-slate-800">{(Number(budget) || results?.analysis?.estimated_budget_range?.max || 0).toLocaleString()} ريال</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">نوع العقد</span>
                    <span className="text-slate-700">عقد بدء مشروع</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">شروط الدفع</span>
                    <span className="text-slate-700">50% مقدماً، 50% عند التسليم</span>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep(2)}>رجوع</Button>
                <Button
                  onClick={handleCreateContract}
                  disabled={creating || (!useNewProject && !selectedProjectId)}
                  className="bg-gradient-to-l from-[#6B5D4F] to-[#C9A66B] text-white gap-2"
                >
                  {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> جارٍ الإنشاء...</> : <><FileText className="w-4 h-4" /> إنشاء المشروع والعقد</>}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}