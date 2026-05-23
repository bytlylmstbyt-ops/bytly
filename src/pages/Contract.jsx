import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { 
  FileText, Download, CheckCircle, AlertCircle, 
  Loader2, Calendar, DollarSign, User, Building2,
  Scale, Shield, Clock, Send, Printer, PenLine
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import ElectronicSignModal from "@/components/contracts/ElectronicSignModal";

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
  const [isSigning, setIsSigning] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [contractId, projectId]);

  const loadData = async () => {
    setIsLoading(true);
    const user = await base44.auth.me();
    setCurrentUser(user);

    if (contractId) {
      const contractData = await base44.entities.Contract.filter({ id: contractId });
      if (contractData.length > 0) {
        const cont = contractData[0];
        setContract(cont);

        const [projectData, clientData, engineerData] = await Promise.all([
          base44.entities.Project.filter({ id: cont.project_id }),
          base44.entities.Client.filter({ id: cont.client_id }),
          base44.entities.Engineer.filter({ id: cont.engineer_id })
        ]);

        setProject(projectData[0]);
        setClient(clientData[0]);
        setEngineer(engineerData[0]);
      }
    } else if (projectId) {
      const projectData = await base44.entities.Project.filter({ id: projectId });
      setProject(projectData[0]);
      
      if (projectData[0]) {
        const [clientData, engineerData] = await Promise.all([
          base44.entities.Client.filter({ id: projectData[0].client_id }),
          base44.entities.Engineer.filter({ id: projectData[0].assigned_engineer_id })
        ]);
        setClient(clientData[0]);
        setEngineer(engineerData[0]);
      }
    }

    setIsLoading(false);
  };

  const handleSign = async () => {
    if (!agreed || !contract) return;

    setIsSigning(true);

    const isClient = currentUser.email === client?.email;
    const isEngineer = currentUser.email === engineer?.email;

    const updates = {};
    if (isClient) {
      updates.client_signature = true;
      updates.client_signature_date = new Date().toISOString();
    }
    if (isEngineer) {
      updates.engineer_signature = true;
      updates.engineer_signature_date = new Date().toISOString();
    }

    // Check if both signed
    const bothSigned = (isClient && contract.engineer_signature) || 
                      (isEngineer && contract.client_signature) ||
                      (updates.client_signature && updates.engineer_signature);

    if (bothSigned) {
      updates.status = "active";
      
      // Send notification to both parties
      await base44.entities.Notification.create({
        recipient_email: client.email,
        title: "تم توقيع العقد",
        message: `تم توقيع عقد المشروع "${project?.title}" من قبل الطرفين وأصبح ساري المفعول`,
        type: "project_update",
        related_project_id: contract.project_id
      });

      await base44.entities.Notification.create({
        recipient_email: engineer.email,
        title: "تم توقيع العقد",
        message: `تم توقيع عقد المشروع "${project?.title}" من قبل الطرفين وأصبح ساري المفعول`,
        type: "project_update",
        related_project_id: contract.project_id
      });
    } else {
      updates.status = "pending_signature";
    }

    await base44.entities.Contract.update(contract.id, updates);

    setIsSigning(false);
    loadData();
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#d4a574]"></div>
      </div>
    );
  }

  const contractDate = contract?.created_date || new Date().toISOString();
  const contractNumber = contract?.contract_number || `BYT-${Date.now().toString().slice(-8)}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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

        {/* Contract Document */}
        <Card className="border-0 shadow-xl mb-8 print:shadow-none">
          <CardContent className="p-8 md:p-12">
            {/* Header */}
            <div className="text-center mb-8 pb-8 border-b-2 border-slate-200">
              <div className="w-16 h-16 mx-auto rounded-xl bg-gradient-to-br from-[#1a1a2e] to-[#d4a574] flex items-center justify-center mb-4">
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
                  <Scale className="w-5 h-5 text-[#d4a574]" />
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
                  <Building2 className="w-5 h-5 text-[#d4a574]" />
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
                  <FileText className="w-5 h-5 text-[#d4a574]" />
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

        {/* Signature Section */}
        {contract && (() => {
          const isClient   = currentUser?.email === client?.email;
          const isEngineer = currentUser?.email === engineer?.email;
          const mySign = isClient ? contract.client_signature : contract.engineer_signature;
          const canSign = (isClient || isEngineer) && !mySign &&
            ["pending_signature", "draft"].includes(contract.status);
          return canSign ? (
            <Card className="border-0 shadow-xl print:hidden">
              <CardContent className="p-6 text-center">
                <PenLine className="w-10 h-10 mx-auto mb-3 text-[#d4a574]" />
                <p className="font-semibold text-[#1a1a2e] mb-1">بانتظار توقيعك</p>
                <p className="text-slate-500 text-sm mb-5">
                  أنت {isClient ? "العميل – الطرف الأول" : "المهندس – الطرف الثاني"}
                </p>
                <Button
                  onClick={() => setShowSignModal(true)}
                  className="bg-gradient-to-r from-[#1a1a2e] to-[#d4a574] text-white px-8 py-5 text-base gap-2"
                >
                  <PenLine className="w-5 h-5" />
                  وقّع الآن
                </Button>
              </CardContent>
            </Card>
          ) : null;
        })()}

        {/* Electronic Sign Modal */}
        {showSignModal && contract && (
          <ElectronicSignModal
            contract={contract}
            project={project}
            client={client}
            engineer={engineer}
            currentUser={currentUser}
            onDone={() => { setShowSignModal(false); loadData(); }}
            onClose={() => setShowSignModal(false)}
          />
        )}

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