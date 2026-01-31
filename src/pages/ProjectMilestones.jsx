import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle, Clock, Upload, DollarSign } from "lucide-react";
import { motion } from "framer-motion";
import { sendNotification } from "@/components/notifications/NotificationHelper";

export default function ProjectMilestones() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get("id");

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [user, setUser] = useState(null);
  const [isEngineer, setIsEngineer] = useState(false);
  const [engineer, setEngineer] = useState(null);
  const [client, setClient] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [projectData] = await base44.entities.Project.filter({ id: projectId });
      setProject(projectData);

      const milestonesData = await base44.entities.ProjectMilestone.filter(
        { project_id: projectId },
        "order"
      );
      setMilestones(milestonesData);

      const [engineerData] = await base44.entities.Engineer.filter({ 
        id: projectData.assigned_engineer_id 
      });
      setEngineer(engineerData);
      setIsEngineer(engineerData?.email === currentUser.email);

      const [clientData] = await base44.entities.Client.filter({ 
        id: projectData.client_id 
      });
      setClient(clientData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const approveMilestone = async (milestone) => {
    try {
      await base44.entities.ProjectMilestone.update(milestone.id, {
        client_approved: true,
        payment_released: true,
        status: "approved"
      });

      // Update engineer balance
      await base44.entities.Engineer.update(engineer.id, {
        available_balance: (engineer.available_balance || 0) + milestone.amount
      });

      // Create transaction
      await base44.entities.Transaction.create({
        user_id: engineer.email,
        type: "escrow_release",
        amount: milestone.amount,
        status: "completed",
        description: `تحرير دفعة: ${milestone.title}`,
        project_id: projectId
      });

      // Notify engineer
      await sendNotification({
        recipientEmail: engineer.email,
        title: "تم تحرير دفعة مرحلة",
        message: `تم تحرير ${milestone.amount.toLocaleString('ar-SA')} ريال لمرحلة: ${milestone.title}`,
        type: "payment",
        projectId: projectId,
        priority: "high"
      });

      await loadData();
    } catch (error) {
      console.error("Error approving milestone:", error);
      alert("حدث خطأ في الموافقة");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#d4a574]" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-slate-600">المشروع غير موجود</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completedMilestones = milestones.filter(m => m.status === "approved").length;
  const progress = milestones.length > 0 ? (completedMilestones / milestones.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-[#1a1a2e] mb-2">
              مراحل المشروع
            </h1>
            <p className="text-slate-600">{project.title}</p>
          </div>

          {/* Progress Overview */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">التقدم الكلي</span>
                  <span className="text-sm text-slate-600">
                    {completedMilestones} من {milestones.length} مراحل مكتملة
                  </span>
                </div>
                <Progress value={progress} className="h-3" />
              </div>
            </CardContent>
          </Card>

          {/* Milestones List */}
          <div className="space-y-4">
            {milestones.map((milestone, index) => (
              <motion.div
                key={milestone.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={milestone.status === "approved" ? "border-green-300 bg-green-50/30" : ""}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="outline" className="text-xs">
                            المرحلة {milestone.order}
                          </Badge>
                          {milestone.status === "approved" && (
                            <Badge className="bg-green-600 text-white text-xs">
                              <CheckCircle className="w-3 h-3 ml-1" />
                              مكتملة
                            </Badge>
                          )}
                          {milestone.status === "in_progress" && (
                            <Badge className="bg-blue-600 text-white text-xs">
                              <Clock className="w-3 h-3 ml-1" />
                              قيد التنفيذ
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg">{milestone.title}</CardTitle>
                        {milestone.description && (
                          <p className="text-sm text-slate-600 mt-2">{milestone.description}</p>
                        )}
                      </div>
                      <div className="text-left">
                        <p className="text-2xl font-bold text-green-600">
                          {milestone.amount.toLocaleString('ar-SA')} ريال
                        </p>
                        <p className="text-xs text-slate-500">{milestone.percentage}% من المبلغ</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {milestone.deliverable_url && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800 mb-2">المخرج النهائي:</p>
                        <a
                          href={milestone.deliverable_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          عرض الملف
                        </a>
                      </div>
                    )}

                    {!isEngineer && milestone.deliverable_url && !milestone.client_approved && (
                      <Button
                        onClick={() => approveMilestone(milestone)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="w-4 h-4 ml-2" />
                        الموافقة وتحرير الدفعة
                      </Button>
                    )}

                    {milestone.payment_released && (
                      <div className="flex items-center gap-2 text-green-600 text-sm">
                        <DollarSign className="w-4 h-4" />
                        <span>تم تحرير الدفعة للمهندس</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}