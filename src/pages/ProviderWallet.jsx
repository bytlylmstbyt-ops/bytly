import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Loader2, HardHat, Package, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import LiveWalletDashboard from "@/components/wallet/LiveWalletDashboard";
import WalletTransactionChart from "@/components/wallet/WalletTransactionChart";
import ProviderWithdrawalForm from "@/components/wallet/ProviderWithdrawalForm";

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
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [contractorData] = await base44.entities.Contractor.filter({ email: currentUser.email });
      const [supplierData] = await base44.entities.Supplier.filter({ email: currentUser.email });

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

        const trans = await base44.entities.Transaction.filter(
          { user_email: currentUser.email },
          "-created_date",
          100
        );
        setTransactions(trans);
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
          <WalletTransactionChart transactions={transactions} />
        </div>

        <div className="mt-6">
          <ProviderWithdrawalForm
            provider={profile}
            providerType={providerType}
            onSuccess={loadWalletData}
          />
        </div>
      </div>
    </div>
  );
}