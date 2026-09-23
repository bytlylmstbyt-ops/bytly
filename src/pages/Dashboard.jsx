import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import EngineerDashboard from "./EngineerDashboard";
import ClientDashboard from "./ClientDashboard";
import ContractorDashboard from "./ContractorDashboard";
import SupplierDashboard from "./SupplierDashboard";
import FirmDashboard from "./FirmDashboard";
import ConsultantDashboard from "./ConsultantDashboard";

function Loading() {
  return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#C9A66B]" /></div>;
}

export default function Dashboard() {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: profile } = await supabase.from("profiles").select("role").or(`user_id.eq.${user.id},id.eq.${user.id}`).maybeSingle();
        if (mounted) setRole(profile?.role || user.user_metadata?.role || "client");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);
  if (loading) return <Loading />;
  switch (role) {
    case "engineer": return <EngineerDashboard />;
    case "contractor": return <ContractorDashboard />;
    case "supplier": return <SupplierDashboard />;
    case "firm":
    case "engineering_firm":
    case "consulting_firm": return <FirmDashboard />;
    case "consultant":
    case "technical_consultant": return <ConsultantDashboard />;
    default: return <ClientDashboard />;
  }
}