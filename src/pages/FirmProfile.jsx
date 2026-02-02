import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Shield, Building2, Award, Clock, Star, CheckCircle,
  FileCheck, Users, TrendingUp, MapPin, Phone, Mail, Globe
} from "lucide-react";
import { motion } from "framer-motion";

export default function FirmProfile() {
  const [searchParams] = useSearchParams();
  const firmId = searchParams.get("id");
  const [firm, setFirm] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFirmData();
  }, [firmId]);

  const loadFirmData = async () => {
    try {
      const [firmData] = await base44.entities.EngineeringFirm.filter({ id: firmId });
      setFirm(firmData);

      const members = await base44.entities.FirmTeamMember.filter({ firm_id: firmId });
      setTeamMembers(members);
    } catch (error) {
      console.error("Error loading firm:", error);
    } finally {
      setLoading(false);
    }
  };

  const specializationLabels = {
    structural: "إنشائي",
    mep: "كهروميكانيك",
    fire_safety: "السلامة والحريق",
    architectural: "معماري",
    civil: "مدني",
    electrical: "كهربائي",
    plumbing: "سباكة",
    hvac: "تكييف وتهوية"
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#d4a574]" />
      </div>
    );
  }

  if (!firm) {
    return <div className="text-center py-20">الشركة غير موجودة</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cover & Profile Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="relative">
            <div className="h-64 rounded-t-2xl overflow-hidden bg-gradient-to-r from-purple-600 to-indigo-600">
              {firm.cover_image && (
                <img src={firm.cover_image} alt="cover" className="w-full h-full object-cover" />
              )}
            </div>
            <div className="absolute -bottom-16 right-8">
              <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                <AvatarImage src={firm.company_logo} />
                <AvatarFallback className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white text-4xl">
                  {firm.company_name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>

          <Card className="mt-20 shadow-xl">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-[#1a1a2e]">{firm.company_name}</h1>
                    {firm.is_verified && (
                      <Badge className="bg-green-100 text-green-700 flex items-center gap-1">
                        <Shield className="w-4 h-4" />
                        موثق من بيتلي
                      </Badge>
                    )}
                  </div>
                  <p className="text-slate-600 mb-4">{firm.description}</p>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                    {firm.city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {firm.city}
                      </span>
                    )}
                    {firm.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {firm.phone}
                      </span>
                    )}
                    {firm.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {firm.email}
                      </span>
                    )}
                    {firm.website && (
                      <a href={firm.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                        <Globe className="w-4 h-4" />
                        الموقع الإلكتروني
                      </a>
                    )}
                  </div>
                </div>

                <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                  تواصل مع الشركة
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-3 gap-6 mt-6">
            {/* Stats Dashboard */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  لوحة الإحصائيات
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600">إجمالي المراجعات</span>
                    <span className="font-bold text-2xl text-purple-600">{firm.total_audits || 0}</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600">متوسط وقت الاعتماد</span>
                    <span className="font-bold text-lg flex items-center gap-1">
                      <Clock className="w-4 h-4 text-blue-600" />
                      {firm.average_approval_time || 0} يوم
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600">رضا العملاء</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span className="font-bold">{(firm.client_satisfaction_rating || 0).toFixed(1)}</span>
                      <span className="text-xs text-slate-500">/ 5</span>
                    </div>
                  </div>
                  <Progress value={(firm.client_satisfaction_rating || 0) * 20} className="h-2" />
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">المشاريع النشطة</span>
                    <Badge variant="outline">{firm.active_projects || 0}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Credentials */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-green-600" />
                  الاعتمادات الرسمية
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-slate-600 mb-1">السجل التجاري</p>
                  <p className="font-semibold text-green-700">{firm.commercial_registration}</p>
                </div>

                {firm.municipality_license && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-slate-600 mb-1">ترخيص البلدية</p>
                    <p className="font-semibold text-blue-700">{firm.municipality_license}</p>
                  </div>
                )}

                {firm.established_year && (
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-xs text-slate-600 mb-1">سنة التأسيس</p>
                    <p className="font-semibold text-purple-700">{firm.established_year}</p>
                  </div>
                )}

                {firm.team_size > 0 && (
                  <div className="p-3 bg-amber-50 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-600">حجم الفريق</p>
                      <p className="font-semibold text-amber-700">{firm.team_size} مهندس</p>
                    </div>
                    <Users className="w-8 h-8 text-amber-500" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Specializations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  التخصصات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {firm.specializations?.map((spec, idx) => (
                    <Badge key={idx} className="bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700">
                      <CheckCircle className="w-3 h-3 ml-1" />
                      {specializationLabels[spec] || spec}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Team Members */}
          {teamMembers.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#d4a574]" />
                  فريق العمل
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="p-4 border rounded-lg hover:border-purple-300 transition-all">
                      <div className="flex items-start gap-3">
                        <Avatar>
                          <AvatarImage src={member.profile_image} />
                          <AvatarFallback>{member.full_name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold">{member.full_name}</p>
                          <p className="text-sm text-slate-600">{member.position}</p>
                          {member.specialization && (
                            <Badge variant="outline" className="text-xs mt-1">
                              {member.specialization}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}