import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getAcquisitionAttribution, getVisitorId } from "@/lib/analyticsService";

const sessionKey = "bytly_analytics_session";
const INTERNAL_HOSTS = ["mybytly.com", "www.mybytly.com"];
const getPath = () => window.location.pathname + window.location.search;
const isInternalHost = (host = "") => INTERNAL_HOSTS.includes(host.toLowerCase()) || /\.vercel\.app$/i.test(host);

function normalizeSource(source, medium, clickId) {
  const s = String(source || "").toLowerCase().trim(), m = String(medium || "").toLowerCase();
  const paid = Boolean(clickId) || /paid|cpc|ppc|ads|paid_social|display/i.test(m);
  const labels = { facebook:"فيسبوك", instagram:"إنستغرام", linkedin:"لينكدإن", whatsapp:"واتساب", google:"جوجل", x:"X", twitter:"X" };
  if (s === "direct") return { source:"direct", label:"مباشر", type:"direct" };
  if (isInternalHost(s)) return { source:"internal", label:"داخل المنصة", type:"internal" };
  if (labels[s]) return { source:s, label:paid ? labels[s]+" – إعلان" : labels[s], type:paid ? "paid" : "referral" };
  return { source:"other", label:"إحالة أخرى", type:"referral" };
}

function captureAttribution() {
  const url = new URL(window.location.href), q = url.searchParams, referrer = document.referrer || "";
  let host = ""; try { host = referrer ? new URL(referrer).hostname : ""; } catch {}
  let source = q.get("utm_source") || q.get("source") || "", medium = q.get("utm_medium") || "";
  const campaign=q.get("utm_campaign")||"", content=q.get("utm_content")||"", term=q.get("utm_term")||"";
  const clickId=q.get("fbclid")?"facebook":q.get("gclid")?"google":q.get("msclkid")?"microsoft":"";
  if (!source && clickId) source=clickId;
  if (!medium && clickId) medium="paid";
  if (!source && host && !isInternalHost(host)) {
    if (/facebook|fb\.com/i.test(host)) source="facebook";
    else if (/instagram/i.test(host)) source="instagram";
    else if (/linkedin/i.test(host)) source="linkedin";
    else if (/whatsapp/i.test(host)) source="whatsapp";
    else if (/t\.co|twitter|x\.com/i.test(host)) source="x";
    else if (/google/i.test(host)) source="google";
    else source=host;
  }
  if (!source) source="direct";
  const n=normalizeSource(source,medium,clickId);
  const current={source:n.source,medium:medium||null,campaign:campaign||null,content:content||null,term:term||null,referrer:referrer||null,label:n.label,type:n.type};
  try {
    const existing=getAcquisitionAttribution();
    if (existing?.source && existing.source!=="direct" && existing.source!=="internal") return existing;
    localStorage.setItem("bytly_acquisition_attribution",JSON.stringify(current));
  } catch {}
  return current;
}

const device=()=>/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)?"mobile":"desktop";
const os=()=>/iPhone|iPad|iPod/i.test(navigator.userAgent)?"iOS":/Android/i.test(navigator.userAgent)?"Android":/Windows/i.test(navigator.userAgent)?"Windows":/Mac OS X/i.test(navigator.userAgent)?"macOS":/Linux/i.test(navigator.userAgent)?"Linux":"Unknown";
const browser=()=>/Edg\//.test(navigator.userAgent)?"Edge":/Chrome\//.test(navigator.userAgent)?"Chrome":/Safari\//.test(navigator.userAgent)&&!/Chrome\//.test(navigator.userAgent)?"Safari":/Firefox\//.test(navigator.userAgent)?"Firefox":"Other";

