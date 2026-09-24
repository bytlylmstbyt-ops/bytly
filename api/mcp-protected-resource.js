export default function handler(req,res){
 res.setHeader("Content-Type","application/json");res.setHeader("Cache-Control","public,max-age=300");res.setHeader("Access-Control-Allow-Origin","*");
 if(req.method!=="GET")return res.status(405).json({error:"Method Not Allowed"});
 return res.status(200).json({resource:"https://mybytly.com/api/mcp",authorization_servers:["https://mybytly.com"],scopes_supported:["mcp"],bearer_methods_supported:["header"]});
}