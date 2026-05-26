import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DollarSign, TrendingUp, Users, Building2, 
  ArrowUpRight, ArrowDownRight, Loader2, Search, Percent
} from "lucide-react";
import MobileSelect from "@/components/mobile/MobileSelect";
import { motion } from "framer-motion";

export default function AdminWalletDashboard() {
  const [loading, setLoading] = useState(true);
  const [platformTransactions, setPlatformTransactions] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [clients, setClients] = useState([]);
  const [firms, setFirms] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load all transactions
      const transactions = await base44.entities.Transaction.filter({}, "-created_date", 500);
      setAllTransactions(transactions);

      // Filter platform commission transactions
      const commissions = transactions.filter(t => t.type === "commission" && t.user_type === "platform");
      setPlatformTransactions(commissions);

      // Load user data
      const engineersList = await base44.entities.Engineer.filter({});
      const clientsList = await base44.entities.Client.filter({});
      const firmsList = await base44.entities.EngineeringFirm.filter({});

      setEngineers(engineersList);
      setClients(clientsList);
      setFirms(firmsList);
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate platform earnings
  const totalCommissions = platformTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  
  // Calculate total wallet balances
  const totalEngineerBalances = engineers.reduce((sum, e) => 
    sum + (e.available_balance || 0) + (e.pending_balance || 0), 0
  );
  const totalClientBalances = clients.reduce((sum, c) => sum + (c.wallet_balance || 0), 0);
  const totalFirmBalances = firms.reduce((sum, f) => sum + (f.wallet_balance || 0), 0);

  // Calculate escrow amounts
  const totalEscrow = allTransactions
    .filter(t => t.status === "held_in_escrow")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#d4a574]" />
      </div>
    );
  }

  const filteredTransactions = allTransactions.filter(t => {
    const matchesSearch = 
      t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.user_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || t.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30 py-8" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-2">
            لوحة التحكم المالية للمنصة
          </h1>
          <p className="text-slate-600 mb-8">إدارة ومراقبة المعاملات المالية والعمولات</p>
        </motion.div>

        {/* Financial Overview */}
        <div className="grid md:grid-cols-4 gap-4 mb-8" style={{ gridAutoRows: "auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="w-8 h-8 text-purple-600" />
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-sm text-slate-600 mb-1">إجمالي عمولات المنصة</p>
                <p className="text-3xl font-bold text-purple-900">
                  {totalCommissions.toLocaleString('ar-SA')} <span className="text-lg">ر.س</span>
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-sm text-slate-600 mb-1">محافظ المهندسين</p>
                <p className="text-3xl font-bold text-blue-900">
                  {totalEngineerBalances.toLocaleString('ar-SA')} <span className="text-lg">ر.س</span>
                </p>
                <p className="text-xs text-blue-700 mt-1">{engineers.length} مهندس</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-sm text-slate-600 mb-1">محافظ العملاء</p>
                <p className="text-3xl font-bold text-green-900">
                  {totalClientBalances.toLocaleString('ar-SA')} <span className="text-lg">ر.س</span>
                </p>
                <p className="text-xs text-green-700 mt-1">{clients.length} عميل</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <Building2 className="w-8 h-8 text-amber-600" />
                </div>
                <p className="text-sm text-slate-600 mb-1">الأموال في الضمان</p>
                <p className="text-3xl font-bold text-amber-900">
                  {totalEscrow.toLocaleString('ar-SA')} <span className="text-lg">ر.س</span>
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Extra: نسبة العمولة */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="md:col-span-4"
          >
            <Card className="bg-gradient-to-r from-slate-800 to-slate-700 text-white border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/10 rounded-xl">
                      <Percent className="w-6 h-6 text-amber-300" />
                    </div>
                    <div>
                      <p className="text-white/70 text-sm">ملخص المنصة المالي</p>
                      <p className="font-semibold text-lg">نسبة العمولة الحالية: <span className="text-amber-300">15%</span></p>
                    </div>
                  </div>
                  <div className="flex gap-6 text-center">
                    <div>
                      <p className="text-white/60 text-xs">إجمالي الأرصدة</p>
                      <p className="text-xl font-bold text-white">
                        {(totalEngineerBalances + totalClientBalances + totalFirmBalances).toLocaleString('ar-SA')} ر.س
                      </p>
                    </div>
                    <div>
                      <p className="text-white/60 text-xs">عمولات المنصة</p>
                      <p className="text-xl font-bold text-amber-300">
                        {totalCommissions.toLocaleString('ar-SA')} ر.س
                      </p>
                    </div>
                    <div>
                      <p className="text-white/60 text-xs">المعاملات الكلية</p>
                      <p className="text-xl font-bold text-white">{allTransactions.length}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>سجل المعاملات</CardTitle>
            <div className="flex gap-3 mt-4">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="بحث بالوصف أو البريد..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
              <MobileSelect
                value={filterType}
                onValueChange={setFilterType}
                label="نوع المعاملة"
                placeholder="كل الأنواع"
                options={[
                  { value: "all", label: "كل الأنواع" },
                  { value: "commission", label: "عمولات" },
                  { value: "escrow_hold", label: "حجز ضمان" },
                  { value: "escrow_release", label: "تحرير ضمان" },
                  { value: "refund", label: "استرجاع" },
                  { value: "withdrawal", label: "سحب" },
                  { value: "deposit", label: "إيداع" },
                ]}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={
                        transaction.type === "commission" 
                          ? "bg-purple-100 text-purple-700"
                          : transaction.type === "escrow_release"
                          ? "bg-green-100 text-green-700"
                          : transaction.type === "escrow_hold"
                          ? "bg-amber-100 text-amber-700"
                          : transaction.type === "refund"
                          ? "bg-red-100 text-red-700"
                          : "bg-blue-100 text-blue-700"
                      }>
                        {transaction.type === "commission" && "عمولة"}
                        {transaction.type === "escrow_release" && "تحرير ضمان"}
                        {transaction.type === "escrow_hold" && "حجز ضمان"}
                        {transaction.type === "refund" && "استرجاع"}
                        {transaction.type === "withdrawal" && "سحب"}
                        {!["commission", "escrow_release", "escrow_hold", "refund", "withdrawal"].includes(transaction.type) && transaction.type}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {transaction.user_type === "engineer" && "مهندس"}
                        {transaction.user_type === "client" && "عميل"}
                        {transaction.user_type === "firm" && "شركة"}
                        {transaction.user_type === "platform" && "منصة"}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-slate-900">{transaction.description}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {transaction.user_email} • {new Date(transaction.created_date).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className={`text-lg font-bold ${
                      transaction.type === "commission" 
                        ? "text-purple-600"
                        : transaction.type === "escrow_release"
                        ? "text-green-600"
                        : "text-slate-900"
                    }`}>
                      {transaction.type === "commission" ? "+" : ""}
                      {transaction.amount.toLocaleString('ar-SA')} ر.س
                    </p>
                    {transaction.commission_amount > 0 && (
                      <p className="text-xs text-purple-600">عمولة: {transaction.commission_amount.toLocaleString('ar-SA')} ر.س</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}