import React,{useEffect,useState} from "react";
import {useNavigate,useSearchParams} from "react-router-dom";
import {supabase} from "@/lib/supabaseClient";
import {Card,CardContent,CardHeader,CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {Textarea} from "@/components/ui/textarea";
import {Award,Download,Star,CheckCircle,FileText,Home,User,Loader2,Shield,Stamp} from "lucide-react";
import {motion} from "framer-motion";
import {jsPDF} from "jspdf";
import html2canvas from "html2canvas";

export default function CertificationPage(){
 const navigate=useNavigate(),[params]=useSearchParams(),projectId=params.get("id");
 const [loading,setLoading]=useState(true),[submitting,setSubmitting]=useState(false),[downloading,setDownloading]=useState(false);
 const [project,setProject]=useState(null),[engineer,setEngineer]=useState(null),[client,setClient]=useState(null),[consultant,setConsultant]=useState(null),[technicalReview,setTechnicalReview]=useState(null);
 const [ratings,setRatings]=useState({engineerRating:0,consultantRating:0,comment:""});
 useEffect(()=>{loadData()},[projectId]);
 const loadData=async()=>{
  try{
   const {data:{user}}=await supabase.auth.getUser(); if(!user) throw new Error("AUTH");
   const {data:p,error:pe}=await supabase.from("projects").select("*").eq("id",projectId).maybeSingle(); if(pe)throw pe;if(!p)throw new Error("NOT_FOUND");
   setProject(p);
   const engineerResult = p.assigned_engineer_id ? await supabase.from("engineers").select("*").eq("id",p.assigned_engineer_id).maybeSingle() : {data:null,error:null};
   const clientResult = p.client_id ? await supabase.from("clients").select("*").eq("id",p.client_id).maybeSingle() : {data:null,error:null};
   const reviewResult = await supabase.from("technical_reviews").select("*").eq("project_id",projectId).order("created_at",{ascending:false}).limit(1).maybeSingle();
   if (engineerResult.error) console.warn("Certification engineer lookup failed:", engineerResult.error);
   if (clientResult.error) console.warn("Certification client lookup failed:", clientResult.error);
   if (reviewResult.error) console.warn("Certification technical review lookup failed:", reviewResult.error);
   setEngineer(engineerResult.data || null); setClient(clientResult.data || null); setTechnicalReview(reviewResult.data || null);
   if(p.technical_consultant_id){
    const {data:x,error:consultantError}=await supabase.from("consultants").select("*").eq("id",p.technical_consultant_id).maybeSingle();
    if(consultantError) console.warn("Certification consultant lookup failed:", consultantError);
    setConsultant(x || null);
   }
   const {data:adminProfile,error:adminProfileError}=await supabase.from("profiles").select("role").eq("user_id",user.id).maybeSingle();
   if(adminProfileError) console.warn("Certification admin profile lookup failed:",adminProfileError);
   const isAdmin=adminProfile?.role==="admin" || user.email?.toLowerCase()==="bytlylmstbyt@gmail.com";
   if(!isAdmin && !["technical_approved","pending_client_approval","completed"].includes(p.status)) throw new Error("NOT_APPROVED");
  }catch(err){console.error(err);alert(err.message==="NOT_APPROVED"?"المشروع لم يتم اعتماده بعد":"حدث خطأ في تحميل البيانات");navigate(-1)}
  finally{setLoading(false)}
 };
 const pdf=async()=>{
  setDownloading(true);
  try{
   const safe=(projectId||"BYTLY").slice(0,8).toUpperCase(),d=new Date();
   const el=document.createElement("div");el.dir="rtl";el.style.cssText='position:fixed;left:-10000px;top:0;width:800px;background:#FBF8F3;padding:45px;font-family:Tahoma,Arial,sans-serif;color:#1a1a2e;box-sizing:border-box;border:5px solid #C9A66B';
   el.innerHTML='<div style="border:1px solid #C9A66B;padding:35px;text-align:center"><div style="font-size:22px;font-weight:bold;color:#4A3F35">BYTLY | بيتلي</div><h1 style="color:#4A3F35">شهادة اعتماد ومطابقة الجودة</h1><p>رقم الشهادة: CERT-'+safe+'</p><hr style="border:1px solid #C9A66B"><h3>تفاصيل المشروع</h3><p>اسم المشروع: '+(project?.title||"—")+'</p><p>العميل: '+(client?.full_name||"—")+'</p><p>المهندس: '+(engineer?.full_name||"—")+'</p><p>المستشار الفني: '+(consultant?.full_name||"—")+'</p><h3>تقرير المطابقة</h3><p>'+(technicalReview?.saudi_code_compliance||"تمت مراجعة المشروع فنياً.")+'</p><p>'+(technicalReview?.implementation_recommendations||"—")+'</p><div style="margin-top:45px;border-top:1px solid #C9A66B;padding-top:15px">ختم إلكتروني — بيتلي<br>'+d.toLocaleDateString("ar-SA")+'</div></div>';
   document.body.appendChild(el);const canvas=await html2canvas(el,{scale:2,backgroundColor:"#fff",useCORS:true});el.remove();
   const doc=new jsPDF({orientation:"portrait",unit:"mm",format:"a4"}),img=canvas.toDataURL("image/jpeg",.95),ratio=canvas.width/canvas.height,w=210,h=210/ratio;doc.addImage(img,"JPEG",0,(297-h)/2,w,h);doc.save("شهادة_جودة_"+safe+".pdf");
  }catch(e){console.error(e);alert("حدث خطأ أثناء إنشاء الشهادة")}finally{setDownloading(false)}
 };
 const submit=async()=>{
  if(!ratings.engineerRating||!ratings.consultantRating){alert("يرجى إكمال تقييم المصمم والمستشار الفني");return}
  setSubmitting(true);
  try{
   const {data,error}=await supabase.rpc("complete_project_certification",{p_project_id:projectId,p_engineer_rating:ratings.engineerRating,p_consultant_rating:ratings.consultantRating,p_comment:ratings.comment||""});
   if(error)throw error;
   alert("شكراً لك! تم إتمام المشروع وتحرير المستحقات بنجاح.");
   navigate("/");
  }catch(e){console.error(e);alert(e.message==="PROJECT_ALREADY_COMPLETED"?"هذا المشروع تم إتمامه وتسوية مستحقاته مسبقاً.":"حدث خطأ أثناء إتمام المشروع: "+(e.message||"غير معروف"))}
  finally{setSubmitting(false)}
 };
 if(loading)return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-[#C9A66B]"/></div>;
 return <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-green-50/30 py-8 px-4" dir="rtl"><div className="max-w-5xl mx-auto space-y-6">
  <motion.div initial={{opacity:0}} animate={{opacity:1}} className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl p-8 text-white shadow-2xl border-4 border-[#C9A66B] text-center">
   <Home className="w-12 h-12 mx-auto text-[#C9A66B]"/><h1 className="text-4xl font-bold mt-3">شهادة اعتماد فني</h1><p className="text-xl text-[#C9A66B]">منصة بيتلي للخدمات والاستشارات الهندسية</p>
   <div className="grid md:grid-cols-3 gap-4 mt-6"><div className="bg-white/10 rounded-lg p-4"><User className="mx-auto text-[#C9A66B]"/><small>العميل</small><b className="block">{client?.full_name||"—"}</b></div><div className="bg-white/10 rounded-lg p-4"><Award className="mx-auto text-[#C9A66B]"/><small>المهندس</small><b className="block">{engineer?.full_name||"—"}</b></div><div className="bg-white/10 rounded-lg p-4"><Shield className="mx-auto text-[#C9A66B]"/><small>المستشار</small><b className="block">{consultant?.full_name||"—"}</b></div></div>
   <div className="mt-5 bg-green-500/20 border border-green-400 rounded-lg p-3"><b>مشروع: {project?.title}</b><div className="text-sm text-green-300">معتمد / جاهز للإتمام</div></div>
  </motion.div>
  <Card><CardHeader><CardTitle className="flex items-center gap-2"><Stamp className="text-[#C9A66B]"/>تقرير المطابقة الهندسية</CardTitle></CardHeader><CardContent>{technicalReview?<div className="space-y-4 bg-slate-50 rounded-lg p-4"><Badge className={technicalReview.compliance_status==="compliant"?"bg-green-100 text-green-800":"bg-amber-100 text-amber-800"}>{technicalReview.compliance_status==="compliant"?"✓ مطابق للمواصفات":"✓ مطابق مع ملاحظات"}</Badge><div><b>الكود السعودي والمعايير الوطنية:</b><p>{technicalReview.saudi_code_compliance||"—"}</p></div><div className="border-t pt-3"><b>توصيات التنفيذ:</b><p>{technicalReview.implementation_recommendations||"—"}</p></div>{technicalReview.quality_assessment&&<div className="border-t pt-3"><b>تقييم الجودة:</b><p>{technicalReview.quality_assessment}</p></div>}{technicalReview.technical_notes&&<div className="border-t pt-3"><b>ملاحظات فنية:</b><p>{technicalReview.technical_notes}</p></div>}</div>:<p className="text-center text-slate-500">لا يوجد تقرير مطابقة متاح</p>}</CardContent></Card>
  <div className="grid md:grid-cols-2 gap-4"><Card><CardContent className="pt-6 text-center"><FileText className="w-12 h-12 mx-auto text-blue-600"/><h3 className="font-bold">المخططات النهائية</h3>{(project?.final_deliverable_url||technicalReview?.report_file)?<Button asChild className="w-full bg-blue-600"><a href={project.final_deliverable_url||technicalReview.report_file} target="_blank" rel="noreferrer"><Download className="ml-2"/>تحميل الآن</a></Button>:<p className="text-sm text-slate-500">لا يوجد ملف متاح</p>}</CardContent></Card><Card><CardContent className="pt-6 text-center"><Award className="w-12 h-12 mx-auto text-green-600"/><h3 className="font-bold">شهادة الجودة</h3><Button onClick={pdf} disabled={downloading} className="w-full bg-green-600">{downloading?<Loader2 className="animate-spin ml-2"/>:<Download className="ml-2"/>}{downloading?"جاري التجهيز...":"تحميل الشهادة"}</Button></CardContent></Card></div>
  {!project?.client_final_approval&&<Card><CardHeader><CardTitle className="flex items-center gap-2"><Star className="text-yellow-500"/>تقييم المشروع وإتمامه</CardTitle></CardHeader><CardContent className="space-y-6"><div><b>تقييم المصمم: {engineer?.full_name}</b><div className="flex gap-2 justify-center mt-3">{[1,2,3,4,5].map(n=><button key={n} onClick={()=>setRatings(r=>({...r,engineerRating:n}))}><Star className={n<=ratings.engineerRating?"w-10 h-10 fill-yellow-400 text-yellow-400":"w-10 h-10 text-slate-300"}/></button>)}</div></div><div className="border-t pt-4"><b>تقييم المستشار الفني: {consultant?.full_name||"المستشار"}</b><div className="flex gap-2 justify-center mt-3">{[1,2,3,4,5].map(n=><button key={n} onClick={()=>setRatings(r=>({...r,consultantRating:n}))}><Star className={n<=ratings.consultantRating?"w-10 h-10 fill-yellow-400 text-yellow-400":"w-10 h-10 text-slate-300"}/></button>)}</div></div><Textarea value={ratings.comment} onChange={e=>setRatings(r=>({...r,comment:e.target.value}))} placeholder="تعليق (اختياري)" rows={4}/><Button onClick={submit} disabled={submitting} className="w-full bg-green-600 py-6 text-lg">{submitting?<><Loader2 className="animate-spin ml-2"/>جاري الإتمام...</>:<><CheckCircle className="ml-2"/>إرسال التقييم وإتمام المشروع</>}</Button></CardContent></Card>}
 </div></div>
}