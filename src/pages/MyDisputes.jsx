import React,{useEffect,useState} from "react";
import {supabase} from "@/lib/supabaseClient";
import {Link} from "react-router-dom";
import {createPageUrl} from "@/utils";
import {Card,CardContent,CardHeader,CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {Loader2,ShieldAlert,Plus,MessageSquare,FileText} from "lucide-react";
import {toast} from "sonner";

const labels={payment_issue:"مشكلة دفع",quality_issue:"مشكلة جودة",deadline_issue:"مشكلة مواعيد",contract_breach:"خرق عقد",communication_issue:"مشكلة تواصل",scope_change:"تغيير في النطاق",other:"أخرى"};
const statusLabels={submitted:"مقدم",under_review:"قيد المراجعة",investigation:"قيد التحقيق",mediation:"في الوساطة",resolved:"تم الحل",closed:"مغلق",escalated:"مصعّد"};

export default function MyDisputes(){
 const [disputes,setDisputes]=useState([]); const [isLoading,setIsLoading]=useState(true);
 useEffect(()=>{loadData()},[]);
 const loadData=async()=>{
  try{
   const {data:{user}}=await supabase.auth.getUser(); if(!user){setDisputes([]);return;}
   const {data,error}=await supabase.from("disputes").select("*,projects:project_id(id,title)").or(`opened_by.eq.${user.id},against_user_id.eq.${user.id},raised_against.eq.${user.id}`).order("created_at",{ascending:false});
   if(error)throw error; setDisputes(data||[]);
  }catch(e){console.error(e);toast.error("تعذر تحميل النزاعات");}finally{setIsLoading(false)}
 };
 if(isLoading)return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#C9A66B]"/></div>;
 return <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-8"><div className="max-w-6xl mx-auto px-4">
  <div className="flex justify-between items-center mb-8"><div className="flex items-center gap-3"><ShieldAlert className="w-8 h-8 text-[#C9A66B]"/><div><h1 className="text-3xl font-bold">نزاعاتي</h1><p className="text-slate-600">إدارة ومتابعة النزاعات</p></div></div><Link to={createPageUrl("FileDispute")}><Button className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B]"><Plus className="w-5 h-5 ml-2"/>تقديم نزاع جديد</Button></Link></div>
  {disputes.length===0?<Card className="text-center py-12"><CardContent><ShieldAlert className="w-16 h-16 mx-auto text-slate-300 mb-4"/><h3 className="text-xl font-semibold mb-2">لا توجد نزاعات</h3><p className="text-slate-500 mb-4">لم تقم بتقديم أي نزاعات حتى الآن</p><Link to={createPageUrl("FileDispute")}><Button variant="outline">تقديم نزاع</Button></Link></CardContent></Card>:
  <div className="grid gap-4">{disputes.map(d=><Card key={d.id} className="hover:shadow-lg transition-shadow"><CardHeader><div className="flex justify-between items-start"><div><div className="flex items-center gap-3 mb-2"><CardTitle className="text-lg">{d.title||"نزاع بدون عنوان"}</CardTitle><Badge>{statusLabels[d.status]||d.status}</Badge></div><div className="flex items-center gap-4 text-sm text-slate-500"><span>{labels[d.dispute_type]||d.reason||"غير محدد"}</span><span>•</span><span>{new Date(d.created_at).toLocaleDateString("ar-SA")}</span><span>•</span><span>{d.priority==="urgent"?"عاجل":d.priority==="high"?"عالي":d.priority==="medium"?"متوسط":"منخفض"}</span></div></div></div></CardHeader><CardContent><p className="text-slate-600 mb-4 line-clamp-2">{d.description}</p><div className="flex items-center justify-between"><div className="flex items-center gap-4 text-sm text-slate-500">{(d.evidence_files||[]).length>0&&<span className="flex items-center gap-1"><FileText className="w-4 h-4"/>{d.evidence_files.length} مرفق</span>}{(d.messages||[]).length>0&&<span className="flex items-center gap-1"><MessageSquare className="w-4 h-4"/>{d.messages.length} رسالة</span>}</div><Link to={createPageUrl(`DisputeDetails?id=${d.id}`)}><Button variant="outline" size="sm">عرض التفاصيل</Button></Link></div></CardContent></Card>)}</div>}
 </div></div>;
}