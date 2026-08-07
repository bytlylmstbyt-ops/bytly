import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  MapPin, Calendar, DollarSign, Clock, Users, Files, Scale,
  CreditCard, Kanban, TrendingUp, User, MessageSquare
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const PHASES = {
  design: { label: "التصميم", order: 1 },
  permits: { label: "التراخيص", order: 2 },
  execution: { label: "التنفيذ", order: 3 },
  delivery: { label: "التسليم", order: 4 },
};

const PHASE_ORDER = ["design", "permits", "execution", "delivery"];

export default function ProjectOverviewTab({
  project, proposals, contracts, transactions, engineers, user, userEngineer, userClient,
  onScrollToProposals, onScrollToContract, onScrollToPayments, onScrollToFiles, onScrollToChat,
}) {
  const assignedEngineer = engineers?.[project.assigned_engineer_id];
  const hasContract = contracts && contracts.length > 0;
  const activeContract = hasContract ? contracts[0] : null;
  const totalFiles = (project.attachments || []).length;
  const totalPaid = (transactions || []).filter(t => t.status === "completed").reduce((s, t) => s + (t.amount || 0), 0);

  const currentPhaseIdx = PHASE_ORDER.indexOf(project.phase || "design");

  const stats = [
    { label: "العروض", value: proposals.length, icon: Users, color: "text-purple-600 bg-purple-50", action: onScrollToProposals },
    { label: "الملفات", value: totalFiles, icon: Files, color: "text-blue-600 bg-blue-50", action: onScrollToFiles },
    { label: "العقد", value: hasContract ? (activeContract.status === "signed" || activeContract.status === "active" ? "موقّع" : "مسودة") : "لا يوجد", icon: Scale, color: "text-indigo-600 bg-indigo-50", action: onScrollToContract },
    { label: "المدفوعات", value: `${totalPaid.toLocaleString()} ر.س`, icon: CreditCard, color: "text-green-600 bg-green-50", action: onScrollToPayments },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <button key={i} onClick={s.action} className="text-right">
              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow h-full">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${s.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 truncate">{s.label}</p>
                    <p className="font-bold text-slate-800 text-sm truncate">{s.value}</p>
                  </div>
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>

      {/* Description + Project Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-base">وصف المشروع</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 whitespace-pre-wrap leading-relaxed text-sm">
              {project.description}
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-base">معلومات المشروع</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(project.budget_min || project.budget_max) && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">الميزانية</p>
                  <p className="font-semibold text-sm">{project.budget_min?.toLocaleString()} - {project.budget_max?.toLocaleString()} ر.س</p>
                </div>
              </div>
            )}
            {project.location && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">الموقع</p>
                  <p className="font-semibold text-sm">{project.location}</p>
                </div>
              </div>
            )}
            {project.deadline && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">الموعد النهائي</p>
                  <p className="font-semibold text-sm">{new Date(project.deadline).toLocaleDateString("ar")}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">تاريخ النشر</p>
                <p className="font-semibold text-sm">{new Date(project.created_date).toLocaleDateString("ar", { year: "numeric", month: "long", day: "numeric" })}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Phase Progress */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#C9A66B]" />
            مسار المشروع
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-1 md:gap-2">
            {PHASE_ORDER.map((phase, idx) => {
              const isCurrent = idx === currentPhaseIdx;
              const isPassed = idx < currentPhaseIdx;
              return (
                <React.Fragment key={phase}>
                  <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isPassed ? "bg-green-500 text-white" :
                      isCurrent ? "bg-[#C9A66B] text-white ring-4 ring-[#C9A66B]/20" :
                      "bg-slate-100 text-slate-400"
                    }`}>
                      {isPassed ? "✓" : idx + 1}
                    </div>
                    <span className={`text-xs text-center truncate w-full ${isCurrent ? "font-bold text-[#C9A66B]" : isPassed ? "text-green-600" : "text-slate-400"}`}>
                      {PHASES[phase].label}
                    </span>
                    {isCurrent && project.phase_progress != null && (
                      <span className="text-xs text-slate-500">{project.phase_progress}%</span>
                    )}
                  </div>
                  {idx < PHASE_ORDER.length - 1 && (
                    <div className={`h-0.5 flex-1 rounded-full ${isPassed ? "bg-green-400" : "bg-slate-200"}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Team Members */}
      {(assignedEngineer || userClient) && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-base">فريق المشروع</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userClient && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={userClient.profile_image} />
                  <AvatarFallback className="bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] text-white"><User className="w-5 h-5" /></AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">العميل</p>
                  <p className="font-semibold text-sm truncate">{userClient.full_name}</p>
                </div>
              </div>
            )}
            {assignedEngineer && (
              <Link to={createPageUrl("EngineerProfile") + `?id=${assignedEngineer.id}`} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-[#C9A66B] transition-colors">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={assignedEngineer.profile_image} />
                  <AvatarFallback className="bg-gradient-to-br from-[#1a1a2e] to-[#C9A66B] text-white">{assignedEngineer.full_name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">المهندس المعيّن</p>
                  <p className="font-semibold text-sm truncate">{assignedEngineer.full_name}</p>
                </div>
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button onClick={onScrollToFiles} className="text-right">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow h-full">
            <CardContent className="p-3 flex items-center gap-2">
              <Files className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium">الملفات</span>
            </CardContent>
          </Card>
        </button>
        {project.status === "in_progress" && (
          <Link to={createPageUrl("ProjectKanban") + `?id=${project.id}`} className="text-right">
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow h-full">
              <CardContent className="p-3 flex items-center gap-2">
                <Kanban className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium">لوحة المهام</span>
              </CardContent>
            </Card>
          </Link>
        )}
        <button onClick={onScrollToChat} className="text-right">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow h-full">
            <CardContent className="p-3 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#C9A66B]" />
              <span className="text-sm font-medium">المحادثات</span>
            </CardContent>
          </Card>
        </button>
        <Link to={createPageUrl("ProjectMilestones") + `?id=${project.id}`} className="text-right">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow h-full">
            <CardContent className="p-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium">المراحل</span>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}