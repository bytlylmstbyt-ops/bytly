import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import {
  Scale, FileSignature, Download, Loader2, FileText, CheckCircle2,
  Clock, Plus, Eye
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ElectronicSignModal from "@/components/contracts/ElectronicSignModal";
import { logWorkspaceActivity } from "@/components/project/logWorkspaceActivity";

const CONTRACT_STATUS = {
  draft: { label: "مسودة", color: "bg-slate-100 text-slate-600" },
  pending_signature: { label: "بانتظار التوقيع", color: "bg-amber-100 text-amber-700" },
  signed: { label: "موقّع", color: "bg-green-100 text-green-700" },
  active: { label: "ساري المفعول", color: "bg-green-100 text-green-700" },
  completed: { label: "مكتمل", color: "bg-blue-100 text-blue-700" },
  terminated: { label: "منتهي", color: "bg-red-100 text-red-700" },
  archived: { label: "مؤرشف", color: "bg-slate-100 text-slate-500" },
};

export default function ProjectContractSection({
  project, contracts, user, userEngineer, userClient, onUpdated
}) {
  const [creating, setCreating] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);

  if (!user) return null;

  const isClient = project.created_by === user.email;
  const isEngineer = userEngineer && project.assigned_engineer_id === userEngineer.id;
  const canManage = isClient || isEngineer || user.role === "admin";

  const hasContracts = contracts && contracts.length > 0;
  const activeContract = hasContracts ? contracts[0] : null;
  const status = activeContract ? CONTRACT_STATUS[activeContract.status] : null;

  const handleCreateContract = async () => {
    setCreating(true);
    try {
      const response = await base44.functions.invoke("autoGenerateContract", {
        project_id: project.id,
      });
      if (response.data?.success || response.data?.contract_id) {
        onUpdated?.();
      }
    } catch (err) {
      console.error("Contract creation failed:", err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Card className="border-0 shadow-lg" id="project-contract">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-[#C9A66B]" />
            العقد القانوني
          </span>
          {activeContract && (
            <Badge className={status?.color}>{status?.label}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasContracts ? (
          /* لا يوجد عقد — زر إنشاء */
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-3">
              <Scale className="w-7 h-7 text-slate-300" />
            </div>
            <p className="text-slate-600 font-medium mb-1">لا يوجد عقد بعد</p>
            <p className="text-sm text-slate-400 mb-4">
              أنشئ عقداً رسمياً لضمان حقوق الطرفين وتوثيق الالتزامات
            </p>
            {canManage && (
              <Button
                onClick={handleCreateContract}
                disabled={creating}
                className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white gap-2"
              >
                {creating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                إنشاء عقد
              </Button>
            )}
          </div>
        ) : (
          /* يوجد عقد — خيارات العرض والتوقيع والتحميل */
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                  <FileText className="w-5 h-5 text-[#C9A66B]" />
                </div>
                <div>
                  <p className="font-medium text-slate-800 text-sm">
                    عقد #{(activeContract.id || "").slice(-6)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {activeContract.total_amount?.toLocaleString()} ر.س
                    {activeContract.contract_type === "project_start" ? " — عقد بدء مشروع" : " — اتفاقية خدمات"}
                  </p>
                </div>
              </div>
              {activeContract.contract_pdf_url && (
                <a
                  href={activeContract.contract_pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg bg-white flex items-center justify-center hover:bg-slate-100"
                >
                  <Download className="w-4 h-4 text-slate-600" />
                </a>
              )}
            </div>

            {/* إجراءات حسب الحالة */}
            <div className="flex flex-wrap gap-2">
              <Link to={createPageUrl("MyContracts")} className="flex-1">
                <Button variant="outline" className="w-full gap-2">
                  <Eye className="w-4 h-4" />
                  عرض العقد
                </Button>
              </Link>

              {activeContract.status === "pending_signature" && canManage && (
                <Button
                  onClick={() => setShowSignModal(true)}
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white gap-2"
                >
                  <FileSignature className="w-4 h-4" />
                  توقيع إلكتروني
                </Button>
              )}

              {activeContract.status === "signed" || activeContract.status === "active" ? (
                <div className="flex-1 flex items-center justify-center gap-2 p-2 rounded-lg bg-green-50 text-green-700 text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  تم توقيع العقد
                </div>
              ) : activeContract.status === "draft" || activeContract.status === "pending_signature" ? (
                <div className="flex-1 flex items-center justify-center gap-2 p-2 rounded-lg bg-amber-50 text-amber-700 text-sm">
                  <Clock className="w-4 h-4" />
                  بانتظار التوقيع
                </div>
              ) : null}
            </div>
          </div>
        )}
      </CardContent>

      {/* Electronic Sign Modal */}
      {showSignModal && activeContract && (
        <ElectronicSignModal
          contract={activeContract}
          project={project}
          client={userClient}
          engineer={userEngineer}
          currentUser={user}
          onClose={() => setShowSignModal(false)}
          onDone={async () => {
            setShowSignModal(false);
            const isClientUser = project.created_by === user.email;
            const bothSigned = isClientUser
              ? activeContract.engineer_signature
              : activeContract.client_signature;
            await logWorkspaceActivity({
              projectId: project.id,
              user,
              activityType: bothSigned ? "contract_signed" : "contract_updated",
              summary: bothSigned
                ? `تم توقيع عقد المشروع من الطرفين وأصبح سارياً`
                : `وقّع ${isClientUser ? "العميل" : "المهندس"} على عقد المشروع — بانتظار الطرف الآخر`,
              entityType: "contract",
              entityId: activeContract.id,
              entityTitle: `عقد #${(activeContract.id || "").slice(-6)}`,
            });
            onUpdated?.();
          }}
        />
      )}
    </Card>
  );
}