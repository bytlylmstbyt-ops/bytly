import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { supabase } from "@/lib/supabaseClient";

const ROLE_ROUTES = {
  investor: `${createPageUrl("RegisterClient")}?type=investor`,
  client: `${createPageUrl("RegisterClient")}?type=individual`,
  engineer: `${createPageUrl("RegisterEngineer")}?type=engineer`,
  surveyor: `${createPageUrl("RegisterEngineer")}?type=surveyor`,
  firm: createPageUrl("RegisterFirm"),
  legal: createPageUrl("RegisterLegalConsultant"),
  consultant: createPageUrl("RegisterConsultant"),
  contractor: createPageUrl("RegisterContractor"),
  supplier: createPageUrl("RegisterSupplier"),
};

const REGISTRATION_PATHS = [
  "/RegisterClient", "/RegisterEngineer", "/RegisterFirm", "/RegisterLegalConsultant",
  "/RegisterConsultant", "/RegisterContractor", "/RegisterSupplier", "/RegistrationSuccess"
];

async function hasRoleProfile(userId, role) {
  const checks = [];
  if (role === "engineer" || role === "surveyor") checks.push(supabase.from("engineers").select("id").eq("user_id", userId).limit(1));
  if (role === "client" || role === "investor") checks.push(supabase.from("clients").select("id").eq("user_id", userId).limit(1));
  if (role === "firm") checks.push(supabase.from("engineering_firms").select("id").eq("owner_user_id", userId).limit(1));
  if (!checks.length) return null;
  const results = await Promise.all(checks);
  if (results.some(r => r.error && !/permission|policy|relation/i.test(r.error.message || ""))) return false;
  return results.some(r => Array.isArray(r.data) && r.data.length > 0);
}

export default function RegistrationGate({ children }) {
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [pending, setPending] = useState(false);
  const [destination, setDestination] = useState(createPageUrl("RegisterChoice"));

  useEffect(() => {
    let active = true;
    const check = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData?.session?.user;
        if (!user) { if (active) setPending(false); return; }

        const metaRole = user.user_metadata?.registration_role || user.user_metadata?.role;
        const rawPending = localStorage.getItem("bytly_registration_pending");
        let storedRole = null;
        try { storedRole = JSON.parse(rawPending || "{}").role; } catch {}
        const role = storedRole || metaRole;
        if (!role || !ROLE_ROUTES[role]) { if (active) setPending(false); return; }

        const complete = await hasRoleProfile(user.id, role);
        if (complete === true) {
          localStorage.removeItem("bytly_registration_pending");
          if (active) setPending(false);
          return;
        }

        // If Supabase has not yet got a role table for this role, only a locally-started
        // registration is considered pending; this keeps existing migrated users untouched.
        const locallyPending = !!rawPending;
        if (active) {
          setDestination(ROLE_ROUTES[role]);
          setPending(complete === false || locallyPending);
        }
      } finally {
        if (active) setChecking(false);
      }
    };
    check();
    return () => { active = false; };
  }, [location.pathname]);

  if (checking) return null;
  if (!pending || REGISTRATION_PATHS.includes(location.pathname)) return children;
  return <Navigate to={destination} replace state={{ registrationRequired: true }} />;
}
