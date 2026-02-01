import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Lock, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function PermissionGuard({ 
  children, 
  resource, 
  action, 
  fallback = null,
  showMessage = true 
}) {
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPermission();
  }, [resource, action]);

  const checkPermission = async () => {
    try {
      const user = await base44.auth.me();
      
      // Admins have all permissions
      if (user.role === "admin") {
        setHasPermission(true);
        setLoading(false);
        return;
      }

      // Check user roles
      const userRoles = await base44.entities.UserRole.filter({ user_email: user.email });
      
      if (userRoles.length === 0) {
        setHasPermission(false);
        setLoading(false);
        return;
      }

      // Load role details and check permissions
      let granted = false;
      for (const userRole of userRoles) {
        const [role] = await base44.entities.Role.filter({ id: userRole.role_id });
        if (role && role.is_active) {
          const permissions = role.permissions || {};
          if (permissions[resource]?.[action]) {
            granted = true;
            break;
          }
        }
      }

      setHasPermission(granted);
    } catch (error) {
      console.error("Error checking permission:", error);
      setHasPermission(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-[#6B5D4F]" />
      </div>
    );
  }

  if (!hasPermission) {
    if (fallback) return fallback;
    
    if (!showMessage) return null;

    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardContent className="pt-6 text-center">
          <Lock className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">غير مصرح</h3>
          <p className="text-slate-600">ليس لديك صلاحية لتنفيذ هذا الإجراء</p>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}