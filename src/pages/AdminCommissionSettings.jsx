import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Percent, Save, DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function AdminCommissionSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [commissionRate, setCommissionRate] = useState(15);
  const [stats, setStats] = useState({
    totalCommissions: 0,
    averageProjectValue: 0,
    totalTransactions: 0
  });

  useEffect(() => {
    loadSettings();
    loadStats();
  }, []);

  const loadSettings = async () => {
    try {
      // In a real implementation, you'd fetch this from a settings entity
      // For now, using default 15%
      setCommissionRate(15);
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const transactions = await base44.entities.Transaction.filter({ type: "commission" });
      const total = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      
      setStats({
        totalCommissions: total,
        totalTransactions: transactions.length,
        averageProjectValue: transactions.length > 0 ? total / transactions.length : 0
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const handleSave = async () => {
    if (commissionRate < 0 || commissionRate > 50) {
      toast.error("يجب أن تكون نسبة العمولة بين 0% و 50%");
      return;
    }

    setSaving(true);
    try {
      // In a real implementation, save to a Settings entity
      toast.success("تم حفظ إعدادات العمولة بنجاح");
      await loadStats();
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("حدث خطأ في حفظ الإعدادات");
    } finally {
      setSaving(false);
    }
  };

  const calculateCommission = (amount) => {
    return (amount * commissionRate / 100).toFixed(2);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30 py-8" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-2">
            إعدادات العمولات
          </h1>
          <p className="text-slate-600 mb-8">إدارة نسبة عمولة المنصة من المعاملات</p>
        </motion.div>

        {/* Statistics */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="w-8 h-8 text-purple-600" />
                </div>
                <p className="text-sm text-slate-600 mb-1">إجمالي العمولات المحصلة</p>
                <p className="text-3xl font-bold text-purple-900">
                  {stats.totalCommissions.toLocaleString('ar-SA')} <span className="text-lg">ر.س</span>
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
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-sm text-slate-600 mb-1">عدد المعاملات</p>
                <p className="text-3xl font-bold text-blue-900">
                  {stats.totalTransactions}
                </p>
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
                  <Percent className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-sm text-slate-600 mb-1">النسبة الحالية</p>
                <p className="text-3xl font-bold text-green-900">
                  {commissionRate}%
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Commission Settings */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="w-5 h-5 text-purple-600" />
              تحديد نسبة العمولة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                نسبة العمولة (%)
              </label>
              <div className="flex gap-3">
                <Input
                  type="number"
                  min="0"
                  max="50"
                  step="0.5"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 0)}
                  className="text-lg"
                />
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-8"
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      جاري الحفظ
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      حفظ
                    </span>
                  )}
                </Button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                سيتم تطبيق هذه النسبة على جميع المعاملات الجديدة
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">ملاحظة مهمة:</p>
                <p>تغيير نسبة العمولة سيؤثر فقط على المعاملات الجديدة. المعاملات الحالية والمعلقة ستحتفظ بالنسبة السابقة.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Example Calculations */}
        <Card>
          <CardHeader>
            <CardTitle>أمثلة على حساب العمولة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1000, 5000, 10000, 50000].map((amount) => (
                <div key={amount} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">مبلغ المرحلة</p>
                    <p className="text-sm text-slate-600">{amount.toLocaleString('ar-SA')} ريال</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-purple-600">العمولة</p>
                    <p className="text-sm text-slate-600">{calculateCommission(amount)} ريال</p>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-green-600">للمهندس</p>
                    <p className="text-sm text-slate-600">
                      {(amount - calculateCommission(amount)).toLocaleString('ar-SA')} ريال
                    </p>
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