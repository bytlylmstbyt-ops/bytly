import React,{useEffect,useState}from"react";
import{useNavigate,useSearchParams}from"react-router-dom";
import{createPageUrl}from"@/utils";
import{Bell,CheckCircle,Loader2,ExternalLink}from"lucide-react";
import{Card,CardContent}from"@/components/ui/card";
import{Button}from"@/components/ui/button";
import{supabase}from"@/lib/supabaseClient";

export default function NotificationCenter(){
 const[n,setN]=useState([]),[loading,setLoading]=useState(true),[selectedId,setSelectedId]=useState(null);
 const navigate=useNavigate(); const[searchParams]=useSearchParams();
 const notificationId=searchParams.get("notificationId");

 const getTarget=async(x)=>{
  const rawType=String(x.entity_type||"").toLowerCase();
  const notificationType=String(x.type||"").toLowerCase();
  const id=x.entity_id;

  // User-registration/admin notifications: resolve the actual profile role first.
  // This prevents "new user" notifications from falling back to the generic user page.
  if(id){
   const{data:profile}=await supabase.from("profiles").select("id,user_id,role,full_name,email").or("id.eq."+id+",user_id.eq."+id).maybeSingle();
   if(profile?.role){
    const role=String(profile.role).toLowerCase();
    const roleRoutes={
      client:"AdminClients",
      engineer:"AdminEngineers",
      contractor:"AdminProviders",
      supplier:"AdminProviders",
      consultant:"AdminProviders",
      firm:"AdminProviders",
      company:"AdminProviders",
      engineering_company:"AdminProviders",
      investor:"AdminDeveloperInvestorManagement",
      developer:"AdminDeveloperInvestorManagement",
      advertiser:"AdminAdvertisers",
      admin:"AdminUserManagementCenter"
    };
    const page=roleRoutes[role];
    if(page)return createPageUrl(page)+"?userId="+encodeURIComponent(profile.user_id||profile.id);
   }
  }

  // Non-user notifications keep their entity-specific destination.
  const routes={
   project:"ProjectDetails",dispute:"DisputeDetails",contract:"Contract",
   message:"MessagesUser",messages:"MessagesUser",proposal:"ProjectProposals",
   milestone:"ProjectMilestones",review:"ServiceReviews",complaint:"Complaints",
   payment:"Wallet",withdrawal:"ProviderWallet"
  };
  const entityKey=rawType.replace(/-/g,"_");
  if(routes[entityKey])return createPageUrl(routes[entityKey])+(id?"?id="+encodeURIComponent(id):"");

  // If the notification type itself identifies a user category, use it as a fallback.
  const roleRoutes={
   client:"AdminClients",engineer:"AdminEngineers",contractor:"AdminProviders",
   supplier:"AdminProviders",consultant:"AdminProviders",firm:"AdminProviders",
   company:"AdminProviders",engineering_company:"AdminProviders",
   investor:"AdminDeveloperInvestorManagement",developer:"AdminDeveloperInvestorManagement",
   advertiser:"AdminAdvertisers"
  };
  if(id&&roleRoutes[entityKey])return createPageUrl(roleRoutes[entityKey])+"?userId="+encodeURIComponent(id);
  if(id&&roleRoutes[notificationType])return createPageUrl(roleRoutes[notificationType])+"?userId="+encodeURIComponent(id);

  return createPageUrl("NotificationCenter");
 };

 const selectNotification=async(x)=>{
  setSelectedId(x.id);
  if(x.id&&!x.read_at){
   await supabase.from("notifications").update({read_at:new Date().toISOString()}).eq("id",x.id);
   setN(prev=>prev.map(v=>v.id===x.id?{...v,read_at:new Date().toISOString()}:v));
  }
  setTimeout(()=>document.getElementById("notification-"+x.id)?.scrollIntoView({behavior:"smooth",block:"center"}),0);
 };

 const openLinked=async(x)=>{const target=await getTarget(x);if(target)navigate(target);};

 const load=async()=>{
  if(!supabase){setLoading(false);return}
  const{data:{user}}=await supabase.auth.getUser();
  if(!user){setLoading(false);return}
  const{data,error}=await supabase.from("notifications").select("*").eq("user_id",user.id).order("created_at",{ascending:false}).limit(100);
  if(error)console.error(error);
  const items=data||[];setN(items);setLoading(false);
  if(notificationId){const found=items.find(x=>x.id===notificationId);if(found)selectNotification(found);}
 };

 useEffect(()=>{load();let ch;if(supabase){supabase.auth.getUser().then(({data:{user}})=>{if(user)ch=supabase.channel("notification-center-"+user.id).on("postgres_changes",{event:"*",schema:"public",table:"notifications",filter:"user_id=eq."+user.id},load).subscribe()})}return()=>{if(ch)supabase.removeChannel(ch)}},[notificationId]);

 const mark=async()=>{if(!supabase)return;const{data:{user}}=await supabase.auth.getUser();if(!user)return;await supabase.from("notifications").update({read_at:new Date().toISOString()}).eq("user_id",user.id).is("read_at",null);load()};

 if(loading)return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-[#C9A66B]"/></div>;
 const selected=n.find(x=>x.id===selectedId);

 return <div className="min-h-screen bg-slate-50 py-8" dir="rtl"><div className="max-w-4xl mx-auto px-4">
  <div className="flex items-center justify-between mb-6"><div><h1 className="text-2xl font-bold text-[#4A3F35] flex items-center gap-2"><Bell className="text-[#C9A66B]"/>مركز الإشعارات</h1><p className="text-sm text-slate-500 mt-1">{n.filter(x=>!x.read_at).length} غير مقروء</p></div><Button variant="outline" onClick={mark}><CheckCircle className="w-4 h-4 ml-2"/>تحديد الكل كمقروء</Button></div>
  {selected&&<Card className="mb-4 border-2 border-[#C9A66B]"><CardContent className="p-5"><p className="text-xs text-[#C9A66B] font-semibold mb-2">الإشعار المحدد</p><h2 className="font-bold text-lg">{selected.title}</h2><p className="text-sm text-slate-600 mt-2">{selected.body}</p><p className="text-xs text-slate-400 mt-2">{new Date(selected.created_at).toLocaleString("ar-SA")}</p><Button className="mt-4 bg-[#C9A66B] hover:bg-[#b89558]" onClick={()=>openLinked(selected)}><ExternalLink className="w-4 h-4 ml-2"/>فتح المرتبط</Button></CardContent></Card>}
  <Card><CardContent className="p-0">{n.length?n.map(x=><button id={"notification-"+x.id} type="button" key={x.id} onClick={()=>selectNotification(x)} className={"w-full text-right p-4 border-b last:border-0 transition-colors cursor-pointer "+(selectedId===x.id?"bg-amber-50 ring-2 ring-inset ring-[#C9A66B]":!x.read_at?"bg-blue-50/50 hover:bg-amber-50":"bg-white hover:bg-amber-50")}><div className="flex gap-3"><Bell className="w-5 h-5 text-[#C9A66B] mt-1"/><div><p className="font-semibold">{x.title}</p><p className="text-sm text-slate-600 mt-1">{x.body}</p><p className="text-xs text-slate-400 mt-2">{new Date(x.created_at).toLocaleString("ar-SA")}</p></div></div></button>):<div className="py-16 text-center text-slate-500">لا توجد إشعارات</div>}</CardContent></Card>
 </div></div>;
}