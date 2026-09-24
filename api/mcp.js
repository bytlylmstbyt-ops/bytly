import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL=process.env.VITE_SUPABASE_URL||"https://wbqtgdkubrocnqnykhlt.supabase.co";
const SUPABASE_KEY=process.env.SUPABASE_ANON_KEY||process.env.VITE_SUPABASE_ANON_KEY||"sb_publishable_8dsKwVbalFlUNA65FJaWlA_1ch0TKfw";
const GATEWAY="https://wbqtgdkubrocnqnykhlt.supabase.co/functions/v1/mcp-gateway";
const SERVER={name:"Bytly MCP",version:"1.1.0",protocolVersion:"2025-06-18"};
const tools=[
{name:"get_current_user",description:"Get the authenticated Bytly user's profile and role.",inputSchema:{type:"object",properties:{},additionalProperties:false}},
{name:"list_projects",description:"List projects visible to the authenticated Bytly user.",inputSchema:{type:"object",properties:{limit:{type:"integer",minimum:1,maximum:50}},additionalProperties:false}},
{name:"list_notifications",description:"List notifications for the authenticated Bytly user.",inputSchema:{type:"object",properties:{limit:{type:"integer",minimum:1,maximum:50}},additionalProperties:false}}
];
function send(res,status,body,type="application/json"){res.status(status);res.setHeader("Content-Type",type);res.setHeader("Cache-Control","no-store");res.setHeader("Access-Control-Allow-Origin","*");res.setHeader("Access-Control-Expose-Headers","WWW-Authenticate, MCP-Protocol-Version");res.setHeader("Access-Control-Allow-Headers","Authorization, Content-Type, MCP-Protocol-Version, Accept, Last-Event-ID");res.setHeader("Access-Control-Allow-Methods","GET, POST, DELETE, OPTIONS");return res.end(body==null?"":JSON.stringify(body));}
const rpc=(id,result)=>({jsonrpc:"2.0",id,result});
const rpcError=(id,code,message)=>({jsonrpc:"2.0",id,error:{code,message}});
const tokenOf=req=>String(req.headers.authorization||"").replace(/^Bearer\s+/i,"").trim();
async function mcpOAuthUser(token){
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!key||!token)return null;
 const s=createClient(SUPABASE_URL,key,{auth:{autoRefreshToken:false,persistSession:false}});
 const {data,error}=await s.from("mcp_oauth_tokens").select("user_id,scope,expires_at").eq("access_token_hash",crypto.createHash("sha256").update(token).digest("hex")).is("revoked_at",null).gt("expires_at",new Date().toISOString()).maybeSingle();
 return error||!data?null:{supabase:s,user:{id:data.user_id},scope:data.scope};
}
async function gateway(token,tool,args){
 const r=await fetch(GATEWAY,{method:"POST",headers:{"Authorization":"Bearer "+token,"Content-Type":"application/json"},body:JSON.stringify({tool,...(args||{})})});
 let body=null;try{body=await r.json()}catch{}
 return {ok:r.ok,status:r.status,body};
}
async function supabaseUser(token){
 const s=createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{autoRefreshToken:false,persistSession:false},global:{headers:{Authorization:"Bearer "+token}}});
 const {data,error}=await s.auth.getUser(token);
 return !error&&data?.user?{supabase:s,user:data.user}:null;
}
async function callTool(name,args,req){
 const token=tokenOf(req);if(!token)return {status:401,body:rpcError(null,-32001,"Authentication required")};
 const jwt=await supabaseUser(token) || await mcpOAuthUser(token);
 if(jwt){
   const s=jwt.supabase,u=jwt.user;
   if(name==="get_current_user"){
     const {data,error}=await s.from("profiles").select("id,user_id,email,full_name,phone,role").eq("user_id",u.id).maybeSingle();
     if(error)return {status:200,body:rpcError(null,-32000,error.message)};
     return {status:200,value:{user:{id:u.id,email:u.email},profile:data}};
   }
   if(name==="list_notifications"){
     const limit=Math.min(Math.max(Number(args?.limit)||20,1),50);
     const {data,error}=await s.from("notifications").select("*").eq("user_id",u.id).order("created_at",{ascending:false}).limit(limit);
     if(error)return {status:200,body:rpcError(null,-32000,error.message)}; return {status:200,value:data||[]};
   }
   if(name==="list_projects"){
     const limit=Math.min(Math.max(Number(args?.limit)||20,1),50);
     const {data,error}=await s.from("projects").select("*").limit(limit);
     if(error)return {status:200,body:rpcError(null,-32000,error.message)}; return {status:200,value:data||[]};
   }
   return {status:200,body:rpcError(null,-32602,"Unknown tool")};
 }
 const g=await gateway(token,name,{limit:args?.limit});
 if(g.status===401)return {status:401,body:rpcError(null,-32001,"Invalid or expired authentication")};
 if(!g.ok)return {status:200,body:rpcError(null,-32000,g.body?.error||"MCP gateway error")};
 return {status:200,value:g.body};
}
export default async function handler(req,res){
 if(req.method==="OPTIONS")return send(res,204);
 if(req.method==="GET"){
   const accepts=String(req.headers.accept||"");
   if(accepts.includes("text/event-stream")){res.status(200);res.setHeader("Content-Type","text/event-stream");res.setHeader("Cache-Control","no-cache");res.setHeader("Access-Control-Allow-Origin","*");res.write(": bytly-mcp\n\n");return res.end();}
   return send(res,200,{status:"ok",server:SERVER,endpoint:"/api/mcp",transport:"streamable-http",authentication:"Bearer OAuth or Supabase access token",tools:tools.map(x=>x.name)});
 }
 if(req.method==="DELETE")return send(res,405,{error:"MCP sessions are stateless"});
 if(req.method!=="POST")return send(res,405,{error:"Method Not Allowed"});
 let body;try{body=typeof req.body==="string"?JSON.parse(req.body):req.body}catch{return send(res,400,rpcError(null,-32700,"Invalid JSON"))}
 const id=body?.id??null,method=body?.method;if(!method)return send(res,400,rpcError(id,-32600,"Invalid Request"));
 if(method==="initialize")return send(res,200,rpc(id,{protocolVersion:SERVER.protocolVersion,capabilities:{tools:{listChanged:false}},serverInfo:{name:SERVER.name,version:SERVER.version},instructions:"Bytly MCP exposes user-scoped Bytly data."}));
 if(method==="notifications/initialized")return send(res,202);
 if(method==="ping")return send(res,200,rpc(id,{}));
 if(method==="tools/list")return send(res,200,rpc(id,{tools}));
 if(method==="tools/call"){
   const result=await callTool(body?.params?.name,body?.params?.arguments||{},req);
   if(result.status===401)res.setHeader("WWW-Authenticate",'Bearer resource_metadata="https://www.mybytly.com/.well-known/oauth-protected-resource"');
   if(result.body){if(result.body.id===null)result.body.id=id;return send(res,result.status,result.body)}
   return send(res,result.status||200,rpc(id,{content:[{type:"text",text:JSON.stringify(result.value??null)}]}));
 }
 return send(res,200,rpcError(id,-32601,"Method not found"));
}
