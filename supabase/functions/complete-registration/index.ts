import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const TABLES=new Set(["engineers","clients","engineering_firms","consultants","contractors","suppliers","legal_consultants"]);
const ROLE_TO_TABLE={engineer:"engineers",surveyor:"engineers",painter:"engineers",client:"clients",investor:"clients",firm:"engineering_firms",consultant:"consultants",contractor:"contractors",supplier:"suppliers",legal:"legal_consultants"};
async function getPlatformOwnerId(admin:any){const {data,error}=await admin.from("profiles").select("user_id").in("role",["admin","super_admin"]).order("created_at",{ascending:true}).limit(1).maybeSingle();if(error)throw new Error(`تعذر تحديد حساب الإدارة: ${error.message}`);return data?.user_id||null;}
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{...corsHeaders,"Content-Type":"application/json"}});

function b64url(bytes:Uint8Array){let s="";for(const b of bytes)s+=String.fromCharCode(b);return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");}
function clean(v:string){return v.replace(/[\r\n]/g," ").trim();}
async function sendSystemEmail(to:string,subject:string,html:string){
 const clientId=Deno.env.get("BYTLY_GMAIL_CLIENT_ID"), clientSecret=Deno.env.get("BYTLY_GMAIL_CLIENT_SECRET"), refreshToken=Deno.env.get("BYTLY_GMAIL_REFRESH_TOKEN");
 if(!clientId||!clientSecret||!refreshToken)return {sent:false,reason:"GMAIL_SYSTEM_SECRETS_NOT_CONFIGURED"};
 const tokenRes=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({client_id:clientId,client_secret:clientSecret,refresh_token:refreshToken,grant_type:"refresh_token"})});
 const tokenData=await tokenRes.json().catch(()=>({}));
 if(!tokenRes.ok||!tokenData.access_token)return {sent:false,reason:"GMAIL_REFRESH_TOKEN_INVALID"};
 const raw=["From: Bytly <info@mybytly.com>","Reply-To: info@mybytly.com",`To: ${clean(to)}`,`Subject: ${clean(subject)}`,"MIME-Version: 1.0","Content-Type: text/html; charset=UTF-8","",html].join("\r\n");
 const sendRes=await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send",{method:"POST",headers:{Authorization:`Bearer ${tokenData.access_token}`,"Content-Type":"application/json"},body:JSON.stringify({raw:b64url(new TextEncoder().encode(raw))})});
 const sendData=await sendRes.json().catch(()=>({}));
 return sendRes.ok?{sent:true,messageId:sendData.id||null}:{sent:false,reason:"GMAIL_SEND_FAILED"};
}

