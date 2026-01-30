import React from "react";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, MessageSquare, Calendar } from "lucide-react";

const getIconForType = (type) => {
  switch (type) {
    case "call":
      return Phone;
    case "email":
      return Mail;
    case "meeting":
      return Calendar;
    default:
      return MessageSquare;
  }
};

export default function InteractionTimeline({ interactions, clientEmail }) {
  const clientInteractions = interactions.filter(i => i.client_email === clientEmail);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">سجل التفاعلات</h3>
      {clientInteractions.length === 0 ? (
        <p className="text-slate-500">لا توجد تفاعلات محسجلة</p>
      ) : (
        <div className="space-y-3">
          {clientInteractions.map((interaction) => {
            const Icon = getIconForType(interaction.interaction_type);
            return (
              <div key={interaction.id} className="flex gap-4 p-3 border rounded-lg hover:bg-slate-50">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                    <Icon className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-medium">{interaction.title}</p>
                  <p className="text-sm text-slate-600">{interaction.content}</p>
                  <div className="flex gap-2 mt-2">
                    {interaction.sentiment && (
                      <Badge className={interaction.sentiment === 'positive' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {interaction.sentiment}
                      </Badge>
                    )}
                    {interaction.priority && (
                      <Badge variant="outline">{interaction.priority}</Badge>
                    )}
                  </div>
                </div>
                <div className="text-right text-xs text-slate-500">
                  {new Date(interaction.interaction_date).toLocaleDateString("ar-SA")}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}