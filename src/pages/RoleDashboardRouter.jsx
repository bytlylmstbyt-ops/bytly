import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import EngineerDashboard from "./EngineerDashboard";
import ClientDashboard from "./ClientDashboard";
import ContractorDashboard from "./ContractorDashboard";
import SupplierDashboard from "./SupplierDashboard";
import FirmDashboard from "./FirmDashboard";
import ConsultantDashboard from "./ConsultantDashboard";
import LegalConsultantProfile from "./LegalConsultantProfile";
import InvestorHub from "./InvestorHub";
import { Loader2 } from "lucide-react";

const ROLE_ENTITY_MAP = [
  ["engineer", "Engineer", EngineerDashboard],
  ["client", "Client", ClientDashboard],
  ["contractor", "Contractor", ContractorDashboard],
  ["supplier", "Supplier", SupplierDashboard],
  ["firm", "EngineeringFirm", FirmDashboard],
  ["consultant", "Consultant", ConsultantDashboard],
  ["legal_consultant", "LegalConsultant", LegalConsultantProfile],
];

export default function RoleDashboardRouter() {
  const [state, setState] = useState({ loading: true, component: null, error: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const user = await base44.auth.me();
        const email = user?.email;
        if (!email) throw new Error("No authenticated user");
        const explicitRole = String(user.role || user.user_metadata?.role || user.user_metadata?.account_type || "").toLowerCase();

        const checks = await Promise.all(ROLE_ENTITY_MAP.map(async ([role, entity, Component]) => {
          try {
            const rows = await base44.entities[entity].filter({ email });
            return rows?.length ? { role, Component, profile: rows[0] } : null;
          } catch { return null; }
        }));

        let match = checks.find(Boolean);
        if (match?.role === "client" && match.profile?.client_type === "investor") {
          match = { ...match, Component: InvestorHub };
        }
        if (!match && explicitRole) {
          const byRole = ROLE_ENTITY_MAP.find(([role]) => role === explicitRole);
          if (byRole) match = { role: byRole[0], Component: byRole[2] };
          if (explicitRole === "investor" || explicitRole === "developer") {
            match = { role: explicitRole, Component: InvestorHub };
          }
        }
        if (!match) throw new Error("Account type not resolved");
        if (!cancelled) setState({ loading: false, component: match.Component, error: null });
      } catch (error) {
        console.error("Role dashboard routing error:", error);
        if (!cancelled) setState({ loading: false, component: null, error: "تعذر تحديد نوع الحساب لفتح لوحة التحكم." });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (state.loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50" dir="rtl"><Loader2 className="w-10 h-10 animate-spin text-[#C9A66B]" /></div>;
  if (!state.component) return <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4" dir="rtl"><div className="max-w-md w-full rounded-2xl bg-white shadow-lg p-8 text-center"><h2 className="text-xl font-bold text-[#1a1a2e] mb-3">لوحة التحكم</h2><p className="text-slate-600">{state.error}</p></div></div>;

  const Component = state.component;
  return <Component />;
}