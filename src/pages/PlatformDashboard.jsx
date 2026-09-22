import React,{useEffect,useMemo,useState}from"react";
import{supabase}from"@/lib/supabaseClient";
import{Card,CardContent,CardHeader,CardTitle}from"@/components/ui/card";
import{TrendingUp,Users,Briefcase,DollarSign,Activity,Star,AlertCircle,CheckCircle,Clock,RefreshCw,BarChart2,ArrowUpRight,ArrowDownRight}from"lucide-react";
import{AreaChart,Area,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,PieChart,Pie,Cell}from"recharts";

const money=n=>new Intl.NumberFormat("ar-SA",{style:"currency",currency:"SAR",maximumFractionDigits:0}).format(Number(n)||0);
const num=n=>Number(n||0).toLocaleString("ar-SA");
const COLORS=["#C9A66B","#3B82F6","#22C55E","#EF4444","#8B5CF6","#F59E0B"];
const statusLabel={open:"مفتوح",in_progress:"جارٍ",completed:"مكتمل",cancelled:"ملغي",disputed:"نزاع",pending_client_approval:"موافقة العميل",awaiting_technical_review:"مراجعة فنية",technical_approved:"معتمد فنيًا"};

function Kpi({title,value,sub,icon:Icon,loading,trend}){
 return <Card><CardContent className="p-4"><div className="flex justify-between gap-3"><div><p className="text-xs text-slate-500">{title}</p>{loading?<div className="h-7 w-24 bg-slate-100 rounded animate-pulse mt-2"/>:<p className="text-2xl font-bold text-[#4A3F35] mt-1">{value}</p>}<p className="text-xs text-slate-400 mt-1">{sub}</p></div><Icon className="w-5 h-5 text-[#C9A66B]"/></div>{trend!==undefined&&<div className={trend>=0?"text-green-600":"text-red-500"}><span className="text-xs flex items-center gap-1 mt-2">{trend>=0?<ArrowUpRight className="w-3 h-3"/>:<ArrowDownRight className="w-3 h-3"/>}{Math.abs(trend)}% عن الشهر السابق</span></div>}</CardContent></Card>
}

