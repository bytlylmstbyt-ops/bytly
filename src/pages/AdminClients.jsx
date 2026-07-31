import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Users, Search, Edit, Ban, CheckCircle, Loader2,
  Mail, Phone, MapPin, Briefcase, DollarSign
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function AdminClientsPage() {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingClient, setEditingClient] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      if (user.role !== "admin") {
        alert("غير مصرح لك بالوصول لهذه الصفحة");
        return;
      }

      const clientsData = await base44.entities.Client.list("-created_date");
      
      // Load projects for each client
      const clientsWithProjects = await Promise.all(
        clientsData.map(async (client) => {
          const projects = await base44.entities.Project.filter({ 
            client_id: client.id 
          });
          const totalSpent = projects.reduce((sum, p) => sum + (p.escrow_amount || 0), 0);
          return {
            ...client,
            totalProjects: projects.length,
            totalSpent
          };
        })
      );

      setClients(clientsWithProjects);
    } catch (error) {
      console.error("Error loading data:", error);
      alert("حدث خطأ في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setEditFormData({
      full_name: client.full_name,
      phone: client.phone,
      city: client.city,
      country: client.country
    });
  };

  const saveEdit = async () => {
    try {
      await base44.entities.Client.update(editingClient.id, editFormData);
      await loadData();
      setEditingClient(null);
      alert("تم تحديث البيانات بنجاح");
    } catch (error) {
      alert("حدث خطأ في التحديث");
    }
  };

  const toggleClientStatus = async (client) => {
    try {
      const newStatus = client.is_active === false ? true : false;
      await base44.entities.Client.update(client.id, { is_active: newStatus });
      await loadData();
    } catch (error) {
      alert("حدث خطأ في تحديث الحالة");
    }
  };

  const filteredClients = clients.filter(client =>
    client.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#C9A66B]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-8 px-4" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-8 h-8 text-[#C9A66B]" />
            <h1 className="text-3xl font-bold text-[#1a1a2e]">إدارة العملاء</h1>
          </div>
          <p className="text-slate-600">عرض وتعديل وإدارة حسابات العملاء</p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-3xl font-bold text-[#1a1a2e]">{clients.length}</p>
                <p className="text-sm text-slate-500">إجمالي العملاء</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-3xl font-bold text-green-600">
                  {clients.filter(c => c.is_active !== false).length}
                </p>
                <p className="text-sm text-slate-500">نشط</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-3xl font-bold text-blue-600">
                  {clients.reduce((sum, c) => sum + (c.totalProjects || 0), 0)}
                </p>
                <p className="text-sm text-slate-500">مشاريع منشورة</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-3xl font-bold text-purple-600">
                  {clients.reduce((sum, c) => sum + (c.totalSpent || 0), 0).toLocaleString('ar-SA')}
                </p>
                <p className="text-sm text-slate-500">إجمالي الإنفاق (ريال)</p>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="ابحث بالاسم أو البريد الإلكتروني أو المدينة..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Clients List */}
        <div className="grid gap-4">
          {filteredClients.map((client, index) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-[#1a1a2e]">{client.full_name}</h3>
                        {client.is_active === false ? (
                          <Badge variant="destructive">معطل</Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-800">نشط</Badge>
                        )}
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-3 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          {client.email}
                        </div>
                        {client.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            {client.phone}
                          </div>
                        )}
                        {client.city && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {client.city}, {client.country}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4" />
                          {client.totalProjects || 0} مشروع
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          {(client.totalSpent || 0).toLocaleString('ar-SA')} ريال
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(client)}
                          >
                            <Edit className="w-4 h-4 ml-2" />
                            تعديل
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>تعديل بيانات العميل</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>الاسم الكامل</Label>
                              <Input
                                value={editFormData.full_name || ""}
                                onChange={(e) => setEditFormData({...editFormData, full_name: e.target.value})}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>رقم الهاتف</Label>
                              <Input
                                value={editFormData.phone || ""}
                                onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>المدينة</Label>
                                <Input
                                  value={editFormData.city || ""}
                                  onChange={(e) => setEditFormData({...editFormData, city: e.target.value})}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>الدولة</Label>
                                <Input
                                  value={editFormData.country || ""}
                                  onChange={(e) => setEditFormData({...editFormData, country: e.target.value})}
                                />
                              </div>
                            </div>
                            <Button onClick={saveEdit} className="w-full">
                              حفظ التغييرات
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button
                        variant={client.is_active === false ? "default" : "destructive"}
                        size="sm"
                        onClick={() => toggleClientStatus(client)}
                      >
                        {client.is_active === false ? (
                          <>
                            <CheckCircle className="w-4 h-4 ml-2" />
                            تفعيل
                          </>
                        ) : (
                          <>
                            <Ban className="w-4 h-4 ml-2" />
                            تعطيل
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}