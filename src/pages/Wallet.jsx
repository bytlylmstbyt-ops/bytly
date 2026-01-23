import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { 
  Wallet, ArrowUpRight, ArrowDownLeft, Plus, 
  CreditCard, Clock, CheckCircle, XCircle, Loader2,
  DollarSign, TrendingUp, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function WalletPage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    setIsLoading(true);
    const currentUser = await base44.auth.me();
    setUser(currentUser);

    // Get user profile (engineer or client)
    const [engineerData, clientData] = await Promise.all([
      base44.entities.Engineer.filter({ email: currentUser.email }),
      base44.entities.Client.filter({ email: currentUser.email })
    ]);

    const userProfile = engineerData[0] || clientData[0];
    setProfile(userProfile);

    if (userProfile) {
      const trans = await base44.entities.Transaction.filter(
        { user_id: userProfile.id },
        "-created_date"
      );
      setTransactions(trans);
    }

    setIsLoading(false);
  };

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) return;
    
    setIsProcessing(true);
    
    // Create transaction record
    await base44.entities.Transaction.create({
      user_id: profile.id,
      type: "deposit",
      amount: parseFloat(depositAmount),
      status: "completed",
      description: "إيداع في المحفظة"
    });

    // Update balance
    const entityType = profile.specialization ? "Engineer" : "Client";
    await base44.entities[entityType].update(profile.id, {
      wallet_balance: (profile.wallet_balance || 0) + parseFloat(depositAmount)
    });

    setIsProcessing(false);
    setShowDepositDialog(false);
    setDepositAmount("");
    loadWalletData();
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) return;
    if (parseFloat(withdrawAmount) > (profile?.wallet_balance || 0)) {
      alert("الرصيد غير كافي");
      return;
    }
    
    setIsProcessing(true);
    
    // Create transaction record
    await base44.entities.Transaction.create({
      user_id: profile.id,
      type: "withdrawal",
      amount: parseFloat(withdrawAmount),
      status: "pending",
      description: "طلب سحب من المحفظة"
    });

    // Update balance
    const entityType = profile.specialization ? "Engineer" : "Client";
    await base44.entities[entityType].update(profile.id, {
      wallet_balance: (profile.wallet_balance || 0) - parseFloat(withdrawAmount)
    });

    setIsProcessing(false);
    setShowWithdrawDialog(false);
    setWithdrawAmount("");
    loadWalletData();
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case "deposit":
        return <ArrowDownLeft className="w-5 h-5 text-green-500" />;
      case "withdrawal":
        return <ArrowUpRight className="w-5 h-5 text-red-500" />;
      case "escrow_hold":
        return <Shield className="w-5 h-5 text-blue-500" />;
      case "escrow_release":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "subscription":
        return <CreditCard className="w-5 h-5 text-purple-500" />;
      case "commission":
        return <DollarSign className="w-5 h-5 text-amber-500" />;
      default:
        return <DollarSign className="w-5 h-5 text-slate-500" />;
    }
  };

  const getTransactionLabel = (type) => {
    const labels = {
      deposit: "إيداع",
      withdrawal: "سحب",
      escrow_hold: "حجز ضمان",
      escrow_release: "تحرير ضمان",
      subscription: "اشتراك",
      commission: "عمولة"
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-700">مكتمل</Badge>;
      case "pending":
        return <Badge className="bg-amber-100 text-amber-700">قيد المعالجة</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-700">فشل</Badge>;
      case "cancelled":
        return <Badge className="bg-slate-100 text-slate-700">ملغي</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#d4a574]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-[#1a1a2e]">المحفظة الإلكترونية</h1>
          <p className="text-slate-500">إدارة رصيدك ومعاملاتك المالية</p>
        </motion.div>

        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-0 shadow-xl overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-[#1a1a2e] to-[#d4a574] p-8 text-white">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                    <Wallet className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="text-white/80 text-sm">الرصيد الحالي</p>
                    <p className="text-4xl font-bold">
                      {(profile?.wallet_balance || 0).toLocaleString()}
                      <span className="text-lg mr-2">ر.س</span>
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Dialog open={showDepositDialog} onOpenChange={setShowDepositDialog}>
                  <DialogTrigger asChild>
                    <Button className="flex-1 bg-white/20 hover:bg-white/30 text-white border-0">
                      <Plus className="w-5 h-5 ml-2" />
                      إيداع
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>إيداع في المحفظة</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <label className="text-sm font-medium text-slate-700">المبلغ (ر.س)</label>
                        <Input
                          type="number"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          placeholder="أدخل المبلغ"
                          className="mt-1"
                        />
                      </div>
                      <div className="flex gap-2">
                        {[100, 500, 1000, 5000].map(amount => (
                          <Button
                            key={amount}
                            variant="outline"
                            size="sm"
                            onClick={() => setDepositAmount(amount.toString())}
                          >
                            {amount}
                          </Button>
                        ))}
                      </div>
                      <Button
                        onClick={handleDeposit}
                        disabled={isProcessing || !depositAmount}
                        className="w-full bg-gradient-to-r from-[#1a1a2e] to-[#d4a574] text-white"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin ml-2" />
                            جاري المعالجة...
                          </>
                        ) : (
                          "تأكيد الإيداع"
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex-1 bg-white/10 hover:bg-white/20 text-white border-white/30">
                      <ArrowUpRight className="w-5 h-5 ml-2" />
                      سحب
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>سحب من المحفظة</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="bg-slate-100 rounded-lg p-4 text-center">
                        <p className="text-sm text-slate-500">الرصيد المتاح</p>
                        <p className="text-2xl font-bold text-[#1a1a2e]">
                          {(profile?.wallet_balance || 0).toLocaleString()} ر.س
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">مبلغ السحب (ر.س)</label>
                        <Input
                          type="number"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          placeholder="أدخل المبلغ"
                          className="mt-1"
                          max={profile?.wallet_balance || 0}
                        />
                      </div>
                      <Button
                        onClick={handleWithdraw}
                        disabled={isProcessing || !withdrawAmount || parseFloat(withdrawAmount) > (profile?.wallet_balance || 0)}
                        className="w-full bg-gradient-to-r from-[#1a1a2e] to-[#d4a574] text-white"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin ml-2" />
                            جاري المعالجة...
                          </>
                        ) : (
                          "تأكيد السحب"
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Escrow Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-lg mb-8 bg-blue-50 border-blue-200">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-800">نظام الدفع الضامن</h3>
                <p className="text-sm text-blue-600">
                  يتم حجز أموال المشاريع حتى اكتمال التسليم والموافقة من الطرفين
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>سجل المعاملات</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length > 0 ? (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div 
                      key={transaction.id} 
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-xl"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                          {getTransactionIcon(transaction.type)}
                        </div>
                        <div>
                          <p className="font-medium text-[#1a1a2e]">
                            {getTransactionLabel(transaction.type)}
                          </p>
                          <p className="text-sm text-slate-500">
                            {new Date(transaction.created_date).toLocaleDateString("ar", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className={`font-bold ${
                          ["deposit", "escrow_release"].includes(transaction.type) 
                            ? "text-green-600" 
                            : "text-red-600"
                        }`}>
                          {["deposit", "escrow_release"].includes(transaction.type) ? "+" : "-"}
                          {transaction.amount?.toLocaleString()} ر.س
                        </p>
                        {getStatusBadge(transaction.status)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <DollarSign className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">لا توجد معاملات بعد</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}