export default function PlatformDashboard(){
 const[projects,setProjects]=useState([]),[engineers,setEngineers]=useState([]),[profiles,setProfiles]=useState([]),[sessions,setSessions]=useState([]),[loading,setLoading]=useState(true),[refreshing,setRefreshing]=useState(false),[lastRefresh,setLastRefresh]=useState(new Date()),[error,setError]=useState("");
 const loadData=async(manual=false)=>{
  if(manual)setRefreshing(true);setLoading(true);setError("");
  try{
   const results=await Promise.all([
    supabase.from("projects").select("id,title,status,created_at,budget_max,project_commission_amount,platform_commission,engineer_payment").order("created_at",{ascending:false}).limit(500),
    supabase.from("engineers").select("id,full_name,status,is_verified,rating,is_real,created_at").limit(500),
    supabase.from("profiles").select("id,user_id,full_name,email,role,created_at,last_seen_at").limit(1000),
    supabase.from("analytics_sessions").select("id,user_id,visitor_id,last_seen_at,duration_seconds").order("last_seen_at",{ascending:false}).limit(500)
   ]);
   const bad=results.find(x=>x.error);
   if(bad?.error)throw bad.error;
   setProjects(results[0].data||[]);setEngineers(results[1].data||[]);setProfiles(results[2].data||[]);setSessions(results[3].data||[]);setLastRefresh(new Date());
  }catch(e){console.error("Platform dashboard load error",e);setError("تعذر تحميل بيانات لوحة أداء المنصة. تم إيقاف الاعتماد على Base44 ويجب أن تأتي البيانات من Supabase.");}
  finally{setLoading(false);if(manual)setRefreshing(false)}
 };
 useEffect(()=>{loadData();const t=setInterval(()=>loadData(),60000);return()=>clearInterval(t)},[]);

 const stats=useMemo(()=>{
  const now=new Date(),month=now.getMonth(),year=now.getFullYear(),prev=new Date(year,month-1,1),prevMonth=prev.getMonth(),prevYear=prev.getFullYear();
  const inMonth=d=>{const x=new Date(d);return x.getMonth()===month&&x.getFullYear()===year},inPrev=d=>{const x=new Date(d);return x.getMonth()===prevMonth&&x.getFullYear()===prevYear};
  const revenue=p=>Number(p.project_commission_amount??p.platform_commission??0);
  const totalRevenue=projects.reduce((s,p)=>s+revenue(p),0),thisRevenue=projects.filter(p=>inMonth(p.created_at)).reduce((s,p)=>s+revenue(p),0),prevRevenue=projects.filter(p=>inPrev(p.created_at)).reduce((s,p)=>s+revenue(p),0);
  const thisProjects=projects.filter(p=>inMonth(p.created_at)).length,prevProjects=projects.filter(p=>inPrev(p.created_at)).length;
  const activeProjects=projects.filter(p=>["open","in_progress","awaiting_technical_review","technical_approved","pending_client_approval"].includes(p.status)).length;
  const approvedEngineers=engineers.filter(e=>e.status==="approved"||e.is_verified).length;
  const activeNow=new Set(sessions.filter(s=>Date.now()-new Date(s.last_seen_at).getTime()<=90000).map(s=>s.user_id||s.visitor_id)).size;
  const avgRating=engineers.filter(e=>Number(e.rating)>0); const rating=avgRating.length?(avgRating.reduce((s,e)=>s+Number(e.rating),0)/avgRating.length).toFixed(1):"—";
  const status={};projects.forEach(p=>status[p.status||"unknown"]=(status[p.status||"unknown"]||0)+1);
  return{totalRevenue,thisRevenue,revenueGrowth:prevRevenue?Math.round((thisRevenue-prevRevenue)/prevRevenue*100):0,thisProjects,projectGrowth:prevProjects?Math.round((thisProjects-prevProjects)/prevProjects*100):0,activeProjects,approvedEngineers,pendingEngineers:engineers.filter(e=>e.status==="pending").length,users:profiles.length,activeNow,rating,status};
 },[projects,engineers,profiles,sessions]);

 const chart=useMemo(()=>Array.from({length:6},(_,i)=>{const d=new Date();d.setMonth(d.getMonth()-(5-i));const revenue=projects.filter(p=>{const x=new Date(p.created_at);return x.getMonth()===d.getMonth()&&x.getFullYear()===d.getFullYear()}).reduce((s,p)=>s+Number(p.project_commission_amount??p.platform_commission??0),0);return{name:d.toLocaleDateString("ar-SA",{month:"short"}),إيرادات:Math.round(revenue),مشاريع:projects.filter(p=>{const x=new Date(p.created_at);return x.getMonth()===d.getMonth()&&x.getFullYear()===d.getFullYear()}).length}}),[projects]);
 const pie=Object.entries(stats.status).map(([k,v],i)=>({name:statusLabel[k]||k,value:v,fill:COLORS[i%COLORS.length]}));
 const recent=projects.slice(0,8);

 return <div className="min-h-screen bg-slate-50" dir="rtl"><div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3"><div><h1 className="text-2xl font-bold text-[#4A3F35]">لوحة تحكم المديرة</h1><p className="text-sm text-slate-500 mt-1">نظرة مباشرة على أداء منصة بيتلي من Supabase</p></div><div className="flex items-center gap-3"><span className="text-xs text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3"/>آخر تحديث: {lastRefresh.toLocaleTimeString("ar-SA")}</span><button type="button" onClick={()=>loadData(true)} disabled={loading||refreshing} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#C9A66B] text-white text-xs disabled:opacity-50"><RefreshCw className={`w-4 h-4 ${refreshing?"animate-spin":""}`}/>{refreshing?"جارٍ التحديث...":"تحديث"}</button></div></div>
  {error&&<Card className="border-red-200 bg-red-50"><CardContent className="p-4 text-sm text-red-700 flex items-center gap-2"><AlertCircle className="w-5 h-5"/>{error}</CardContent></Card>}
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3"><Kpi title="المشاريع النشطة" value={num(stats.activeProjects)} sub={`من إجمالي ${num(projects.length)} مشروع`} icon={Briefcase} loading={loading}/><Kpi title="إيرادات المنصة" value={money(stats.thisRevenue)} sub="هذا الشهر" icon={DollarSign} trend={stats.revenueGrowth} loading={loading}/><Kpi title="المهندسون المعتمدون" value={num(stats.approvedEngineers)} sub={`${num(stats.pendingEngineers)} بانتظار الموافقة`} icon={Users} loading={loading}/><Kpi title="المستخدمون النشطون الآن" value={num(stats.activeNow)} sub={`من إجمالي ${num(stats.users)} مستخدم`} icon={Activity} loading={loading}/></div>
  <div className="grid md:grid-cols-3 gap-5"><Card className="md:col-span-2"><CardHeader><CardTitle className="text-sm">الإيرادات والمشاريع — آخر 6 أشهر</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={260}><AreaChart data={chart}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name"/><YAxis/><Tooltip/><Area type="monotone" dataKey="إيرادات" stroke="#C9A66B" fill="#C9A66B" fillOpacity={0.18}/><Area type="monotone" dataKey="مشاريع" stroke="#3B82F6" fill="none"/></AreaChart></ResponsiveContainer></CardContent></Card><Card><CardHeader><CardTitle className="text-sm">حالات المشاريع</CardTitle></CardHeader><CardContent>{pie.length?<><ResponsiveContainer width="100%" height={180}><PieChart><Pie data={pie} dataKey="value" innerRadius={45} outerRadius={70}>{pie.map((x,i)=><Cell key={i} fill={x.fill}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer><div className="space-y-1">{pie.slice(0,6).map(x=><div key={x.name} className="flex justify-between text-xs"><span>{x.name}</span><b>{num(x.value)}</b></div>)}</div></>:<p className="text-sm text-slate-400 text-center py-10">لا توجد بيانات</p>}</CardContent></Card></div>
  <Card><CardHeader><CardTitle className="text-sm">آخر المشاريع</CardTitle></CardHeader><CardContent className="p-0">{recent.length?<div className="divide-y">{recent.map(p=><div key={p.id} className="flex items-center justify-between gap-3 px-4 py-3"><div className="min-w-0"><p className="text-sm font-medium truncate">{p.title||"مشروع بدون عنوان"}</p><p className="text-xs text-slate-400">{p.created_at?new Date(p.created_at).toLocaleString("ar-SA"):"—"}</p></div><div className="text-right"><span className="text-xs font-semibold text-[#C9A66B]">{money(p.budget_max)}</span><p className="text-xs text-slate-500">{statusLabel[p.status]||p.status||"غير محدد"}</p></div></div>)}</div>:<p className="text-sm text-slate-400 text-center py-8">لا توجد مشاريع</p>}</CardContent></Card>
  <div className="grid grid-cols-2 md:grid-cols-3 gap-3"><Kpi title="متوسط التقييم" value={stats.rating+"/5"} sub="من ملفات المهندسين" icon={Star} loading={loading}/><Kpi title="إجمالي الإيرادات" value={money(stats.totalRevenue)} sub="المسجل من عمولات المشاريع" icon={BarChart2} loading={loading}/><Kpi title="مشاريع مكتملة" value={num(projects.filter(p=>p.status==="completed").length)} sub="منذ بداية المنصة" icon={CheckCircle} loading={loading}/></div>
 </div></div>
}