import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";
import { Loader2, Building2, User as UserIcon } from "lucide-react";
import WithdrawalForm from "../components/wallet/WithdrawalForm";
import ClientWalletView from "../components/wallet/ClientWalletView";
import InvestorFinancialView from "../components/wallet/InvestorFinancialView";
import DepositPanel from "../components/wallet/DepositPanel";
import LiveWalletDashboard from "../components/wallet/LiveWalletDashboard";
import WalletTransactionChart from "../components/wallet/WalletTransactionChart";
import QuickWithdrawalButton from "../components/wallet/QuickWithdrawalButton";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WalletPage() {
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [userType, setUserType] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    setIsLoading(true);
    try {
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !currentUser?.email) throw authError || new Error("انتهت جلسة الدخول");
      setUser(currentUser);
      const { data: profileRow, error: profileError } = await supabase.from("profiles").select("*").eq("user_id", currentUser.id).maybeSingle();
      if (profileError) throw profileError;
      let profile = profileRow || {
        id: currentUser.id, user_id: currentUser.id, email: currentUser.email,
        full_name: currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || "",
        wallet_balance: 0, client_type: "individual", profile_image: null
      };
      let type = String(profileRow?.role || "").toLowerCase();
      if (type === "provider" || type === "surveyor") type = "engineer";
      if (type !== "engineer" && type !== "investor") type = "client";
      const { data: wallet } = await supabase.from("wallet_accounts").select("*").eq("user_id", currentUser.id).maybeSingle();
      profile = { ...profile, wallet_balance: wallet?.available_balance || 0, held_balance: wallet?.held_balance || 0 };
      const { data: trans, error: transError } = await supabase.from("wallet_transactions").select("*").eq("user_id", currentUser.id).order("created_at", { ascending: false }).limit(100);
      if (transError) throw transError;
      setTransactions(trans || []);
      if (type === "client" || type === "investor") {
        const { data: projectsList, error: projectsError } = await supabase.from("projects").select("*").eq("client_user_id", currentUser.id).order("created_at", { ascending: false });
        if (projectsError) throw projectsError;
        setProjects(projectsList || []);
      }
      const { data: withdrawals } = await supabase.from("withdrawal_requests").select("*").eq("user_id", currentUser.id).order("created_at", { ascending: false }).limit(100);
      setWithdrawalRequests(withdrawals || []);
      setUserProfile(profile);
      setUserType(type);
    } catch (error) {
      console.error("Error loading wallet data:", error);
      setUserProfile(null);
      setUserType(null);
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

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-slate-600 mb-4">{t('wallet.noProfile')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-bold gradient-text">
                {t('wallet.title')}
              </h1>
            {userType === "engineer" && (
              <div className="flex items-center gap-1 text-sm text-slate-600">
                <UserIcon className="w-4 h-4" />
                <span>{t('wallet.userTypes.engineer')}</span>
              </div>
            )}
            {userType === "firm" && (
              <div className="flex items-center gap-1 text-sm text-slate-600">
                <Building2 className="w-4 h-4" />
                <span>{t('wallet.userTypes.firm')}</span>
              </div>
            )}
            </div>
            <div className="flex items-center gap-2">
              {userType === "engineer" && (
                <QuickWithdrawalButton engineer={userProfile} onSuccess={loadWalletData} />
              )}
              <Link to={createPageUrl("WalletRecharge")}>
                <Button className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                  <Plus className="w-5 h-5 ml-2" />
                  {t('wallet.rechargeWallet')}
                </Button>
              </Link>
            </div>
          </div>
          <p className="text-slate-600">{t('wallet.subtitle')}</p>
        </motion.div>

        {/* Engineer Wallet View */}
        {userType === "engineer" && (
          <>
            <LiveWalletDashboard
              profile={userProfile}
              userType="engineer"
              userEmail={user?.email}
            />
            <div className="mt-6">
              <WalletTransactionChart transactions={transactions} />
            </div>
            <div className="mt-6 grid md:grid-cols-2 gap-6">
              <WithdrawalForm
                engineer={userProfile}
                onSuccess={loadWalletData}
              />
              <DepositPanel
                profile={userProfile}
                userEmail={user?.email}
                onSuccess={loadWalletData}
              />
            </div>
          </>
        )}

        {/* Client Wallet View */}
        {userType === "client" && (
          <div className="space-y-6">
            <WalletTransactionChart transactions={transactions} />
            <ClientWalletView
              client={userProfile}
              transactions={transactions}
              projects={projects}
              onRefresh={loadWalletData}
              userEmail={user?.email}
            />
          </div>
        )}

        {/* Investor Financial View */}
        {userType === "investor" && (
          <div className="space-y-6">
            <WalletTransactionChart transactions={transactions} />
            <InvestorFinancialView
              client={userProfile}
              transactions={transactions}
              projects={projects}
              onRefresh={loadWalletData}
              userEmail={user?.email}
            />
          </div>
        )}

        {/* Firm Wallet View */}
        {userType === "firm" && (
          <LiveWalletDashboard
            profile={userProfile}
            userType="firm"
            userEmail={user?.email}
          />
        )}
      </div>
    </div>
  );
}