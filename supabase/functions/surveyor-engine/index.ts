import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const reply=(b:unknown,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{...cors,"Content-Type":"application/json"}});
const str=(v:unknown)=>typeof v==="string"?v.trim():"";
const n=(v:unknown)=>typeof v==="number"?v:Number(v);
const km=(a:number,b:number,c:number,d:number)=>{const r=6371,x=(c-a)*Math.PI/180,y=(d-b)*Math.PI/180,z=Math.sin(x/2)**2+Math.cos(a*Math.PI/180)*Math.cos(c*Math.PI/180)*Math.sin(y/2)**2;return 2*r*Math.atan2(Math.sqrt(z),Math.sqrt(1-z));};
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 if(req.method!=="POST")return reply({error:"Method not allowed"},405);
 const h=req.headers.get("Authorization");if(!h?.startsWith("Bearer "))return reply({error:"Authentication required"},401);
 const url=Deno.env.get("SUPABASE_URL"),anon=Deno.env.get("SUPABASE_ANON_KEY"),key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!url||!anon||!key)return reply({error:"Supabase configuration missing"},503);
 const caller=createClient(url,anon,{global:{headers:{Authorization:h}}});
 const {data:{user},error:authError}=await caller.auth.getUser();if(authError||!user)return reply({error:"جلسة الدخول غير صالحة"},401);
 const db=createClient(url,key);
 try{
 const b=await req.json(),a=str(b.action);
 const {data:roleRow}=await db.from("profiles").select("role").eq("user_id",user.id).maybeSingle();
 const admin=String(roleRow?.role||"").toLowerCase()==="admin";
 const {data:sv,error:svErr}=await db.from("surveyor_profiles").select("*").eq("user_id",user.id).maybeSingle();if(svErr)throw svErr;
 const getReq=async(id:string)=>{const {data,error}=await db.from("survey_requests").select("*,survey_deliverables(*)").eq("id",id).maybeSingle();if(error)throw error;return data;};
 const notify=async(uid:string,title:string,body:string,type="system")=>{const {error}=await db.from("notifications").insert({user_id:uid,title,body,type,entity_type:"survey_request"});if(error)console.error("notify",error.message);};
 if(a==="available"){
  const date=str(b.date),email=str(b.surveyor_email);if(!date||!email)return reply({available_slots:[]});
  const {data:target,error}=await db.from("surveyor_profiles").select("id,user_id").eq("email",email).maybeSingle();if(error)throw error;if(!target)return reply({available_slots:[]});
  const {data:booked,error:be}=await db.from("consultation_appointments").select("appointment_time,duration_minutes").eq("target_id",target.id).eq("appointment_date",date).neq("status","cancelled");if(be)throw be;
  const allSlots=["09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00"];
  const taken=new Set((booked||[]).map(x=>String(x.appointment_time).slice(0,5)));
  return reply({available_slots:allSlots.filter(x=>!taken.has(x))});
 }
 if(a==="book"){
  const date=str(b.appointment_date),time=str(b.appointment_time),targetId=str(b.target_id);
  if(!date||!time||!targetId)return reply({error:"التاريخ والوقت والمساح مطلوبون"},400);
  if(date<new Date().toISOString().slice(0,10))return reply({error:"لا يمكن حجز موعد في الماضي"},400);
  const {data:target,error:te}=await db.from("surveyor_profiles").select("id,user_id,email,full_name").eq("id",targetId).maybeSingle();if(te)throw te;if(!target||target.email!==str(b.target_email))return reply({error:"المساح غير موجود"},404);
  const {data:busy,error:be}=await db.from("consultation_appointments").select("id").eq("target_id",targetId).eq("appointment_date",date).eq("appointment_time",time).neq("status","cancelled").limit(1);if(be)throw be;if(busy?.length)return reply({error:"هذا الموعد حُجز للتو، اختر وقتاً آخر"},409);
  const {data,error}=await db.from("consultation_appointments").insert({created_by:user.id,client_user_id:user.id,provider_user_id:target.user_id,target_id:target.id,target_name:target.full_name,target_email:target.email,appointment_date:date,appointment_time:time,duration_minutes:Math.max(15,Math.min(240,Math.round(n(b.duration_minutes)||60))),consultation_type:str(b.consultation_type)||"site_visit",appointment_type:"surveyor",topic:str(b.topic)||"موعد رفع مساحي",notes:str(b.notes),location:str(b.location),client_name:str(user.user_metadata?.full_name)||str(user.user_metadata?.name)||user.email,client_email:user.email,status:"confirmed",request_id:str(b.request_id)||null}).select("*").single();if(error)throw error;return reply({success:true,appointment:data});
 }
 if(a==="list_appointments"){
  const role=str(b.role);let q=db.from("consultation_appointments").select("*").eq("appointment_type","surveyor").order("appointment_date",{ascending:true}).order("appointment_time",{ascending:true}).limit(100);
  q=role==="client"?q.eq("client_user_id",user.id):q.eq("provider_user_id",user.id);
  const {data,error}=await q;if(error)throw error;
  return reply({appointments:(data||[]).map(x=>({...x,google_calendar_link:x.calendar_link,target_name:x.target_name,target_email:x.target_email}))});
 }
 if(a==="cancel_appointment"){
  const id=str(b.appointment_id);const {data:appointment,error:findError}=await db.from("consultation_appointments").select("*").eq("id",id).maybeSingle();if(findError)throw findError;if(!appointment)return reply({error:"الموعد غير موجود"},404);
  if(appointment.client_user_id!==user.id&&appointment.provider_user_id!==user.id&&!admin)return reply({error:"غير مصرح لك بإلغاء الموعد"},403);
  if(["completed","cancelled"].includes(appointment.status))return reply({error:"الموعد ملغى أو مكتمل بالفعل"},400);
  const {error}=await db.from("consultation_appointments").update({status:"cancelled",updated_at:new Date().toISOString()}).eq("id",id);if(error)throw error;return reply({success:true});
 }
 if(a==="directory"){
  const {data,error}=await db.from("surveyor_profiles").select("id,full_name,city,bio,license_number,years_experience,rating,status").eq("status","approved").order("rating",{ascending:false}).limit(200);
  if(error)throw error;return reply({surveyors:data||[]});
 }
 if(a==="profile")return reply({profile:sv||null});
 if(a==="register"){
  if(sv)return reply({error:"لديك ملف مساح بالفعل"},409);
  if(!str(b.license_number)||!str(b.city))return reply({error:"رقم الرخصة والمدينة مطلوبان"},400);
  const {data,error}=await db.from("surveyor_profiles").insert({user_id:user.id,email:user.email,full_name:str(b.full_name)||str(user.user_metadata?.full_name),phone:str(b.phone),license_number:str(b.license_number),city:str(b.city),latitude:b.latitude==null?null:n(b.latitude),longitude:b.longitude==null?null:n(b.longitude),geofencing_radius_km:Math.max(1,Math.min(500,Math.round(n(b.geofencing_radius_km)||50))),bio:str(b.bio),years_experience:Math.max(0,Math.round(n(b.years_experience)||0))}).select("*").single();
  if(error)throw error;return reply({success:true,profile_id:data.id});
 }
 if(a==="accept_terms"){
  if(!sv)return reply({error:"ملف المساح غير موجود"},404);
  const {error}=await db.from("surveyor_profiles").update({terms_accepted:true,terms_accepted_date:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("id",sv.id).eq("user_id",user.id);if(error)throw error;return reply({success:true});
 }
 if(a==="dashboard"||a==="list"){
  const role=str(b.role_type);
  const [avail,my,reviews]=await Promise.all([
   db.from("survey_requests").select("*,survey_deliverables(*)").eq("status","broadcasted").order("created_at",{ascending:false}).limit(100),
   db.from("survey_requests").select("*,survey_deliverables(*)").eq(role==="client"?"client_user_id":"surveyor_user_id",user.id).order("created_at",{ascending:false}).limit(100),
   db.from("project_reviews").select("*").eq("reviewee_user_id",user.id).order("created_at",{ascending:false}).limit(30)
  ]);
  if(avail.error)throw avail.error;if(my.error)throw my.error;if(reviews.error)throw reviews.error;
  const radius=n(sv?.geofencing_radius_km)||50,lat=n(sv?.latitude),lon=n(sv?.longitude);
  const available=(avail.data||[]).filter(r=>sv?.status==="approved"&&sv?.is_available&&lat&&lon&&r.latitude!=null&&r.longitude!=null&&km(lat,lon,n(r.latitude),n(r.longitude))<=radius).map(r=>({...r,distance_km:Math.round(km(lat,lon,n(r.latitude),n(r.longitude))*100)/100}));
  if(a==="dashboard")return reply({profile:sv||null,available_requests:available,my_requests:my.data||[],reviews:reviews.data||[]});
  return reply({requests:role==="available"?available:my.data||[]});
 }
 if(a==="create"){
  const lat=n(b.latitude),lon=n(b.longitude),area=n(b.property_area_sqm),status=str(b.property_status)||"vacant_land";
  if(!Number.isFinite(lat)||!Number.isFinite(lon)||!Number.isFinite(area)||area<=0)return reply({error:"الموقع والمساحة مطلوبان"},400);
  const {data:all,error:e}=await db.from("surveyor_profiles").select("id,user_id,full_name,email,latitude,longitude,geofencing_radius_km").eq("status","approved").eq("is_available",true);if(e)throw e;
  const matches=(all||[]).filter(s=>s.latitude!=null&&s.longitude!=null&&km(lat,lon,n(s.latitude),n(s.longitude))<=(n(s.geofencing_radius_km)||50)).map(s=>({surveyor_id:s.id,user_id:s.user_id,name:s.full_name,email:s.email,distance_km:Math.round(km(lat,lon,n(s.latitude),n(s.longitude))*100)/100})).sort((x,y)=>x.distance_km-y.distance_km);
  const total=Math.max(300,Math.min(5000,Math.round(area*(status==="existing_building"?5:3)))),fee=Math.round(total*.15),payout=total-fee;
  const {data:req,error}=await db.rpc("bytly_hold_survey_escrow",{p_client_user_id:user.id,p_client_email:user.email,p_client_name:str(user.user_metadata?.full_name),p_latitude:lat,p_longitude:lon,p_address:str(b.address),p_area:area,p_property_status:status,p_notes:str(b.notes),p_total:total,p_fee:fee,p_payout:payout,p_matches:matches.slice(0,10)});
  if(error){if(error.message?.includes("INSUFFICIENT_BALANCE"))return reply({error:"رصيد غير كافٍ",required:total},400);if(error.message?.includes("WALLET_NOT_FOUND"))return reply({error:"الرجاء تفعيل محفظة العميل أولاً"},400);throw error;}
  for(const m of matches.slice(0,10))await notify(m.user_id,"طلب رفع مساحي جديد قريب منك","طلب جديد على بعد "+m.distance_km+" كم. المستحق "+payout+" ريال.");
  return reply({success:true,request_id:req.id,total_charged:total,payout_amount:payout,platform_fee:fee,matched_count:matches.length});
 }
 if(a==="accept"){
  if(!sv||sv.status!=="approved"||!sv.terms_accepted)return reply({error:"يجب اعتماد ملفك والموافقة على الشروط لقبول الطلبات"},403);
  const {data,error}=await db.from("survey_requests").update({status:"accepted",surveyor_id:sv.id,surveyor_user_id:user.id,surveyor_email:user.email,surveyor_name:sv.full_name,accepted_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("id",str(b.request_id)).in("status",["broadcasted","pending"]).is("surveyor_id",null).select("*").maybeSingle();
  if(error)throw error;if(!data)return reply({error:"تم قبول الطلب من مساح آخر أو لم يعد متاحاً"},409);
  await notify(data.client_user_id,"تم تعيين مساح لطلبك","قبل المساح "+sv.full_name+" طلب الرفع المساحي.");return reply({success:true,request_id:data.id});
 }
 if(a==="submit"){
  if(!sv)return reply({error:"ملف المساح غير موجود"},404);const req=await getReq(str(b.request_id));if(!req)return reply({error:"الطلب غير موجود"},404);
  if(req.surveyor_user_id!==user.id)return reply({error:"غير مصرح لك"},403);if(!["accepted","in_progress"].includes(req.status))return reply({error:"حالة الطلب لا تسمح بالتسليم"},400);
  const cad=Array.isArray(b.cad_files)?b.cad_files:[],visual=Array.isArray(b.visual_files)?b.visual_files:[];if(!cad.length&&!visual.length)return reply({error:"يجب رفع ملف واحد على الأقل"},400);
  const {error}=await db.from("survey_deliverables").insert({request_id:req.id,surveyor_id:sv.id,cad_files:cad,visual_files:visual,survey_metadata:b.survey_metadata||{}});if(error)throw error;
  const {error:up}=await db.from("survey_requests").update({status:"submitted",submitted_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("id",req.id).eq("surveyor_user_id",user.id);if(up)throw up;
  await notify(req.client_user_id,"تم تسليم مخرجات المسح","تم رفع ملفات المسح. يرجى مراجعتها واعتمادها.","review");return reply({success:true,request_id:req.id});
 }
 if(a==="approve"){
  const req=await getReq(str(b.request_id));if(!req)return reply({error:"الطلب غير موجود"},404);if(req.client_user_id!==user.id)return reply({error:"غير مصرح لك"},403);
  const {data,error}=await db.rpc("bytly_release_survey_escrow",{p_request_id:req.id,p_client_user_id:user.id});if(error){if(error.message?.includes("INVALID_REQUEST_STATUS"))return reply({error:"يجب تسليم المخرجات أولاً"},400);throw error;}
  if(req.surveyor_user_id)await notify(req.surveyor_user_id,"تم صرف مستحقاتك","تم اعتماد المخرجات وإضافة "+req.payout_amount+" ريال إلى رصيدك.","payment");return reply({success:true,request_id:req.id,payout_amount:req.payout_amount});
 }
 if(a==="cancel"){
  const {data,error}=await db.rpc("bytly_cancel_survey_escrow",{p_request_id:str(b.request_id),p_client_user_id:user.id});if(error){if(error.message?.includes("CANNOT_CANCEL_AFTER_ACCEPTANCE"))return reply({error:"لا يمكن إلغاء الطلب بعد قبوله من المساح"},400);if(error.message?.includes("FORBIDDEN"))return reply({error:"غير مصرح لك"},403);throw error;}return reply({success:true,request:data});
 }
 if(a==="status"){
  const req=await getReq(str(b.request_id));if(!req)return reply({error:"الطلب غير موجود"},404);if(req.client_user_id!==user.id&&req.surveyor_user_id!==user.id&&!admin)return reply({error:"غير مصرح لك"},403);
  const {data:surveyor}=req.surveyor_id?await db.from("surveyor_profiles").select("*").eq("id",req.surveyor_id).maybeSingle():{data:null};return reply({request:req,deliverables:req.survey_deliverables||[],surveyor});
 }
 if(a==="check_review"){
  const requestId=str(b.request_id);const {data,error}=await db.from("project_reviews").select("id").eq("project_id",requestId).eq("reviewer_user_id",user.id).limit(1);if(error)throw error;return reply({reviewed:!!data?.length});
 }
 if(a==="wallet_history"){
  const {data:wallet,error:wErr}=await db.from("wallet_accounts").select("available_balance,held_balance,currency").eq("user_id",user.id).eq("currency","SAR").maybeSingle();if(wErr)throw wErr;
  const {data:tx,error:tErr}=await db.from("wallet_transactions").select("*").eq("user_id",user.id).order("created_at",{ascending:false}).limit(50);if(tErr)throw tErr;
  return reply({wallet_balance:wallet?.available_balance||0,held_balance:wallet?.held_balance||0,transactions:tx||[]});
 }
 if(a==="review"){
  const req=await getReq(str(b.request_id)),rating=n(b.rating);if(!req)return reply({error:"الطلب غير موجود"},404);if(req.client_user_id!==user.id)return reply({error:"غير مصرح لك"},403);if(req.status!=="disbursed")return reply({error:"لا يمكن التقييم قبل اعتماد المخرجات"},400);if(!Number.isFinite(rating)||rating<1||rating>5)return reply({error:"التقييم يجب أن يكون بين 1 و5"},400);
  const {data:old,error:oldErr}=await db.from("project_reviews").select("id").eq("project_id",req.id).eq("reviewer_user_id",user.id).limit(1);if(oldErr)throw oldErr;if(old?.length)return reply({error:"تم تقييم هذا الطلب مسبقاً"},409);
  const {error}=await db.from("project_reviews").insert({project_id:req.id,reviewer_user_id:user.id,reviewee_user_id:req.surveyor_user_id,rating,quality_rating:Math.max(0,Math.min(5,Math.round(n(b.quality_rating)||0))),delivery_rating:Math.max(0,Math.min(5,Math.round(n(b.delivery_rating)||0))),communication_rating:Math.max(0,Math.min(5,Math.round(n(b.communication_rating)||0))),comment:str(b.comment)});if(error)throw error;
  const {data:rs,error:rsErr}=await db.from("project_reviews").select("rating").eq("reviewee_user_id",req.surveyor_user_id);if(rsErr)throw rsErr;const avg=(rs||[]).reduce((t,x)=>t+n(x.rating),0)/Math.max(1,(rs||[]).length);
  await db.from("surveyor_profiles").update({rating:Math.round(avg*10)/10}).eq("id",req.surveyor_id);await notify(req.surveyor_user_id,"تقييم جديد","حصلت على تقييم "+rating+" من 5.","review");return reply({success:true});
 }
 return reply({error:"إجراء غير صالح"},400);
 }catch(e){console.error("surveyor-engine",e instanceof Error?e.message:String(e));return reply({error:"تعذر تنفيذ طلب الرفع المساحي حالياً. تحقق من ترحيل قاعدة البيانات ثم أعد المحاولة."},500);}
});