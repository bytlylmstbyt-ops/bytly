import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, Building2, UserCircle, Search, 
  Calendar, Gift, Crown, Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { differenceInDays } from "date-fns";

export default function AdminSubscriptionControl() {
  const [loading, setLoading] = useState(true);
  const [engineers, setEngineers] = useState([]);
  const [clients, setClients] = useState([]);
  const [firms, setFirms] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [globalFreeMode, setGlobalFreeMode] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [engineersList, clientsList, firmsList] = await Promise.all([
        base44.entities.Engineer.filter({}),
        base44.entities.Client.filter({}),
        base44.entities.EngineeringFirm.filter({})
      ]);

      setEngineers(engineersList);
      setClients(clientsList);
      setFirms(firmsList);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserSubscription = async (userId, userType, currentStatus) => {
    try {
      const updates = {
        is_subscription_active: !currentStatus
      };

      if (userType === "engineer") {
        await base44.entities.Engineer.update(userId, updates);
      } else if (userType === "client") {
        await base44.entities.Client.update(userId, updates);
      } else if (userType === "firm") {
        await base44.entities.EngineeringFirm.update(userId, updates);
      }

      toast.success("تم تحديث حالة الاشتراك");
      await loadData();
    } catch (error) {
      console.error("Error toggling subscription:", error);
      toast.error("حدث خطأ في التحديث");
    }
  };

  const convertToPayingUser = async (userId, userType, planType) => {
    try {
      const startDate = new Date();
      const endDate = new Date();
      if (planType === "monthly") {
        endDate.setMonth(endDate.getMonth() + 1);
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      const updates = {
        subscription_type: planType,
        subscription_start_date: startDate.toISOString().split("T")[0],
        subscription_end_date: endDate.toISOString().split("T")[0],
        is_subscription_active: true
      };

      if (userType === "engineer") {
        await base44.entities.Engineer.update(userId, updates);
      } else if (userType === "client") {
        await base44.entities.Client.update(userId, updates);
      } else if (userType === "firm") {
        await base44.entities.EngineeringFirm.update(userId, updates);
      }

      toast.success(`تم تحويل المستخدم إلى باقة ${planType === "monthly" ? "شهرية" : "سنوية"}`);
      await loadData();
    } catch (error) {
      console.error("Error converting user:", error);
      toast.error("حدث خطأ في التحويل");
    }
  };

  const extendTrial = async (userId, userType, daysToAdd) => {
    try {
      let currentUser;
      if (userType === "engineer") {
        [currentUser] = await base44.entities.Engineer.filter({ id: userId });
      } else if (userType === "client") {
        [currentUser] = await base44.entities.Client.filter({ id: userId });
      } else {
        [currentUser] = await base44.entities.EngineeringFirm.filter({ id: userId });
      }

      const currentEndDate = currentUser.trial_end_date 
        ? new Date(currentUser.trial_end_date)
        : new Date();
      
      const newEndDate = new Date(currentEndDate);
      newEndDate.setDate(newEndDate.getDate() + daysToAdd);

      const updates = {
        trial_end_date: newEndDate.toISOString().split("T")[0],
        notification_sent_15_days: false
      };

      if (userType === "engineer") {
        await base44.entities.Engineer.update(userId, updates);
      } else if (userType === "client") {
        await base44.entities.Client.update(userId, updates);
      } else {
        await base44.entities.EngineeringFirm.update(userId, updates);
      }

      toast.success(`تم تمديد الفترة التجريبية ${daysToAdd} يوم`);
      await loadData();
    } catch (error) {
      console.error("Error extending trial:", error);
      toast.error("حدث خطأ في التمديد");
    }
  };

  const renderUserRow = (user, userType) => {
    const daysLeft = user.trial_end_date 
      ? differenceInDays(new Date(user.trial_end_date), new Date())
      : null;

    const isFreeTrial = user.subscription_type === "free_trial";
    const displayName = user.full_name || user.company_name;

    return (
      <div
        key={user.id}
        className="flex items-center justify-between p-4 bg-white rounded-lg border hover:shadow-md transition-shadow"
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-medium text-slate-900">{displayName}</p>
            <Badge className={
              isFreeTrial 
                ? "bg-green-100 text-green-700"
                : user.subscription_type === "yearly"
                ? "bg-amber-100 text-amber-700"
                : "bg-blue-100 text-blue-700"
            }>
              {isFreeTrial && <Gift className="w-3 h-3 ml-1" />}
              {isFreeTrial ? "تجريبي مجاني" : user.subscription_type === "yearly" ? "سنوي" : "شهري"}
            </Badge>
            {!user.is_subscription_active && (
              <Badge variant="outline" className="text-red-600 border-red-300">
                معطل
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-600">{user.email}</p>
          {daysLeft !== null && isFreeTrial && (
            <p className="text-xs text-slate-500 mt-1">
              <Calendar className="w-3 h-3 inline ml-1" />
              {daysLeft > 0 ? `${daysLeft} يوم متبقي` : "انتهت الفترة التجريبية"}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Switch
            checked={user.is_subscription_active}
            onCheckedChange={() => toggleUserSubscription(user.id, userType, user.is_subscription_active)}
          />
          <div className="flex gap-1">
            {isFreeTrial && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => extendTrial(user.id, userType, 30)}
                  className="text-xs"
                >
                  +30 يوم
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => convertToPayingUser(user.id, userType, "monthly")}
                  className="text-xs"
                >
                  → شهري
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => convertToPayingUser(user.id, userType, "yearly")}
                  className="text-xs"
                >
                  → سنوي
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
      </div>
    );
  }

  const filteredEngineers = engineers.filter(e => 
    e.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredClients = clients.filter(c =>
    c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFirms = firms.filter(f =>
    f.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const freeTrialCount = [...engineers, ...clients, ...firms].filter(u => u.subscription_type === "free_trial").length;
  const paidCount = [...engineers, ...clients, ...firms].filter(u => u.subscription_type !== "free_trial").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30 py-8" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-2">
            إدارة الاشتراكات
          </h1>
          <p className="text-slate-600 mb-8">التحكم في الاشتراكات والفترات التجريبية</p>
        </motion.div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Gift className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-sm text-slate-600 mb-1">مستخدمين في الفترة المجانية</p>
              <p className="text-3xl font-bold text-green-900">{freeTrialCount}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Crown className="w-8 h-8 text-purple-600" />
              </div>
              <p className="text-sm text-slate-600 mb-1">مشتركين مدفوعين</p>
              <p className="text-3xl font-bold text-purple-900">{paidCount}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-sm text-slate-600 mb-1">إجمالي المهندسين</p>
              <p className="text-3xl font-bold text-blue-900">{engineers.length}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Building2 className="w-8 h-8 text-amber-600" />
              </div>
              <p className="text-sm text-slate-600 mb-1">الشركات الاستشارية</p>
              <p className="text-3xl font-bold text-amber-900">{firms.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute right-3 top-3 w-5 h-5 text-slate-400" />
              <Input
                placeholder="بحث بالاسم أو البريد الإلكتروني..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-12"
              />
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Tabs defaultValue="engineers">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="engineers">
              <Users className="w-4 h-4 ml-2" />
              المهندسين ({filteredEngineers.length})
            </TabsTrigger>
            <TabsTrigger value="clients">
              <UserCircle className="w-4 h-4 ml-2" />
              العملاء ({filteredClients.length})
            </TabsTrigger>
            <TabsTrigger value="firms">
              <Building2 className="w-4 h-4 ml-2" />
              الشركات ({filteredFirms.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="engineers" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>اشتراكات المهندسين</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredEngineers.map(engineer => renderUserRow(engineer, "engineer"))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clients" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>اشتراكات العملاء</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredClients.map(client => renderUserRow(client, "client"))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="firms" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>اشتراكات الشركات الاستشارية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredFirms.map(firm => renderUserRow(firm, "firm"))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}