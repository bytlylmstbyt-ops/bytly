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
    setTransactions([]);
    setWithdrawalRequests([]);
    setProjects([]);
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      const authUser = authData?.user;
      if (authError || !authUser) {
        setUser(null);
        setUserProfile(null);
        setUserType(null);
        setTransactions([]);
        setWithdrawalRequests([]);
        setProjects([]);
        return;
      }

      const { data: profileRow, error: profileError } = await supabase
        .from("profiles")
        .select("user_id,email,full_name,role,phone")
        .eq("user_id", authUser.id)
        .maybeSingle();
      if (profileError) throw profileError;

      const currentUser = {
        id: authUser.id,
        email: authUser.email || profileRow?.email || "",
        full_name: profileRow?.full_name || authUser.user_metadata?.full_name || authUser.user_metadata?.name || "",
        role: profileRow?.role || authUser.app_metadata?.role || "",
        phone: profileRow?.phone || authUser.phone || authUser.user_metadata?.phone || null,
        profile: profileRow || null,
        user_metadata: authUser.user_metadata || {},
      };
      setUser(currentUser);

      const role = String(currentUser.role || "").toLowerCase();
      let profile = null;
      let type = null;

      if (role === "client" || role === "investor") {
        const { data, error } = await supabase
          .from("clients")
          .select("id,user_id,full_name,email,phone,city,country,client_type,company_name,trust_score,total_projects,subscription_type,is_subscription_active,status")
          .eq("user_id", authUser.id)
          .maybeSingle();
        if (error) throw error;
        if (data) {
          profile = data;
          type = data.client_type === "investor" || role === "investor" ? "investor" : "client";
        }
      } else if (role === "engineer" || role === "surveyor") {
        const { data, error } = await supabase
          .from("engineers")
          .select("id,user_id,full_name,email,phone,city,specialization,bio,is_verified,status,rating,registration_number,country,years_experience,completed_projects,profile_image,total_reviews,subscription_type,is_subscription_active")
          .eq("user_id", authUser.id)
          .maybeSingle();
        if (error) throw error;
        if (data) {
          profile = data;
          type = "engineer";
        }
      } else {
        // Some existing accounts have a generic role. Resolve only by the authenticated user ID.
        const [{ data: client, error: clientError }, { data: engineer, error: engineerError }] = await Promise.all([
          supabase.from("clients").select("id,user_id,full_name,email,phone,city,country,client_type,company_name,status").eq("user_id", authUser.id).maybeSingle(),
          supabase.from("engineers").select("id,user_id,full_name,email,phone,city,specialization,status,profile_image").eq("user_id", authUser.id).maybeSingle(),
        ]);
        if (clientError) throw clientError;
        if (engineerError) throw engineerError;
        if (client) {
          profile = client;
          type = client.client_type === "investor" ? "investor" : "client";
        } else if (engineer) {
          profile = engineer;
          type = "engineer";
        }
      }

      const { data: walletAccount, error: walletError } = await supabase
        .from("wallet_accounts")
        .select("available_balance,held_balance,currency,status")
        .eq("user_id", authUser.id)
        .maybeSingle();
      if (walletError) throw walletError;

      // Never use the legacy profile wallet_balance as the financial source of truth.
      if (profile) {
        profile = {
          ...profile,
          wallet_balance: Number(walletAccount?.available_balance || 0),
          held_balance: Number(walletAccount?.held_balance || 0),
          wallet_currency: walletAccount?.currency || "SAR",
        };
        const { data: transactionsData, error: transactionsError } = await supabase
          .from("wallet_transactions")
          .select("id,user_id,project_id,payment_id,type,amount,currency,status,reference,description,balance_type,direction,created_at")
          .eq("user_id", authUser.id)
          .order("created_at", { ascending: false })
          .limit(100);
        if (transactionsError) throw transactionsError;
        setTransactions((transactionsData || []).map(row => ({ ...row, created_date: row.created_at })));

        if (type === "client" || type === "investor") {
          const { data: projectRows, error: projectsError } = await supabase
            .from("projects")
            .select("id,title,description,status,category,project_type,location,start_date,deadline,budget_min,budget_max,currency,created_at,client_user_id")
            .eq("client_user_id", authUser.id)
            .order("created_at", { ascending: false })
            .limit(100);
          if (projectsError) throw projectsError;
          setProjects((projectRows || []).map(row => ({ ...row, created_date: row.created_at })));
        } else if (type === "engineer" && profile.id) {
          const { data: withdrawals, error: withdrawalsError } = await supabase
            .from("withdrawal_requests")
            .select("id,engineer_id,amount,iban,bank_name,account_holder_name,status,request_date,processing_date,completion_date,rejection_reason,transaction_reference,description,created_at,updated_at")
            .eq("engineer_id", profile.id)
            .order("created_at", { ascending: false })
            .limit(100);
          if (withdrawalsError) throw withdrawalsError;
          setWithdrawalRequests((withdrawals || []).map(row => ({ ...row, created_date: row.created_at })));
        }
      } else {
        // A valid signed-in homeowner can open the wallet before completing a client profile.
        profile = {
          id: authUser.id,
          user_id: authUser.id,
          email: currentUser.email,
          full_name: currentUser.full_name,
          wallet_balance: Number(walletAccount?.available_balance || 0),
          held_balance: Number(walletAccount?.held_balance || 0),
          wallet_currency: walletAccount?.currency || "SAR",
          client_type: "individual",
          profile_image: null,
          phone: currentUser.phone,
        };
        type = "client";
        setTransactions([]);
        setProjects([]);
        setWithdrawalRequests([]);
      }

      setUserProfile(profile);
      setUserType(type || "client");
    } catch (error) {
      console.error("Error loading wallet data from Supabase:", error);
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