import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Star, Pause } from "lucide-react";
import ProviderActionsMenu from "./ProviderActionsMenu";

const STATUS_BADGE = {
  approved: "bg-green-100 text-green-700 border-green-200",
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
};
const STATUS_LABEL = { approved: "معتمد", pending: "معلق", rejected: "مرفوض" };

const renderSub = (item, subField) => {
  const v = item[subField];
  if (Array.isArray(v)) return v.length ? v.join("، ") : "—";
  return v || "—";
};

export default function ProvidersTable({
  items, provider, providerKey, isAdmin, onUpdate, onDelete,
  selectable = false, selectedIds = [], onToggle, onToggleAll,
}) {
  const Icon = provider.icon;
  const selectedSet = new Set(selectedIds);
  const allSelected = items.length > 0 && items.every((it) => selectedSet.has(it.id));
  const someSelected = items.some((it) => selectedSet.has(it.id));

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#F5F0E8] text-[#4A3F35] text-right">
              {selectable && (
                <th className="px-3 py-3 w-10 text-center">
                  <Checkbox
                    checked={allSelected ? true : someSelected ? "indeterminate" : false}
                    onCheckedChange={() => onToggleAll?.(items.map((i) => i.id))}
                  />
                </th>
              )}
              <th className="px-3 py-3 font-semibold whitespace-nowrap">الاسم / الشركة</th>
              <th className="px-3 py-3 font-semibold whitespace-nowrap">البريد الإلكتروني</th>
              <th className="px-3 py-3 font-semibold whitespace-nowrap">المدينة</th>
              <th className="px-3 py-3 font-semibold whitespace-nowrap">التخصص</th>
              <th className="px-3 py-3 font-semibold whitespace-nowrap">الهاتف</th>
              <th className="px-3 py-3 font-semibold whitespace-nowrap">الحالة</th>
              <th className="px-3 py-3 font-semibold whitespace-nowrap text-center sticky left-0 bg-[#F5F0E8]">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={selectable ? 8 : 7} className="py-12 text-center text-slate-400">
                  <Icon className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  لا يوجد سجلات مطابقة
                </td>
              </tr>
            ) : (
              items.map((item, idx) => {
                const suspended = item.is_available === false;
                const checked = selectedSet.has(item.id);
                return (
                  <tr key={item.id} className={`border-t border-slate-100 hover:bg-slate-50/60 ${idx % 2 ? "bg-white" : "bg-slate-50/30"} ${checked ? "ring-1 ring-inset ring-[#C9A66B]/40" : ""}`}>
                    {selectable && (
                      <td className="px-3 py-3 text-center">
                        <Checkbox checked={checked} onCheckedChange={() => onToggle?.(item.id)} />
                      </td>
                    )}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        {item.profile_image || item.company_logo ? (
                          <img src={item.profile_image || item.company_logo} alt="" className="w-8 h-8 rounded object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded bg-[#F5F0E8] flex items-center justify-center">
                            <Icon className="w-4 h-4 text-[#C9A66B]" />
                          </div>
                        )}
                        <span className="font-medium text-[#4A3F35]">{item[provider.nameField] || "—"}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-slate-600 whitespace-nowrap">{item.email || "—"}</td>
                    <td className="px-3 py-3 text-slate-600 whitespace-nowrap">{item.city || "—"}</td>
                    <td className="px-3 py-3 text-slate-600">{renderSub(item, provider.subField)}</td>
                    <td className="px-3 py-3 text-slate-600 whitespace-nowrap" dir="ltr">{item.phone || "—"}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1 flex-wrap">
                        <Badge variant="outline" className={STATUS_BADGE[item.status] || "bg-slate-100 text-slate-500"}>
                          {STATUS_LABEL[item.status] || item.status}
                        </Badge>
                        {item.is_verified && (
                          <Badge variant="outline" className="bg-[#C9A66B]/10 text-[#C9A66B] border-[#C9A66B]/20">
                            <Star className="w-3 h-3 ml-0.5" /> موثّق
                          </Badge>
                        )}
                        {suspended && (
                          <Badge variant="outline" className="bg-slate-100 text-slate-500 border-slate-200">
                            <Pause className="w-3 h-3 ml-0.5" /> معلّق
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center sticky left-0 bg-inherit">
                      <ProviderActionsMenu
                        provider={item}
                        providerKey={providerKey}
                        nameField={provider.nameField}
                        isAdmin={isAdmin}
                        onUpdate={onUpdate}
                        onDelete={onDelete}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}