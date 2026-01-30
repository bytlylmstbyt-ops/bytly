import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Search, Loader2, Award, Eye, 
  CheckCircle, Clock, Filter
} from "lucide-react";
import { motion } from "framer-motion";

export default function AllCertificationsPage() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [engineers, setEngineers] = useState({});
  const [clients, setClients] = useState({});
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

      // Load all certified projects
      const allProjects = await base44.entities.Project.filter({
        status: "technical_approved"
      }, "-updated_date");
      
      setProjects(allProjects);

      // Load engineers and clients
      const engineerIds = [...new Set(allProjects.map(p => p.assigned_engineer_id).filter(Boolean))];
      const clientIds = [...new Set(allProjects.map(p => p.client_id).filter(Boolean))];

      const [engineersData, clientsData] = await Promise.all([
        Promise.all(engineerIds.map(id => base44.entities.Engineer.filter({ id }))),
        Promise.all(clientIds.map(id => base44.entities.Client.filter({ id })))
      ]);

      const engineersMap = {};
      engineersData.forEach(data => {
        if (data.length > 0) engineersMap[data[0].id] = data[0];
      });
      setEngineers(engineersMap);

      const clientsMap = {};
      clientsData.forEach(data => {
        if (data.length > 0) clientsMap[data[0].id] = data[0];
      });
      setClients(clientsMap);

    } catch (error) {
      console.error("Error loading data:", error);
      alert("حدث خطأ في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (project) => {
    if (project.client_final_approval) {
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 ml-1" />
          مكتمل
        </Badge>
      );
    }
    return (
      <Badge className="bg-blue-100 text-blue-800">
        <Clock className="w-3 h-3 ml-1" />
        قيد الاعتماد النهائي
      </Badge>
    );
  };

  const filteredProjects = projects.filter(project => {
    const engineer = engineers[project.assigned_engineer_id];
    const client = clients[project.client_id];
    
    const matchesSearch = !searchQuery || 
      project.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      engineer?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "completed" && project.client_final_approval) ||
      (statusFilter === "pending" && !project.client_final_approval);
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#d4a574]" />
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
              شهادات الجودة والاعتماد
            </h1>
            <p className="text-slate-600">
              جميع المشاريع المعتمدة فنياً
            </p>
          </div>
          
          <Badge className="bg-green-100 text-green-800 text-lg py-2 px-4">
            {filteredProjects.length} شهادة
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
                    placeholder="ابحث بالمشروع أو المهندس أو العميل..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10"
                  />
                </div>

                {/* Status Filter */}
                <div className="flex gap-2">
                  {[
                    { value: "all", label: "الكل" },
                    { value: "pending", label: "قيد الاعتماد" },
                    { value: "completed", label: "مكتمل" }
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

        {/* Projects Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {filteredProjects.length > 0 ? (
            filteredProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:shadow-xl transition-all border-2 border-[#d4a574]/20">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#1a1a2e] to-[#d4a574] flex items-center justify-center flex-shrink-0">
                        <Award className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-[#1a1a2e] mb-1">
                          {project.title}
                        </h3>
                        {getStatusBadge(project)}
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">المصمم:</span>
                        <span className="font-medium">
                          {engineers[project.assigned_engineer_id]?.full_name || "غير محدد"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">العميل:</span>
                        <span className="font-medium">
                          {clients[project.client_id]?.full_name || "غير محدد"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">المبلغ:</span>
                        <span className="font-bold text-[#1a1a2e]">
                          {project.escrow_amount?.toLocaleString('ar-SA')} ريال
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">تاريخ الاعتماد:</span>
                        <span className="font-medium">
                          {new Date(project.technical_review_date || project.updated_date).toLocaleDateString('ar-SA')}
                        </span>
                      </div>
                    </div>

                    <Link to={createPageUrl("CertificationPage") + `?id=${project.id}`}>
                      <Button className="w-full bg-gradient-to-r from-[#1a1a2e] to-[#d4a574] text-white">
                        <Eye className="w-4 h-4 ml-2" />
                        عرض الشهادة
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <div className="col-span-2">
              <Card>
                <CardContent className="py-12 text-center">
                  <Filter className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">لا توجد شهادات مطابقة للبحث</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}