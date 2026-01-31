import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldAlert, Plus, MessageSquare, FileText } from "lucide-react";

export default function MyDisputes() {
  const [user, setUser] = useState(null);
  const [disputes, setDisputes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const currentUser = await base44.auth.me();
    setUser(currentUser);

    const allDisputes = await base44.entities.Dispute.list("-created_date");
    const userDisputes = allDisputes.filter(
      d => d.raised_by === currentUser.email || d.raised_against === currentUser.email
    );
    setDisputes(userDisputes);
    setIsLoading(false);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      submitted: { label: "مقدم", color: "bg-blue-100 text-blue-800" },
      under_review: { label: "قيد المراجعة", color: "bg-yellow-100 text-yellow-800" },
      investigation: { label: "قيد التحقيق", color: "bg-orange-100 text-orange-800" },
      mediation: { label: "في الوساطة", color: "bg-purple-100 text-purple-800" },
      resolved: { label: "تم الحل", color: "bg-green-100 text-green-800" },
      closed: { label: "مغلق", color: "bg-slate-100 text-slate-800" },
      escalated: { label: "مصعّد", color: "bg-red-100 text-red-800" }
    };
    const config = statusConfig[status] || statusConfig.submitted;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getDisputeTypeLabel = (type) => {
    const types = {
      payment_issue: "مشكلة دفع",
      quality_issue: "مشكلة جودة",
      deadline_issue: "مشكلة مواعيد",
      contract_breach: "خرق عقد",
      communication_issue: "مشكلة تواصل",
      scope_change: "تغيير في النطاق",
      other: "أخرى"
    };
    return types[type] || type;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#C9A66B]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-[#C9A66B]" />
            <div>
              <h1 className="text-3xl font-bold text-slate-900">نزاعاتي</h1>
              <p className="text-slate-600">إدارة ومتابعة النزاعات</p>
            </div>
          </div>
          <Link to={createPageUrl("FileDispute")}>
            <Button className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white">
              <Plus className="w-5 h-5 ml-2" />
              تقديم نزاع جديد
            </Button>
          </Link>
        </div>

        {disputes.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <ShieldAlert className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-xl font-semibold mb-2">لا توجد نزاعات</h3>
              <p className="text-slate-500 mb-4">لم تقم بتقديم أي نزاعات حتى الآن</p>
              <Link to={createPageUrl("FileDispute")}>
                <Button variant="outline">تقديم نزاع</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {disputes.map((dispute) => (
              <Card key={dispute.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-lg">{dispute.title}</CardTitle>
                        {getStatusBadge(dispute.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span>{getDisputeTypeLabel(dispute.dispute_type)}</span>
                        <span>•</span>
                        <span>{new Date(dispute.created_date).toLocaleDateString('ar-SA')}</span>
                        <span>•</span>
                        <span className={
                          dispute.priority === 'urgent' ? 'text-red-600 font-medium' :
                          dispute.priority === 'high' ? 'text-orange-600' :
                          'text-slate-500'
                        }>
                          {dispute.priority === 'urgent' ? 'عاجل' :
                           dispute.priority === 'high' ? 'عالي' :
                           dispute.priority === 'medium' ? 'متوسط' : 'منخفض'}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 mb-4 line-clamp-2">{dispute.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      {dispute.evidence_files?.length > 0 && (
                        <span className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {dispute.evidence_files.length} مرفق
                        </span>
                      )}
                      {dispute.messages?.length > 0 && (
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          {dispute.messages.length} رسالة
                        </span>
                      )}
                    </div>
                    <Link to={createPageUrl(`DisputeDetails?id=${dispute.id}`)}>
                      <Button variant="outline" size="sm">
                        عرض التفاصيل
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}