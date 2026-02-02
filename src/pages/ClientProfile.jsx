import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User, Building2, TrendingUp, CheckCircle, Clock,
  DollarSign, Star, MapPin, Mail, Phone
} from "lucide-react";
import { motion } from "framer-motion";

export default function ClientProfile() {
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get("id");
  const [client, setClient] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClientData();
  }, [clientId]);

  const loadClientData = async () => {
    try {
      const [clientData] = await base44.entities.Client.filter({ id: clientId });
      setClient(clientData);

      const projectsList = await base44.entities.Project.filter({ client_id: clientId });
      setProjects(projectsList);
    } catch (error) {
      console.error("Error loading client:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTrustScoreColor = (score) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-amber-600";
    return "text-slate-600";
  };

  const getTrustScoreLabel = (score) => {
    if (score >= 80) return "ممتاز";
    if (score >= 60) return "جيد جداً";
    if (score >= 40) return "جيد";
    return "مبتدئ";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#d4a574]" />
      </div>
    );
  }

  if (!client) {
    return <div className="text-center py-20">العميل غير موجود</div>;
  }

  const isInvestor = client.client_type === "investor";
  const trustScore = client.trust_score || 0;
  const paymentReliability = client.total_payments > 0 
    ? ((client.on_time_payments / client.total_payments) * 100).toFixed(0)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="shadow-xl mb-8">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row gap-6">
                <Avatar className="w-24 h-24 mx-auto md:mx-0">
                  <AvatarImage src={client.profile_image} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-3xl">
                    {client.full_name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-2xl font-bold text-[#1a1a2e]">{client.full_name}</h1>
                    <Badge className={isInvestor ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}>
                      {isInvestor ? "مستثمر" : "عميل فردي"}
                    </Badge>
                  </div>

                  {isInvestor && client.company_name && (
                    <p className="text-lg text-slate-600 mb-2">{client.company_name}</p>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm text-slate-600 mb-4">
                    {client.city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {client.city}
                      </span>
                    )}
                    {client.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {client.email}
                      </span>
                    )}
                  </div>

                  {/* Trust Score */}
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">نقاط الثقة</span>
                      <span className={`text-2xl font-bold ${getTrustScoreColor(trustScore)}`}>
                        {trustScore}/100
                      </span>
                    </div>
                    <Progress value={trustScore} className="h-2 mb-2" />
                    <Badge className="bg-white/60">
                      {getTrustScoreLabel(trustScore)}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Payment History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  سجل الدفع
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600">موثوقية الدفع</span>
                    <span className="font-bold text-lg text-green-600">{paymentReliability}%</span>
                  </div>
                  <Progress value={paymentReliability} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-xs text-slate-500">دفعات في الوقت</p>
                    <p className="text-xl font-bold text-green-600">{client.on_time_payments || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">إجمالي الدفعات</p>
                    <p className="text-xl font-bold text-blue-600">{client.total_payments || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Projects Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  المشاريع
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">إجمالي المشاريع</span>
                    <Badge variant="outline" className="text-lg px-3">
                      {client.total_projects || 0}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">المشاريع النشطة</span>
                    <Badge className="bg-blue-100 text-blue-700">
                      {projects.filter(p => p.status === "in_progress").length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">المشاريع المكتملة</span>
                    <Badge className="bg-green-100 text-green-700">
                      {projects.filter(p => p.status === "completed").length}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Real Estate Portfolio (Investors Only) */}
          {isInvestor && client.real_estate_portfolio?.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-purple-600" />
                  محفظة العقارات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {client.real_estate_portfolio.map((property, idx) => (
                    <div key={idx} className="p-4 border rounded-lg hover:border-purple-300 transition-all">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-[#1a1a2e]">{property.property_name}</h4>
                        <Badge className={
                          property.status === "completed" 
                            ? "bg-green-100 text-green-700"
                            : property.status === "construction"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-slate-100 text-slate-700"
                        }>
                          {property.status === "completed" ? "مكتمل" : 
                           property.status === "construction" ? "قيد الإنشاء" : "تخطيط"}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 flex items-center gap-1 mb-2">
                        <MapPin className="w-3 h-3" />
                        {property.location}
                      </p>
                      {property.investment_value && (
                        <p className="text-sm font-medium text-purple-600">
                          {property.investment_value.toLocaleString('ar-SA')} ر.س
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bio */}
          {engineer.bio && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>نبذة عني</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 leading-relaxed">{engineer.bio}</p>
                </CardContent>
              </Card>
            </motion.div>
          )}