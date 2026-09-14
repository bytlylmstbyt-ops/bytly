import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mail, Phone, Building2, Briefcase, ChevronRight } from "lucide-react";

const STATUS_COLOR = {
  lead:      "bg-blue-100 text-blue-700",
  active:    "bg-green-100 text-green-700",
  inactive:  "bg-slate-100 text-slate-600",
  churned:   "bg-red-100 text-red-700",
};
const STATUS_LABEL = { lead: "عميل محتمل", active: "نشط", inactive: "غير نشط", churned: "منسحب" };

export default function ClientCard({ client, interactionCount = 0, projectCount = 0, onClick }) {
  return (
    <Card className="hover:shadow-md transition-all cursor-pointer group" onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="w-11 h-11 shrink-0">
            <AvatarFallback className="text-white font-bold" style={{ background: client.color || "#6B5D4F" }}>
              {(client.full_name || client.name || "?").charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-slate-800 truncate">{client.full_name || client.name}</h3>
              <Badge className={`text-xs ${STATUS_COLOR[client.crm_status] || STATUS_COLOR.lead}`}>
                {STATUS_LABEL[client.crm_status] || "عميل محتمل"}
              </Badge>
            </div>
            {client.company && (
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <Building2 className="w-3 h-3" />{client.company}
              </p>
            )}
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <Mail className="w-3 h-3" />{client.email}
            </p>
            {client.phone && (
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <Phone className="w-3 h-3" />{client.phone}
              </p>
            )}
            <div className="flex gap-3 mt-2">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Briefcase className="w-3 h-3" />{projectCount} مشروع
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Mail className="w-3 h-3" />{interactionCount} تفاعل
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0 mt-1" />
        </div>
      </CardContent>
    </Card>
  );
}