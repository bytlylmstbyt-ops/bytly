import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

export function usePermissions() {
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      // Admins have all permissions
      if (userData.role === "admin") {
        setPermissions(getAllPermissions());
        setLoading(false);
        return;
      }

      // Load user roles
      const userRoles = await base44.entities.UserRole.filter({ user_email: userData.email });
      
      if (userRoles.length === 0) {
        setPermissions({});
        setLoading(false);
        return;
      }

      // Merge permissions from all active roles
      const mergedPermissions = {};
      for (const userRole of userRoles) {
        const [role] = await base44.entities.Role.filter({ id: userRole.role_id });
        if (role && role.is_active && role.permissions) {
          mergePermissions(mergedPermissions, role.permissions);
        }
      }

      setPermissions(mergedPermissions);
    } catch (error) {
      console.error("Error loading permissions:", error);
      setPermissions({});
    } finally {
      setLoading(false);
    }
  };

  const mergePermissions = (target, source) => {
    for (const [resource, actions] of Object.entries(source)) {
      if (!target[resource]) {
        target[resource] = {};
      }
      for (const [action, value] of Object.entries(actions)) {
        target[resource][action] = target[resource][action] || value;
      }
    }
  };

  const getAllPermissions = () => {
    return {
      projects: { view: true, create: true, edit: true, delete: true },
      engineers: { view: true, create: true, edit: true, delete: true, approve: true },
      clients: { view: true, create: true, edit: true, delete: true },
      contracts: { view: true, create: true, edit: true, delete: true },
      invoices: { view: true, create: true, edit: true, delete: true },
      payments: { view: true, process: true, refund: true },
      disputes: { view: true, manage: true, resolve: true },
      analytics: { view: true, export: true },
      settings: { view: true, edit: true, roles: true }
    };
  };

  const can = (resource, action) => {
    return permissions[resource]?.[action] || false;
  };

  const canAny = (checks) => {
    return checks.some(([resource, action]) => can(resource, action));
  };

  const canAll = (checks) => {
    return checks.every(([resource, action]) => can(resource, action));
  };

  return {
    permissions,
    loading,
    user,
    can,
    canAny,
    canAll,
    isAdmin: user?.role === "admin",
    reload: loadPermissions
  };
}