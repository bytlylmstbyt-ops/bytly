import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, FolderGit2, ScrollText, Wallet, History, Inbox } from "lucide-react";

const fmtMoney = (v) => (v != null ? Number(v).toLocaleString("ar-SA") + " ر.س" : "—");

const safe = async (fn) => { try { return await fn(); } catch { return []; } };

export default function ProviderRelatedDialog({
  provider, providerKey, nameField, open, onOpenChange, initialTab,
}) {
  const [tab, setTab] = useState(initialTab || "projects");
  const [projects, setProjects] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (initialTab) setTab(initialTab); }, [initialTab]);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    (async () => {
      setLoading(true);
      const pid = provider.id;
      const email = provider.email;

      // Projects — best effort by type
      let projs = [];
      if (providerKey === "Contractor") {
        const cs = await safe(() => base44.entities.Contract.filter({ contractor_id: pid }));
        const ids = [...new Set(cs.map((c) => c.project_id).filter(Boolean))];
        for (const id of ids) {
          const p = await safe(() => base44.entities.Project.get(id));
          if (p && p.id) projs.push(p);
        }
      } else if (providerKey === "Consultant") {
        projs = await safe(() => base44.entities.Project.filter({ technical_consultant_id: pid }));
      } else if (providerKey === "LegalConsultant") {
        projs = await safe(() => base44.entities.Project.filter({ legal_consultant_id: pid }));
      }

      // Contracts / reviews
      let related = [];
      if (providerKey === "Contractor") {
        related = await safe(() => base44.entities.Contract.filter({ contractor_id: pid }));
      } else if (providerKey === "Consultant") {
        related = await safe(() => base44.entities.TechnicalReview.filter({ consultant_id: pid }));
      }

      // Transactions
      const txns = email ? await safe(() => base44.entities.Transaction.filter({ user_email: email })) : [];

      // Activity log
      const logs = email ? await safe(() => base44.entities.TaskActivityLog.filter({ actor_email: email })) : [];

      if (alive) {
        setProjects(projs); setContracts(related); setTransactions(txns); setActivity(logs);
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [open, provider, providerKey]);

  const name = provider[nameField] || "بدون اسم";

  const Empty = ({ label }) => (
    <div className="py-10 text-center text-slate-400 flex flex-col items-center gap-2">
      <Inbox className="w-8 h-8" />
      <p className="text-sm">{label}</p>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>البيانات المرتبطة — {name}</DialogTitle>
          <DialogDescription>المشاريع والعقود والمدفوعات وسجل النشاط لمقدم الخدمة</DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="projects" className="gap-1.5"><FolderGit2 className="w-3.5 h-3.5" /> المشاريع</TabsTrigger>
            <TabsTrigger value="contracts" className="gap-1.5"><ScrollText className="w-3.5 h-3.5" /> العقود</TabsTrigger>
            <TabsTrigger value="payments" className="gap-1.5"><Wallet className="w-3.5 h-3.5" /> المدفوعات</TabsTrigger>
            <TabsTrigger value="activity" className="gap-1.5"><History className="w-3.5 h-3.5" /> النشاط</TabsTrigger>
          </TabsList>

          {loading ? (
            <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 text-[#C9A66B] animate-spin" /></div>
          ) : (
            <>
              <TabsContent value="projects" className="max-h-[50vh] overflow-y-auto mt-3">
                {projects.length === 0 ? <Empty label="لا توجد مشاريع مرتبطة" /> : (
                  <div className="space-y-2">
                    {projects.map((p) => (
                      <div key={p.id} className="border border-slate-100 rounded-lg p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-[#4A3F35] text-sm">{p.title}</p>
                          <Badge variant="outline" className="bg-slate-50">{p.status}</Badge>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-1">{p.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="contracts" className="max-h-[50vh] overflow-y-auto mt-3">
                {contracts.length === 0 ? <Empty label="لا توجد عقود مرتبطة" /> : (
                  <div className="space-y-2">
                    {contracts.map((c) => (
                      <div key={c.id} className="border border-slate-100 rounded-lg p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-[#4A3F35] text-sm">
                            {providerKey === "Consultant" ? "مراجعة فنية" : "عقد"} {c.contract_number || ""}
                          </p>
                          <Badge variant="outline" className="bg-slate-50">{c.status || c.compliance_status || ""}</Badge>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {c.total_amount ? fmtMoney(c.total_amount) : c.consultant_fee ? fmtMoney(c.consultant_fee) : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="payments" className="max-h-[50vh] overflow-y-auto mt-3">
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <WalletStat label="رصيد المحفظة" value={provider.wallet_balance} />
                  <WalletStat label="الرصيد المتاح" value={provider.available_balance} />
                  <WalletStat label="الرصيد المعلق" value={provider.pending_balance} />
                </div>
                {transactions.length === 0 ? <Empty label="لا توجد معاملات" /> : (
                  <div className="space-y-2">
                    {transactions.slice(0, 30).map((t) => (
                      <div key={t.id} className="border border-slate-100 rounded-lg p-3 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-[#4A3F35] text-sm">{t.type}</p>
                          <p className="text-xs text-slate-400">{t.description}</p>
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-sm text-[#4A3F35]">{fmtMoney(t.amount)}</p>
                          <Badge variant="outline" className="bg-slate-50 mt-1">{t.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="activity" className="max-h-[50vh] overflow-y-auto mt-3">
                {activity.length === 0 ? <Empty label="لا يوجد سجل نشاط" /> : (
                  <div className="space-y-2">
                    {activity.slice(0, 30).map((a) => (
                      <div key={a.id} className="border border-slate-100 rounded-lg p-3">
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="outline" className="bg-slate-50">{a.action_type}</Badge>
                          <span className="text-xs text-slate-400">
                            {a.created_date ? new Date(a.created_date).toLocaleDateString("ar-SA") : ""}
                          </span>
                        </div>
                        <p className="text-sm text-[#4A3F35] mt-1">{a.summary || a.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function WalletStat({ label, value }) {
  return (
    <div className="rounded-lg bg-[#F5F0E8] p-3 text-center">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-sm font-bold text-[#4A3F35]">{fmtMoney(value)}</p>
    </div>
  );
}