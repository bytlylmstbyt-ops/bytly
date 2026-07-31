import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { 
  FileText, Search, Filter, Download, Eye, 
  Calendar, User, Building2, CheckCircle, Clock,
  Archive, TrendingUp, FileCheck, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function ContractArchive() {
  const [contracts, setContracts] = useState([]);
  const [filteredContracts, setFilteredContracts] = useState([]);
  const [engineers, setEngineers] = useState({});
  const [clients, setClients] = useState({});
  const [projects, setProjects] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentUser, setCurrentUser] = useState(null);
  const [userType, setUserType] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterContracts();
  }, [contracts, searchQuery, statusFilter]);

  const loadData = async () => {
    setIsLoading(true);
    const user = await base44.auth.me();
    setCurrentUser(user);

    // Check user type
    const [engineerData, clientData] = await Promise.all([
      base44.entities.Engineer.filter({ email: user.email }),
      base44.entities.Client.filter({ email: user.email })
    ]);

    let userContracts = [];
    if (engineerData.length > 0) {
      setUserType("engineer");
      userContracts = await base44.entities.Contract.filter({ 
        engineer_id: engineerData[0].id 
      });
    } else if (clientData.length > 0) {
      setUserType("client");
      userContracts = await base44.entities.Contract.filter({ 
        client_id: clientData[0].id 
      });
    }

    setContracts(userContracts);

    // Load related data
    const engineerIds = [...new Set(userContracts.map(c => c.engineer_id))];
    const clientIds = [...new Set(userContracts.map(c => c.client_id))];
    const projectIds = [...new Set(userContracts.map(c => c.project_id))];

    const [engineersData, clientsData, projectsData] = await Promise.all([
      Promise.all(engineerIds.map(id => base44.entities.Engineer.filter({ id }))),
      Promise.all(clientIds.map(id => base44.entities.Client.filter({ id }))),
      Promise.all(projectIds.map(id => base44.entities.Project.filter({ id })))
    ]);

    const engineersMap = {};
    engineersData.forEach(data => {
      if (data[0]) engineersMap[data[0].id] = data[0];
    });
    setEngineers(engineersMap);

    const clientsMap = {};
    clientsData.forEach(data => {
      if (data[0]) clientsMap[data[0].id] = data[0];
    });
    setClients(clientsMap);

    const projectsMap = {};
    projectsData.forEach(data => {
      if (data[0]) projectsMap[data[0].id] = data[0];
    });
    setProjects(projectsMap);

    setIsLoading(false);
  };

  const filterContracts = () => {
    let filtered = contracts;

    if (searchQuery) {
      filtered = filtered.filter(contract => {
        const project = projects[contract.project_id];
        const engineer = engineers[contract.engineer_id];
        const client = clients[contract.client_id];
        
        return (
          contract.contract_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          engineer?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          client?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    setFilteredContracts(filtered);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { label: "مسودة", color: "bg-slate-100 text-slate-700" },
      pending_signature: { label: "في انتظار التوقيع", color: "bg-amber-100 text-amber-700" },
      signed: { label: "موقّع", color: "bg-green-100 text-green-700" },
      active: { label: "نشط", color: "bg-blue-100 text-blue-700" },
      completed: { label: "مكتمل", color: "bg-emerald-100 text-emerald-700" },
      terminated: { label: "منتهي", color: "bg-red-100 text-red-700" },
      archived: { label: "مؤرشف", color: "bg-purple-100 text-purple-700" }
    };
    
    const config = statusConfig[status] || statusConfig.draft;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getStats = () => {
    return {
      total: contracts.length,
      pending: contracts.filter(c => c.status === "pending_signature").length,
      active: contracts.filter(c => c.status === "active").length,
      completed: contracts.filter(c => c.status === "completed").length
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#C9A66B]"></div>
      </div>
    );
  }

  const stats = getStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-[#1a1a2e] flex items-center gap-3">
                <Archive className="w-8 h-8 text-[#C9A66B]" />
                أرشيف العقود
              </h1>
              <p className="text-slate-600 mt-2">جميع عقودك ومستنداتك القانونية</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <FileText className="w-8 h-8 text-blue-600" />
                  <Badge variant="secondary">الكل</Badge>
                </div>
                <p className="text-3xl font-bold text-[#1a1a2e]">{stats.total}</p>
                <p className="text-sm text-slate-500">إجمالي العقود</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Clock className="w-8 h-8 text-amber-600" />
                  <Badge className="bg-amber-100 text-amber-700">قيد الانتظار</Badge>
                </div>
                <p className="text-3xl font-bold text-[#1a1a2e]">{stats.pending}</p>
                <p className="text-sm text-slate-500">في انتظار التوقيع</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                  <Badge className="bg-blue-100 text-blue-700">نشط</Badge>
                </div>
                <p className="text-3xl font-bold text-[#1a1a2e]">{stats.active}</p>
                <p className="text-sm text-slate-500">عقد نشط</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <Badge className="bg-green-100 text-green-700">مكتمل</Badge>
                </div>
                <p className="text-3xl font-bold text-[#1a1a2e]">{stats.completed}</p>
                <p className="text-sm text-slate-500">عقد مكتمل</p>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Filters */}
        <Card className="border-0 shadow-lg mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="بحث برقم العقد، المشروع، أو الاسم..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="draft">مسودة</SelectItem>
                  <SelectItem value="pending_signature">في انتظار التوقيع</SelectItem>
                  <SelectItem value="signed">موقّع</SelectItem>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="completed">مكتمل</SelectItem>
                  <SelectItem value="terminated">منتهي</SelectItem>
                  <SelectItem value="archived">مؤرشف</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Contracts List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="w-6 h-6 text-[#C9A66B]" />
                العقود ({filteredContracts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredContracts.length > 0 ? (
                <div className="space-y-4">
                  {filteredContracts.map(contract => {
                    const project = projects[contract.project_id];
                    const engineer = engineers[contract.engineer_id];
                    const client = clients[contract.client_id];

                    return (
                      <Link
                        key={contract.id}
                        to={createPageUrl("Contract") + `?id=${contract.id}`}
                      >
                        <motion.div
                          whileHover={{ scale: 1.01 }}
                          className="border rounded-xl p-6 hover:shadow-lg transition-all bg-gradient-to-r from-white to-slate-50"
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-start gap-3 mb-3">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1a1a2e] to-[#C9A66B] flex items-center justify-center flex-shrink-0">
                                  <FileText className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold text-lg text-[#1a1a2e]">
                                      {contract.contract_type === "service_agreement" 
                                        ? "عقد تقديم خدمات" 
                                        : "عقد بدء مشروع"}
                                    </h3>
                                    {getStatusBadge(contract.status)}
                                  </div>
                                  <p className="text-sm text-slate-600 mb-2">
                                    رقم العقد: {contract.contract_number}
                                  </p>
                                  <p className="text-slate-700 font-medium">{project?.title}</p>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-slate-400" />
                                  <div>
                                    <p className="text-xs text-slate-500">العميل</p>
                                    <p className="text-sm font-medium">{client?.full_name}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Building2 className="w-4 h-4 text-slate-400" />
                                  <div>
                                    <p className="text-xs text-slate-500">المهندس</p>
                                    <p className="text-sm font-medium">{engineer?.full_name}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-slate-400" />
                                  <div>
                                    <p className="text-xs text-slate-500">تاريخ الإنشاء</p>
                                    <p className="text-sm font-medium">
                                      {new Date(contract.created_date).toLocaleDateString("ar")}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Signature Status */}
                              <div className="flex items-center gap-4 mt-4 pt-4 border-t">
                                <div className="flex items-center gap-2">
                                  {contract.client_signature ? (
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                  ) : (
                                    <Clock className="w-5 h-5 text-amber-500" />
                                  )}
                                  <span className="text-sm text-slate-600">
                                    توقيع العميل: {contract.client_signature ? "موقّع" : "في الانتظار"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {contract.engineer_signature ? (
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                  ) : (
                                    <Clock className="w-5 h-5 text-amber-500" />
                                  )}
                                  <span className="text-sm text-slate-600">
                                    توقيع المهندس: {contract.engineer_signature ? "موقّع" : "في الانتظار"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2">
                              <Button variant="outline" size="sm" className="w-full md:w-auto">
                                <Eye className="w-4 h-4 ml-2" />
                                عرض العقد
                              </Button>
                              {contract.contract_pdf_url && (
                                <Button variant="outline" size="sm" className="w-full md:w-auto">
                                  <Download className="w-4 h-4 ml-2" />
                                  تحميل PDF
                                </Button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-600 text-lg mb-2">لا توجد عقود</p>
                  <p className="text-slate-500 text-sm">
                    {searchQuery || statusFilter !== "all" 
                      ? "لم يتم العثور على عقود مطابقة للبحث" 
                      : "لم تقم بإنشاء أي عقود بعد"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}