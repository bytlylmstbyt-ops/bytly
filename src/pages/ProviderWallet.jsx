import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";
import { Loader2, HardHat, Package, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import LiveWalletDashboard from "@/components/wallet/LiveWalletDashboard";
import ProviderWithdrawalForm from "@/components/wallet/ProviderWithdrawalForm";
import ProviderFinancialReport from "@/components/wallet/ProviderFinancialReport";

export default function ProviderWallet() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [providerType, setProviderType] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    setIsLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      const authUser = authData?.user;
      if (!authUser) {
        setUser(null);
        setProfile(null);
        return;
      }
      const currentUser = {
        id: authUser.id,
        user_id: authUser.id,
        email: authUser.email,
        full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || "",
      };
      setUser(currentUser);

      const [{ data: contractorData, error: contractorError }, { data: supplierData, error: supplierError }] = await Promise.all([
        supabase.from("contractors").select("*").eq("user_id", authUser.id).maybeSingle(),
        supabase.from("suppliers").select("*").eq("user_id", authUser.id).maybeSingle(),
      ]);
      if (contractorError) throw contractorError;
      if (supplierError) throw supplierError;

      let profileData = null;
      let type = null;

      if (contractorData) {
        profileData = contractorData;
        type = "contractor";
      } else if (supplierData) {
        profileData = supplierData;
        type = "supplier";
      }

      if (profileData) {
        setProfile(profileData);
        setProviderType(type);

        const { data: trans, error: transactionsError } = await supabase
          .from("wallet_transactions").select("*").eq("user_id", authUser.id)
          .order("created_at", { ascending: false }).limit(100);
        if (transactionsError) throw transactionsError;
        setTransactions(trans || []);
      }
    } catch (error) {
      console.error("Error loading wallet data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#C9A66B]" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-slate-600 mb-4">لم يتم العثور على حساب مقاول أو مورد مرتبط بحسابك</p>
        </div>
      </div>
    );
  }

  const providerLabel = providerType === "contractor" ? "المقاول" : "المورد";
  const ProviderIcon = providerType === "contractor" ? HardHat : Package;

  return (
    <div className="min-h-screen py-8 px-4" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-bold gradient-text">
                محفظتي
              </h1>
              <div className="flex items-center gap-1 text-sm text-slate-600">
                <ProviderIcon className="w-4 h-4" />
                <span>{providerLabel}</span>
              </div>
            </div>
            <Link to="/WalletRecharge">
              <Button className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                <Plus className="w-5 h-5 ml-2" />
                شحن المحفظة
              </Button>
            </Link>
          </div>
          <p className="text-slate-600">إدارة أرصدتك المالية ومعاملاتك</p>
        </motion.div>

        <LiveWalletDashboard
          profile={profile}
          userType={providerType}
          userEmail={user?.email}
        />

        <div className="mt-6">
          <ProviderWithdrawalForm
            provider={profile}
            providerType={providerType}
            onSuccess={loadWalletData}
          />
        </div>

        <div className="mt-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">التقارير المالية</h2>
          <ProviderFinancialReport
            provider={profile}
            providerType={providerType}
            userEmail={user?.email}
          />
        </div>
      </div>
    </div>
  );
}