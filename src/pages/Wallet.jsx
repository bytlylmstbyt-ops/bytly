import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WalletOverview from "../components/wallet/WalletOverview";
import WithdrawalForm from "../components/wallet/WithdrawalForm";
import TransactionHistory from "../components/wallet/TransactionHistory";

export default function WalletPage() {
  const [user, setUser] = useState(null);
  const [engineer, setEngineer] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Get engineer profile
      const engineerData = await base44.entities.Engineer.filter({ email: currentUser.email });
      
      if (engineerData.length > 0) {
        setEngineer(engineerData[0]);

        // Load transactions
        const trans = await base44.entities.Transaction.filter(
          { user_id: engineerData[0].id },
          "-created_date",
          50
        );
        setTransactions(trans);

        // Load withdrawal requests
        const withdrawals = await base44.entities.WithdrawalRequest.filter(
          { engineer_id: engineerData[0].id },
          "-created_date"
        );
        setWithdrawalRequests(withdrawals);
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
        <Loader2 className="w-8 h-8 animate-spin text-[#d4a574]" />
      </div>
    );
  }

  if (!engineer) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-slate-600 mb-4">يجب أن تكون مصممًا للوصول إلى المحفظة</p>
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
          <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-2">
            المحفظة الإلكترونية
          </h1>
          <p className="text-slate-600">إدارة رصيدك ومعاملاتك المالية</p>
        </motion.div>

        {/* Wallet Overview */}
        <WalletOverview engineer={engineer} />

        {/* Transactions */}
        <TransactionHistory transactions={transactions} />
      </div>
    </div>
  );
}