import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, Clock, CheckCircle, AlertTriangle, 
  FileText, Calendar, DollarSign, Upload, Eye
} from "lucide-react";
import { motion } from "framer-motion";
import moment from "moment";
import "moment/locale/ar";

moment.locale("ar");

export default function EngineerProjects() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [engineer, setEngineer] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const user = await base44.auth.me();
      const [engineerData] = await base44.entities.Engineer.filter({ email: user.email });
      setEngineer(engineerData);

      const projectsData = await base44.entities.Project.filter({
        assigned_engineer_id: engineerData.id
      }, "-created_date");

      setProjects(projectsData);
    } catch (error) {
      console.error("Error loading projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      in_progress: "bg-blue-100 text-blue-800",
      awaiting_technical_review: "bg-yellow-100 text-yellow-800",
      technical_approved: "bg-green-100 text-green-800",
      pending_client_approval: "bg-purple-100 text-purple-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      disputed: "bg-red-100 text-red-800"
    };
    return colors[status] || "bg-slate-100 text-slate-800";
  };

  const getStatusLabel = (status) => {
    const labels = {
      in_progress: "قيد التنفيذ",
      awaiting_technical_review: "بانتظار المراجعة الفنية",
      technical_approved: "معتمد فنياً",
      pending_client_approval: "بانتظار موافقة العميل",
      completed: "مكتمل",
      cancelled: "ملغي",
      disputed: "متنازع عليه"
    };
    return labels[status] || status;
  };

  const isOverdue = (deadline) => {
    return deadline && moment(deadline).isBefore(moment());
  };

  const filteredProjects = projects.filter(p => {
    if (filter === "all") return true;
    if (filter === "active") return ["in_progress", "awaiting_technical_review", "technical_approved", "pending_client_approval"].includes(p.status);
    if (filter === "overdue") return isOverdue(p.deadline) && p.status !== "completed";
    if (filter === "completed") return p.status === "completed";
    return true;
  });

  const stats = {
    total: projects.length,
    active: projects.filter(p => ["in_progress", "awaiting_technical_review", "technical_approved", "pending_client_approval"].includes(p.status)).length,
    overdue: projects.filter(p => isOverdue(p.deadline) && p.status !== "completed").length,
    completed: projects.filter(p => p.status === "completed").length
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#C9A66B]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-[#1a1a2e] mb-2">
              مشاريعي
            </h1>
            <p className="text-slate-600">إدارة ومتابعة المشاريع الجارية</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="hover-lift cursor-pointer" onClick={() => setFilter("all")}>
              <CardContent className="pt-6">
                <div className="text-center">
                  <FileText className="w-8 h-8 text-[#6B5D4F] mx-auto mb-2" />
                  <p className="text-2xl font-bold text-[#1a1a2e]">{stats.total}</p>
                  <p className="text-sm text-slate-600">إجمالي المشاريع</p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-lift cursor-pointer" onClick={() => setFilter("active")}>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Clock className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-600">{stats.active}</p>
                  <p className="text-sm text-slate-600">قيد التنفيذ</p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-lift cursor-pointer" onClick={() => setFilter("overdue")}>
              <CardContent className="pt-6">
                <div className="text-center">
                  <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
                  <p className="text-sm text-slate-600">متأخرة</p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-lift cursor-pointer" onClick={() => setFilter("completed")}>
              <CardContent className="pt-6">
                <div className="text-center">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                  <p className="text-sm text-slate-600">مكتملة</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2 mb-6 overflow-x-auto">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
              size="sm"
            >
              الكل
            </Button>
            <Button
              variant={filter === "active" ? "default" : "outline"}
              onClick={() => setFilter("active")}
              size="sm"
            >
              قيد التنفيذ
            </Button>
            <Button
              variant={filter === "overdue" ? "default" : "outline"}
              onClick={() => setFilter("overdue")}
              size="sm"
            >
              متأخرة
            </Button>
            <Button
              variant={filter === "completed" ? "default" : "outline"}
              onClick={() => setFilter("completed")}
              size="sm"
            >
              مكتملة
            </Button>
          </div>

          {/* Projects List */}
          <div className="space-y-4">
            {filteredProjects.length > 0 ? (
              filteredProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className={`hover-lift ${isOverdue(project.deadline) && project.status !== "completed" ? "border-2 border-red-300" : ""}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-2">{project.title}</CardTitle>
                          <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                            {project.description}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <Badge className={getStatusColor(project.status)}>
                              {getStatusLabel(project.status)}
                            </Badge>
                            {isOverdue(project.deadline) && project.status !== "completed" && (
                              <Badge className="bg-red-100 text-red-700">
                                <AlertTriangle className="w-3 h-3 ml-1" />
                                متأخر
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="text-xl font-bold text-green-600">
                            {project.escrow_amount?.toLocaleString('ar-SA')} ريال
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-600">
                            التسليم: {project.deadline ? moment(project.deadline).format("DD MMMM YYYY") : "غير محدد"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <FileText className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-600">
                            التعديلات: {project.revisions_count || 0} / {project.max_revisions || 3}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-600">
                            الضمان: {project.escrow_status === "held" ? "محجوز" : project.escrow_status}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Link to={createPageUrl("ProjectWorkspace") + `?id=${project.id}`} className="flex-1">
                          <Button className="w-full bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white">
                            <Upload className="w-4 h-4 ml-2" />
                            مساحة العمل
                          </Button>
                        </Link>
                        <Link to={createPageUrl("ProjectDetails") + `?id=${project.id}`}>
                          <Button variant="outline">
                            <Eye className="w-4 h-4 ml-2" />
                            التفاصيل
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : (
              <Card>
                <CardContent className="py-16 text-center">
                  <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">
                    لا توجد مشاريع
                  </h3>
                  <p className="text-slate-500">لم يتم العثور على مشاريع بهذا التصنيف</p>
                </CardContent>
              </Card>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}