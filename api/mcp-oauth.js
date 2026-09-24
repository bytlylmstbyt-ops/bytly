import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const URL=process.env.VITE_SUPABASE_URL||"https://wbqtgdkubrocnqnykhlt.supabase.co";
const KEY=process.env.SUPABASE_SERVICE_ROLE_KEY;
const BASE="https://mybytly.com";
const sha=s=>crypto.createHash("sha256").update(s).digest("hex");
const rand=()=>crypto.randomBytes(32).toString("base64url");
const db=()=>createClient(URL,KEY,{auth:{autoRefreshToken:false,persistSession:false}});
const json=(res,status,b)=>{res.status(status);res.setHeader("Content-Type","application/json");res.setHeader("Cache-Control","no-store");res.setHeader("Access-Control-Allow-Origin","*");return res.end(JSON.stringify(b));};
const redirectAllowed=(uris,uri)=>Array.isArray(uris)&&uris.includes(uri);

export default async function handler(req,res){
 if(req.method==="OPTIONS"){res.setHeader("Access-Control-Allow-Origin","*");res.setHeader("Access-Control-Allow-Headers","Content-Type,Authorization");res.setHeader("Access-Control-Allow-Methods","GET,POST,OPTIONS");return res.status(204).end();}
 const action=String(req.query?.action||"");
 if(action==="metadata") return json(res,200,{issuer:BASE,authorization_endpoint:BASE+"/oauth/authorize",token_endpoint:BASE+"/oauth/token",registration_endpoint:BASE+"/oauth/register",response_types_supported:["code"],grant_types_supported:["authorization_code"],code_challenge_methods_supported:["S256"],scopes_supported:["mcp"],token_endpoint_auth_methods_supported:["none"]});
 if(action==="resource") return json(res,200,{resource:BASE+"/api/mcp",authorization_servers:[BASE],scopes_supported:["mcp"],bearer_methods_supported:["header"]});
 if(action==="register"){
   if(req.method!=="POST") return json(res,405,{error:"method_not_allowed"});
   let b=req.body||{}; if(typeof b==="string") try{b=JSON.parse(b)}catch{}
   const name=String(b.client_name||"MCP Client").slice(0,120), uris=Array.isArray(b.redirect_uris)?b.redirect_uris.map(String):[];
   if(!uris.length||uris.some(u=>!/^https?:\/\//i.test(u))) return json(res,400,{error:"invalid_redirect_uris"});
   const clientId="bytly_"+rand(); const s=db();
   const {error}=await s.from("mcp_oauth_clients").insert({client_id:clientId,client_name:name,redirect_uris:uris,client_type:"public"});
   if(error)return json(res,500,{error:"server_error",error_description:error.message});
   return json(res,201,{client_id:clientId,client_name:name,redirect_uris:uris,token_endpoint_auth_method:"none"});
 }
 if(action==="authorize"){
   if(req.method!=="GET") return json(res,405,{error:"method_not_allowed"});
   const q=req.query||{}; const clientId=String(q.client_id||""), redirect=String(q.redirect_uri||""), challenge=String(q.code_challenge||""), state=String(q.state||"");
   if(q.response_type!=="code"||q.code_challenge_method!=="S256"||!clientId||!redirect||!challenge)return json(res,400,{error:"invalid_request"});
   const s=db(); const {data:c,error}=await s.from("mcp_oauth_clients").select("*").eq("client_id",clientId).is("revoked_at",null).maybeSingle();
   if(error||!c||!redirectAllowed(c.redirect_uris,redirect))return json(res,400,{error:"invalid_client_or_redirect"});
   const login=BASE+"/login?from_url="+encodeURIComponent("/oauth/authorize?"+new URLSearchParams(q).toString());
   const {data:{user}}=await s.auth.getUser(String(req.headers.authorization||"").replace(/^Bearer\s+/i,""));
   if(!user)return res.redirect(302,login);
   const html="<!doctype html><html lang='ar' dir='rtl'><meta charset='utf-8'><title>السماح لـ MCP</title><body style='font-family:system-ui;max-width:560px;margin:80px auto;padding:24px'><h2>السماح لـ "+nameSafe(c.client_name)+" بالوصول إلى بيتلي</h2><p>سيتم السماح للمساعد بالوصول إلى بيانات بيتلي المصرح بها لحسابك.</p><form method='POST' action='/api/mcp-oauth?action=approve'><input type='hidden' name='client_id' value='"+esc(clientId)+"'><input type='hidden' name='redirect_uri' value='"+esc(redirect)+"'><input type='hidden' name='code_challenge' value='"+esc(challenge)+"'><input type='hidden' name='state' value='"+esc(state)+"'><button style='padding:12px 24px'>موافقة</button></form></body></html>";
   res.status(200);res.setHeader("Content-Type","text/html; charset=utf-8");return res.end(html);
 }
 if(action==="approve"){
   if(req.method!=="POST")return json(res,405,{error:"method_not_allowed"});
   const b=req.body||{}; const s=db(); const {data:c}=await s.from("mcp_oauth_clients").select("*").eq("client_id",String(b.client_id)).is("revoked_at",null).maybeSingle();
   if(!c||!redirectAllowed(c.redirect_uris,String(b.redirect_uri)))return json(res,400,{error:"invalid_client"});
   const token=String(req.headers.authorization||"").replace(/^Bearer\s+/i,""); const {data:{user}}=await s.auth.getUser(token);
   if(!user)return res.redirect(302,"/login?from_url="+encodeURIComponent(req.url));
   const raw=rand(); await s.from("mcp_oauth_codes").insert({code_hash:sha(raw),client_id:c.client_id,user_id:user.id,redirect_uri:String(b.redirect_uri),code_challenge:String(b.code_challenge),code_challenge_method:"S256",scope:"mcp",expires_at:new Date(Date.now()+5*60*1000).toISOString()});
   const u=new URL(String(b.redirect_uri));u.searchParams.set("code",raw);if(b.state)u.searchParams.set("state",String(b.state));return res.redirect(302,u.toString());
 }
 if(action==="token"){
   if(req.method!=="POST")return json(res,405,{error:"method_not_allowed"});
   let b=req.body||{};if(typeof b==="string")try{b=JSON.parse(b)}catch{}
   if(b.grant_type!=="authorization_code")return json(res,400,{error:"unsupported_grant_type"});
   const verifier=String(b.code_verifier||"");const s=db();const {data:c}=await s.from("mcp_oauth_codes").select("*").eq("code_hash",sha(String(b.code||""))).is("used_at",null).gt("expires_at",new Date().toISOString()).maybeSingle();
   if(!c||c.client_id!==String(b.client_id||"")||c.redirect_uri!==String(b.redirect_uri||""))return json(res,400,{error:"invalid_grant"});
   const expected=crypto.createHash("sha256").update(verifier).digest("base64url");if(expected!==c.code_challenge)return json(res,400,{error:"invalid_grant"});
   await s.from("mcp_oauth_codes").update({used_at:new Date().toISOString()}).eq("code_hash",c.code_hash);
   const access=rand();await s.from("mcp_oauth_tokens").insert({access_token_hash:sha(access),client_id:c.client_id,user_id:c.user_id,scope:c.scope,expires_at:new Date(Date.now()+60*60*1000).toISOString()});
   return json(res,200,{access_token:access,token_type:"Bearer",expires_in:3600,scope:c.scope});
 }
 return json(res,404,{error:"not_found"});
}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function nameSafe(s){return esc(String(s||"MCP Client"))}