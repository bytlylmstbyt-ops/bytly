import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Search, Loader2, FileCheck, Clock, 
  CheckCircle, XCircle, Filter, ArrowRight
} from "lucide-react";
import { motion } from "framer-motion";

export default function AllWithdrawalRequestsPage() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [engineers, setEngineers] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      
      // Check admin access
      if (user.role !== "admin") {
        alert("غير مصرح لك بالوصول لهذه الصفحة");
        return;
      }

      // Load all withdrawal requests
      const allRequests = await base44.entities.WithdrawalRequest.list("-created_date");
      setRequests(allRequests);

      // Load engineers data
      const engineerIds = [...new Set(allRequests.map(r => r.engineer_id))];
      const engineersData = await Promise.all(
        engineerIds.map(id => base44.entities.Engineer.filter({ id }))
      );
      
      const engineersMap = {};
      engineersData.forEach(data => {
        if (data.length > 0) {
          engineersMap[data[0].id] = data[0];
        }
      });
      setEngineers(engineersMap);

    } catch (error) {
      console.error("Error loading data:", error);
      alert("حدث خطأ في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: "قيد الانتظار", color: "bg-amber-100 text-amber-800", icon: Clock },
      processing: { label: "قيد المعالجة", color: "bg-blue-100 text-blue-800", icon: Loader2 },
      completed: { label: "مكتمل", color: "bg-green-100 text-green-800", icon: CheckCircle },
      rejected: { label: "مرفوض", color: "bg-red-100 text-red-800", icon: XCircle }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 ml-1" />
        {config.label}
      </Badge>
    );
  };

  const filteredRequests = requests.filter(request => {
    const engineer = engineers[request.engineer_id];
    const matchesSearch = !searchQuery || 
      engineer?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.id?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#C9A66B]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-8 px-4" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-[#1a1a2e] mb-2">
              طلبات السحب
            </h1>
            <p className="text-slate-600">
              مراجعة واعتماد جميع طلبات السحب
            </p>
          </div>
          
          <Badge className="bg-blue-100 text-blue-800 text-lg py-2 px-4">
            {filteredRequests.length} طلب
          </Badge>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    placeholder="ابحث بالاسم أو رقم الطلب..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10"
                  />
                </div>

                {/* Status Filter */}
                <div className="flex gap-2">
                  {[
                    { value: "all", label: "الكل" },
                    { value: "pending", label: "قيد الانتظار" },
                    { value: "processing", label: "قيد المعالجة" },
                    { value: "completed", label: "مكتمل" },
                    { value: "rejected", label: "مرفوض" }
                  ].map(status => (
                    <Button
                      key={status.value}
                      variant={statusFilter === status.value ? "default" : "outline"}
                      onClick={() => setStatusFilter(status.value)}
                      className={statusFilter === status.value ? "bg-[#1a1a2e]" : ""}
                    >
                      {status.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Requests List */}
        <div className="space-y-4">
          {filteredRequests.length > 0 ? (
            filteredRequests.map((request, index) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="font-bold text-lg text-[#1a1a2e]">
                            {engineers[request.engineer_id]?.full_name || "مهندس"}
                          </h3>
                          {getStatusBadge(request.status)}
                          {request.consultant_approval && (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 ml-1" />
                              معتمد
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-slate-500">المبلغ:</span>
                            <p className="font-bold text-[#1a1a2e]">
                              {request.amount?.toLocaleString('ar-SA')} ريال
                            </p>
                          </div>
                          <div>
                            <span className="text-slate-500">البنك:</span>
                            <p className="font-medium">{request.bank_name}</p>
                          </div>
                          <div>
                            <span className="text-slate-500">التاريخ:</span>
                            <p className="font-medium">
                              {new Date(request.created_date).toLocaleDateString('ar-SA')}
                            </p>
                          </div>
                        </div>

                        {request.consultant_notes && (
                          <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                            <p className="text-sm text-slate-700">
                              <strong>ملاحظات المستشار:</strong> {request.consultant_notes}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <Link to={createPageUrl("ConsultantApproval") + `?id=${request.id}`}>
                          <Button className="bg-gradient-to-r from-[#1a1a2e] to-[#C9A66B] text-white w-full">
                            <FileCheck className="w-4 h-4 ml-2" />
                            مراجعة
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Filter className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">لا توجد طلبات مطابقة للبحث</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}