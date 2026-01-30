import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Save, Loader2, Trash2 } from "lucide-react";

export default function TaskDetailModal({ task, project, engineers, isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState(task || {});
  const [isSaving, setIsSaving] = useState(false);
  const [newComment, setNewComment] = useState("");

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    const currentUser = await base44.auth.me();
    const updatedComments = [
      ...(formData.comments || []),
      {
        author_email: currentUser.email,
        text: newComment,
        created_at: new Date().toISOString()
      }
    ];

    setFormData({ ...formData, comments: updatedComments });
    setNewComment("");
  };

  if (!isOpen) return null;

  const engineer = engineers.find(e => e.id === formData.assigned_to);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>تفاصيل المهمة</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Title and Description */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">العنوان</label>
              <Input
                value={formData.title || ""}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">الوصف</label>
              <Textarea
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          {/* Assignment and Dates */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">المسؤول</label>
              <Select
                value={formData.assigned_to || ""}
                onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر مهندس" />
                </SelectTrigger>
                <SelectContent>
                  {engineers.map((eng) => (
                    <SelectItem key={eng.id} value={eng.id}>
                      {eng.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">الأولوية</label>
              <Select
                value={formData.priority || "medium"}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">منخفضة</SelectItem>
                  <SelectItem value="medium">متوسطة</SelectItem>
                  <SelectItem value="high">عالية</SelectItem>
                  <SelectItem value="urgent">عاجلة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">تاريخ الاستحقاق</label>
              <Input
                type="date"
                value={formData.due_date || ""}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">الساعات المتوقعة</label>
              <Input
                type="number"
                value={formData.estimated_hours || ""}
                onChange={(e) => setFormData({ ...formData, estimated_hours: parseFloat(e.target.value) })}
              />
            </div>
          </div>

          {/* Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">نسبة الإنجاز</label>
              <span className="text-sm font-semibold text-[#d4a574]">{formData.progress_percentage || 0}%</span>
            </div>
            <Slider
              value={[formData.progress_percentage || 0]}
              onValueChange={(value) => setFormData({ ...formData, progress_percentage: value[0] })}
              max={100}
              step={10}
            />
          </div>

          {/* Comments Section */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                التعليقات
              </h4>

              <div className="space-y-3 max-h-48 overflow-y-auto">
                {formData.comments?.map((comment, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-slate-50 rounded-lg"
                  >
                    <p className="text-xs text-slate-600 font-medium">{comment.author_email}</p>
                    <p className="text-sm text-slate-800 mt-1">{comment.text}</p>
                    <p className="text-xs text-slate-500 mt-2">
                      {new Date(comment.created_at).toLocaleDateString('ar-SA')}
                    </p>
                  </motion.div>
                ))}
              </div>

              <div className="flex gap-2">
                <Textarea
                  placeholder="أضف تعليق..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={2}
                />
                <Button
                  size="sm"
                  onClick={handleAddComment}
                  variant="outline"
                >
                  إضافة
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-gradient-to-r from-blue-600 to-indigo-600"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 ml-2" />
                  حفظ
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}