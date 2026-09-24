import React,{useEffect,useState} from "react";
import {supabase} from "@/lib/supabaseClient";
export default function MCPConsent(){
 const [state,setState]=useState({loading:true,error:"",client:"MCP Client"});
 const q=new URLSearchParams(window.location.search);
 const finish=async()=>{
  const {data,error}=await supabase.auth.getSession();
  if(error||!data?.session){window.location.replace("/login?from_url="+encodeURIComponent(window.location.pathname+window.location.search));return;}
  const r=await fetch("/api/mcp-oauth?action=approve",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+data.session.access_token},body:JSON.stringify({client_id:q.get("client_id"),redirect_uri:q.get("redirect_uri"),code_challenge:q.get("code_challenge"),state:q.get("state")})});
  if(r.redirected){window.location.replace(r.url);return;}
  const text=await r.text();let j={};try{j=JSON.parse(text)}catch{}
  if(!r.ok)throw new Error(j.error_description||j.error||"تعذر إتمام التفويض");
 };
 useEffect(()=>{(async()=>{try{const s=await supabase.auth.getSession();if(!s.data?.session){window.location.replace("/login?from_url="+encodeURIComponent(window.location.pathname+window.location.search));return;}setState({loading:false,error:"",client:q.get("client_id")||"MCP Client"});}catch(e){setState({loading:false,error:e.message,client:"MCP Client"});}})()},[]);
 if(state.loading)return <div dir="rtl" style={{padding:40,textAlign:"center"}}>جاري التحقق من حسابك…</div>;
 if(state.error)return <div dir="rtl" style={{padding:40,textAlign:"center"}}><h2>تعذر التفويض</h2><p>{state.error}</p></div>;
 return <main dir="rtl" style={{minHeight:"100dvh",display:"flex",alignItems:"center",justifyContent:"center",background:"#f8fafc",padding:20}}>
  <section style={{maxWidth:520,width:"100%",background:"#fff",padding:32,borderRadius:20,boxShadow:"0 10px 35px rgba(0,0,0,.08)"}}>
   <h1 style={{marginTop:0}}>السماح بالوصول إلى بيتلي</h1>
   <p>المساعد <b>{state.client}</b> يطلب الوصول إلى بيانات بيتلي المصرح بها لحسابك.</p>
   <p style={{color:"#64748b"}}>لن يتمكن المساعد من الوصول إلى حسابات مستخدمين آخرين.</p>
   <button onClick={finish} style={{width:"100%",padding:14,border:0,borderRadius:10,background:"#111827",color:"#fff",fontWeight:700,cursor:"pointer"}}>موافقة ومتابعة</button>
  </section>
 </main>;
}