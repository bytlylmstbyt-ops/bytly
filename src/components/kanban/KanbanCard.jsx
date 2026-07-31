import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Flag, Users, MessageCircle, Paperclip } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function KanbanCard({ task, engineer, onClick }) {
  const getPriorityColor = (priority) => {
    const colors = {
      low: "bg-blue-100 text-blue-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-orange-100 text-orange-800",
      urgent: "bg-red-100 text-red-800"
    };
    return colors[priority] || "bg-gray-100 text-gray-800";
  };

  const getStatusColor = (status) => {
    const colors = {
      todo: "bg-slate-100 text-slate-800",
      in_progress: "bg-blue-100 text-blue-800",
      review: "bg-purple-100 text-purple-800",
      done: "bg-green-100 text-green-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const isOverdue = task.due_date && new Date(task.due_date) < new Date();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      onClick={onClick}
      className="cursor-pointer select-none"
    >
      <Card className={`p-4 hover:shadow-lg transition-all border-l-4 ${
        isOverdue ? 'border-l-red-500 bg-red-50' : 'border-l-[#C9A66B]'
      }`}>
        <div className="space-y-3">
          {/* Title */}
          <h4 className="font-semibold text-sm text-slate-900 line-clamp-2">
            {task.title}
          </h4>

          {/* Badges */}
          <div className="flex gap-2 flex-wrap">
            <Badge className={getPriorityColor(task.priority)}>
              {task.priority === 'low' ? 'منخفضة' :
               task.priority === 'medium' ? 'متوسطة' :
               task.priority === 'high' ? 'عالية' : 'عاجلة'}
            </Badge>
            {isOverdue && (
              <Badge className="bg-red-100 text-red-800">متأخرة</Badge>
            )}
          </div>

          {/* Description Preview */}
          {task.description && (
            <p className="text-xs text-slate-600 line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Metadata */}
          <div className="space-y-2 text-xs text-slate-600">
            {task.due_date && (
              <div className="flex items-center gap-2">
                <Calendar className="w-3 h-3" />
                <span>{new Date(task.due_date).toLocaleDateString('ar-SA')}</span>
              </div>
            )}

            {task.estimated_hours && (
              <div className="flex items-center gap-2">
                <Flag className="w-3 h-3" />
                <span>{task.estimated_hours} ساعات</span>
              </div>
            )}
          </div>

          {/* Bottom Section */}
          <div className="flex items-center justify-between pt-2 border-t">
            {/* Engineer Avatar */}
            {engineer && (
              <Avatar className="w-6 h-6">
                <AvatarImage src={engineer.profile_image} />
                <AvatarFallback className="text-xs bg-[#C9A66B] text-white">
                  {engineer.full_name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
            )}

            {/* Indicators */}
            <div className="flex items-center gap-2">
              {task.comments?.length > 0 && (
                <div className="flex items-center gap-1 text-slate-500">
                  <MessageCircle className="w-3 h-3" />
                  <span className="text-xs">{task.comments.length}</span>
                </div>
              )}
              {task.attachments?.length > 0 && (
                <div className="flex items-center gap-1 text-slate-500">
                  <Paperclip className="w-3 h-3" />
                  <span className="text-xs">{task.attachments.length}</span>
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {task.progress_percentage > 0 && (
            <div className="w-full bg-slate-200 rounded-full h-1.5">
              <div
                className="bg-gradient-to-r from-[#C9A66B] to-[#1a1a2e] h-1.5 rounded-full transition-all"
                style={{ width: `${task.progress_percentage}%` }}
              />
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}