import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Building2, CheckCircle, Clock, AlertCircle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MasterProgressDashboard({ projects }) {
  const [projectsWithMilestones, setProjectsWithMilestones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMilestonesData();
  }, [projects]);

  const loadMilestonesData = async () => {
    try {
      const enrichedProjects = await Promise.all(
        projects.map(async (project) => {
          const milestones = await base44.entities.ProjectMilestone.filter(
            { project_id: project.id },
            "order"
          );
          
          const completedMilestones = milestones.filter(m => m.status === "approved").length;
          const progress = milestones.length > 0 ? (completedMilestones / milestones.length) * 100 : 0;
          
          return {
            ...project,
            milestones,
            completedMilestones,
            totalMilestones: milestones.length,
            progress
          };
        })
      );
      
      setProjectsWithMilestones(enrichedProjects);
    } catch (error) {
      console.error("Error loading milestones:", error);
    } finally {
      setLoading(false);
    }
  };

  const getProjectStatusIcon = (project) => {
    if (project.status === "completed") return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (project.status === "in_progress") return <Clock className="w-5 h-5 text-blue-600" />;
    return <AlertCircle className="w-5 h-5 text-slate-400" />;
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-200 rounded-lg" />)}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-[#C9A66B]" />
          شريط إنجاز جميع المشاريع
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {projectsWithMilestones.map((project) => (
            <div
              key={project.id}
              className="p-4 rounded-xl border hover:border-[#C9A66B] transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  {getProjectStatusIcon(project)}
                  <div>
                    <h4 className="font-semibold text-[#1a1a2e]">{project.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">{project.location}</p>
                  </div>
                </div>
                <Badge className={
                  project.project_type === "full_construction" 
                    ? "bg-blue-100 text-blue-700" 
                    : "bg-green-100 text-green-700"
                }>
                  {project.project_type === "full_construction" ? "بناء كامل" : "خدمة سريعة"}
                </Badge>
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">التقدم</span>
                  <span className="font-medium">
                    {project.completedMilestones} / {project.totalMilestones} مراحل
                  </span>
                </div>
                <Progress value={project.progress} className="h-2" />
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  الميزانية: {project.budget_max?.toLocaleString('ar-SA')} ر.س
                </div>
                <Link to={createPageUrl("ProjectDetails") + `?id=${project.id}`}>
                  <Button size="sm" variant="outline">
                    <Eye className="w-4 h-4 ml-2" />
                    عرض التفاصيل
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}