import React,{useState}from"react";
import{Search,ShieldCheck,ShoppingBag,Smartphone,TrendingUp,AlertTriangle,CheckCircle2,Loader2,ArrowRight}from"lucide-react";
import{supabase}from"@/lib/supabaseClient";

const CATS={};
function scoreLabel(n){return n>=85?"ممتاز":n>=70?"جيد":n>=50?"يحتاج تحسين":"يحتاج تدخل سريع"}

export default function StoreDoctor(){
 const[url,setUrl]=useState("");const[data,setData]=useState(null);const[loading,setLoading]=useState(false);const[error,setError]=useState("");
 async function scan(e){e?.preventDefault();setError("");setData(null);if(!url.trim()){setError("أدخلي رابط متجرك أولًا");return}setLoading(true);
  try{const{data:d,error:err}=await supabase.functions.invoke("store-audit",{body:{url:url.trim()}});if(err)throw err;if(d?.error)throw new Error(d.error);setData(d)}catch(e){setError(e?.message||"تعذر فحص المتجر الآن")}finally{setLoading(false)}
 }
 return <div dir="rtl" className="min-h-screen bg-[#faf9f6] text-slate-900">
  <header className="border-b bg-white/90 backdrop-blur"><div className="mx-auto max-w-6xl px-5 py-5 flex items-center justify-between"><div className="font-black text-2xl tracking-tight">Store Doctor<span className="text-[#b88b45]">.</span></div><div className="text-sm text-slate-500">فحص ذكي للمتاجر الإلكترونية</div></div></header>
  <main className="mx-auto max-w-6xl px-5 py-14">
   <section className="text-center max-w-3xl mx-auto"><div className="inline-flex items-center gap-2 rounded-full bg-[#f1eadf] px-4 py-2 text-sm text-[#805d2d] mb-5"><ShieldCheck size={17}/> فحص أولي مجاني</div><h1 className="text-4xl md:text-6xl font-black leading-tight">اعرف لماذا متجرك قد لا يبيع بما يكفي.</h1><p className="mt-5 text-lg text-slate-600 leading-8">أدخل رابط متجرك، وسنفحص إشارات الثقة وتجربة الشراء والجوال وSEO ونحوّل الملاحظات إلى خطوات إصلاح واضحة.</p>
    <form onSubmit={scan} className="mt-9 flex flex-col sm:flex-row gap-3 bg-white p-3 rounded-2xl shadow-sm border"><input dir="ltr" value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://yourstore.com" className="flex-1 px-4 py-4 outline-none text-left rounded-xl bg-slate-50"/><button disabled={loading} className="px-7 py-4 rounded-xl bg-slate-900 text-white font-bold disabled:opacity-60 flex items-center justify-center gap-2">{loading?<><Loader2 className="animate-spin" size={19}/>جاري الفحص...</>:<>ابدأ فحص متجرك<ArrowRight size={18}/></>}</button></form>
    {error&&<div className="mt-4 text-red-700 bg-red-50 border border-red-100 rounded-xl p-3">{error}</div>}
   </section>
   {!data&&<section className="grid md:grid-cols-4 gap-4 mt-16">{[[ShieldCheck,"الثقة"],[ShoppingBag,"تجربة الشراء"],[Smartphone,"الجوال"],[TrendingUp,"SEO"]].map(([I,t])=><div className="bg-white border rounded-2xl p-6" key={t}><I className="text-[#b88b45]" size={25}/><h3 className="font-bold mt-4">{t}</h3><p className="text-sm text-slate-500 mt-2">نقاط عملية بدل تقرير عام.</p></div>)}</section>}
   {data&&<section className="mt-14"><div className="grid md:grid-cols-3 gap-5"><div className="md:col-span-1 bg-slate-900 text-white rounded-3xl p-8"><div className="text-sm text-slate-300">نتيجة الفحص</div><div className="text-7xl font-black mt-3">{data.score}<span className="text-2xl">/100</span></div><div className="mt-3 text-[#e6c995] font-bold">{scoreLabel(data.score)}</div><div className="mt-6 text-sm text-slate-300">{data.title||data.url}</div></div><div className="md:col-span-2 grid sm:grid-cols-3 gap-4">{[["نجحت",data.passed,"text-emerald-600"],["تحتاج مراجعة",data.failed,"text-amber-600"],["ملاحظات أولوية",data.priority?.length||0,"text-red-600"]].map(([a,b,c])=><div className="bg-white border rounded-2xl p-6" key={a}><div className="text-sm text-slate-500">{a}</div><div className={"text-4xl font-black mt-2 "+c}>{b}</div></div>)}</div></div>
    <div className="mt-7 bg-white border rounded-3xl p-6"><h2 className="text-2xl font-black">أهم ما يحتاج إصلاح</h2><div className="mt-5 space-y-3">{data.priority?.length?data.priority.map((x,i)=><div key={x.key} className="border rounded-2xl p-5 flex gap-4"><div className="mt-1"><AlertTriangle className="text-amber-500"/></div><div><div className="font-bold">{x.title} <span className="text-xs mr-2 rounded-full bg-red-50 text-red-700 px-2 py-1">{x.priority}</span></div><div className="text-sm text-slate-500 mt-2">{x.fix}</div></div></div>):<div className="text-emerald-700 flex items-center gap-2"><CheckCircle2/>لم تظهر ملاحظات أولوية في الفحص الأولي.</div>}</div></div>
    <div className="mt-5 text-xs text-slate-400">{data.note}</div><button onClick={()=>{setData(null);window.scrollTo({top:0,behavior:"smooth"})}} className="mt-5 text-sm font-bold underline">فحص متجر آخر</button>
   </section>}
  </main>
 </div>
}