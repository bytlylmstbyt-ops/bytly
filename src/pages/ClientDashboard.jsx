import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { supabase } from "@/lib/supabaseClient";
import IndividualClientDashboard from "@/components/client/IndividualClientDashboard";
import InvestorClientDashboard from "@/components/client/InvestorClientDashboard";
import SmartAlertsDashboard from "@/components/client/SmartAlertsDashboard";
import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, Clock, TrendingUp, CheckCircle, DollarSign, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ClientDashboard() {
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState(null);
  const [stats, setStats] = useState({
    totalProjects: 0,
    openProjects: 0,
    inProgressProjects: 0,
    completedProjects: 0,
    totalSpent: 0,
    activeProposals: 0
  });
  const [recentProjects, setRecentProjects] = useState([]);
  const [recentProposals, setRecentProposals] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      const currentUser = authData?.user;
      if (!currentUser?.id) return;
      const { data: clientData } = await supabase.from("clients").select("*").eq("user_id", currentUser.id).maybeSingle();
      setClient(clientData);
      if (!clientData) return;
      const { data: projects = [] } = await supabase.from("projects").select("*").eq("client_id", clientData.id).order("created_at",{ascending:false});
      const projectIds=projects.map(p=>p.id);
      let myProposals=[];
      if(projectIds.length){
        const {data: proposals=[]}=await supabase.from("project_offers").select("*").in("project_id",projectIds);
        myProposals=proposals;
      }
      const openProjects=projects.filter(p=>p.status==="open");
      const inProgressProjects=projects.filter(p=>p.status==="in_progress");
      const completedProjects=projects.filter(p=>p.status==="completed");
      const totalSpent=completedProjects.reduce((sum,p)=>sum+Number(p.escrow_amount||p.budget_max||0),0);
      setStats({totalProjects:projects.length,openProjects:openProjects.length,inProgressProjects:inProgressProjects.length,completedProjects:completedProjects.length,totalSpent,activeProposals:myProposals.filter(p=>p.status==="pending").length});
      setRecentProjects(projects.slice(0,5)); setRecentProposals(myProposals.slice(0,5));
    } catch(error){ console.error("Error loading dashboard:",error); } finally { setLoading(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#C9A66B]"></div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-slate-600 mb-4">لم يتم العثور على حساب عميل</p>
            <Link to={createPageUrl("RegisterClient")}>
              <Button>إنشاء حساب عميل</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statCards = [
    {
      title: "إجمالي المشاريع",
      value: stats.totalProjects,
      icon: Briefcase,
      color: "bg-blue-500",
      bgColor: "bg-blue-50"
    },
    {
      title: "مشاريع مفتوحة",
      value: stats.openProjects,
      icon: Clock,
      color: "bg-green-500",
      bgColor: "bg-green-50"
    },
    {
      title: "قيد التنفيذ",
      value: stats.inProgressProjects,
      icon: TrendingUp,
      color: "bg-amber-500",
      bgColor: "bg-amber-50"
    },
    {
      title: "مكتملة",
      value: stats.completedProjects,
      icon: CheckCircle,
      color: "bg-purple-500",
      bgColor: "bg-purple-50"
    },
    {
      title: "إجمالي الإنفاق",
      value: `${stats.totalSpent.toLocaleString('ar-SA')} ر.س`,
      icon: DollarSign,
      color: "bg-emerald-500",
      bgColor: "bg-emerald-50"
    },
    {
      title: "عروض جديدة",
      value: stats.activeProposals,
      icon: Users,
      color: "bg-rose-500",
      bgColor: "bg-rose-50"
    }
  ];

  const statusColors = {
    open: "bg-green-100 text-green-700",
    in_progress: "bg-blue-100 text-blue-700",
    completed: "bg-slate-100 text-slate-700"
  };

  const statusLabels = {
    open: "مفتوح",
    in_progress: "قيد التنفيذ",
    completed: "مكتمل"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <SmartAlertsDashboard client={client} />
        {client.client_type === "investor" ? (
          <InvestorClientDashboard 
            client={client} 
            stats={stats} 
            recentProjects={recentProjects} 
          />
        ) : (
          <IndividualClientDashboard 
            client={client} 
            stats={stats} 
            recentProjects={recentProjects} 
          />
        )}
      </div>
    </div>
  );
}