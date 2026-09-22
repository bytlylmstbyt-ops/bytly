import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { supabase } from "@/lib/supabaseClient";
import { Bell, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const TYPE_ICONS = { approval:"✅", project_update:"📊", payment:"💰", withdrawal:"💵", new_message:"💬", review:"📝", milestone:"🎯", proposal:"📋", contract:"📜", project_status:"🏗️", complaint:"⚠️", new_user:"👤", system:"🔔" };

export default function NotificationBell() {
  const [notifications,setNotifications]=useState([]);
  const [unreadCount,setUnreadCount]=useState(0);
  const [isOpen,setIsOpen]=useState(false);
  const navigate = useNavigate();
  const openNotification = async (n) => {
    let role = n.entity_type, userId = n.entity_id;
    if (!["client","engineer","contractor","supplier","consultant","firm","investor","developer"].includes(role) && userId) {
      const {data} = await supabase.from("profiles").select("id,user_id,role").or(`id.eq.${userId},user_id.eq.${userId}`).maybeSingle();
      if (data) { role = data.role; userId = data.user_id || data.id; }
    }
    const routes={client:"AdminClients",engineer:"AdminEngineers",contractor:"AdminProviders",supplier:"AdminProviders",consultant:"AdminProviders",firm:"AdminProviders",investor:"AdminClients",developer:"AdminProviders"};
    const page=routes[role]||"AdminUserManagementCenter"; const params=userId?`?userId=${encodeURIComponent(userId)}`:"";
    if(n.id&&!n.read_at){await supabase.from("notifications").update({read_at:new Date().toISOString()}).eq("id",n.id);setUnreadCount(x=>Math.max(0,x-1));setNotifications(p=>p.map(x=>x.id===n.id?{...x,read_at:new Date().toISOString()}:x));}
    setIsOpen(false);navigate(`${createPageUrl(page)}${params}`);
  };

  useEffect(()=>{
    let channel;
    const init=async()=>{
      if(!supabase) return;
      const {data:{user}}=await supabase.auth.getUser();
      if(!user) return;
      const load=async()=>{
        const {data,error}=await supabase.from("notifications").select("*").eq("user_id",user.id).order("created_at",{ascending:false}).limit(10);
        if(error) console.error("Supabase notifications load error:",error);
        else { setNotifications(data||[]); setUnreadCount((data||[]).filter(n=>!n.read_at).length); }
      };
      await load();
      channel=supabase.channel(`notifications-${user.id}`)
        .on("postgres_changes",{event:"INSERT",schema:"public",table:"notifications",filter:`user_id=eq.${user.id}`},payload=>{
          const n=payload.new;
          setNotifications(prev=>[n,...prev].slice(0,10));
          setUnreadCount(prev=>prev+1);
          toast({title:`${TYPE_ICONS[n.type]||"🔔"} ${n.title||"إشعار جديد"}`,description:n.body||"",duration:6000});
        })
        .on("postgres_changes",{event:"UPDATE",schema:"public",table:"notifications",filter:`user_id=eq.${user.id}`},payload=>{
          setNotifications(prev=>prev.map(n=>n.id===payload.new.id?payload.new:n));
          setUnreadCount(prev=>payload.new.read_at?Math.max(0,prev-1):prev);
        })
        .subscribe();
    };
    init();
    return ()=>{ if(channel) supabase?.removeChannel(channel); };
  },[]);

  const markAllAsRead=async()=>{
    if(!supabase) return;
    const {data:{user}}=await supabase.auth.getUser(); if(!user) return;
    const {error}=await supabase.from("notifications").update({read_at:new Date().toISOString()}).eq("user_id",user.id).is("read_at",null);
    if(error) console.error("Mark notifications read error:",error);
    else {setUnreadCount(0);setNotifications(prev=>prev.map(n=>({...n,read_at:n.read_at||new Date().toISOString()})));}
  };

  return <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="relative h-11 w-11 md:h-9 md:w-9 hover:bg-slate-100" aria-label="الإشعارات">
      <Bell className="w-5 h-5 text-slate-600"/>{unreadCount>0&&<Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 hover:bg-red-600">{unreadCount>9?"9+":unreadCount}</Badge>}
    </Button></DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
      <div className="flex items-center justify-between p-2 border-b"><h3 className="font-semibold text-sm">الإشعارات</h3>{unreadCount>0&&<Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-7 text-xs"><CheckCircle className="w-3 h-3 ml-1"/>الكل كمقروء</Button>}</div>
      {notifications.length===0?<div className="text-center py-8 text-slate-500 text-sm">لا توجد إشعارات</div>:<>{notifications.map(n=><DropdownMenuItem key={n.id} onSelect={(e)=>{e.preventDefault();openNotification(n)}} className={`flex items-start gap-3 p-3 cursor-pointer transition-colors ${!n.read_at?"bg-blue-50 hover:bg-blue-100":"hover:bg-slate-50"}`}>
        <span className="text-xl shrink-0">{TYPE_ICONS[n.type]||"🔔"}</span><div className="flex-1 min-w-0"><p className={`text-sm font-medium truncate ${!n.read_at?"text-slate-900":"text-slate-700"}`}>{n.title}</p><p className="text-xs text-slate-500 line-clamp-2 mt-1">{n.body}</p><p className="text-xs text-slate-400 mt-1">{new Date(n.created_at).toLocaleDateString("ar-SA",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}</p></div>
      </DropdownMenuItem>)}<DropdownMenuSeparator/><DropdownMenuItem asChild><Link to={createPageUrl("NotificationCenter")} className="text-center text-sm text-[#C9A66B] font-medium p-2 hover:bg-amber-50">عرض كل الإشعارات</Link></DropdownMenuItem></>}
    </DropdownMenuContent>
  </DropdownMenu>;
}