import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { 
  Briefcase, Wallet, Plus, ArrowLeft, Clock, 
  TrendingUp, Eye, DollarSign, FileText, Settings, Shield, Unlock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function IndividualClientDashboard({ client, stats, recentProjects }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16 border-2 border-white shadow-lg">
                <AvatarImage src={client.profile_image} />
                <AvatarFallback className="bg-gradient-to-br from-[#1a1a2e] to-[#d4a574] text-white text-xl">
                  {client.full_name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold text-[#1a1a2e]">
                  مرحباً، {client.full_name}
                </h1>
                <p className="text-slate-500">صاحب مشاريع</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link to={createPageUrl("CreateProject")}>
                <Button className="bg-gradient-to-r from-[#1a1a2e] to-[#d4a574] text-white">
                  <Plus className="w-5 h-5 ml-2" />
                  مشروع جديد
                </Button>
              </Link>
              <Link to={createPageUrl("Settings")}>
                <Button variant="outline">
                  <Settings className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-[#1a1a2e]">{stats.totalProjects}</p>
                <p className="text-sm text-slate-500">إجمالي المشاريع</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-[#1a1a2e]">{stats.openProjects}</p>
                <p className="text-sm text-slate-500">مشاريع مفتوحة</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-[#1a1a2e]">{stats.inProgressProjects}</p>
                <p className="text-sm text-slate-500">قيد التنفيذ</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-[#1a1a2e]">{stats.walletBalance?.toLocaleString()}</p>
                <p className="text-sm text-slate-500">ر.س في المحفظة</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Escrow Alert for in-progress projects */}
        {recentProjects.some(p => p.status === 'in_progress' && p.escrow_status === 'held') && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <Card className="border-blue-200 bg-blue-50 border-0 shadow-lg">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-200 flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5 text-blue-700" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900">مبالغ ضمان محجوزة</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      لديك مشاريع بمبالغ محجوزة في بيتلي. بعد استلام المخططات يمكنك تحرير المبلغ للمهندس من صفحة تفاصيل المشروع.
                    </p>
                    <div className="flex gap-2 mt-3">
                      {recentProjects.filter(p => p.status === 'in_progress' && p.escrow_status === 'held').map(p => (
                        <Link key={p.id} to={createPageUrl("ProjectDetails") + `?id=${p.id}`}>
                          <Badge className="bg-blue-100 text-blue-700 cursor-pointer hover:bg-blue-200 gap-1">
                            <Unlock className="w-3 h-3" /> {p.title?.slice(0, 20)}...
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Recent Projects */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>مشاريعي الأخيرة</CardTitle>
            </CardHeader>
            <CardContent>
              {recentProjects.length > 0 ? (
                <div className="space-y-4">
                  {recentProjects.map(project => (
                    <Link key={project.id} to={createPageUrl("ProjectDetails") + `?id=${project.id}`}>
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                        <div>
                          <p className="font-medium text-[#1a1a2e]">{project.title}</p>
                          <p className="text-sm text-slate-500">{project.total_proposals || 0} عرض</p>
                        </div>
                        <Badge className={
                          project.status === "completed" ? "bg-green-100 text-green-700" :
                          project.status === "in_progress" ? "bg-blue-100 text-blue-700" :
                          project.status === "cancelled" ? "bg-red-100 text-red-700" :
                          "bg-amber-100 text-amber-700"
                        }>
                          {project.status === "completed" ? "مكتمل" :
                           project.status === "in_progress" ? "قيد التنفيذ" :
                           project.status === "cancelled" ? "ملغي" : "مفتوح"}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Briefcase className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>لم تضف أي مشاريع بعد</p>
                  <Link to={createPageUrl("CreateProject")}>
                    <Button variant="link" className="text-[#d4a574]">
                      أضف مشروعك الأول
                      <ArrowLeft className="w-4 h-4 mr-2" />
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}