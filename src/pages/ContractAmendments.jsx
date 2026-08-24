import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  FileEdit, Plus, Eye, CheckCircle, Clock, 
  X, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ContractAmendments() {
  const urlParams = new URLSearchParams(window.location.search);
  const contractId = urlParams.get("id");

  const [contract, setContract] = useState(null);
  const [amendments, setAmendments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [client, setClient] = useState(null);
  const [engineer, setEngineer] = useState(null);
  const [amendmentData, setAmendmentData] = useState({
    amendment_type: "clause_modification",
    description: "",
    changes: []
  });
  const [newChange, setNewChange] = useState({
    field: "",
    old_value: "",
    new_value: "",
    reason: ""
  });

  useEffect(() => {
    loadData();
  }, [contractId]);

  const loadData = async () => {
    setIsLoading(true);
    const user = await base44.auth.me();
    setCurrentUser(user);

    const [contractData] = await base44.entities.Contract.filter({ id: contractId });
    setContract(contractData);

    if (contractData) {
      const [clientData] = await base44.entities.Client.filter({ id: contractData.client_id });
      const [engineerData] = await base44.entities.Engineer.filter({ id: contractData.engineer_id });
      setClient(clientData);
      setEngineer(engineerData);

      const amendmentsData = await base44.entities.ContractAmendment.filter({ 
        contract_id: contractId 
      });
      setAmendments(amendmentsData.sort((a, b) => b.amendment_number - a.amendment_number));
    }

    setIsLoading(false);
  };

  const handleAddChange = () => {
    if (!newChange.field || !newChange.new_value) {
      alert("يرجى ملء الحقول المطلوبة");
      return;
    }

    setAmendmentData({
      ...amendmentData,
      changes: [...amendmentData.changes, { ...newChange }]
    });

    setNewChange({
      field: "",
      old_value: "",
      new_value: "",
      reason: ""
    });
  };

  const handleRemoveChange = (index) => {
    setAmendmentData({
      ...amendmentData,
      changes: amendmentData.changes.filter((_, i) => i !== index)
    });
  };

  const handleCreateAmendment = async () => {
    if (!amendmentData.description || amendmentData.changes.length === 0) {
      alert("يرجى إضافة وصف وتغيير واحد على الأقل");
      return;
    }

    try {
      const amendmentNumber = amendments.length + 1;
      
      await base44.entities.ContractAmendment.create({
        contract_id: contractId,
        amendment_number: amendmentNumber,
        amendment_type: amendmentData.amendment_type,
        description: amendmentData.description,
        changes: amendmentData.changes,
        requested_by: currentUser.email,
        status: "pending"
      });

      // Create new contract version
      const newVersion = contract.contract_version ? contract.contract_version + 1 : 2;
      await base44.entities.Contract.update(contractId, {
        contract_version: newVersion,
        previous_version_id: contractId
      });

      // Send notifications
      await base44.entities.Notification.create({
        recipient_email: client.email,
        title: "طلب تعديل على العقد",
        message: `تم تقديم طلب تعديل على العقد. يرجى المراجعة والموافقة`,
        type: "project_update",
        related_project_id: contract.project_id
      });

      await base44.entities.Notification.create({
        recipient_email: engineer.email,
        title: "طلب تعديل على العقد",
        message: `تم تقديم طلب تعديل على العقد. يرجى المراجعة والموافقة`,
        type: "project_update",
        related_project_id: contract.project_id
      });

      setIsDialogOpen(false);
      setAmendmentData({
        amendment_type: "clause_modification",
        description: "",
        changes: []
      });
      loadData();
    } catch (error) {
      console.error("Error creating amendment:", error);
      alert("حدث خطأ أثناء إنشاء التعديل");
    }
  };

  const handleSignAmendment = async (amendment) => {
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

    const bothSigned = (isClient && amendment.engineer_signature) || 
                      (isEngineer && amendment.client_signature);

    if (bothSigned) {
      updates.status = "active";
      updates.effective_date = new Date().toISOString();
    }

    await base44.entities.ContractAmendment.update(amendment.id, updates);
    loadData();
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { label: "في الانتظار", color: "bg-amber-100 text-amber-700", icon: Clock },
      approved_by_client: { label: "موافقة العميل", color: "bg-blue-100 text-blue-700", icon: CheckCircle },
      approved_by_engineer: { label: "موافقة المهندس", color: "bg-blue-100 text-blue-700", icon: CheckCircle },
      active: { label: "ساري المفعول", color: "bg-green-100 text-green-700", icon: CheckCircle },
      rejected: { label: "مرفوض", color: "bg-red-100 text-red-700", icon: X }
    };

    const { label, color, icon: Icon } = config[status] || config.pending;
    return (
      <Badge className={color}>
        <Icon className="w-3 h-3 ml-1" />
        {label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#C9A66B]"></div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold">العقد غير موجود</h3>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-[#1a1a2e] flex items-center gap-3">
                <FileEdit className="w-8 h-8 text-[#C9A66B]" />
                تعديلات العقد
              </h1>
              <p className="text-slate-600 mt-2">
                العقد رقم: {contract.contract_number} | الإصدار: {contract.contract_version || 1}
              </p>
            </div>
            <div className="flex gap-3">
              <Link to={createPageUrl("Contract") + `?id=${contractId}`}>
                <Button variant="outline">
                  <Eye className="w-4 h-4 ml-2" />
                  عرض العقد
                </Button>
              </Link>
              {(contract.status === "active" || contract.status === "signed") && (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-[#1a1a2e] to-[#C9A66B] text-white">
                      <Plus className="w-5 h-5 ml-2" />
                      طلب تعديل
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>طلب تعديل على العقد</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 mt-4">
                      <div className="space-y-2">
                        <Label>نوع التعديل</Label>
                        <Select
                          value={amendmentData.amendment_type}
                          onValueChange={(value) => setAmendmentData({ ...amendmentData, amendment_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="clause_modification">تعديل بند</SelectItem>
                            <SelectItem value="term_extension">تمديد المدة</SelectItem>
                            <SelectItem value="price_adjustment">تعديل السعر</SelectItem>
                            <SelectItem value="scope_change">تغيير النطاق</SelectItem>
                            <SelectItem value="other">أخرى</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>وصف التعديل *</Label>
                        <Textarea
                          value={amendmentData.description}
                          onChange={(e) => setAmendmentData({ ...amendmentData, description: e.target.value })}
                          placeholder="وصف تفصيلي للتعديل المطلوب..."
                          rows={3}
                        />
                      </div>

                      {/* Changes List */}
                      {amendmentData.changes.length > 0 && (
                        <div className="space-y-3">
                          <Label>التغييرات المطلوبة:</Label>
                          {amendmentData.changes.map((change, index) => (
                            <div key={index} className="border rounded-lg p-4 bg-slate-50">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                  <p className="font-semibold">{change.field}</p>
                                  <p className="text-sm text-slate-600 mt-1">
                                    <span className="line-through text-red-600">{change.old_value || "لا يوجد"}</span>
                                    {" → "}
                                    <span className="text-green-600">{change.new_value}</span>
                                  </p>
                                  {change.reason && (
                                    <p className="text-sm text-slate-500 mt-1">السبب: {change.reason}</p>
                                  )}
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRemoveChange(index)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add New Change */}
                      <Card>
                        <CardContent className="pt-6 space-y-4">
                          <h4 className="font-semibold">إضافة تغيير جديد</h4>
                          <div className="space-y-2">
                            <Label>اسم الحقل *</Label>
                            <Input
                              value={newChange.field}
                              onChange={(e) => setNewChange({ ...newChange, field: e.target.value })}
                              placeholder="مثال: تاريخ التسليم"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>القيمة القديمة</Label>
                              <Input
                                value={newChange.old_value}
                                onChange={(e) => setNewChange({ ...newChange, old_value: e.target.value })}
                                placeholder="القيمة الحالية"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>القيمة الجديدة *</Label>
                              <Input
                                value={newChange.new_value}
                                onChange={(e) => setNewChange({ ...newChange, new_value: e.target.value })}
                                placeholder="القيمة المطلوبة"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>سبب التغيير</Label>
                            <Input
                              value={newChange.reason}
                              onChange={(e) => setNewChange({ ...newChange, reason: e.target.value })}
                              placeholder="اختياري"
                            />
                          </div>
                          <Button onClick={handleAddChange} variant="outline" className="w-full">
                            <Plus className="w-4 h-4 ml-2" />
                            إضافة التغيير
                          </Button>
                        </CardContent>
                      </Card>

                      <Button
                        onClick={handleCreateAmendment}
                        className="w-full bg-gradient-to-r from-[#1a1a2e] to-[#C9A66B] text-white"
                      >
                        <FileEdit className="w-4 h-4 ml-2" />
                        إرسال طلب التعديل
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </motion.div>

        {/* Amendments List */}
        <div className="space-y-6">
          {amendments.map((amendment) => (
            <motion.div
              key={amendment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-r-4 border-r-blue-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 mb-2">
                        <FileEdit className="w-5 h-5" />
                        التعديل #{amendment.amendment_number}
                      </CardTitle>
                      <p className="text-sm text-slate-600">
                        {new Date(amendment.created_date).toLocaleDateString("ar")}
                      </p>
                    </div>
                    {getStatusBadge(amendment.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">الوصف:</p>
                    <p className="text-slate-900">{amendment.description}</p>
                  </div>

                  {/* Changes */}
                  <div>
                    <p className="text-sm text-slate-500 mb-2">التغييرات:</p>
                    <div className="space-y-2">
                      {amendment.changes?.map((change, index) => (
                        <div key={index} className="bg-slate-50 rounded-lg p-3">
                          <p className="font-medium text-sm mb-1">{change.field}</p>
                          <p className="text-sm text-slate-600">
                            <span className="line-through text-red-600">{change.old_value || "لا يوجد"}</span>
                            {" → "}
                            <span className="text-green-600 font-medium">{change.new_value}</span>
                          </p>
                          {change.reason && (
                            <p className="text-xs text-slate-500 mt-1">السبب: {change.reason}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Signatures */}
                  <div className="flex items-center gap-6 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      {amendment.client_signature ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <Clock className="w-5 h-5 text-amber-500" />
                      )}
                      <span className="text-sm">توقيع العميل</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {amendment.engineer_signature ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <Clock className="w-5 h-5 text-amber-500" />
                      )}
                      <span className="text-sm">توقيع المهندس</span>
                    </div>
                  </div>

                  {/* Sign Button */}
                  {amendment.status === "pending" && !amendment.client_signature && !amendment.engineer_signature && (
                    <Button
                      onClick={() => handleSignAmendment(amendment)}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600"
                    >
                      <CheckCircle className="w-4 h-4 ml-2" />
                      الموافقة والتوقيع على التعديل
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {amendments.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <FileEdit className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-semibold mb-2">لا توجد تعديلات</h3>
                <p className="text-slate-600">لم يتم إجراء أي تعديلات على هذا العقد بعد</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}