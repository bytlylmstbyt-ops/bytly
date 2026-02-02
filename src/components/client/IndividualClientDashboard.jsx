import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { 
  Home, Briefcase, Clock, CheckCircle, Plus, HelpCircle,
  FileText, Calendar, MessageSquare, TrendingUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function IndividualClientDashboard({ client, stats, recentProjects }) {
  const onboardingSteps = [
    { title: "تحديد احتياجاتك", completed: true, icon: Home },
    { title: "اختيار مهندس", completed: stats.totalProjects > 0, icon: Briefcase },
    { title: "مراجعة التصاميم", completed: stats.inProgressProjects > 0, icon: FileText },
    { title: "بدء التنفيذ", completed: stats.completedProjects > 0, icon: TrendingUp }
  ];

  const completedSteps = onboardingSteps.filter(s => s.completed).length;
  const progress = (completedSteps / onboardingSteps.length) * 100;

  const educationalTips = [
    {
      title: "ما هو التصميم الداخلي؟",
      description: "التصميم الداخلي هو فن تخطيط وتنسيق المساحات الداخلية لتحقيق راحتك وجمال منزلك"
    },
    {
      title: "متى أحتاج لمهندس معماري؟",
      description: "عند بناء منزل جديد أو إجراء تعديلات كبيرة على الهيكل الإنشائي"
    },
    {
      title: "كيف تعمل المراحل؟",
      description: "يتم تقسيم المشروع لمراحل، كل مرحلة يتم اعتمادها ودفعها بشكل منفصل لضمان الجودة"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-6 text-white"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">مرحباً، {client.full_name}!</h2>
            <p className="text-amber-50">لنبدأ رحلة تصميم منزل أحلامك معاً</p>
          </div>
          <Home className="w-12 h-12 opacity-20" />
        </div>
      </motion.div>

      {/* Onboarding Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#d4a574]" />
            رحلتك مع بيتلي
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">التقدم الكلي</span>
              <span className="text-sm text-slate-600">{completedSteps} من {onboardingSteps.length}</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {onboardingSteps.map((step, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  step.completed ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'
                }`}
              >
                {step.completed ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <Clock className="w-5 h-5 text-slate-400" />
                )}
                <span className={`text-sm font-medium ${step.completed ? 'text-green-700' : 'text-slate-600'}`}>
                  {step.title}
                </span>
              </div>
            ))}
          </div>

          {!stats.totalProjects && (
            <Link to={createPageUrl("CreateProject")} className="block mt-4">
              <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500">
                <Plus className="w-5 h-5 ml-2" />
                ابدأ مشروعك الأول
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>

      {/* Educational Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-[#d4a574]" />
            نصائح مفيدة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {educationalTips.map((tip, idx) => (
              <div key={idx} className="p-4 rounded-lg bg-blue-50 border border-blue-100">
                <h4 className="font-semibold text-blue-900 mb-1">{tip.title}</h4>
                <p className="text-sm text-blue-700">{tip.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Project */}
      {stats.totalProjects > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>مشروعك الحالي</CardTitle>
          </CardHeader>
          <CardContent>
            {recentProjects.slice(0, 1).map((project) => (
              <Link
                key={project.id}
                to={createPageUrl("ProjectDetails") + `?id=${project.id}`}
                className="block p-6 rounded-xl border-2 hover:border-[#d4a574] hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-bold text-[#1a1a2e]">{project.title}</h3>
                  <Badge className="bg-blue-100 text-blue-700">
                    {project.status === "open" ? "مفتوح" : 
                     project.status === "in_progress" ? "قيد التنفيذ" : "مكتمل"}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(project.created_date).toLocaleDateString('ar-SA')}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    {project.total_proposals || 0} عرض
                  </span>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}