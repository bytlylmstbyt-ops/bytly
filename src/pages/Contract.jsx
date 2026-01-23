import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { 
  FileText, Download, CheckCircle, AlertCircle, 
  Loader2, Calendar, DollarSign, User, Building2,
  Scale, Shield, Clock, Send, Printer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

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
            <Button variant="outline">
              <Download className="w-4 h-4 ml-2" />
              تحميل PDF
            </Button>
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
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-[#1a1a2e] mb-2">المادة الأولى: موضوع العقد</h4>
                    <p className="mr-4">
                      يتعهد الطرف الثاني (مقدم الخدمة) بتقديم خدمات {engineer?.specialization} 
                      للطرف الأول (صاحب المشروع) وفقاً للمواصفات والمتطلبات المتفق عليها في وصف المشروع.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-[#1a1a2e] mb-2">المادة الثانية: نطاق الأعمال</h4>
                    <ul className="mr-8 space-y-2 list-disc">
                      <li>إعداد التصاميم والمخططات الهندسية المطلوبة</li>
                      <li>تقديم الاستشارات الفنية اللازمة</li>
                      <li>إجراء التعديلات المطلوبة (حتى 3 مراجعات)</li>
                      <li>تسليم جميع الملفات المصدرية والنهائية</li>
                      <li>تقديم الدعم الفني لمدة 30 يوماً بعد التسليم</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-[#1a1a2e] mb-2">المادة الثالثة: قيمة العقد والدفع</h4>
                    <div className="mr-4 space-y-2 bg-amber-50 p-4 rounded-lg">
                      <p>
                        <span className="font-semibold">القيمة الإجمالية:</span> 
                        <span className="text-xl font-bold text-[#1a1a2e] mr-2">
                          {contract?.total_amount?.toLocaleString() || project?.escrow_amount?.toLocaleString()} ريال سعودي
                        </span>
                      </p>
                      <p className="text-sm text-slate-600">شاملة ضريبة القيمة المضافة (15%)</p>
                    </div>
                    <div className="mr-4 mt-3">
                      <p className="font-semibold mb-2">شروط الدفع:</p>
                      <ul className="space-y-1 text-sm">
                        <li>• 30% دفعة مقدمة عند توقيع العقد</li>
                        <li>• 40% عند تسليم التصاميم الأولية</li>
                        <li>• 30% عند التسليم النهائي والموافقة</li>
                      </ul>
                      <p className="text-sm text-blue-600 mt-3 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        يتم حجز المبالغ في نظام الدفع الضامن (Escrow) لحماية الطرفين
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-[#1a1a2e] mb-2">المادة الرابعة: المدة الزمنية</h4>
                    <div className="mr-4 space-y-2">
                      <p>
                        <span className="font-semibold">تاريخ البدء:</span> 
                        {contract?.start_date 
                          ? new Date(contract.start_date).toLocaleDateString("ar")
                          : new Date().toLocaleDateString("ar")
                        }
                      </p>
                      <p>
                        <span className="font-semibold">تاريخ التسليم المتوقع:</span> 
                        {contract?.delivery_date || project?.deadline
                          ? new Date(contract?.delivery_date || project?.deadline).toLocaleDateString("ar")
                          : "حسب الاتفاق"
                        }
                      </p>
                      <p className="text-sm text-slate-600">
                        • في حالة التأخير لأسباب قاهرة، يتم الاتفاق على تمديد المدة
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-[#1a1a2e] mb-2">المادة الخامسة: التزامات الطرف الأول (العميل)</h4>
                    <ul className="mr-8 space-y-2 list-disc">
                      <li>توفير جميع المعلومات والمستندات المطلوبة للمشروع</li>
                      <li>سداد المستحقات المالية في المواعيد المتفق عليها</li>
                      <li>الرد على الاستفسارات خلال مدة معقولة (3 أيام عمل)</li>
                      <li>إبداء الملاحظات على التصاميم بشكل واضح ومفصل</li>
                      <li>الموافقة النهائية على التصاميم خلال 7 أيام من التسليم</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-[#1a1a2e] mb-2">المادة السادسة: التزامات الطرف الثاني (المهندس)</h4>
                    <ul className="mr-8 space-y-2 list-disc">
                      <li>تنفيذ الأعمال بجودة عالية وحرفية مهنية</li>
                      <li>الالتزام بالمواصفات والمعايير الهندسية المعتمدة</li>
                      <li>تسليم الأعمال في المواعيد المحددة</li>
                      <li>إجراء التعديلات المطلوبة ضمن الحد المتفق عليه</li>
                      <li>تسليم جميع الملفات المصدرية والوثائق الفنية</li>
                      <li>الحفاظ على سرية معلومات المشروع</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-[#1a1a2e] mb-2">المادة السابعة: حقوق الملكية الفكرية</h4>
                    <ul className="mr-8 space-y-2 list-disc">
                      <li>تنتقل جميع حقوق الملكية الفكرية للتصاميم المسلمة للطرف الأول بعد السداد الكامل</li>
                      <li>يحق للطرف الثاني عرض التصاميم في معرض أعماله بعد موافقة الطرف الأول</li>
                      <li>لا يجوز للطرف الأول المطالبة بحقوق الملكية قبل إتمام الدفع</li>
                      <li>يحتفظ الطرف الثاني بحق توقيع أعماله باسمه</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-[#1a1a2e] mb-2">المادة الثامنة: إنهاء العقد</h4>
                    <ul className="mr-8 space-y-2 list-disc">
                      <li>يحق لأي من الطرفين إنهاء العقد بإشعار كتابي قبل 7 أيام</li>
                      <li>في حالة الإنهاء، يتم احتساب قيمة الأعمال المنجزة فقط</li>
                      <li>يُعاد باقي المبلغ المدفوع للطرف الأول خلال 14 يوم عمل</li>
                      <li>في حالة إخلال أحد الطرفين بالتزاماته، يحق للطرف الآخر إنهاء العقد فوراً</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-[#1a1a2e] mb-2">المادة التاسعة: حل النزاعات</h4>
                    <ul className="mr-8 space-y-2 list-disc">
                      <li>يلتزم الطرفان بمحاولة حل أي نزاع بالطرق الودية أولاً</li>
                      <li>في حالة عدم التوصل لحل، يتم اللجوء إلى إدارة منصة بيتلي للوساطة</li>
                      <li>قرار منصة بيتلي في النزاعات يكون ملزماً للطرفين</li>
                      <li>في حالة الاستمرار، يتم اللجوء للجهات القضائية المختصة في المملكة</li>
                      <li>القانون الساري هو قانون المملكة العربية السعودية</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-[#1a1a2e] mb-2">المادة العاشرة: السرية</h4>
                    <p className="mr-4">
                      يلتزم الطرفان بالحفاظ على سرية جميع المعلومات والوثائق المتبادلة 
                      وعدم الإفصاح عنها لأي طرف ثالث دون موافقة كتابية مسبقة. 
                      يستمر هذا الالتزام حتى بعد انتهاء العقد.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-[#1a1a2e] mb-2">المادة الحادية عشرة: القوة القاهرة</h4>
                    <p className="mr-4">
                      لا يُسأل أي من الطرفين عن التأخير أو عدم تنفيذ الالتزامات بسبب ظروف قاهرة 
                      خارجة عن الإرادة (كوارث طبيعية، حروب، أوبئة، إلخ). 
                      يجب إخطار الطرف الآخر فوراً وتقديم الإثباتات اللازمة.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-[#1a1a2e] mb-2">المادة الثانية عشرة: أحكام عامة</h4>
                    <ul className="mr-8 space-y-2 list-disc">
                      <li>هذا العقد يمثل الاتفاق الكامل بين الطرفين</li>
                      <li>أي تعديل على العقد يجب أن يكون كتابياً وموقعاً من الطرفين</li>
                      <li>بطلان أي بند من بنود العقد لا يؤثر على صحة البنود الأخرى</li>
                      <li>تُحرر نسختان من العقد، لكل طرف نسخة</li>
                      <li>جميع المراسلات تتم عبر منصة بيتلي كمرجع موثق</li>
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
        {contract && !contract.client_signature && !contract.engineer_signature && (
          <Card className="border-0 shadow-xl print:hidden">
            <CardContent className="p-6">
              <div className="flex items-start gap-3 mb-6">
                <Checkbox 
                  id="agree" 
                  checked={agreed}
                  onCheckedChange={setAgreed}
                />
                <Label htmlFor="agree" className="text-sm leading-relaxed cursor-pointer">
                  أقر بأنني قرأت هذا العقد وفهمت جميع بنوده وشروطه، وأوافق عليها بشكل كامل. 
                  كما أقر بأن التوقيع الإلكتروني له نفس القوة القانونية للتوقيع اليدوي.
                </Label>
              </div>
              <Button
                onClick={handleSign}
                disabled={!agreed || isSigning}
                className="w-full bg-gradient-to-r from-[#1a1a2e] to-[#d4a574] text-white py-6 text-lg"
              >
                {isSigning ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin ml-2" />
                    جاري التوقيع...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 ml-2" />
                    التوقيع على العقد
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
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