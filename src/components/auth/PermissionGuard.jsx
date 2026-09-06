import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Lock, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const PLATFORM_OWNER_EMAIL = "bytlylmstbyt@gmail.com";

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
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        setHasPermission(false);
        return;
      }

      const email = (user.email || "").trim().toLowerCase();
      if (email === PLATFORM_OWNER_EMAIL) {
        setHasPermission(true);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.role === "admin") {
        setHasPermission(true);
        return;
      }

      setHasPermission(false);
    } catch (error) {
      console.error("Error checking Supabase permission:", error);
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
