import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, Mail, Calendar, Pencil, Trash2, Instagram, Linkedin, Twitter, Facebook, Globe } from "lucide-react";
import { format } from "date-fns";

const STATUS_CONFIG = {
  new:        { label: "جديد",         color: "bg-blue-100 text-blue-700" },
  contacted:  { label: "تم التواصل",   color: "bg-yellow-100 text-yellow-700" },
  interested: { label: "مهتم",          color: "bg-orange-100 text-orange-700" },
  contracted: { label: "تعاقد ✅",      color: "bg-green-100 text-green-700" },
  lost:       { label: "خسارة",         color: "bg-red-100 text-red-600" },
};

const STATUS_OPTIONS = [
  { value: "new",        label: "جديد" },
  { value: "contacted",  label: "تم التواصل" },
  { value: "interested", label: "مهتم" },
  { value: "contracted", label: "تعاقد" },
  { value: "lost",       label: "خسارة" },
];

const SOURCE_ICONS = {
  instagram: <Instagram className="w-3.5 h-3.5 text-pink-500" />,
  linkedin:  <Linkedin  className="w-3.5 h-3.5 text-blue-600" />,
  twitter:   <Twitter   className="w-3.5 h-3.5 text-sky-500" />,
  facebook:  <Facebook  className="w-3.5 h-3.5 text-blue-700" />,
  other:     <Globe     className="w-3.5 h-3.5 text-slate-500" />,
};

export default function LeadCard({ lead, onEdit, onDelete, onStatusChange }) {
  const status = STATUS_CONFIG[lead.status] || STATUS_CONFIG.new;

  return (
    <Card className="hover:shadow-md transition-shadow border border-slate-100">
      <CardContent className="p-4" dir="rtl">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">{lead.name}</span>
            <span className="flex items-center gap-1 text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border">
              {SOURCE_ICONS[lead.source] || SOURCE_ICONS.other}
              {lead.source}
            </span>
          </div>
          <Badge className={`text-xs font-medium ${status.color}`}>{status.label}</Badge>
        </div>

        <div className="space-y-1 text-sm text-slate-500 mb-3">
          {lead.phone && (
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" /> {lead.phone}
            </div>
          )}
          {lead.email && (
            <div className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> {lead.email}
            </div>
          )}
          {lead.project_type && (
            <div className="text-slate-600">📋 {lead.project_type} {lead.budget && `· ${lead.budget}`}</div>
          )}
          {lead.follow_up_date && (
            <div className="flex items-center gap-1.5 text-orange-500">
              <Calendar className="w-3.5 h-3.5" />
              متابعة: {format(new Date(lead.follow_up_date), "dd/MM/yyyy")}
            </div>
          )}
        </div>

        {lead.notes && (
          <p className="text-xs text-slate-400 bg-slate-50 rounded p-2 mb-3 line-clamp-2">
            💬 {lead.notes}
          </p>
        )}

        <div className="flex items-center gap-2">
          <Select value={lead.status} onValueChange={v => onStatusChange(lead.id, v)}>
            <SelectTrigger className="h-8 text-xs flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-slate-700" onClick={() => onEdit(lead)}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:text-red-600" onClick={() => onDelete(lead.id)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}