import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const TABLES=new Set(["engineers","clients","engineering_firms","consultants","contractors","suppliers","legal_consultants"]);
const ROLE_TO_TABLE={engineer:"engineers",surveyor:"engineers",painter:"engineers",client:"clients",investor:"clients",firm:"engineering_firms",consultant:"consultants",contractor:"contractors",supplier:"suppliers",legal:"legal_consultants"};
async function getPlatformOwnerId(admin:any){const {data,error}=await admin.from("profiles").select("user_id").in("role",["admin","super_admin"]).order("created_at",{ascending:true}).limit(1).maybeSingle();if(error)throw new Error(`تعذر تحديد حساب الإدارة: ${error.message}`);return data?.user_id||null;}
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{...corsHeaders,"Content-Type":"application/json"}});

function b64url(bytes:Uint8Array){let s="";for(const b of bytes)s+=String.fromCharCode(b);return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");}
function clean(v:string){return v.replace(/[\r\n]/g," ").trim();}
async function hmacFingerprint(secret:string,value:string){
 const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
 const signature=await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(value));
 return Array.from(new Uint8Array(signature)).map(byte=>byte.toString(16).padStart(2,"0")).join("");
}
async function enforceUploadRateLimit(req:Request,admin:any,secret:string,email:string,sessionId:string){
 // Trust only the edge-injected Cloudflare client IP; never accept a caller-supplied forwarding header.
 const clientIp=req.headers.get("cf-connecting-ip")?.trim();
 if(!clientIp)return {ok:false,reason:"trusted_client_ip_unavailable"};
 const checks=[
  {value:"ip:"+clientIp,limit:40},
  {value:"email:"+email.trim().toLowerCase(),limit:12},
  {value:"session:"+sessionId.toLowerCase(),limit:10}
 ];
 for(const check of checks){
  const fingerprint=await hmacFingerprint(secret,check.value);
  const {data,error}=await admin.rpc("consume_registration_upload_rate_limit",{
   p_fingerprint_hash:fingerprint,p_limit:check.limit,p_window_seconds:3600
  });
  if(error)return {ok:false,reason:"rate_limit_backend_unavailable"};
  if(data!==true)return {ok:false,reason:"rate_limit_exceeded"};
 }
 return {ok:true};
}

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
  const body=await req.json();
  const action=String(body?.action||"");
  if(action==="prepare_document_upload"||action==="cleanup_document_uploads"){
    const uploadSessionId=String(body?.uploadSessionId||"");
    if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uploadSessionId))
      return json({ok:false,error:"جلسة رفع المستند غير صالحة."},400);
    const allowedFields=new Set(["graduation_certificate_url","saudi_engineers_council_certificate_url","profile_image"]);
    const mimeExtensions:Record<string,string>={"application/pdf":"pdf","image/jpeg":"jpg","image/png":"png","image/webp":"webp"};
    if(action==="cleanup_document_uploads"){
      const paths=Array.isArray(body?.paths)?body.paths.map((path:unknown)=>String(path)):[];
      const safePaths=paths.filter((path:string)=>
        path.startsWith(`registration-temp/${uploadSessionId}/`)&&!path.includes("..")&&
        /^registration-temp\/[0-9a-f-]{36}\/[a-z_]+-[0-9a-f-]{8}-[0-9a-f-]{4}-4[0-9a-f-]{3}-[89ab][0-9a-f-]{3}-[0-9a-f-]{12}\.(pdf|jpg|png|webp)$/i.test(path)
      );
      if(safePaths.length){
        const {error}=await admin.storage.from("registration-documents").remove(safePaths);
        if(error)return json({ok:false,error:"تعذر تنظيف الملفات المؤقتة."},400);
      }
      return json({ok:true,removed:safePaths.length});
    }
    const field=String(body?.field||"");
    const name=String(body?.name||"");
    const type=String(body?.type||"");
    const size=Number(body?.size);
    const email=String(body?.email||"").trim().toLowerCase();
    const validType=field==="profile_image"?["image/jpeg","image/png","image/webp"].includes(type):Boolean(mimeExtensions[type]);
    if(!allowedFields.has(field)||!name||!Number.isFinite(size)||size<=0||size>10*1024*1024||!validType)
      return json({ok:false,error:"نوع الملف غير مدعوم أو تجاوز حجمه 10 ميجابايت."},400);
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return json({ok:false,error:"أدخل البريد الإلكتروني الصحيح قبل رفع الشهادات."},400);
    const rateLimit=await enforceUploadRateLimit(req,admin,serviceKey,email,uploadSessionId);
    if(!rateLimit.ok){
      const status=rateLimit.reason==="rate_limit_exceeded"?429:503;
      return json({ok:false,error:status===429?"تم تجاوز عدد محاولات رفع الملفات. انتظر ساعة ثم حاول مرة أخرى.":"تعذر التحقق من حماية الرفع حالياً. حاول مرة أخرى لاحقاً."},status);
    }
    const path=`registration-temp/${uploadSessionId}/${field}-${crypto.randomUUID()}.${mimeExtensions[type]}`;
    const {data,error}=await admin.storage.from("registration-documents").createSignedUploadUrl(path,{upsert:false});
    if(error||!data?.token){
      console.error("registration signed upload URL error",error);
      return json({ok:false,error:"تعذر تجهيز رابط رفع الشهادة. حاول مرة أخرى."},400);
    }
    return json({ok:true,path:data.path||path,token:data.token,expires_in:7200});
  }
  const table=String(body?.table||"");const role=String(body?.role||"");
  const email=String(body?.email||"").trim().toLowerCase();const fullName=String(body?.fullName||"").trim();const phone=String(body?.phone||"").trim();
  const row=body?.row&&typeof body.row==="object"?{...body.row}:{};const password=String(body?.password||"");const attribution=body?.attribution&&typeof body.attribution==="object"?body.attribution:{};const documents=body?.documents&&typeof body.documents==="object"?body.documents:{};
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
  const validatedDocuments = new Map<string,{bytes:Uint8Array,type:string,extension:string,path:string}>();
  const temporaryDocumentPaths:string[]=[];
  const cleanupTemporaryDocuments=async()=>{
    if(!temporaryDocumentPaths.length)return;
    const paths=[...temporaryDocumentPaths];
    temporaryDocumentPaths.length=0;
    const {error}=await admin.storage.from("registration-documents").remove(paths);
    if(error)console.error("Temporary registration document cleanup failed",error);
  };
  if(table==="engineers"){
    const certificateFields=["graduation_certificate_url","saudi_engineers_council_certificate_url"];
    const fieldsToValidate=[...certificateFields,...(documents.profile_image?.path?["profile_image"]:[])];
    const uploadSessionId=String(documents.uploadSessionId||"");
    if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uploadSessionId)){
      await recordAttempt("failed",null,"document_validation","جلسة رفع الشهادات غير صالحة");
      await cleanupTemporaryDocuments();
      return json({ok:false,error:"انتهت جلسة رفع الشهادات. أعد اختيار الشهادتين وحاول مرة أخرى."},400);
    }
    const mimeExtensions:Record<string,string>={"application/pdf":"pdf","image/jpeg":"jpg","image/png":"png","image/webp":"webp"};
    // Register every session-owned candidate path before validating any file.
    // If the first certificate fails, later already-uploaded files are still cleaned.
    for(const field of fieldsToValidate){
      const candidate=documents[field];
      const candidatePath=String(candidate?.path||"");
      // Track session-owned files independently of caller-declared MIME type,
      // so a MIME/path mismatch is still cleaned when validation rejects it.
      const candidatePattern=new RegExp("^registration-temp/"+uploadSessionId+"/"+field+"-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\\.(pdf|jpg|png|webp)$","i");
      if(candidatePattern.test(candidatePath)&&!temporaryDocumentPaths.includes(candidatePath))temporaryDocumentPaths.push(candidatePath);
    }
    for(const field of fieldsToValidate){
      const doc=documents[field];
      const path=String(doc?.path||"");
      const extension=mimeExtensions[String(doc?.type||"")];
      const expectedPathPattern=extension
        ? new RegExp("^registration-temp/" + uploadSessionId + "/" + field + "-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\." + extension + "$","i")
        : null;
      if(!expectedPathPattern?.test(path)){
        await recordAttempt("failed",null,"document_validation",`مسار المستند غير صالح: ${field}`);
        await cleanupTemporaryDocuments();
        return json({ok:false,error:"يرجى رفع شهادة التخرج وشهادة القيد من جديد."},400);
      }
      if(!doc?.name){
        await recordAttempt("failed",null,"document_validation",`اسم المستند مفقود: ${field}`);
        await cleanupTemporaryDocuments();
        return json({ok:false,error:"بيانات أحد المستندات غير مكتملة. أعد رفع الشهادتين."},400);
      }
      const {data:blob,error:downloadError}=await admin.storage.from("registration-documents").download(path);
      if(downloadError||!blob){
        await recordAttempt("failed",null,"document_validation",`تعذر العثور على المستند: ${field}`);
        await cleanupTemporaryDocuments();
        return json({ok:false,error:"لم نتمكن من التحقق من حفظ الشهادتين. أعد رفعهما وحاول مرة أخرى."},400);
      }
      if(blob.size<=0||blob.size>10*1024*1024){
        await recordAttempt("failed",null,"document_validation",`حجم المستند غير صالح: ${field}`);
        await cleanupTemporaryDocuments();
        return json({ok:false,error:"حجم كل شهادة يجب ألا يتجاوز 10 ميجابايت."},400);
      }
      const bytes=new Uint8Array(await blob.arrayBuffer());
      const header=bytes.subarray(0,12);
      const signatureValid=doc.type==="application/pdf"
        ? new TextDecoder().decode(header.subarray(0,5))==="%PDF-"
        : doc.type==="image/jpeg"
          ? header[0]===0xff&&header[1]===0xd8&&header[2]===0xff
          : doc.type==="image/png"
            ? header[0]===0x89&&new TextDecoder().decode(header.subarray(1,4))==="PNG"
            : new TextDecoder().decode(header.subarray(0,4))==="RIFF"&&new TextDecoder().decode(header.subarray(8,12))==="WEBP";
      if(!signatureValid){
        await recordAttempt("failed",null,"document_validation",`محتوى الملف لا يطابق نوعه: ${field}`);
        await cleanupTemporaryDocuments();
        return json({ok:false,error:"نوع أحد الملفات لا يطابق محتواه. تحقق من الملف وأعد رفعه."},400);
      }
      validatedDocuments.set(field,{bytes,type:doc.type,extension,path});
    }
  }
  delete row.user_id;delete row.owner_user_id;delete row.id;row.email=email;row.phone=phone;const companyTables=new Set(["engineering_firms","contractors","suppliers"]);if(companyTables.has(table)){row.company_name=String(row.company_name||fullName).trim();delete row.full_name;}else{row.full_name=fullName;delete row.company_name;}if(["engineers","clients","engineering_firms"].includes(table)){row.is_real=true;row.source="supabase";}else{delete row.is_real;delete row.source;}

  const {data:existingProfile,error:profileLookupError}=await admin.from("profiles").select("id,user_id,role").eq("email",email).maybeSingle();
  if(profileLookupError){await cleanupTemporaryDocuments();await recordAttempt("failed",null,"profile_lookup",profileLookupError.message);return json({ok:false,error:`تعذر التحقق من البريد: ${profileLookupError.message}`},500);}
  if(existingProfile?.user_id){await cleanupTemporaryDocuments();await recordAttempt("failed",existingProfile.user_id,"duplicate","هذا البريد مسجل بالفعل");return json({ok:false,error:"هذا البريد مسجل بالفعل. يمكنك تسجيل الدخول."},409);}

  const {data:created,error:authError}=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{full_name:fullName,name:fullName,role,account_type:role,phone}});
  if(authError||!created.user){
   const message=authError?.message||"تعذر إنشاء حساب الدخول";
   if(/already registered|already exists/i.test(message)){await cleanupTemporaryDocuments();return json({ok:false,error:"هذا البريد مسجل بالفعل. يمكنك تسجيل الدخول."},409);}
   await cleanupTemporaryDocuments();await recordAttempt("failed",null,"auth_create",message); return json({ok:false,error:`تعذر إنشاء حساب الدخول: ${message}`},400);
  }
  const userId=created.user.id;const ownershipField=table==="engineering_firms"?"owner_user_id":"user_id";row[ownershipField]=userId;
  if(table==="engineers"){row.status="pending";row.is_verified=false;}
  const {error:profileError}=await admin.from("profiles").upsert({user_id:userId,full_name:fullName,email,phone,role,acquisition_source:attribution.source||null,acquisition_medium:attribution.medium||null,acquisition_campaign:attribution.campaign||null,acquisition_content:attribution.content||null,acquisition_referrer:attribution.referrer||null,acquisition_label:attribution.label||null},{onConflict:"user_id"});
  if(profileError){await cleanupTemporaryDocuments();await recordAttempt("failed",userId,"profile_create",profileError.message);await admin.auth.admin.deleteUser(userId);return json({ok:false,error:`تعذر حفظ ملف المستخدم: ${profileError.message}`},400);}
  const uploadedDocumentPaths:string[]=[];
  if(table==="engineers"){
    const fieldsToUpload=["graduation_certificate_url","saudi_engineers_council_certificate_url",...(documents.profile_image?.path?["profile_image"]:[])];
    for(const field of fieldsToUpload){
      const doc=validatedDocuments.get(field);
      if(!doc)continue;
      const path=`engineers/${userId}/${field}-${crypto.randomUUID()}.${doc.extension}`;
      const {error:uploadError}=await admin.storage.from("registration-documents").upload(path,doc.bytes,{upsert:false,contentType:doc.type,cacheControl:"3600"});
      if(uploadError){
        for(const uploadedPath of uploadedDocumentPaths){try{await admin.storage.from("registration-documents").remove([uploadedPath]);}catch(_){}}
        if(temporaryDocumentPaths.length)await admin.storage.from("registration-documents").remove(temporaryDocumentPaths);
        await recordAttempt("failed",userId,"document_upload",uploadError.message);
        await admin.from("profiles").delete().eq("user_id",userId);
        await admin.auth.admin.deleteUser(userId);
        return json({ok:false,error:"تعذر حفظ مستندات التسجيل بأمان. لم يتم إكمال إنشاء الحساب؛ يرجى إعادة المحاولة."},400);
      }
      uploadedDocumentPaths.push(path);
      row[field]=path;
    }
  }
  const {data:saved,error:rowError}=await admin.from(table).insert(row).select("*").single();
  if(rowError){for(const uploadedPath of uploadedDocumentPaths){try{await admin.storage.from("registration-documents").remove([uploadedPath]);}catch(_){}}if(temporaryDocumentPaths.length)await admin.storage.from("registration-documents").remove(temporaryDocumentPaths);await recordAttempt("failed",userId,"role_record_create",rowError.message);await admin.from("profiles").delete().eq("user_id",userId);await admin.auth.admin.deleteUser(userId);return json({ok:false,error:`تعذر حفظ بيانات التسجيل: ${rowError.message}`},400);}
  if(temporaryDocumentPaths.length){const {error:cleanupError}=await admin.storage.from("registration-documents").remove(temporaryDocumentPaths);if(cleanupError)console.error("Temporary certificate cleanup failed",cleanupError);}

  let platformNotification=false;
  try{const platformOwnerId=await getPlatformOwnerId(admin);
    if(platformOwnerId){
      const n=await admin.from("notifications").insert({user_id:platformOwnerId,type:"new_registration",title:"تسجيل مستخدم جديد في بيتلي",body:`تم تسجيل ${fullName} — ${email} — ${role} — ${phone}`,entity_type:"registration",entity_id:saved?.id||null});
      platformNotification=!n.error;
    }
  }catch(_){}

  const welcomeHtml=`<div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.8"><h2>مرحباً بك في Bytly</h2><p>أهلاً ${clean(fullName)}،</p><p>شكراً لتسجيلك في <strong>Bytly / بيتلي</strong>. تم استلام طلب تسجيلك وشهاداتك بنجاح. حسابك الآن قيد المراجعة حتى تتحقق الإدارة من بياناتك وتعتمد الحساب.</p><p>سنبلغك عند اكتمال المراجعة.</p><p>مع التحية،<br>فريق Bytly</p></div>`;
  const adminHtml=`<div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.8"><h2>تسجيل مستخدم جديد في Bytly</h2><p><strong>الاسم:</strong> ${clean(fullName)}</p><p><strong>البريد:</strong> ${clean(email)}</p><p><strong>الهاتف:</strong> ${clean(phone)}</p><p><strong>نوع الحساب:</strong> ${clean(role)}</p><p><strong>معرّف المستخدم:</strong> ${clean(userId)}</p></div>`;
  // Email delivery is best-effort after the account and documents have been saved.
  // A mail-provider/network failure must not turn a successful registration into a
  // reported registration failure that encourages the user to retry a duplicate account.
  const [welcome,adminEmail]=await Promise.all([
    sendSystemEmail(email,"مرحباً بك في Bytly — تم إنشاء حسابك بنجاح",welcomeHtml)
      .catch(error=>{console.error("Welcome email delivery failed",error);return {sent:false,reason:"email_delivery_unavailable"};}),
    sendSystemEmail("bytlylmstbyt@gmail.com",`تسجيل مستخدم جديد في Bytly: ${fullName}`,adminHtml)
      .catch(error=>{console.error("Admin email delivery failed",error);return {sent:false,reason:"email_delivery_unavailable"};})
  ]);

  await recordAttempt("succeeded",userId,null,null);
  return json({ok:true,user_id:userId,record_id:saved?.id||null,documents_uploaded:uploadedDocumentPaths.length,platform_notification_sent:platformNotification,welcome_email_sent:welcome.sent,admin_email_sent:adminEmail.sent,email_status:{welcome:welcome.reason||"sent",admin:adminEmail.reason||"sent"}});
 }catch(error){console.error("complete-registration error",error);return json({ok:false,error:error instanceof Error?error.message:"تعذر إكمال التسجيل"},500);}
});