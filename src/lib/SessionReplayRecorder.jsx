import {useEffect} from "react";
import {supabase} from "@/lib/supabaseClient";

export default function SessionReplayRecorder({sessionId,visitorId,enabled=true}){
 useEffect(()=>{if(!enabled||!sessionId||!visitorId)return;
  let seq=0,last="";
  const mask=el=>{if(!el||el.nodeType!==1)return null;if(el.matches("input,textarea,select,[contenteditable=true],[data-analytics-private],input[type=password]"))return{tag:el.tagName.toLowerCase(),masked:true};return{tag:el.tagName.toLowerCase(),id:el.id||"",text:(el.innerText||"").replace(/\s+/g," ").trim().slice(0,100)}};
  const capture=async(type)=>{const payload={url:location.pathname+location.search,title:document.title,scroll:Math.round(scrollY/Math.max(document.body.scrollHeight-innerHeight,1)*100),active:mask(document.activeElement)};const key=JSON.stringify(payload);if(key===last&&type==="mutation")return;last=key;await supabase.from("analytics_replay_snapshots").insert({session_id:sessionId,visitor_id:visitorId,snapshot_type:type,sequence_no:seq++,payload})};
  capture("initial");
  const mo=new MutationObserver(()=>capture("mutation"));mo.observe(document.body,{subtree:true,childList:true,attributes:true});
  const onScroll=()=>capture("scroll");window.addEventListener("scroll",onScroll,{passive:true});
  return()=>{mo.disconnect();window.removeEventListener("scroll",onScroll)};
 },[sessionId,visitorId,enabled]);
 return null;
}
