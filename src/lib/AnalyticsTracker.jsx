import{useEffect,useRef}from"react";
import{supabase}from"@/lib/supabaseClient";

const visitorKey="bytly_analytics_visitor_id";
const getVisitorId=()=>{let id=localStorage.getItem(visitorKey);if(!id){id=crypto.randomUUID();localStorage.setItem(visitorKey,id)}return id};
const path=()=>window.location.pathname+window.location.search;
const device=()=>/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)?"mobile":"desktop";
const os=()=>/iPhone|iPad|iPod/i.test(navigator.userAgent)?"iOS":/Android/i.test(navigator.userAgent)?"Android":/Windows/i.test(navigator.userAgent)?"Windows":/Mac OS X/i.test(navigator.userAgent)?"macOS":/Linux/i.test(navigator.userAgent)?"Linux":"Unknown";
const browser=()=>/Edg\//.test(navigator.userAgent)?"Edge":/Chrome\//.test(navigator.userAgent)?"Chrome":/Safari\//.test(navigator.userAgent)&&!/Chrome\//.test(navigator.userAgent)?"Safari":/Firefox\//.test(navigator.userAgent)?"Firefox":"Other";

export default function AnalyticsTracker(){
 const sessionRef=useRef(null),visitorRef=useRef(null),userRef=useRef(null),maxScrollRef=useRef(0);
 useEffect(()=>{if(!supabase)return;let mounted=true,heartbeat,routeWatcher,visibilityTimer,observer;
 const started=Date.now();let eventCount=0,pageCount=0,lastPath="",lastSection="";
 const start=async()=>{
  try{
   visitorRef.current=getVisitorId();
   const{data:{user}}=await supabase.auth.getUser();userRef.current=user?.id||null;
   let country="Unknown";
   try{const r=await fetch("https://ipapi.co/json/",{headers:{Accept:"application/json"}});if(r.ok){const j=await r.json();country=j.country_name||j.country||"Unknown"}}catch{}
   const{data:session,error}=await supabase.from("analytics_sessions").insert({user_id:userRef.current,visitor_id:visitorRef.current,entry_page:path(),browser:browser(),operating_system:os(),device_type:device(),country}).select("id").single();
   if(error||!session)return;
   sessionRef.current=session.id;
   if(localStorage.getItem("bytly_replay_enabled")!=="false"){
    let replaySeq=0,lastReplay="";
    const maskReplay=el=>{if(!el||el.nodeType!==1)return null;if(el.matches("input,textarea,select,[contenteditable=true],[data-analytics-private],input[type=password]"))return{tag:el.tagName.toLowerCase(),masked:true};return{tag:el.tagName.toLowerCase(),id:el.id||"",text:(el.innerText||"").replace(/\\s+/g," ").trim().slice(0,100)}};
    const saveReplay=async type=>{const payload={url:path(),title:document.title,scroll:Math.round(window.scrollY/Math.max(document.body.scrollHeight-window.innerHeight,1)*100),active:maskReplay(document.activeElement)};const key=JSON.stringify(payload);if(key===lastReplay&&type==="mutation")return;lastReplay=key;await supabase.from("analytics_replay_snapshots").insert({session_id:sessionRef.current,visitor_id:visitorRef.current,snapshot_type:type,sequence_no:replaySeq++,payload})};
    await saveReplay("initial");
    const replayObserver=new MutationObserver(()=>saveReplay("mutation"));replayObserver.observe(document.body,{subtree:true,childList:true,attributes:true});
    window.addEventListener("scroll",()=>saveReplay("scroll"),{passive:true});
    window.__bytlyReplayCleanup=()=>replayObserver.disconnect();
   }
   const updateSession=async()=>{if(!sessionRef.current)return;await supabase.from("analytics_sessions").update({event_count:eventCount,page_count:pageCount,last_seen_at:new Date().toISOString(),duration_seconds:Math.floor((Date.now()-started)/1000),exit_page:path(),max_scroll_percent:maxScrollRef.current}).eq("id",sessionRef.current).eq("visitor_id",visitorRef.current)};
   const track=async(event_name,metadata={},section_name=null)=>{if(!sessionRef.current||!mounted)return;const{error}=await supabase.from("analytics_events").insert({session_id:sessionRef.current,user_id:userRef.current,visitor_id:visitorRef.current,event_name,page_path:path(),metadata,section_name,screen_x:metadata.screen_x||null,screen_y:metadata.screen_y||null});if(!error){eventCount++;if(event_name==="page_view")pageCount++;await updateSession()}};
   await track("page_view",{title:document.title});
   heartbeat=setInterval(updateSession,30000);
   lastPath=path();
   routeWatcher=setInterval(()=>{const p=path();if(p!==lastPath){lastPath=p;lastSection="";track("page_view",{title:document.title})}},1000);
   const isSensitive=el=>el.matches?.("input[type=password],textarea,[data-analytics-private]")||el.closest?.("[data-analytics-private]");const onClick=e=>{const el=e.target?.closest?.("button,a,[role=button]");if(!el||isSensitive(el))return;const label=(el.innerText||el.getAttribute("aria-label")||el.getAttribute("title")||"").trim().slice(0,120);track("click",{label,tag:el.tagName.toLowerCase(),screen_x:e.clientX,screen_y:e.clientY},el.dataset?.analyticsSection||null)};
   const onScroll=()=>{const pct=Math.round(window.scrollY/(Math.max(document.body.scrollHeight-window.innerHeight,1))*100);if(pct>maxScrollRef.current)maxScrollRef.current=Math.min(100,pct);if(pct-(window.__bytlyLastScroll||0)>=20){window.__bytlyLastScroll=pct;track("scroll",{percent:Math.min(100,pct)})}};
   const getSections=()=>{const marked=Array.from(document.querySelectorAll("[data-analytics-section]")).filter(el=>el.dataset.analyticsSection);if(marked.length)return marked;return Array.from(document.querySelectorAll("main h1,main h2,main h3,section h1,section h2,section h3")).filter(el=>el.textContent?.trim()).map(el=>{el.dataset.analyticsSection=el.textContent.trim().slice(0,100);return el})};
   observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting&&entry.intersectionRatio>=0.5){const name=entry.target.dataset.analyticsSection;if(name&&name!==lastSection){lastSection=name;track("section_view",{title:name},name)}}}),{threshold:[0.5]});
   getSections().forEach(el=>observer.observe(el));
   const onVisibility=()=>{if(document.visibilityState==="hidden")updateSession()};
   document.addEventListener("click",onClick,true);window.addEventListener("scroll",onScroll,{passive:true});document.addEventListener("visibilitychange",onVisibility);
   return()=>{mounted=false;window.__bytlyReplayCleanup?.();clearInterval(heartbeat);clearInterval(routeWatcher);clearTimeout(visibilityTimer);observer?.disconnect();document.removeEventListener("click",onClick,true);window.removeEventListener("scroll",onScroll);document.removeEventListener("visibilitychange",onVisibility);updateSession()};
  }catch(e){console.warn("Analytics tracker skipped",e)}
 };
 start();
 },[]);
 return null
}