Deno.serve(async(req)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders});
 if(req.method!=="POST")return json({ok:false,error:"Method not allowed"},405);
 try{
  const secretKeys=Deno.env.get("SUPABASE_SECRET_KEYS");
  const serviceKey=secretKeys?JSON.parse(secretKeys)["default"]:Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const url=Deno.env.get("SUPABASE_URL");
  if(!url||!serviceKey)return json({ok:false,error:"Server registration is not configured"},500);
  const admin=createClient(url,serviceKey,{auth:{autoRefreshToken:false,persistSession:false}});
  const body=await req.json();const table=String(body?.table||"");const role=String(body?.role||"");
  const email=String(body?.email||"").trim().toLowerCase();const fullName=String(body?.fullName||"").trim();const phone=String(body?.phone||"").trim();
  const row=body?.row&&typeof body.row==="object"?{...body.row}:{};const password=String(body?.password||"");const attribution=body?.attribution&&typeof body.attribution==="object"?body.attribution:{};
  const passwordBytes=new TextEncoder().encode(password).length;
  const attemptId=crypto.randomUUID();
  const recordAttempt=async(status:string,userId:any=null,stage:string|null=null,message:string|null=null)=>{
    try{await admin.from("registration_attempts").upsert({id:attemptId,email,status,user_id:userId,error_stage:stage,error_message:message ? `[${role}/${table}] ${message}` : `[${role}/${table}]`},{onConflict:"id"});}catch(_){}
  };
  await recordAttempt("started");
  if(password.length<8){await recordAttempt("failed",null,"validation","كلمة المرور قصيرة");return json({ok:false,error:"كلمة المرور يجب أن تكون 8 أحرف على الأقل."},400);}
  if(passwordBytes>72){await recordAttempt("failed",null,"validation","كلمة المرور طويلة");return json({ok:false,error:"كلمة المرور طويلة جداً. الحد الأقصى 72 بايت."},400);}
  if(!TABLES.has(table)||ROLE_TO_TABLE[role]!==table){await recordAttempt("failed",null,"validation","Invalid registration type");return json({ok:false,error:"Invalid registration type"},400);}
  if(!email||!fullName||!phone){await recordAttempt("failed",null,"validation","الاسم والبريد والهاتف مطلوبة");return json({ok:false,error:"الاسم والبريد والهاتف مطلوبة"},400);}
  delete row.user_id;delete row.owner_user_id;delete row.id;row.email=email;row.full_name=fullName;row.phone=phone;row.is_real=true;row.source="supabase";

  const {data:existingProfile,error:profileLookupError}=await admin.from("profiles").select("id,user_id,role").eq("email",email).maybeSingle();
  if(profileLookupError){await recordAttempt("failed",null,"profile_lookup",profileLookupError.message);return json({ok:false,error:`تعذر التحقق من البريد: ${profileLookupError.message}`},500);}
  if(existingProfile?.user_id){await recordAttempt("failed",existingProfile.user_id,"duplicate","هذا البريد مسجل بالفعل");return json({ok:false,error:"هذا البريد مسجل بالفعل. يمكنك تسجيل الدخول."},409);}

  const {data:created,error:authError}=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{full_name:fullName,name:fullName,role,account_type:role,phone}});
  if(authError||!created.user){
   const message=authError?.message||"تعذر إنشاء حساب الدخول";
   if(/already registered|already exists/i.test(message))return json({ok:false,error:"هذا البريد مسجل بالفعل. يمكنك تسجيل الدخول."},409);
   await recordAttempt("failed",null,"auth_create",message); return json({ok:false,error:`تعذر إنشاء حساب الدخول: ${message}`},400);
  }
  const userId=created.user.id;const ownershipField=table==="engineering_firms"?"owner_user_id":"user_id";row[ownershipField]=userId;
  const {error:profileError}=await admin.from("profiles").upsert({user_id:userId,full_name:fullName,email,phone,role,acquisition_source:attribution.source||null,acquisition_medium:attribution.medium||null,acquisition_campaign:attribution.campaign||null,acquisition_content:attribution.content||null,acquisition_referrer:attribution.referrer||null,acquisition_label:attribution.label||null},{onConflict:"user_id"});
  if(profileError){await recordAttempt("failed",userId,"profile_create",profileError.message);await admin.auth.admin.deleteUser(userId);return json({ok:false,error:`تعذر حفظ ملف المستخدم: ${profileError.message}`},400);}
  const {data:saved,error:rowError}=await admin.from(table).insert(row).select("*").single();
  if(rowError){await recordAttempt("failed",userId,"role_record_create",rowError.message);await admin.from("profiles").delete().eq("user_id",userId);await admin.auth.admin.deleteUser(userId);return json({ok:false,error:`تعذر حفظ بيانات التسجيل: ${rowError.message}`},400);}

  let platformNotification=false;
  try{const platformOwnerId=await getPlatformOwnerId(admin);
    if(platformOwnerId){
      const n=await admin.from("notifications").insert({user_id:platformOwnerId,type:"new_registration",title:"تسجيل مستخدم جديد في بيتلي",body:`تم تسجيل ${fullName} — ${email} — ${role} — ${phone}`,entity_type:"registration",entity_id:saved?.id||null});
      platformNotification=!n.error;
    }
  }catch(_){}

  const welcomeHtml=`<div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.8"><h2>مرحباً بك في Bytly</h2><p>أهلاً ${clean(fullName)}،</p><p>شكراً لتسجيلك في <strong>Bytly / بيتلي</strong>. تم إنشاء حسابك بنجاح.</p><p>يمكنك الآن تسجيل الدخول والبدء باستخدام المنصة.</p><p>مع التحية،<br>فريق Bytly</p></div>`;
  const adminHtml=`<div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.8"><h2>تسجيل مستخدم جديد في Bytly</h2><p><strong>الاسم:</strong> ${clean(fullName)}</p><p><strong>البريد:</strong> ${clean(email)}</p><p><strong>الهاتف:</strong> ${clean(phone)}</p><p><strong>نوع الحساب:</strong> ${clean(role)}</p><p><strong>معرّف المستخدم:</strong> ${clean(userId)}</p></div>`;
  const welcome=await sendSystemEmail(email,"مرحباً بك في Bytly — تم إنشاء حسابك بنجاح",welcomeHtml);
  const adminEmail=await sendSystemEmail("bytlylmstbyt@gmail.com",`تسجيل مستخدم جديد في Bytly: ${fullName}`,adminHtml);

  await recordAttempt("succeeded",userId,null,null);
  return json({ok:true,user_id:userId,record_id:saved?.id||null,platform_notification_sent:platformNotification,welcome_email_sent:welcome.sent,admin_email_sent:adminEmail.sent,email_status:{welcome:welcome.reason||"sent",admin:adminEmail.reason||"sent"}});
 }catch(error){console.error("complete-registration error",error);return json({ok:false,error:error instanceof Error?error.message:"تعذر إكمال التسجيل"},500);}
});