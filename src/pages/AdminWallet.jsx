import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Wallet, Users, CheckCircle, Clock, 
  DollarSign, AlertCircle, Loader2 
} from "lucide-react";
import { motion } from "framer-motion";

export default function AdminWalletPage() {
  const [loading, setLoading] = useState(true);
  const [engineers, setEngineers] = useState([]);
  const [clients, setClients] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [stats, setStats] = useState({
    totalPlatformBalance: 0,
    totalEngineersBalance: 0,
    totalClientBalance: 0,
    pendingWithdrawals: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [{ data: engineersData }, { data: clientsData }, { data: transactionsData }, { data: withdrawalsData }] = await Promise.all([
        supabase.from("engineers").select("*").order("created_at", { ascending: false }).limit(500),
        supabase.from("clients").select("*").order("created_at", { ascending: false }).limit(500),
        supabase.from("wallet_transactions").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("withdrawal_requests").select("id,project_id,engineer_id,contractor_id,supplier_id,provider_type,amount,status,consultant_approval,consultant_user_id,consultant_profile_id,consultant_profile_type,consultant_approval_date,owner_approval,owner_user_id,owner_approval_date,request_date,processing_date,completion_date,rejection_reason,admin_notes,transaction_reference,description,created_at,updated_at").in("status", ["pending", "processing"]).order("created_at", { ascending: false })
      ]);
      setEngineers(engineersData || []); setClients(clientsData || []); setTransactions(transactionsData || []); setWithdrawalRequests(withdrawalsData || []);
      const { data: wallets } = await supabase.from("wallet_accounts").select("*");
      const engIds=new Set((engineersData||[]).map(e=>e.user_id).filter(Boolean)), cliIds=new Set((clientsData||[]).map(c=>c.user_id).filter(Boolean));
      const engBal=(wallets||[]).filter(w=>engIds.has(w.user_id)).reduce((s,w)=>s+Number(w.available_balance||0)+Number(w.held_balance||0),0);
      const cliBal=(wallets||[]).filter(w=>cliIds.has(w.user_id)).reduce((s,w)=>s+Number(w.available_balance||0)+Number(w.held_balance||0),0);
      const fees=(transactionsData||[]).filter(t=>["commission","platform_fee"].includes(t.type)&&t.status==="completed").reduce((s,t)=>s+Number(t.amount||0),0);
      const pending=(withdrawalsData||[]).reduce((s,w)=>s+Number(w.amount||0),0);
      setStats({totalPlatformBalance:fees,totalEngineersBalance:engBal,totalClientBalance:cliBal,pendingWithdrawals:pending});
    } catch(error){ console.error("Error loading data:",error); } finally{setLoading(false);}
  };

  const handleApproveWithdrawal = async (request) => {
    if (!request.consultant_approval) { alert("⚠️ يجب اعتماد المستشار الفني أولاً"); return; }
    if (!request.owner_approval) { alert("⚠️ يجب اعتماد مالك المشروع أولاً"); return; }
    if (!confirm(`هل تريد تنفيذ تحويل مبلغ ${request.amount} ريال؟`)) return;
    try {
      const transactionReference = prompt("أدخل رقم مرجع التحويل البنكي (اختياري):") || null;
      const adminNotes = prompt("ملاحظات الإدارة (اختياري):") || null;
      const { error } = await supabase.rpc("admin_complete_withdrawal", {
        p_withdrawal_id: request.id,
        p_transaction_reference: transactionReference,
        p_admin_notes: adminNotes
      });
      if (error) throw error;
      alert("تم تنفيذ السحب وتسجيل التحويل بنجاح");
      loadData();
    } catch (error) {
      console.error(error);
      alert("تعذر تنفيذ السحب: " + (error.message || "خطأ غير معروف"));
    }
  };

  const handleRejectWithdrawal = async (request) => {
    const reason = prompt("يرجى إدخال سبب الرفض:");
    if (!reason) return;
    try {
      const { error } = await supabase.rpc("admin_reject_withdrawal", {
        p_withdrawal_id: request.id,
        p_rejection_reason: reason
      });
      if (error) throw error;
      alert("تم رفض طلب السحب وإعادة المبلغ إلى الرصيد المتاح");
      loadData();
    } catch (error) {
      console.error(error);
      alert("تعذر رفض طلب السحب: " + (error.message || "خطأ غير معروف"));
    }
  };
}