import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Loader2, Building2, User as UserIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WalletOverview from "../components/wallet/WalletOverview";
import WithdrawalForm from "../components/wallet/WithdrawalForm";
import TransactionHistory from "../components/wallet/TransactionHistory";
import ClientWalletView from "../components/wallet/ClientWalletView";
import InvestorFinancialView from "../components/wallet/InvestorFinancialView";

export default function WalletPage() {
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
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Try to identify user type
      const [engineerData] = await base44.entities.Engineer.filter({ email: currentUser.email });
      const [clientData] = await base44.entities.Client.filter({ email: currentUser.email });
      const [firmData] = await base44.entities.EngineeringFirm.filter({ email: currentUser.email });

      let profile = null;
      let type = null;

      if (engineerData) {
        profile = engineerData;
        type = "engineer";
        
        // Load transactions for engineer
        const trans = await base44.entities.Transaction.filter(
          { user_email: currentUser.email },
          "-created_date",
          100
        );
        setTransactions(trans);

        // Load withdrawal requests
        const withdrawals = await base44.entities.WithdrawalRequest.filter(
          { engineer_id: engineerData.id },
          "-created_date"
        );
        setWithdrawalRequests(withdrawals);
      } else if (clientData) {
        profile = clientData;
        type = clientData.client_type === "investor" ? "investor" : "client";

        // Load transactions for client
        const trans = await base44.entities.Transaction.filter(
          { user_email: currentUser.email },
          "-created_date",
          100
        );
        setTransactions(trans);

        // Load projects for investor/client
        const projectsList = await base44.entities.Project.filter(
          { client_id: clientData.id },
          "-created_date"
        );
        setProjects(projectsList);
      } else if (firmData) {
        profile = firmData;
        type = "firm";

        const trans = await base44.entities.Transaction.filter(
          { user_email: currentUser.email },
          "-created_date",
          100
        );
        setTransactions(trans);
      }

      setUserProfile(profile);
      setUserType(type);
    } catch (error) {
      console.error("Error loading wallet data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#d4a574]" />
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-slate-600 mb-4">يرجى إكمال ملفك الشخصي للوصول إلى المحفظة</p>
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
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl md:text-4xl font-bold gradient-text">
              المحفظة الإلكترونية
            </h1>
            {userType === "engineer" && (
              <div className="flex items-center gap-1 text-sm text-slate-600">
                <UserIcon className="w-4 h-4" />
                <span>مهندس</span>
              </div>
            )}
            {userType === "firm" && (
              <div className="flex items-center gap-1 text-sm text-slate-600">
                <Building2 className="w-4 h-4" />
                <span>شركة استشارية</span>
              </div>
            )}
          </div>
          <p className="text-slate-600">إدارة رصيدك ومعاملاتك المالية</p>
        </motion.div>

        {/* Engineer Wallet View */}
        {userType === "engineer" && (
          <>
            <WalletOverview engineer={userProfile} />
            <Tabs defaultValue="transactions" className="mt-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="transactions">سجل المعاملات</TabsTrigger>
                <TabsTrigger value="withdrawal">طلب سحب</TabsTrigger>
              </TabsList>
              <TabsContent value="transactions">
                <TransactionHistory transactions={transactions} />
              </TabsContent>
              <TabsContent value="withdrawal">
                <WithdrawalForm 
                  engineer={userProfile}
                  onSuccess={loadWalletData}
                />
              </TabsContent>
            </Tabs>
          </>
        )}

        {/* Client Wallet View */}
        {userType === "client" && (
          <ClientWalletView
            client={userProfile}
            transactions={transactions}
            projects={projects}
            onRefresh={loadWalletData}
          />
        )}

        {/* Investor Financial View */}
        {userType === "investor" && (
          <InvestorFinancialView
            client={userProfile}
            transactions={transactions}
            projects={projects}
            onRefresh={loadWalletData}
          />
        )}

        {/* Firm Wallet View */}
        {userType === "firm" && (
          <>
            <WalletOverview engineer={userProfile} isFirm={true} />
            <TransactionHistory transactions={transactions} />
          </>
        )}
      </div>
    </div>
  );
}