import { createClient } from "@supabase/supabase-js";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization,content-type","Access-Control-Allow-Methods":"POST,OPTIONS"};
const supabase=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,{auth:{autoRefreshToken:false,persistSession:false}});
const hash=async(v:string)=>{const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(v));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")};
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response("",{status:204,headers:cors});
 try{
  const token=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"").trim();
  if(!token)return new Response(JSON.stringify({error:"Authentication required"}),{status:401,headers:{"Content-Type":"application/json",...cors}});
  const h=await hash(token);
  const {data:ctx,error:ce}=await supabase.from("mcp_oauth_tokens").select("user_id,scope,expires_at").eq("access_token_hash",h).is("revoked_at",null).gt("expires_at",new Date().toISOString()).maybeSingle();
  if(ce||!ctx)return new Response(JSON.stringify({error:"Invalid or expired authentication"}),{status:401,headers:{"Content-Type":"application/json",...cors}});
  const body=await req.json(); const tool=body.tool; const limit=Math.min(Math.max(Number(body.limit)||20,1),50);
  if(tool==="get_current_user"){
   const {data:user,error}=await supabase.auth.admin.getUserById(ctx.user_id); if(error)throw error;
   const {data:profile,error:pe}=await supabase.from("profiles").select("id,user_id,email,full_name,phone,role").eq("user_id",ctx.user_id).maybeSingle(); if(pe)throw pe;
   return new Response(JSON.stringify({user:{id:user.user.id,email:user.user.email},profile}),{headers:{"Content-Type":"application/json",...cors}});
  }
  if(tool==="list_notifications"){
   const {data,error}=await supabase.from("notifications").select("*").eq("user_id",ctx.user_id).order("created_at",{ascending:false}).limit(limit); if(error)throw error;
   return new Response(JSON.stringify(data||[]),{headers:{"Content-Type":"application/json",...cors}});
  }
  if(tool==="list_projects"){
   const uid=ctx.user_id;
   const filter=`client_user_id.eq.${uid},assigned_engineer_id.eq.${uid},technical_consultant_id.eq.${uid},assigned_contractor_id.eq.${uid},assigned_supplier_id.eq.${uid}`;
   const {data,error}=await supabase.from("projects").select("*").or(filter).order("created_at",{ascending:false}).limit(limit); if(error)throw error;
   return new Response(JSON.stringify(data||[]),{headers:{"Content-Type":"application/json",...cors}});
  }
  return new Response(JSON.stringify({error:"Unknown tool"}),{status:400,headers:{"Content-Type":"application/json",...cors}});
 }catch(e){return new Response(JSON.stringify({error:e?.message||"Server error"}),{status:500,headers:{"Content-Type":"application/json",...cors}})}
});