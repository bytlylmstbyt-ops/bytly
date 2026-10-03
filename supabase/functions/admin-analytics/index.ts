import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
const corsHeaders={ "Access-Control-Allow-Origin":"*", "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods":"POST, OPTIONS" };
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...corsHeaders,"Content-Type":"application/json"}});
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders});
 if(req.method!=="POST")return json({error:"Method not allowed"},405);
 try{
  const auth=req.headers.get("Authorization")||"",token=auth.startsWith("Bearer ")?auth.slice(7):"";
  if(!token)return json({error:"جلسة الدخول غير موجودة."},401);
  const url=Deno.env.get("SUPABASE_URL")!,anon=Deno.env.get("SUPABASE_ANON_KEY")!;
  const client=createClient(url,anon,{global:{headers:{Authorization:`Bearer ${token}`}}});
  const {data:u,error:ue}=await client.auth.getUser(token);
  if(ue||!u.user)return json({error:"انتهت جلسة الدخول."},401);
  const service=createClient(url,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const email=(u.user.email||"").trim().toLowerCase();
  const {data:p}=await service.from("profiles").select("role").eq("user_id",u.user.id).maybeSingle();
  if(email!=="bytlylmstbyt@gmail.com"&&p?.role!=="admin")return json({error:"غير مصرح."},403);
  const body=await req.json().catch(()=>({})),requested=Number(body?.range),range=[1,7,30].includes(requested)?requested:7;
  const now=new Date(),key=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Riyadh",year:"numeric",month:"2-digit",day:"2-digit"}).format(now);
  const [y,m,d]=key.split("-").map(Number),since=new Date(Date.UTC(y,m-1,d-(range===1?0:range-1),-3,0,0)).toISOString();
  const [s,e,pr,c]=await Promise.all([
   service.from("analytics_sessions").select("*").gte("started_at",since).order("started_at",{ascending:false}).limit(1000),
   service.from("analytics_events").select("*").gte("occurred_at",since).order("occurred_at",{ascending:false}).limit(5000),
   service.from("profiles").select("user_id,full_name,email,role"),
   service.from("clients").select("user_id,full_name,email,client_type")
  ]);
  const err=[s,e,pr,c].find(x=>x.error)?.error;
  if(err)return json({error:"تعذر قراءة بيانات التحليلات: "+err.message},500);
  const events=e.data||[];
  const eventsBySession=new Map<string,any[]>();
  for(const event of events){const list=eventsBySession.get(event.session_id)||[];list.push(event);eventsBySession.set(event.session_id,list)}
  const sessions=(s.data||[]).map((session:any)=>{
   const list=(eventsBySession.get(session.id)||[]).slice().sort((a,b)=>new Date(a.occurred_at).getTime()-new Date(b.occurred_at).getTime());
   const first=list[0]?.occurred_at||session.started_at;
   const last=list[list.length-1]?.occurred_at||session.last_seen_at||session.started_at;
   const duration=Math.max(0,Math.floor((new Date(last).getTime()-new Date(first).getTime())/1000));
   const pageCount=list.filter(e=>e.event_name==="page_view").length;
   const scroll=Math.max(0,...list.filter(e=>e.event_name==="scroll").map(e=>Number(e.metadata?.percent)||0));
   return {...session,duration_seconds:Math.max(Number(session.duration_seconds)||0,duration),page_count:Math.max(Number(session.page_count)||0,pageCount),event_count:Math.max(Number(session.event_count)||0,list.length),last_seen_at:last,exit_page:session.exit_page||list[list.length-1]?.page_path||null,max_scroll_percent:Math.max(Number(session.max_scroll_percent)||0,scroll)};
  });
  return json({kind:"analytics",range,since,sessions,events,profiles:pr.data||[],clients:c.data||[]});
 }catch(error){return json({error:error instanceof Error?error.message:String(error)},500);}
});