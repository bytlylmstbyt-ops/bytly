import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Loader2, BarChart3, TrendingUp, Clock, 
  DollarSign, CheckCircle, Filter, Calendar,
  Users, Briefcase
} from "lucide-react";
import ProjectPerformanceChart from "@/components/analytics/ProjectPerformanceChart";
import EngineerAnalytics from "@/components/analytics/EngineerAnalytics";
import FinancialAnalytics from "@/components/analytics/FinancialAnalytics";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [clients, setClients] = useState([]);
  const [user, setUser] = useState(null);
  
  // Filters
  const [selectedEngineer, setSelectedEngineer] = useState("all");
  const [selectedClient, setSelectedClient] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      const [projectsData, engineersData, clientsData] = await Promise.all([
        base44.entities.Project.list(),
        base44.entities.Engineer.list(),
        base44.entities.Client.list()
      ]);

      setProjects(projectsData);
      setEngineers(engineersData);
      setClients(clientsData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  const filteredProjects = projects.filter(project => {
    const engineerMatch = selectedEngineer === "all" || project.assigned_engineer_id === selectedEngineer;
    const clientMatch = selectedClient === "all" || project.client_id === selectedClient;
    
    let dateMatch = true;
    if (dateFrom && project.created_date) {
      dateMatch = dateMatch && new Date(project.created_date) >= new Date(dateFrom);
    }
    if (dateTo && project.created_date) {
      dateMatch = dateMatch && new Date(project.created_date) <= new Date(dateTo);
    }

    return engineerMatch && clientMatch && dateMatch;
  });

  // Calculate metrics
  const totalProjects = filteredProjects.length;
  const completedProjects = filteredProjects.filter(p => p.status === "completed").length;
  const inProgressProjects = filteredProjects.filter(p => p.status === "in_progress").length;
  const avgProjectValue = filteredProjects.reduce((sum, p) => sum + (p.budget_max || 0), 0) / (totalProjects || 1);
  
  const projectsWithDuration = filteredProjects.filter(p => 
    p.status === "completed" && p.created_date && p.updated_date
  );
  const avgDuration = projectsWithDuration.length > 0
    ? projectsWithDuration.reduce((sum, p) => {
        const start = new Date(p.created_date);
        const end = new Date(p.updated_date);
        return sum + Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      }, 0) / projectsWithDuration.length
    : 0;

  const onTimeProjects = filteredProjects.filter(p => {
    if (p.status !== "completed" || !p.deadline || !p.updated_date) return false;
    return new Date(p.updated_date) <= new Date(p.deadline);
  }).length;
  const onTimeRate = completedProjects > 0 ? (onTimeProjects / completedProjects * 100) : 0;

  const clearFilters = () => {
    setSelectedEngineer("all");
    setSelectedClient("all");
    setDateFrom("");
    setDateTo("");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#6B5D4F]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-8" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1a1a2e] mb-2">
            لوحة التحليلات والإحصائيات
          </h1>
          <p className="text-slate-600">تحليل شامل لأداء المشاريع والمهندسين</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              تصفية البيانات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label>المهندس</Label>
                <Select value={selectedEngineer} onValueChange={setSelectedEngineer}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المهندس" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع المهندسين</SelectItem>
                    {engineers.map(eng => (
                      <SelectItem key={eng.id} value={eng.id}>
                        {eng.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>العميل</Label>
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر العميل" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع العملاء</SelectItem>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>من تاريخ</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>

              <div>
                <Label>إلى تاريخ</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" onClick={clearFilters}>
                مسح الفلاتر
              </Button>
              <div className="text-sm text-slate-600 flex items-center">
                عرض {filteredProjects.length} من {projects.length} مشروع
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#1a1a2e]">{totalProjects}</p>
                  <p className="text-sm text-slate-600">إجمالي المشاريع</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#1a1a2e]">{completedProjects}</p>
                  <p className="text-sm text-slate-600">مشاريع مكتملة</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#1a1a2e]">{Math.round(avgDuration)}</p>
                  <p className="text-sm text-slate-600">متوسط المدة (يوم)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#1a1a2e]">
                    {Math.round(avgProjectValue).toLocaleString('ar-SA')}
                  </p>
                  <p className="text-sm text-slate-600">متوسط القيمة (ريال)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-green-600 mb-1">
                  {Math.round(onTimeRate)}%
                </p>
                <p className="text-sm text-slate-600">نسبة الإكمال في الوقت المحدد</p>
                <p className="text-xs text-slate-500 mt-1">
                  ({onTimeProjects} من {completedProjects} مشروع)
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-blue-600 mb-1">{inProgressProjects}</p>
                <p className="text-sm text-slate-600">مشاريع قيد التنفيذ</p>
                <p className="text-xs text-slate-500 mt-1">
                  {totalProjects > 0 ? Math.round(inProgressProjects / totalProjects * 100) : 0}% من الإجمالي
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="w-8 h-8 text-amber-600" />
                </div>
                <p className="text-3xl font-bold text-amber-600 mb-1">{engineers.length}</p>
                <p className="text-sm text-slate-600">مهندسين نشطين</p>
                <p className="text-xs text-slate-500 mt-1">
                  {clients.length} عميل
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white shadow-sm p-1">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">نظرة عامة</span>
            </TabsTrigger>
            <TabsTrigger value="engineers" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">تحليل المهندسين</span>
            </TabsTrigger>
            <TabsTrigger value="financial" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              <span className="hidden sm:inline">التحليل المالي</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <ProjectPerformanceChart projects={filteredProjects} />
          </TabsContent>

          <TabsContent value="engineers">
            <EngineerAnalytics 
              projects={filteredProjects} 
              engineers={engineers}
            />
          </TabsContent>

          <TabsContent value="financial">
            <FinancialAnalytics projects={filteredProjects} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}