import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";
import { 
  FileText, CheckCircle, User, Building2,
  Scale, Shield, Printer, Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";


export default function ContractPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const contractId = urlParams.get("id");
  const projectId = urlParams.get("project");

  const [contract, setContract] = useState(null);
  const [project, setProject] = useState(null);
  const [client, setClient] = useState(null);
  const [engineer, setEngineer] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    loadData();
  }, [contractId, projectId]);

  const loadData = async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      const authUser = authData?.user;
      if (!authUser?.id) throw new Error("سجّل الدخول لعرض العقد.");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("user_id,email,full_name,phone,role")
        .eq("user_id", authUser.id)
        .maybeSingle();
      if (profileError) throw profileError;
      setCurrentUser({
        id: authUser.id,
        user_id: authUser.id,
        email: (authUser.email || profile?.email || "").trim().toLowerCase(),
        full_name: profile?.full_name || authUser.user_metadata?.full_name || authUser.user_metadata?.name || "",
        role: profile?.role || authUser.user_metadata?.role || "user",
      });

      let loadedContract = null;
      let loadedProject = null;
      let loadedClient = null;
      let loadedEngineer = null;

      if (contractId) {
        const { data: row, error: contractError } = await supabase
          .from("project_contracts")
          .select("*")
          .eq("id", contractId)
          .maybeSingle();
        if (contractError) throw contractError;
        if (!row) throw new Error("العقد غير موجود أو ليس لديك صلاحية عرضه.");
        loadedContract = {
          ...row,
          total_amount: row.total_amount ?? row.amount ?? null,
          created_date: row.created_at || null,
          contract_type: row.contract_type || "service_agreement",
        };

        if (row.project_id) {
          const { data, error } = await supabase.from("projects").select("*").eq("id", row.project_id).maybeSingle();
          if (error) throw error;
          loadedProject = data;
        }

        const clientUserId = row.client_user_id || null;
        const providerUserId = row.provider_user_id || null;
        const [clientProfileResult, providerProfileResult, clientRowResult, engineerRowResult] = await Promise.all([
          clientUserId ? supabase.from("profiles").select("user_id,email,full_name,phone,role").eq("user_id", clientUserId).maybeSingle() : Promise.resolve({ data: null, error: null }),
          providerUserId ? supabase.from("profiles").select("user_id,email,full_name,phone,role").eq("user_id", providerUserId).maybeSingle() : Promise.resolve({ data: null, error: null }),
          row.client_id ? supabase.from("clients").select("*").eq("id", row.client_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
          row.engineer_id ? supabase.from("engineers").select("*").eq("id", row.engineer_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
        ]);
        for (const result of [clientProfileResult, providerProfileResult, clientRowResult, engineerRowResult]) {
          if (result.error) throw result.error;
        }
        loadedClient = clientRowResult.data || clientProfileResult.data;
        loadedEngineer = engineerRowResult.data || providerProfileResult.data;

        if (!loadedClient && clientUserId) {
          const { data, error } = await supabase.from("clients").select("*").eq("user_id", clientUserId).maybeSingle();
          if (error) throw error;
          loadedClient = data;
        }
        if (!loadedEngineer && providerUserId) {
          const { data, error } = await supabase.from("engineers").select("*").eq("user_id", providerUserId).maybeSingle();
          if (error) throw error;
          loadedEngineer = data;
        }
      } else if (projectId) {
        const { data, error } = await supabase.from("projects").select("*").eq("id", projectId).maybeSingle();
        if (error) throw error;
        if (!data) throw new Error("المشروع غير موجود أو ليس لديك صلاحية عرضه.");
        loadedProject = data;

        const clientUserId = data.client_user_id || null;
        const engineerId = data.assigned_engineer_id || null;
        const [clientProfileResult, clientRowResult, engineerRowResult] = await Promise.all([
          clientUserId ? supabase.from("profiles").select("user_id,email,full_name,phone,role").eq("user_id", clientUserId).maybeSingle() : Promise.resolve({ data: null, error: null }),
          data.client_id ? supabase.from("clients").select("*").eq("id", data.client_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
          engineerId ? supabase.from("engineers").select("*").eq("id", engineerId).maybeSingle() : Promise.resolve({ data: null, error: null }),
        ]);
        for (const result of [clientProfileResult, clientRowResult, engineerRowResult]) {
          if (result.error) throw result.error;
        }
        loadedClient = clientRowResult.data || clientProfileResult.data;
        loadedEngineer = engineerRowResult.data;
      } else {
        throw new Error("رابط العقد غير مكتمل.");
      }

      setContract(loadedContract);
      setProject(loadedProject);
      setClient(loadedClient);
      setEngineer(loadedEngineer);
    } catch (error) {
      console.error("Contract page failed to load Supabase data:", error);
      setLoadError(error?.message || "تعذر تحميل بيانات العقد.");
      setContract(null);
      setProject(null);
      setClient(null);
      setEngineer(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#C9A66B]"></div>
      </div>
    );
  }

  const contractDate = contract?.created_date || new Date().toISOString();
  const contractNumber = contract?.contract_number || `BYT-${Date.now().toString().slice(-8)}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {loadError && (
          <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            تعذر تحميل العقد: {loadError}
          </div>
        )}
        {/* Header Actions */}
        <div className="flex justify-between items-center mb-6 print:hidden">
          <h1 className="text-2xl font-bold text-[#1a1a2e]">
            {contract?.contract_type === "service_agreement" ? "عقد تقديم خدمات" : "عقد بدء مشروع"}
          </h1>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 ml-2" />
              طباعة
            </Button>
            <Link to={createPageUrl("ContractArchive")}>
              <Button variant="outline">
                <FileText className="w-4 h-4 ml-2" />
                أرشيف العقود
              </Button>
            </Link>
            {(contract?.status === "active" || contract?.status === "signed") && (
              <Link to={createPageUrl("ContractAmendments") + `?id=${contractId}`}>
                <Button variant="outline" className="border-blue-500 text-blue-600">
                  <FileText className="w-4 h-4 ml-2" />
                  التعديلات ({contract?.contract_version || 1})
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Lock Banner */}
        {contract && ["active", "signed", "completed"].includes(contract.status) && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-4 flex items-center gap-3 print:hidden"
          >
            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-green-900">العقد مقفل وموثّق</p>
              <p className="text-sm text-green-700">
                تم توقيع العقد من كلا الطرفين وهو الآن مغلق لأي تعديلات لحماية حقوق الطرفين. لأي تعديل يرجى استخدام نظام التعديلات.
              </p>
            </div>
          </motion.div>
        )}

        {/* Contract Document */}
        <Card className="border-0 shadow-xl mb-8 print:shadow-none">
          <CardContent className="p-8 md:p-12">
            {/* Header */}
            <div className="text-center mb-8 pb-8 border-b-2 border-slate-200">
              <div className="w-16 h-16 mx-auto rounded-xl bg-gradient-to-br from-[#1a1a2e] to-[#C9A66B] flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-[#1a1a2e] mb-2">
                {contract?.contract_type === "service_agreement" 
                  ? "عقد اتفاق تقديم خدمات تصميم هندسي / معماري"
                  : "عقد بدء مشروع"
                }
              </h2>
              <Badge variant="secondary" className="mt-2">
                رقم العقد: {contractNumber}
              </Badge>
            </div>

            {/* Contract Body */}
            <div className="space-y-6 text-slate-700 leading-relaxed">
              {/* Introduction */}
              <div>
                <p className="font-semibold mb-3">تم التوقيع على هذا العقد بتاريخ:</p>
                <p className="text-lg font-bold text-[#1a1a2e]">
                  {new Date(contractDate).toLocaleDateString("ar", { 
                    weekday: "long",
                    year: "numeric", 
                    month: "long", 
                    day: "numeric" 
                  })}
                </p>
              </div>

              <Separator />

              {/* Parties */}
              <div>
                <h3 className="text-xl font-bold text-[#1a1a2e] mb-4 flex items-center gap-2">
                  <Scale className="w-5 h-5 text-[#C9A66B]" />
                  أطراف العقد
                </h3>
                
                <div className="space-y-4 bg-slate-50 p-6 rounded-xl">
                  <div>
                    <p className="font-semibold text-[#1a1a2e] mb-2">الطرف الأول (صاحب المشروع):</p>
                    <div className="mr-4 space-y-1">
                      <p>الاسم: <span className="font-semibold">{client?.full_name}</span></p>
                      <p>البريد الإلكتروني: {client?.email}</p>
                      <p>رقم الهاتف: {client?.phone}</p>
                      <p>الموقع: {client?.city}, {client?.country}</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <p className="font-semibold text-[#1a1a2e] mb-2">الطرف الثاني (مقدم الخدمة):</p>
                    <div className="mr-4 space-y-1">
                      <p>الاسم: <span className="font-semibold">{engineer?.full_name}</span></p>
                      <p>التخصص: {engineer?.specialization}</p>
                      <p>رقم القيد المهني: {engineer?.registration_number}</p>
                      <p>البريد الإلكتروني: {engineer?.email}</p>
                      <p>رقم الهاتف: {engineer?.phone}</p>
                      <p>الموقع: {engineer?.city}, {engineer?.country}</p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Project Details */}
              <div>
                <h3 className="text-xl font-bold text-[#1a1a2e] mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#C9A66B]" />
                  تفاصيل المشروع
                </h3>
                <div className="space-y-3 bg-slate-50 p-6 rounded-xl">
                  <div>
                    <p className="font-semibold text-[#1a1a2e]">اسم المشروع:</p>
                    <p className="mr-4">{project?.title}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-[#1a1a2e]">وصف المشروع:</p>
                    <p className="mr-4 whitespace-pre-wrap">{project?.description}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-[#1a1a2e]">موقع المشروع:</p>
                    <p className="mr-4">{project?.location}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Terms */}
              <div>
                <h3 className="text-xl font-bold text-[#1a1a2e] mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#C9A66B]" />
                  بنود العقد
                </h3>
                
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-r-4 border-blue-500 p-6 rounded-lg mb-6">
                  <h4 className="font-bold text-blue-900 mb-3">أطراف العقد:</h4>
                  <ul className="space-y-2 text-blue-800">
                    <li>• <span className="font-semibold">المصمم:</span> {engineer?.full_name}</li>
                    <li>• <span className="font-semibold">العميل:</span> {client?.full_name}</li>
                    <li>• <span className="font-semibold">الوسيط:</span> تطبيق "بيتلي" (Bytly)</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-[#1a1a2e] mb-2">المادة الأولى: نطاق العمل ومدته</h4>
                    <ul className="mr-8 space-y-2 list-disc">
                      <li>يلتزم المصمم بتنفيذ الخدمات الموضحة في "عرض السعر" المقبول من العميل.</li>
                      <li>مدة التنفيذ هي ({Math.ceil((new Date(contract?.delivery_date || project?.deadline) - new Date(contract?.start_date || new Date())) / (1000 * 60 * 60 * 24))} يوم) تبدأ من تاريخ اكتمال شروط بدء المشروع.</li>
                      <li>وصف الخدمة: {project?.description}</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-[#1a1a2e] mb-2">المادة الثانية: شروط بدء المشروع (لحظة الصفر)</h4>
                    <div className="bg-amber-50 border-r-4 border-amber-500 p-4 rounded-lg mr-4">
                      <p className="font-semibold text-amber-900 mb-3">⏱️ لا يبدأ احتساب مدة التنفيذ إلا بعد تحقق الشرطين التاليين:</p>
                      <ul className="space-y-2 text-amber-800">
                        <li><span className="font-semibold">أولاً:</span> قيام العميل بسداد كامل قيمة المشروع (أو الدفعة الأولى المتفق عليها) وإيداعها في حساب الضمان التابع للمنصة.</li>
                        <li><span className="font-semibold">ثانياً:</span> قيام العميل بتسليم كافة البيانات، المخططات، والمتطلبات الفنية اللازمة لبدء التصميم عبر شات التطبيق.</li>
                      </ul>
                      <p className="text-sm text-amber-700 mt-3">
                        ⚠️ أي تأخير من قبل العميل في تسليم المتطلبات يؤدي تلقائياً إلى إيقاف احتساب المدة الزمنية، 
                        ولا يتحمل المصمم مسؤولية هذا التأخير.
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-[#1a1a2e] mb-2">المادة الثالثة: آلية الدفع والضمان</h4>
                    <div className="mr-4 space-y-3">
                      <div className="bg-green-50 border-r-4 border-green-500 p-4 rounded-lg">
                        <p className="font-semibold text-green-900 mb-2">💰 القيمة الإجمالية:</p>
                        <p className="text-2xl font-bold text-[#1a1a2e]">
                          {contract?.total_amount?.toLocaleString() || project?.escrow_amount?.toLocaleString()} ريال سعودي
                        </p>
                        <p className="text-sm text-green-700 mt-1">شاملة ضريبة القيمة المضافة (15%)</p>
                      </div>
                      
                      <div className="bg-blue-50 border-r-4 border-blue-500 p-4 rounded-lg">
                        <p className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                          <Shield className="w-5 h-5" />
                          نظام الضمان:
                        </p>
                        <ul className="space-y-2 text-blue-800 text-sm">
                          <li>• يقر الطرفان بأن تطبيق "بيتلي" هو الوسيط المالي، حيث تظل الأموال محجوزة لدى التطبيق طوال فترة التنفيذ.</li>
                          <li>• يتم تحويل المبلغ للمصمم (بعد خصم عمولة المنصة 10%) فور ضغط العميل على زر "اعتماد التسليم النهائي".</li>
                          <li>• الأموال محمية بنظام Escrow ولا يمكن سحبها إلا بعد اكتمال المشروع أو الاتفاق المتبادل.</li>
                        </ul>
                      </div>

                      <div>
                        <p className="font-semibold mb-2">شروط الدفع:</p>
                        <p className="text-sm text-slate-600">{contract?.payment_terms || "30% دفعة مقدمة، 40% عند التصاميم الأولية، 30% عند التسليم النهائي"}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-[#1a1a2e] mb-2">المادة الرابعة: احتساب مدة التسليم وإشعار البدء</h4>
                    <div className="mr-4 space-y-3">
                      <div className="bg-slate-50 border-r-4 border-slate-400 p-4 rounded-lg">
                        <p className="font-semibold text-slate-900 mb-2">⏰ المدة الزمنية:</p>
                        <ul className="space-y-2 text-slate-700 text-sm">
                          <li>• تبدأ الفترة الزمنية المحددة للتسليم من تاريخ اليوم التالي لتحقق شروط التفعيل المذكورة في المادة الثانية.</li>
                          <li>• أي تأخير من قبل العميل في تسليم المتطلبات يؤدي تلقائياً إلى إيقاف احتساب المدة الزمنية.</li>
                          <li>• لا يتحمل المصمم مسؤولية التأخير الناتج عن عدم توفر المتطلبات.</li>
                        </ul>
                      </div>
                      
                      <div>
                        <p><span className="font-semibold">تاريخ البدء الفعلي:</span> {contract?.start_date ? new Date(contract.start_date).toLocaleDateString("ar") : "بعد اكتمال الشروط"}</p>
                        <p><span className="font-semibold">تاريخ التسليم المتوقع:</span> {contract?.delivery_date || project?.deadline ? new Date(contract?.delivery_date || project?.deadline).toLocaleDateString("ar") : "حسب الاتفاق"}</p>
                      </div>
                      
                      <div className="bg-purple-50 border-r-4 border-purple-500 p-4 rounded-lg">
                        <p className="font-semibold text-purple-900 mb-2">📱 إشعار البدء التلقائي:</p>
                        <p className="text-sm text-purple-800">
                          يقوم النظام آلياً بإرسال تنبيه للطرفين (Push Notification) وعبر البريد الإلكتروني 
                          يفيد بـ "بدء العمل على المشروع رسمياً" وتحديد تاريخ التسليم المتوقع بناءً على ذلك.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-[#1a1a2e] mb-2">المادة الخامسة: التعديلات والإضافات</h4>
                    <div className="mr-4 space-y-2">
                      <div className="bg-yellow-50 border-r-4 border-yellow-500 p-4 rounded-lg">
                        <ul className="space-y-2 text-yellow-900 text-sm">
                          <li>• يشمل العقد عدد <span className="font-bold text-lg">3 تعديلات مجانية</span> على التصاميم المقدمة.</li>
                          <li>• التعديلات المجانية تكون ضمن نطاق العمل المتفق عليه فقط.</li>
                          <li>• أي طلبات إضافية خارج نطاق العمل المتفق عليه (مثل: تصاميم جديدة، غرف إضافية، تغيير كامل في المفهوم) تخضع لاتفاق مالي جديد منفصل.</li>
                          <li>• يتم الاتفاق على قيمة التعديلات الإضافية قبل البدء فيها.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-[#1a1a2e] mb-2">المادة السادسة: التزامات الطرف الأول (العميل)</h4>
                    <ul className="mr-8 space-y-2 list-disc">
                      <li>توفير جميع المعلومات والمستندات المطلوبة للمشروع عبر شات التطبيق</li>
                      <li>سداد المستحقات المالية كاملة قبل بدء العمل</li>
                      <li>الرد على الاستفسارات خلال مدة معقولة (3 أيام عمل)</li>
                      <li>إبداء الملاحظات على التصاميم بشكل واضح ومفصل</li>
                      <li>الضغط على زر "اعتماد التسليم النهائي" خلال 7 أيام من التسليم</li>
                      <li>عدم طلب تعديلات خارج نطاق العمل المتفق عليه دون الاتفاق على رسوم إضافية</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-[#1a1a2e] mb-2">المادة السابعة: التزامات الطرف الثاني (المصمم)</h4>
                    <ul className="mr-8 space-y-2 list-disc">
                      <li>تنفيذ الأعمال بجودة عالية وحرفية مهنية وفقاً للمواصفات المتفق عليها</li>
                      <li>الالتزام بالمواصفات والمعايير الهندسية المعتمدة في المملكة</li>
                      <li>البدء في التنفيذ فوراً بعد اكتمال شروط بدء المشروع (لحظة الصفر)</li>
                      <li>تسليم الأعمال في المواعيد المحددة حسب المدة المتفق عليها</li>
                      <li>إجراء التعديلات المطلوبة (حتى 3 تعديلات مجانية) ضمن نطاق العمل المتفق عليه</li>
                      <li>تسليم جميع الملفات المصدرية والوثائق الفنية بصيغ قابلة للتعديل</li>
                      <li>الحفاظ على سرية معلومات المشروع وعدم مشاركتها مع أي طرف ثالث</li>
                      <li>التواصل الدوري مع العميل عبر شات التطبيق لإطلاعه على تقدم العمل</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-[#1a1a2e] mb-2">المادة الثامنة: فض النزاعات</h4>
                    <div className="mr-4">
                      <div className="bg-red-50 border-r-4 border-red-500 p-4 rounded-lg">
                        <p className="font-semibold text-red-900 mb-2">⚖️ آلية حل النزاعات:</p>
                        <ul className="space-y-2 text-red-800 text-sm">
                          <li>• في حال وجود خلاف بين الطرفين، يلتزم الطرفان باللجوء لخدمة "حل النزاعات" داخل تطبيق "بيتلي" للتحكيم بينهما قبل اتخاذ أي إجراء خارجي.</li>
                          <li>• تقوم إدارة المنصة بمراجعة الحالة والاستماع لكلا الطرفين وفحص الأدلة المقدمة.</li>
                          <li>• قرار المنصة في النزاع يكون ملزماً للطرفين ونهائياً.</li>
                          <li>• في حالة رفض أي طرف للحل، يتم اللجوء للجهات القضائية المختصة في المملكة.</li>
                          <li>• القانون الساري هو قانون المملكة العربية السعودية.</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-[#1a1a2e] mb-2">المادة التاسعة: حقوق الملكية الفكرية</h4>
                    <ul className="mr-8 space-y-2 list-disc">
                      <li>تنتقل جميع حقوق الملكية الفكرية للتصاميم المسلمة للطرف الأول بعد السداد الكامل واعتماد التسليم النهائي</li>
                      <li>يحق للطرف الثاني (المصمم) عرض التصاميم في معرض أعماله على المنصة بعد موافقة الطرف الأول</li>
                      <li>لا يجوز للطرف الأول المطالبة بحقوق الملكية أو الملفات النهائية قبل إتمام الدفع الكامل</li>
                      <li>يحتفظ الطرف الثاني بحق توقيع أعماله باسمه المهني</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-[#1a1a2e] mb-2">المادة العاشرة: إنهاء العقد</h4>
                    <ul className="mr-8 space-y-2 list-disc">
                      <li>يحق لأي من الطرفين إنهاء العقد بإشعار كتابي عبر المنصة قبل 7 أيام</li>
                      <li>في حالة الإنهاء، يتم احتساب قيمة الأعمال المنجزة فقط بناءً على تقدير المنصة</li>
                      <li>يُعاد باقي المبلغ المحجوز للطرف الأول خلال 14 يوم عمل</li>
                      <li>في حالة إخلال أحد الطرفين بالتزاماته، يحق للطرف الآخر إنهاء العقد فوراً والمطالبة بالتعويض</li>
                    </ul>
                  </div>



                  <div>
                    <h4 className="font-semibold text-[#1a1a2e] mb-2">المادة الحادية عشرة: السرية</h4>
                    <p className="mr-4">
                      يلتزم الطرفان بالحفاظ على سرية جميع المعلومات والوثائق المتبادلة 
                      وعدم الإفصاح عنها لأي طرف ثالث دون موافقة كتابية مسبقة عبر المنصة. 
                      يستمر هذا الالتزام حتى بعد انتهاء العقد.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-[#1a1a2e] mb-2">المادة الثانية عشرة: القوة القاهرة</h4>
                    <p className="mr-4">
                      لا يُسأل أي من الطرفين عن التأخير أو عدم تنفيذ الالتزامات بسبب ظروف قاهرة 
                      خارجة عن الإرادة (كوارث طبيعية، حروب، أوبئة، انقطاع الخدمات، إلخ). 
                      يجب إخطار الطرف الآخر فوراً عبر المنصة وتقديم الإثباتات اللازمة.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-[#1a1a2e] mb-2">المادة الثالثة عشرة: سريان العقد</h4>
                    <div className="mr-4">
                      <div className="bg-indigo-50 border-r-4 border-indigo-500 p-4 rounded-lg">
                        <p className="font-semibold text-indigo-900 mb-2">📜 نفاذ العقد:</p>
                        <ul className="space-y-2 text-indigo-800 text-sm">
                          <li>• يُعتبر هذا العقد سارياً ونافذاً فور توقيع الطرفين إلكترونياً عبر المنصة.</li>
                          <li>• التوقيع الإلكتروني له نفس القوة القانونية للتوقيع اليدوي وفقاً لأنظمة المملكة.</li>
                          <li>• يبدأ المصمم في التنفيذ الفعلي فقط بعد تحقق شروط بدء المشروع (المادة الثانية).</li>
                          <li>• تُحفظ نسخة إلكترونية من العقد لدى كل طرف ولدى المنصة كمرجع موثق.</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-[#1a1a2e] mb-2">المادة الرابعة عشرة: أحكام عامة</h4>
                    <ul className="mr-8 space-y-2 list-disc">
                      <li>هذا العقد يمثل الاتفاق الكامل بين الطرفين ويلغي أي اتفاقات سابقة شفهية أو كتابية</li>
                      <li>أي تعديل على العقد يجب أن يكون كتابياً وموقعاً إلكترونياً من الطرفين عبر المنصة</li>
                      <li>بطلان أي بند من بنود العقد لا يؤثر على صحة ونفاذ البنود الأخرى</li>
                      <li>تُحفظ نسخة رقمية من العقد لدى كل طرف ولدى منصة بيتلي</li>
                      <li>جميع المراسلات والإشعارات تتم عبر منصة بيتلي فقط وتُعتبر مرجعاً موثقاً</li>
                      <li>يخضع هذا العقد لأنظمة وقوانين المملكة العربية السعودية</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Separator className="my-8" />

              {/* Signatures */}
              <div>
                <h3 className="text-xl font-bold text-[#1a1a2e] mb-6 text-center">
                  التوقيعات
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Client Signature */}
                  <div className="text-center">
                    <div className={`border-2 rounded-xl p-6 ${
                      contract?.client_signature ? "border-green-500 bg-green-50" : "border-slate-300"
                    }`}>
                      <User className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                      <p className="font-semibold text-[#1a1a2e] mb-2">الطرف الأول</p>
                      <p className="text-slate-600 mb-3">{client?.full_name}</p>
                      {contract?.client_signature ? (
                        <>
                          <CheckCircle className="w-8 h-8 mx-auto text-green-500 mb-2" />
                          <p className="text-sm text-green-700 font-medium">تم التوقيع</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(contract.client_signature_date).toLocaleDateString("ar")}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-slate-500">في انتظار التوقيع</p>
                      )}
                    </div>
                  </div>

                  {/* Engineer Signature */}
                  <div className="text-center">
                    <div className={`border-2 rounded-xl p-6 ${
                      contract?.engineer_signature ? "border-green-500 bg-green-50" : "border-slate-300"
                    }`}>
                      <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                      <p className="font-semibold text-[#1a1a2e] mb-2">الطرف الثاني</p>
                      <p className="text-slate-600 mb-3">{engineer?.full_name}</p>
                      {contract?.engineer_signature ? (
                        <>
                          <CheckCircle className="w-8 h-8 mx-auto text-green-500 mb-2" />
                          <p className="text-sm text-green-700 font-medium">تم التوقيع</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(contract.engineer_signature_date).toLocaleDateString("ar")}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-slate-500">في انتظار التوقيع</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Platform Notice */}
              <div className="bg-blue-50 border-r-4 border-blue-500 p-6 rounded-lg mt-8">
                <div className="flex items-start gap-3">
                  <Shield className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-2">إشعار من منصة بيتلي</h4>
                    <p className="text-blue-800 text-sm leading-relaxed">
                      هذا العقد محرر إلكترونياً عبر منصة بيتلي وله الحجية القانونية الكاملة. 
                      المنصة تعمل كوسيط لضمان حقوق الطرفين ولا تتحمل مسؤولية تنفيذ بنود العقد. 
                      لأي استفسارات، يُرجى التواصل مع الدعم الفني على: bytlylmstbyt@gmail.com
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Signing remains disabled until a server-side, participant-verified signing flow is available. */}
        {contract && (() => {
          const email = (currentUser?.email || "").toLowerCase();
          const isClient = email && email === (client?.email || "").toLowerCase();
          const isEngineer = email && email === (engineer?.email || "").toLowerCase();
          const mySign = isClient ? contract.client_signature : contract.engineer_signature;
          const canSign = (isClient || isEngineer) && !mySign &&
            ["pending_signature", "draft"].includes(contract.status);
          return canSign ? (
            <Card className="border border-amber-200 shadow-sm print:hidden">
              <CardContent className="p-6 text-center">
                <Shield className="w-10 h-10 mx-auto mb-3 text-amber-600" />
                <p className="font-semibold text-[#1a1a2e] mb-1">التوقيع الإلكتروني قيد التحديث الآمن</p>
                <p className="text-slate-600 text-sm">
                  أوقفنا التوقيع مؤقتًا لأن المسار القديم يعتمد على Base44 ولا يتحقق بأمان من صلاحيات الطرف الذي يوقّع.
                  لن نغيّر حالة العقد أو نسجّل توقيعًا حتى يكتمل مسار التوقيع الآمن على الخادم.
                </p>
              </CardContent>
            </Card>
          ) : null;
        })()}

        {/* Contract Signed */}
        {contract?.client_signature && contract?.engineer_signature && (
          <Card className="border-0 shadow-xl bg-green-50 border-green-200 print:hidden">
            <CardContent className="p-6 text-center">
              <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
              <h3 className="text-xl font-bold text-green-900 mb-2">العقد ساري المفعول</h3>
              <p className="text-green-700">
                تم توقيع العقد من قبل الطرفين وأصبح ملزماً قانونياً
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          body { background: white !important; }
          * { color-adjust: exact !important; -webkit-print-color-adjust: exact !important; }
        }
      `}</style>
    </div>
  );
}