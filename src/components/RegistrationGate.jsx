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
  "/RegisterClient",
  "/RegisterEngineer",
  "/RegisterFirm",
  "/RegisterLegalConsultant",
  "/RegisterConsultant",
  "/RegisterContractor",
  "/RegisterSupplier",
  "/RegistrationSuccess",
];

export default function RegistrationGate({ children }) {
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [pending, setPending] = useState(false);
  const [destination, setDestination] = useState(createPageUrl("RegisterChoice"));

  useEffect(() => {
    let active = true;
    const check = async () => {
      try {
        const raw = localStorage.getItem("bytly_registration_pending");
        if (!raw) {
          if (active) setPending(false);
          return;
        }

        let data = {};
        try { data = JSON.parse(raw) || {}; } catch {}
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData?.session?.user) {
          localStorage.removeItem("bytly_registration_pending");
          if (active) setPending(false);
          return;
        }

        const role = data.role || sessionData.session.user.user_metadata?.registration_role || sessionData.session.user.user_metadata?.role || "client";
        if (active) {
          setDestination(ROLE_ROUTES[role] || ROLE_ROUTES.client);
          setPending(true);
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
