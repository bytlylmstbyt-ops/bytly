import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

const PLATFORM_OWNER_EMAIL = "bytlylmstbyt@gmail.com";

export function usePermissions() {
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      const { data: { user: authUser }, error } = await supabase.auth.getUser();
      if (error || !authUser) {
        setUser(null);
        setPermissions({});
        return;
      }

      const email = (authUser.email || "").trim().toLowerCase();
      const { data: profile } = await supabase
        .from("profiles")
        .select("role,email,full_name")
        .eq("id", authUser.id)
        .maybeSingle();

      const isPlatformOwner = email === PLATFORM_OWNER_EMAIL;
      const isAdmin = isPlatformOwner || profile?.role === "admin";
      const userData = {
        ...authUser,
        email: authUser.email,
        role: isAdmin ? "admin" : (profile?.role || "user"),
        profile,
      };
      setUser(userData);

      // The platform owner is the sole Super Admin and receives full permissions.
      if (isPlatformOwner || profile?.role === "admin") {
        setPermissions(getAllPermissions());
        return;
      }

      // Staff/user role permissions are currently read from the Supabase profile.
      // Fine-grained staff role tables can be wired here without relying on Base44.
      setPermissions({});
    } catch (error) {
      console.error("Error loading Supabase permissions:", error);
      setPermissions({});
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const getAllPermissions = () => ({
    projects: { view: true, create: true, edit: true, delete: true },
    engineers: { view: true, create: true, edit: true, delete: true, approve: true },
    clients: { view: true, create: true, edit: true, delete: true },
    contracts: { view: true, create: true, edit: true, delete: true },
    invoices: { view: true, create: true, edit: true, delete: true },
    payments: { view: true, process: true, refund: true },
    disputes: { view: true, manage: true, resolve: true },
    analytics: { view: true, export: true },
    settings: { view: true, edit: true, roles: true },
    workflows: { view: true, edit: true },
    domains: { view: true, edit: true },
    integrations: { view: true, edit: true },
    email: { view: true, edit: true },
    marketing: { view: true, edit: true },
  });

  const can = (resource, action) => permissions[resource]?.[action] || false;
  const canAny = (checks) => checks.some(([resource, action]) => can(resource, action));
  const canAll = (checks) => checks.every(([resource, action]) => can(resource, action));

  return {
    permissions,
    loading,
    user,
    can,
    canAny,
    canAll,
    isAdmin: user?.role === "admin",
    isPlatformOwner: user?.email?.trim().toLowerCase() === PLATFORM_OWNER_EMAIL,
    reload: loadPermissions,
  };
}