export default function AnalyticsTracker() {
  const sessionRef=useRef(null), visitorRef=useRef(null), userRef=useRef(null);
  const countersRef=useRef({pageCount:0,eventCount:0,maxScroll:0});
  const startedRef=useRef(Date.now());

  useEffect(() => {
    if (!supabase) return;
    let mounted=true, heartbeat=null, authSubscription=null, removeListeners=()=>{};

    const updateSession=async(patch={})=>{
      if(!sessionRef.current) return;
      const {error}=await supabase.from("analytics_sessions").update({
        user_id:userRef.current,last_seen_at:new Date().toISOString(),
        duration_seconds:Math.max(0,Math.floor((Date.now()-startedRef.current)/1000)),
        page_count:countersRef.current.pageCount,event_count:countersRef.current.eventCount,
        max_scroll_percent:countersRef.current.maxScroll,exit_page:getPath(),...patch
      }).eq("id",sessionRef.current);
      if(error) console.warn("[Bytly analytics] session update failed:",error.message);
    };

    const trackEvent=async(eventName,metadata={})=>{
      if(!sessionRef.current || !mounted) return;
      countersRef.current.eventCount += 1;
      const {error}=await supabase.from("analytics_events").insert({
        session_id:sessionRef.current,user_id:userRef.current,visitor_id:visitorRef.current,
        event_name:eventName,page_path:getPath(),metadata,occurred_at:new Date().toISOString(),
        section_name:metadata?.section_name||null
      });
      if(error) console.warn("[Bytly analytics] event failed:",error.message);
      updateSession();
    };

    const start=async()=>{
      visitorRef.current=getVisitorId();
      const {data:{user}}=await supabase.auth.getUser();
      userRef.current=user?.id||null;
      const attribution=captureAttribution();
      let persisted=null; try{persisted=JSON.parse(sessionStorage.getItem(sessionKey)||"null")}catch{}
      const age=persisted?.startedAt?Date.now()-Number(persisted.startedAt):Infinity;
      let sessionId=persisted?.id||null, startedAt=persisted?.startedAt||Date.now();
      if(!sessionId || age>30*60*1000){
        sessionId=crypto.randomUUID(); startedAt=Date.now();
        try{sessionStorage.setItem(sessionKey,JSON.stringify({id:sessionId,startedAt}))}catch{}
        const {error}=await supabase.from("analytics_sessions").insert({
          id:sessionId,user_id:userRef.current,visitor_id:visitorRef.current,entry_page:getPath(),
          browser:browser(),operating_system:os(),device_type:device(),country:"Unknown",
          traffic_source:attribution?.source||"direct",traffic_medium:attribution?.medium||null,
          traffic_campaign:attribution?.campaign||null,traffic_content:attribution?.content||null,
          traffic_term:attribution?.term||null,referrer_url:attribution?.referrer||null,
          attribution_type:attribution?.type||"direct",attribution_label:attribution?.label||"مباشر"
        });
        if(error) console.warn("[Bytly analytics] session insert failed:",error.message);
      }
      sessionRef.current=sessionId; startedRef.current=startedAt;
      if(!mounted)return;
      await trackEvent("session_started",{entry_page:getPath(),attribution});
      countersRef.current.pageCount+=1;
      await trackEvent("page_view",{page:getPath()});
      heartbeat=window.setInterval(()=>updateSession(),30000);

      const onScroll=()=>{
        const doc=document.documentElement,max=Math.max(1,doc.scrollHeight-window.innerHeight);
        const percent=Math.min(100,Math.round((window.scrollY/max)*100));
        if(percent>countersRef.current.maxScroll){countersRef.current.maxScroll=percent;updateSession();}
      };
      const onUnload=()=>{updateSession({ended_at:new Date().toISOString(),exit_page:getPath()});};
      const onVisibility=()=>{if(document.visibilityState==="visible")updateSession();};
      window.addEventListener("scroll",onScroll,{passive:true});
      window.addEventListener("beforeunload",onUnload);
      document.addEventListener("visibilitychange",onVisibility);
      removeListeners=()=>{window.removeEventListener("scroll",onScroll);window.removeEventListener("beforeunload",onUnload);document.removeEventListener("visibilitychange",onVisibility);};

      const {data}=supabase.auth.onAuthStateChange((event,session)=>{
        userRef.current=session?.user?.id||null;
        if(session?.user){trackEvent("login",{auth_event:event});updateSession({user_id:session.user.id});}
      });
      authSubscription=data?.subscription;
    };

    start().catch(error=>console.warn("[Bytly analytics] tracker startup failed:",error?.message||error));
    return ()=>{mounted=false;if(heartbeat)clearInterval(heartbeat);authSubscription?.unsubscribe?.();removeListeners();};
  },[]);

  return null;
}
