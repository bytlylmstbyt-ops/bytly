import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import { 
  FileText, Loader2, CheckCircle, Calendar, DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

export default function ContractGenerator({ project, engineer, client }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [contractData, setContractData] = useState({
    contract_type: "service_agreement",
    total_amount: project?.escrow_amount || 0,
    start_date: new Date().toISOString().split("T")[0],
    delivery_date: project?.deadline || "",
    payment_terms: "30% دفعة مقدمة، 40% عند التصاميم الأولية، 30% عند التسليم النهائي",
    additional_terms: "",
    custom_clauses: []
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    const data = await base44.entities.ContractTemplate.filter({ is_active: true });
    setTemplates(data);
  };

  const handleTemplateSelect = (templateId) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      setContractData({
        ...contractData,
        contract_type: template.contract_type,
        payment_terms: template.default_payment_terms || contractData.payment_terms,
        additional_terms: template.default_terms || "",
        custom_clauses: template.custom_clauses || []
      });
    }
  };

  const handleInputChange = (field, value) => {
    setContractData(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);

    const contractNumber = `BYT-${Date.now().toString().slice(-8)}`;

    const contract = await base44.entities.Contract.create({
      project_id: project.id,
      client_id: client.id,
      engineer_id: engineer.id,
      contract_number: contractNumber,
      ...contractData,
      status: "pending_signature",
      client_signature: false,
      engineer_signature: false
    });

    setIsGenerating(false);
    setIsOpen(false);
    
    // Navigate to contract page
    navigate(createPageUrl("Contract") + `?id=${contract.id}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-[#1a1a2e] to-[#d4a574] text-white">
          <FileText className="w-5 h-5 ml-2" />
          إنشاء عقد
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>إنشاء عقد جديد</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 mt-4">
          {/* Template Selection */}
          {templates.length > 0 && (
            <div className="space-y-2">
              <Label>استخدام قالب جاهز (اختياري)</Label>
              <Select onValueChange={handleTemplateSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر قالب..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTemplate && (
                <p className="text-sm text-slate-600">
                  {selectedTemplate.description}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>نوع العقد</Label>
            <Select
              value={contractData.contract_type}
              onValueChange={(value) => handleInputChange("contract_type", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="project_start">عقد بدء مشروع</SelectItem>
                <SelectItem value="service_agreement">عقد اتفاق تقديم خدمات</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="total_amount">القيمة الإجمالية (ر.س)</Label>
            <div className="relative">
              <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                id="total_amount"
                type="number"
                value={contractData.total_amount}
                onChange={(e) => handleInputChange("total_amount", parseFloat(e.target.value))}
                className="pr-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">تاريخ البدء</Label>
              <Input
                id="start_date"
                type="date"
                value={contractData.start_date}
                onChange={(e) => handleInputChange("start_date", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="delivery_date">تاريخ التسليم</Label>
              <Input
                id="delivery_date"
                type="date"
                value={contractData.delivery_date}
                onChange={(e) => handleInputChange("delivery_date", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_terms">شروط الدفع</Label>
            <Textarea
              id="payment_terms"
              value={contractData.payment_terms}
              onChange={(e) => handleInputChange("payment_terms", e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="additional_terms">بنود إضافية (اختياري)</Label>
            <Textarea
              id="additional_terms"
              value={contractData.additional_terms}
              onChange={(e) => handleInputChange("additional_terms", e.target.value)}
              placeholder="أي شروط أو بنود إضافية..."
              rows={3}
            />
          </div>

          <div className="bg-blue-50 border-r-4 border-blue-500 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              سيتم إنشاء عقد قانوني ملزم بين الطرفين. 
              بعد إنشاء العقد، سيتم إرساله للتوقيع من كلا الطرفين.
            </p>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-[#1a1a2e] to-[#d4a574] text-white py-6"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin ml-2" />
                جاري إنشاء العقد...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 ml-2" />
                إنشاء العقد
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}