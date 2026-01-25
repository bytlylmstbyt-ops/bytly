import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Wallet, TrendingUp, Users, CheckCircle, Clock, 
  DollarSign, AlertCircle, Eye, Loader2 
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

      // Load engineers
      const engineersData = await base44.entities.Engineer.list("-created_date", 500);
      setEngineers(engineersData);

      // Load clients
      const clientsData = await base44.entities.Client.list("-created_date", 500);
      setClients(clientsData);

      // Load transactions
      const transactionsData = await base44.entities.Transaction.list("-created_date", 100);
      setTransactions(transactionsData);

      // Load withdrawal requests
      const withdrawalsData = await base44.entities.WithdrawalRequest.filter(
        { status: "pending" },
        "-created_date"
      );
      setWithdrawalRequests(withdrawalsData);

      // Calculate stats
      const engineersBalance = engineersData.reduce(
        (sum, eng) => sum + (eng.available_balance || 0) + (eng.pending_balance || 0),
        0
      );

      const clientsBalance = clientsData.reduce(
        (sum, client) => sum + (client.wallet_balance || 0),
        0
      );

      const platformCommissions = transactionsData
        .filter(t => t.type === "commission" && t.status === "completed")
        .reduce((sum, t) => sum + t.amount, 0);

      const pendingWithdrawalsTotal = withdrawalsData.reduce(
        (sum, w) => sum + w.amount,
        0
      );

      setStats({
        totalPlatformBalance: platformCommissions,
        totalEngineersBalance: engineersBalance,
        totalClientBalance: clientsBalance,
        pendingWithdrawals: pendingWithdrawalsTotal
      });

    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveWithdrawal = async (request) => {
    if (!confirm(`هل تريد الموافقة على طلب السحب بمبلغ ${request.amount} ريال؟`)) {
      return;
    }

    try {
      // Update withdrawal request status
      await base44.entities.WithdrawalRequest.update(request.id, {
        status: "completed",
        completion_date: new Date().toISOString()
      });

      // Create completion transaction
      await base44.entities.Transaction.create({
        user_id: request.engineer_id,
        type: "withdrawal_completed",
        amount: request.amount,
        status: "completed",
        description: "تم تحويل المبلغ إلى الحساب البنكي",
        withdrawal_request_id: request.id
      });

      alert("تم الموافقة على طلب السحب بنجاح");
      loadData();
    } catch (error) {
      console.error("Error approving withdrawal:", error);
      alert("حدث خطأ أثناء معالجة الطلب");
    }
  };

  const handleRejectWithdrawal = async (request) => {
    const reason = prompt("يرجى إدخال سبب الرفض:");
    if (!reason) return;

    try {
      // Update withdrawal request status
      await base44.entities.WithdrawalRequest.update(request.id, {
        status: "rejected",
        rejection_reason: reason,
        completion_date: new Date().toISOString()
      });

      // Return amount to engineer's available balance
      const engineer = engineers.find(e => e.id === request.engineer_id);
      if (engineer) {
        await base44.entities.Engineer.update(engineer.id, {
          available_balance: (engineer.available_balance || 0) + request.amount
        });
      }

      alert("تم رفض طلب السحب");
      loadData();
    } catch (error) {
      console.error("Error rejecting withdrawal:", error);
      alert("حدث خطأ أثناء معالجة الطلب");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#d4a574]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-2">
            لوحة تحكم المحافظ
          </h1>
          <p className="text-slate-600">إدارة محافظ المنصة والمستخدمين</p>
        </motion.div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-0 shadow-lg bg-gradient-to-br from-[#1a1a2e] to-[#d4a574] text-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">محفظة المنصة</CardTitle>
                <DollarSign className="w-5 h-5" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-1">
                  {stats.totalPlatformBalance.toLocaleString('ar-SA')}
                  <span className="text-lg mr-2">ريال</span>
                </div>
                <p className="text-xs text-white/80">إجمالي العمولات المحصلة</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">محافظ المصممين</CardTitle>
                <Users className="w-5 h-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 mb-1">
                  {stats.totalEngineersBalance.toLocaleString('ar-SA')}
                  <span className="text-lg text-slate-500 mr-2">ريال</span>
                </div>
                <p className="text-xs text-slate-500">{engineers.length} مصمم</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">محافظ العملاء</CardTitle>
                <Wallet className="w-5 h-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 mb-1">
                  {stats.totalClientBalance.toLocaleString('ar-SA')}
                  <span className="text-lg text-slate-500 mr-2">ريال</span>
                </div>
                <p className="text-xs text-slate-500">{clients.length} عميل</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">طلبات السحب المعلقة</CardTitle>
                <Clock className="w-5 h-5 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 mb-1">
                  {stats.pendingWithdrawals.toLocaleString('ar-SA')}
                  <span className="text-lg text-slate-500 mr-2">ريال</span>
                </div>
                <p className="text-xs text-slate-500">{withdrawalRequests.length} طلب</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="engineers" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="engineers">محافظ المصممين</TabsTrigger>
            <TabsTrigger value="clients">محافظ العملاء</TabsTrigger>
            <TabsTrigger value="withdrawals">طلبات السحب</TabsTrigger>
            <TabsTrigger value="transactions">المعاملات</TabsTrigger>
          </TabsList>

          {/* Engineers Wallets */}
          <TabsContent value="engineers">
            <Card>
              <CardHeader>
                <CardTitle>محافظ المصممين</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {engineers.map((engineer) => (
                    <div
                      key={engineer.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                          {engineer.full_name?.charAt(0) || "م"}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{engineer.full_name}</p>
                          <p className="text-sm text-slate-500">{engineer.email}</p>
                        </div>
                      </div>
                      <div className="text-left space-y-1">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="text-xs text-slate-500">معلق</p>
                            <p className="font-bold text-amber-600">
                              {(engineer.pending_balance || 0).toLocaleString('ar-SA')} ر.س
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">متاح</p>
                            <p className="font-bold text-green-600">
                              {(engineer.available_balance || 0).toLocaleString('ar-SA')} ر.س
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Clients Wallets */}
          <TabsContent value="clients">
            <Card>
              <CardHeader>
                <CardTitle>محافظ العملاء</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {clients.map((client) => (
                    <div
                      key={client.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-bold">
                          {client.full_name?.charAt(0) || "ع"}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{client.full_name}</p>
                          <p className="text-sm text-slate-500">{client.email}</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="text-xs text-slate-500 mb-1">الرصيد</p>
                        <p className="text-2xl font-bold text-slate-900">
                          {(client.wallet_balance || 0).toLocaleString('ar-SA')} ر.س
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Withdrawal Requests */}
          <TabsContent value="withdrawals">
            <Card>
              <CardHeader>
                <CardTitle>طلبات السحب المعلقة</CardTitle>
              </CardHeader>
              <CardContent>
                {withdrawalRequests.length > 0 ? (
                  <div className="space-y-4">
                    {withdrawalRequests.map((request) => {
                      const engineer = engineers.find(e => e.id === request.engineer_id);
                      return (
                        <div
                          key={request.id}
                          className="p-4 rounded-lg border bg-amber-50"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <p className="font-medium text-slate-900 mb-1">
                                {engineer?.full_name || "مصمم"}
                              </p>
                              <p className="text-sm text-slate-600 mb-2">
                                {engineer?.email}
                              </p>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-slate-500">المبلغ</p>
                                  <p className="font-bold text-slate-900">
                                    {request.amount.toLocaleString('ar-SA')} ريال
                                  </p>
                                </div>
                                <div>
                                  <p className="text-slate-500">الآيبان</p>
                                  <p className="font-mono text-xs">{request.iban}</p>
                                </div>
                                <div>
                                  <p className="text-slate-500">البنك</p>
                                  <p>{request.bank_name}</p>
                                </div>
                                <div>
                                  <p className="text-slate-500">اسم الحساب</p>
                                  <p>{request.account_holder_name}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleApproveWithdrawal(request)}
                              className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 ml-2" />
                              الموافقة
                            </Button>
                            <Button
                              onClick={() => handleRejectWithdrawal(request)}
                              variant="outline"
                              className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
                            >
                              <AlertCircle className="w-4 h-4 ml-2" />
                              الرفض
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد طلبات سحب معلقة</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions */}
          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>آخر المعاملات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transactions.slice(0, 50).map((transaction) => {
                    const getTypeLabel = (type) => {
                      const labels = {
                        deposit: "إيداع",
                        withdrawal: "سحب",
                        escrow_hold: "حجز في الضمان",
                        escrow_release: "تحرير من الضمان",
                        subscription: "اشتراك",
                        commission: "عمولة المنصة",
                        refund: "استرداد",
                        withdrawal_request: "طلب سحب",
                        withdrawal_completed: "سحب مكتمل"
                      };
                      return labels[type] || type;
                    };

                    const getStatusBadge = (status) => {
                      const config = {
                        pending: { label: "معلق", color: "bg-yellow-100 text-yellow-800" },
                        completed: { label: "مكتمل", color: "bg-green-100 text-green-800" },
                        failed: { label: "فشل", color: "bg-red-100 text-red-800" },
                        cancelled: { label: "ملغي", color: "bg-slate-100 text-slate-800" }
                      };
                      const style = config[status] || config.pending;
                      return <Badge className={style.color}>{style.label}</Badge>;
                    };

                    return (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-4 rounded-lg border"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-slate-900 mb-1">
                            {getTypeLabel(transaction.type)}
                          </p>
                          {transaction.description && (
                            <p className="text-sm text-slate-600 mb-2">
                              {transaction.description}
                            </p>
                          )}
                          <p className="text-xs text-slate-400">
                            {new Date(transaction.created_date).toLocaleString('ar-SA')}
                          </p>
                        </div>
                        <div className="text-left">
                          <p className="text-xl font-bold text-slate-900 mb-1">
                            {transaction.amount.toLocaleString('ar-SA')} ر.س
                          </p>
                          {getStatusBadge(transaction.status)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}