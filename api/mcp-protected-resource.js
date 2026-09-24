export default function handler(req,res){
 res.setHeader("Content-Type","application/json");res.setHeader("Cache-Control","public,max-age=300");res.setHeader("Access-Control-Allow-Origin","*");
 if(req.method!=="GET")return res.status(405).json({error:"Method Not Allowed"});
 return res.status(200).json({resource:"https://www.mybytly.com/api/mcp",authorization_servers:["https://www.mybytly.com"],scopes_supported:["mcp","offline_access"],bearer_methods_supported:["header"]});
}