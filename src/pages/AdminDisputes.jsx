import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ShieldAlert, Search, AlertCircle } from "lucide-react";

export default function AdminDisputes() {
  const [disputes, setDisputes] = useState([]);
  const [filteredDisputes, setFilteredDisputes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  useEffect(() => {
    loadDisputes();
  }, []);

  useEffect(() => {
    filterDisputes();
  }, [searchQuery, statusFilter, priorityFilter, disputes]);

  const loadDisputes = async () => {
    const allDisputes = await base44.entities.Dispute.list("-created_date");
    setDisputes(allDisputes);
    setIsLoading(false);
  };

  const filterDisputes = () => {
    let filtered = [...disputes];

    if (searchQuery) {
      filtered = filtered.filter(d => 
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(d => d.status === statusFilter);
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter(d => d.priority === priorityFilter);
    }

    setFilteredDisputes(filtered);
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

  const stats = {
    total: disputes.length,
    active: disputes.filter(d => ['submitted', 'under_review', 'investigation', 'mediation'].includes(d.status)).length,
    resolved: disputes.filter(d => d.status === 'resolved').length,
    urgent: disputes.filter(d => d.priority === 'urgent' && !['resolved', 'closed'].includes(d.status)).length
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
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <ShieldAlert className="w-8 h-8 text-[#C9A66B]" />
            <div>
              <h1 className="text-3xl font-bold text-slate-900">إدارة النزاعات</h1>
              <p className="text-slate-600">مراجعة وحل النزاعات بين العملاء والمهندسين</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-[#6B5D4F]">{stats.total}</p>
                  <p className="text-sm text-slate-600">إجمالي النزاعات</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">{stats.active}</p>
                  <p className="text-sm text-slate-600">نزاعات نشطة</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">{stats.resolved}</p>
                  <p className="text-sm text-slate-600">تم حلها</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-600">{stats.urgent}</p>
                  <p className="text-sm text-slate-600">عاجلة</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="بحث في النزاعات..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الحالات</SelectItem>
                  <SelectItem value="submitted">مقدم</SelectItem>
                  <SelectItem value="under_review">قيد المراجعة</SelectItem>
                  <SelectItem value="investigation">قيد التحقيق</SelectItem>
                  <SelectItem value="mediation">في الوساطة</SelectItem>
                  <SelectItem value="resolved">تم الحل</SelectItem>
                  <SelectItem value="closed">مغلق</SelectItem>
                  <SelectItem value="escalated">مصعّد</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="الأولوية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الأولويات</SelectItem>
                  <SelectItem value="urgent">عاجل</SelectItem>
                  <SelectItem value="high">عالي</SelectItem>
                  <SelectItem value="medium">متوسط</SelectItem>
                  <SelectItem value="low">منخفض</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {filteredDisputes.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <AlertCircle className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-xl font-semibold mb-2">لا توجد نزاعات</h3>
              <p className="text-slate-500">لم يتم العثور على نزاعات مطابقة للفلاتر المحددة</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredDisputes.map((dispute) => (
              <Card key={dispute.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{dispute.title}</h3>
                        {getStatusBadge(dispute.status)}
                        {dispute.priority === 'urgent' && (
                          <Badge className="bg-red-100 text-red-800">عاجل</Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mb-3 line-clamp-2">{dispute.description}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>تاريخ التقديم: {new Date(dispute.created_date).toLocaleDateString('ar-SA')}</span>
                        <span>•</span>
                        <span>رفعه: {dispute.raised_by}</span>
                        {dispute.assigned_admin && (
                          <>
                            <span>•</span>
                            <span>المسؤول: {dispute.assigned_admin}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <Link to={createPageUrl(`AdminDisputeManage?id=${dispute.id}`)}>
                      <Button size="sm" className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B]">
                        إدارة النزاع
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