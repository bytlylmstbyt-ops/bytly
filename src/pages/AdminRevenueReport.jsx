import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { 
  DollarSign, TrendingUp, ShoppingCart, Briefcase, 
  Calendar, Download, Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminRevenueReport() {
  const [revenues, setRevenues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [filterSource, setFilterSource] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    
    const currentUser = await base44.auth.me();
    setUser(currentUser);

    // Only admins can view
    if (currentUser.role !== "admin") {
      alert("غير مصرح لك بالدخول");
      window.location.href = "/";
      return;
    }

    const revenuesData = await base44.entities.PlatformRevenue.filter(
      { status: "collected" },
      "-payment_date"
    );
    setRevenues(revenuesData);
    setIsLoading(false);
  };

  const filteredRevenues = revenues.filter(rev => {
    if (!filterSource) return true;
    return rev.source_type === filterSource;
  });

  const totalRevenue = filteredRevenues.reduce((sum, rev) => sum + (rev.commission_amount || 0), 0);
  const projectRevenue = filteredRevenues
    .filter(r => r.source_type === "project_milestone")
    .reduce((sum, rev) => sum + (rev.commission_amount || 0), 0);
  const designRevenue = filteredRevenues
    .filter(r => r.source_type === "design_purchase")
    .reduce((sum, rev) => sum + (rev.commission_amount || 0), 0);

  const sourceLabels = {
    project_milestone: "مشاريع",
    design_purchase: "متجر التصاميم",
    subscription: "اشتراكات"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[#1a1a2e] mb-2">تقرير أرباح المنصة</h1>
              <p className="text-slate-600">إجمالي العمولات المحصلة</p>
            </div>
            <Button variant="outline">
              <Download className="w-5 h-5 ml-2" />
              تصدير Excel
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">إجمالي الأرباح</p>
                    <p className="text-3xl font-bold text-green-600">
                      {totalRevenue.toLocaleString('ar-SA')}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">ريال سعودي</p>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-green-600 flex items-center justify-center">
                    <DollarSign className="w-7 h-7 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">عمولات المشاريع</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {projectRevenue.toLocaleString('ar-SA')}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">15% من كل دفعة</p>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center">
                    <Briefcase className="w-7 h-7 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">عمولات المتجر</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {designRevenue.toLocaleString('ar-SA')}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">25% من كل بيع</p>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-purple-600 flex items-center justify-center">
                    <ShoppingCart className="w-7 h-7 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 mb-6">
            <Filter className="w-5 h-5 text-slate-500" />
            <Select value={filterSource} onValueChange={setFilterSource}>
              <SelectTrigger className="w-[200px] bg-white">
                <SelectValue placeholder="جميع المصادر" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>جميع المصادر</SelectItem>
                <SelectItem value="project_milestone">مشاريع فقط</SelectItem>
                <SelectItem value="design_purchase">متجر التصاميم فقط</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Revenue Table */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>سجل العمولات التفصيلي</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredRevenues.length > 0 ? (
                  filteredRevenues.map((revenue, index) => (
                    <motion.div
                      key={revenue.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={
                              revenue.source_type === "project_milestone" 
                                ? "bg-blue-100 text-blue-700" 
                                : "bg-purple-100 text-purple-700"
                            }>
                              {sourceLabels[revenue.source_type]}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {(revenue.commission_rate * 100).toFixed(0)}%
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600">
                            بائع: {revenue.seller_email}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(revenue.payment_date).toLocaleDateString('ar-SA', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div className="text-left">
                          <p className="text-xs text-slate-500 mb-1">المبلغ الكلي</p>
                          <p className="text-lg font-semibold text-slate-700">
                            {revenue.total_amount.toLocaleString('ar-SA')} ر.س
                          </p>
                          <div className="flex items-center gap-1 mt-2">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                            <p className="text-xl font-bold text-green-600">
                              +{revenue.commission_amount.toLocaleString('ar-SA')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <DollarSign className="w-16 h-16 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">لا توجد عمولات محصلة</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}