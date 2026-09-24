import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL=process.env.VITE_SUPABASE_URL||"https://wbqtgdkubrocnqnykhlt.supabase.co";
const SERVICE_KEY=process.env.SUPABASE_SERVICE_ROLE_KEY;
const db=()=>createClient(SUPABASE_URL,SERVICE_KEY,{auth:{autoRefreshToken:false,persistSession:false}});
const send=(res,status,body)=>{res.status(status);res.setHeader("Content-Type","application/json; charset=utf-8");res.setHeader("Cache-Control","no-store");res.setHeader("Access-Control-Allow-Origin","*");res.setHeader("Access-Control-Allow-Headers","Content-Type, Authorization");res.setHeader("Access-Control-Allow-Methods","GET, OPTIONS");return res.end(JSON.stringify(body));};

export default async function handler(req,res){
 if(req.method==="OPTIONS")return res.status(204).setHeader("Access-Control-Allow-Origin","*").end();
 if(req.method!=="GET")return send(res,405,{error:"method_not_allowed"});
 if(!SERVICE_KEY)return send(res,500,{error:"server_not_configured"});
 const auth=String(req.headers.authorization||"").replace(/^Bearer\s+/i,"").trim();
 if(!auth)return send(res,401,{error:"authentication_required"});
 const s=db();
 const {data:{user},error:userError}=await s.auth.getUser(auth);
 if(userError||!user)return send(res,401,{error:"authentication_required"});
 const email=String(user.email||"").toLowerCase();
 const {data:profile}=await s.from("profiles").select("role").eq("user_id",user.id).maybeSingle();
 if(email!=="bytlylmstbyt@gmail.com"&&profile?.role!=="admin")return send(res,403,{error:"admin_only"});
 const {data:clients,error:cErr}=await s.from("mcp_oauth_clients").select("client_id,client_name,client_type,created_at,revoked_at").is("revoked_at",null).order("created_at",{ascending:false});
 if(cErr)return send(res,500,{error:"clients_query_failed"});
 const {data:tokens,error:tErr}=await s.from("mcp_oauth_tokens").select("client_id,user_id,scope,expires_at,created_at").is("revoked_at",null).gt("expires_at",new Date().toISOString());
 if(tErr)return send(res,500,{error:"tokens_query_failed"});
 const classify=name=>{const n=String(name||"").toLowerCase();if(n.includes("claude")||n.includes("anthropic"))return"claude";if(n.includes("chatgpt")||n.includes("openai"))return"chatgpt";if(n.includes("gemini")||n.includes("google"))return"gemini";return"other"};
 const result=["chatgpt","claude","gemini"].map(key=>{const matches=(clients||[]).filter(c=>classify(c.client_name)===key);const ids=new Set(matches.map(c=>c.client_id));const active=(tokens||[]).filter(t=>ids.has(t.client_id));const latest=active.slice().sort((a,b)=>new Date(b.created_at)-new Date(a.created_at))[0];return{client:key,registered:matches.length>0,connected:active.length>0,activeConnections:active.length,lastConnectedAt:latest?.created_at||null}});
 return send(res,200,{status:"ok",server:"Bytly MCP",clients:result,registeredClients:(clients||[]).length,activeTokens:(tokens||[]).length,checkedAt:new Date().toISOString()});
}