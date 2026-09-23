import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import EngineerDashboard from "./EngineerDashboard";
import ClientDashboard from "./ClientDashboard";
import ContractorDashboard from "./ContractorDashboard";
import SupplierDashboard from "./SupplierDashboard";
import FirmDashboard from "./FirmDashboard";
import ConsultantDashboard from "./ConsultantDashboard";
import LegalConsultantProfile from "./LegalConsultantProfile";
import InvestorHub from "./InvestorHub";
import { Loader2 } from "lucide-react";

const ROLE_TABLES = [
  ["engineer", "engineers", EngineerDashboard],
  ["client", "clients", ClientDashboard],
  ["contractor", "contractors", ContractorDashboard],
  ["supplier", "suppliers", SupplierDashboard],
  ["firm", "engineering_firms", FirmDashboard],
  ["consultant", "consultants", ConsultantDashboard],
  ["legal_consultant", "legal_consultants", LegalConsultantProfile],
];

const normalizeRole = (value) => {
  const role = String(value || "").trim().toLowerCase();
  if (["engineering_firm", "engineeringfirm", "firm"].includes(role)) return "firm";
  if (["legalconsultant", "legal-consultant", "lawyer"].includes(role)) return "legal_consultant";
  if (["developer", "investor"].includes(role)) return "investor";
  return role;
};

export default function RoleDashboardRouter() {
  const [state, setState] = useState({ loading: true, component: null, error: null });

  useEffect(() => {
    let cancelled = false;

    const resolveDashboard = async () => {
      try {
        if (!supabase) throw new Error("Supabase غير مهيأ");

        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        const user = authData?.user;
        if (!user?.id || !user?.email) throw new Error("No authenticated user");

        const email = user.email.trim().toLowerCase();
        const metadata = user.user_metadata || {};
        const explicitRole = normalizeRole(metadata.role || metadata.account_type || metadata.user_type);

        // The profile role is authoritative when present; provider tables are
        // checked as a compatibility fallback for migrated accounts.
        let profile = null;
        try {
          const byUser = await supabase.from("profiles").select("id,user_id,email,full_name,role").eq("user_id", user.id).maybeSingle();
          profile = byUser.data || null;
          if (!profile) {
            const byEmail = await supabase.from("profiles").select("id,user_id,email,full_name,role").ilike("email", email).maybeSingle();
            profile = byEmail.data || null;
          }
        } catch {}

        const profileRole = normalizeRole(profile?.role);
        let role = profileRole && profileRole !== "user" ? profileRole : explicitRole;

        if (!role || role === "user") {
          const matches = await Promise.all(ROLE_TABLES.map(async ([candidate, table]) => {
            try {
              const byUser = await supabase.from(table).select("*").eq("user_id", user.id).limit(1);
              if (byUser.data?.length) return { role: candidate, profile: byUser.data[0] };
              const byEmail = await supabase.from(table).select("*").ilike("email", email).limit(1);
              if (byEmail.data?.length) return { role: candidate, profile: byEmail.data[0] };
            } catch {}
            return null;
          }));
          const match = matches.find(Boolean);
          if (match) {
            role = match.role;
            profile = match.profile;
            if (role === "client" && String(profile?.client_type || "").toLowerCase() === "investor") role = "investor";
          }
        }

        if (role === "investor") {
          if (!cancelled) setState({ loading: false, component: InvestorHub, error: null });
          return;
        }

        const mapped = ROLE_TABLES.find(([candidate]) => candidate === role);
        if (!mapped) throw new Error("Account type not resolved");

        if (!cancelled) setState({ loading: false, component: mapped[2], error: null });
      } catch (error) {
        console.error("Role dashboard routing error:", error);
        if (!cancelled) setState({
          loading: false,
          component: null,
          error: "تعذر تحديد نوع الحساب لفتح لوحة التحكم."
        });
      }
    };

    resolveDashboard();
    return () => { cancelled = true; };
  }, []);

  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50" dir="rtl">
        <Loader2 className="w-10 h-10 animate-spin text-[#C9A66B]" />
      </div>
    );
  }

  if (!state.component) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4" dir="rtl">
        <div className="max-w-md w-full rounded-2xl bg-white shadow-lg p-8 text-center">
          <h2 className="text-xl font-bold text-[#1a1a2e] mb-3">لوحة التحكم</h2>
          <p className="text-slate-600">{state.error}</p>
        </div>
      </div>
    );
  }

  const Component = state.component;
  return <Component />;
}
