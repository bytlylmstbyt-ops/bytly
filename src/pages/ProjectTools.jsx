import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, FileText, Receipt, ArrowRight } from "lucide-react";
import GanttChart from "@/components/project-tools/GanttChart";
import DocumentManager from "@/components/project-tools/DocumentManager";
import AutoInvoiceGenerator from "@/components/project-tools/AutoInvoiceGenerator";
import { createPageUrl } from "@/utils";

export default function ProjectTools() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get("project");

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("gantt");

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      if (projectId) {
        const [projectData] = await base44.entities.Project.filter({ id: projectId });
        setProject(projectData);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#6B5D4F]" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">لم يتم العثور على المشروع</h3>
            <p className="text-slate-600 mb-4">الرجاء اختيار مشروع للوصول إلى الأدوات</p>
            <Button onClick={() => navigate(createPageUrl("Projects"))}>
              عرض المشاريع
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-8" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl("ProjectDetails") + "?id=" + projectId)}
            className="mb-4"
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            العودة للمشروع
          </Button>
          <h1 className="text-3xl font-bold text-[#1a1a2e] mb-2">
            أدوات إدارة المشروع
          </h1>
          <p className="text-slate-600">{project.title}</p>
        </div>

        {/* Tools Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white shadow-sm p-1">
            <TabsTrigger value="gantt" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">الجدول الزمني</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">المستندات</span>
            </TabsTrigger>
            <TabsTrigger value="invoices" className="flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              <span className="hidden sm:inline">الفواتير</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gantt">
            <GanttChart project={project} user={user} />
          </TabsContent>

          <TabsContent value="documents">
            <DocumentManager project={project} user={user} />
          </TabsContent>

          <TabsContent value="invoices">
            <AutoInvoiceGenerator project={project} user={user} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}