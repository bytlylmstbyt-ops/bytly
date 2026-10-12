import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
const cors = {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json"}});
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 if(req.method!=="POST")return json({ok:false,error:"POST only"},405);
 const url=Deno.env.get("SUPABASE_URL"),key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),header=req.headers.get("Authorization");
 if(!url||!key)return json({ok:false,error:"Server configuration missing"},500);
 if(!header?.startsWith("Bearer "))return json({ok:false,error:"غير مصرح"},401);
 const admin=createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
 const {data:auth,error:authError}=await admin.auth.getUser(header.slice(7));
 if(authError||!auth.user)return json({ok:false,error:"جلسة الدخول غير صالحة"},401);
 let body:{projectId?:string};try{body=await req.json()}catch{return json({ok:false,error:"بيانات الطلب غير صالحة"},400)}
 const projectId=String(body.projectId||"").trim();if(!projectId)return json({ok:false,error:"معرّف المشروع مطلوب"},400);
 const {data:project,error:projectError}=await admin.from("projects").select("id,title,category,client_user_id,assigned_engineer_id,is_direct_hire").eq("id",projectId).maybeSingle();
 if(projectError)return json({ok:false,error:"تعذر قراءة المشروع"},500);
 if(!project||project.client_user_id!==auth.user.id)return json({ok:false,error:"لا تملك صلاحية إرسال تنبيهات لهذا المشروع"},403);
 let recipients:any[]=[];
 if(project.is_direct_hire&&project.assigned_engineer_id){
  const {data:engineer,error}=await admin.from("engineers").select("user_id,email,full_name,is_verified,status").eq("id",project.assigned_engineer_id).maybeSingle();
  if(error)return json({ok:false,error:"تعذر التحقق من المهندس المحدد"},500);
  if(engineer?.user_id&&engineer.is_verified===true&&["approved","active","verified"].includes(String(engineer.status||"").toLowerCase()))recipients=[engineer];
 }else{
  const {data:engineers,error}=await admin.from("engineers").select("user_id,email,full_name,specialization,is_verified,status").eq("is_verified",true).not("user_id","is",null).limit(500);
  if(error)return json({ok:false,error:"تعذر البحث عن المهندسين المعتمدين"},500);
  const category=String(project.category||"").trim().toLowerCase();
  const categoryTerms:Record<string,string[]> = {
   interior:["interior","تصميم داخلي","ديكور"],
   architecture:["architecture","معماري","هندسة معمارية","عمارة"],
   painting:["painting","رسم","مخططات"],
   landscape:["landscape","حدائق","تنسيق"],
   furniture:["furniture","أثاث"],
   lighting:["lighting","إضاءة"],
   civil:["civil","مدني"],
  };
  const terms=categoryTerms[category]||[category];
  recipients=(engineers||[]).filter((e:any)=>{
   const status=String(e.status||"").toLowerCase();
   const specialization=String(e.specialization||"").toLowerCase();
   return ["approved","active","verified"].includes(status)&&terms.some(term=>specialization.includes(term))&&e.user_id!==auth.user.id;
  });
 }
 const unique=[...new Map(recipients.filter(e=>e.user_id).map(e=>[e.user_id,e])).values()];
 if(!unique.length)return json({ok:true,notified:0,message:"لا يوجد مهندسون معتمدون مطابقون حاليًا"});
 const direct=Boolean(project.is_direct_hire),title=direct?"طلب خدمة مباشرة جديد":"مشروع جديد يناسب تخصصك";
 const message=direct?`تم اختيارك لطلب خدمة مباشرة في مشروع "${project.title}". افتح بيتلي لمراجعة التفاصيل.`:`أُضيف مشروع جديد بعنوان "${project.title}" قد يناسب تخصصك. افتح بيتلي لمراجعة التفاصيل وتقديم عرضك.`;
 const rows=unique.map(e=>({user_id:e.user_id,type:"project_update",title,body:message,entity_type:"project",entity_id:project.id}));
 const {error:insertError}=await admin.from("notifications").insert(rows);
 if(insertError)return json({ok:false,error:"تعذر حفظ تنبيهات المشروع"},500);
 return json({ok:true,notified:rows.length});
});
