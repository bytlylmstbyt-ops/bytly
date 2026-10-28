import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { createPageUrl } from "@/utils";
import { Bell, MessageCircle, Mail, Phone, MapPin } from "lucide-react";

/**
 * Shared account-level shortcuts for Bytly provider dashboards.
 * Counts are best-effort; the dashboard remains usable if a table/policy is unavailable.
 */
export default function AccountQuickAccess({ profile, roleLabel }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [conversationCount, setConversationCount] = useState(0);
  const [accountEmail, setAccountEmail] = useState("");

  useEffect(() => {
    let active = true;
    const loadCounts = async () => {
      try {
        if (!supabase) return;
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user || !active) return;
        setAccountEmail(user.email || "");

        let notificationResult = await supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("recipient_user_id", user.id)
          .is("read_at", null);
        if (notificationResult.error) {
          notificationResult = await supabase
            .from("notifications")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .is("read_at", null);
        }
        if (active && !notificationResult.error) setUnreadCount(notificationResult.count || 0);

        if (user.email) {
          const result = await supabase
            .from("user_conversations")
            .select("id", { count: "exact", head: true })
            .contains("participants", [user.email.trim().toLowerCase()]);
          if (active && !result.error) setConversationCount(result.count || 0);
        }
      } catch (error) {
        console.warn("Could not load account communication counts", error);
      }
    };
    loadCounts();
    return () => { active = false; };
  }, []);

  const displayName = profile?.full_name || profile?.company_name || profile?.name || "عضو بيتلي";
  const email = profile?.email || accountEmail;
  const phone = profile?.phone || profile?.phone_number;
  const location = profile?.city || profile?.location || profile?.address;

  return (
    <section className="mb-6 rounded-2xl border border-amber-100 bg-white p-4 shadow-sm" aria-label="بيانات الحساب والتواصل">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm text-slate-500">مرحباً بك في بيتلي</p>
          <h2 className="mt-1 text-xl font-bold text-[#4B3B30]">{displayName}</h2>
          <p className="mt-1 text-sm text-slate-500">{roleLabel}</p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600">
            {email && <span className="inline-flex items-center gap-1.5"><Mail className="h-4 w-4 text-[#A98550]" />{email}</span>}
            {phone && <span className="inline-flex items-center gap-1.5"><Phone className="h-4 w-4 text-[#A98550]" />{phone}</span>}
            {location && <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 text-[#A98550]" />{location}</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={createPageUrl("NotificationCenter")} className="inline-flex items-center gap-2 rounded-xl border border-amber-200 px-3 py-2 text-sm font-medium text-[#6B5D4F] transition hover:bg-amber-50">
            <span className="relative"><Bell className="h-4 w-4" />{unreadCount > 0 && <span className="absolute -right-2 -top-2 min-w-4 rounded-full bg-red-600 px-1 text-center text-[10px] leading-4 text-white">{unreadCount > 99 ? "99+" : unreadCount}</span>}</span>
            الإشعارات
          </Link>
          <Link to={createPageUrl("Messages")} className="inline-flex items-center gap-2 rounded-xl border border-amber-200 px-3 py-2 text-sm font-medium text-[#6B5D4F] transition hover:bg-amber-50">
            <span className="relative"><MessageCircle className="h-4 w-4" />{conversationCount > 0 && <span className="absolute -right-2 -top-2 min-w-4 rounded-full bg-[#6B5D4F] px-1 text-center text-[10px] leading-4 text-white">{conversationCount > 99 ? "99+" : conversationCount}</span>}</span>
            الرسائل والمحادثات
          </Link>
        </div>
      </div>
    </section>
  );
}
