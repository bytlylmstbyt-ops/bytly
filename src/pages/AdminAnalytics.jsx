import React,{useEffect,useMemo,useState}from"react";
import{Card,CardContent,CardHeader,CardTitle}from"@/components/ui/card";
import{Activity,BarChart3,Clock,Globe2,MousePointerClick,RefreshCw,Users,Monitor,Chrome,PlayCircle}from"lucide-react";
import{supabase}from"@/lib/supabaseClient";

const n=v=>new Intl.NumberFormat("ar-SA").format(v||0);
const dur=s=>{s=Math.max(0,Math.floor(s||0));return s<60?`${s} ث`:`${Math.floor(s/60)} د ${s%60} ث`};
const group=(rows,key)=>Object.entries(rows.reduce((a,x)=>{const k=x[key]||"غير محدد";a[k]=(a[k]||0)+1;return a},{})).sort((a,b)=>b[1]-a[1]).slice(0,8);
const Empty=()=> <div className="h-40 flex items-center justify-center text-slate-400">لا توجد بيانات في الفترة المحددة.</div>;

export default function AdminAnalytics(){
 const[sessions,setSessions]=useState([]),[events,setEvents]=useState([]),[loading,setLoading]=useState(true),[range,setRange]=useState(7),[selected,setSelected]=useState(null);
 const load=async()=>{setLoading(true);const since=new Date(Date.now()-range*86400000).toISOString();const[a,b]=await Promise.all([supabase.from("analytics_sessions").select("*").gte("started_at",since).order("started_at",{ascending:false}).limit(2000),supabase.from("analytics_events").select("*").gte("occurred_at",since).order("occurred_at",{ascending:false}).limit(10000)]);if(a.error)console.error(a.error);if(b.error)console.error(b.error);setSessions(a.data||[]);setEvents(b.data||[]);setLoading(false)};
 useEffect(()=>{load()},[range]);
 const stats=useMemo(()=>({sessions:sessions.length,visitors:new Set(sessions.map(x=>x.visitor_id)).size,users:new Set(sessions.filter(x=>x.user_id).map(x=>x.user_id)).size,events:events.length,avg:sessions.length?sessions.reduce((a,x)=>a+(x.duration_seconds||0),0)/sessions.length:0,maxScroll:sessions.length?sessions.reduce((a,x)=>a+(x.max_scroll_percent||0),0)/sessions.length:0}),[sessions,events]);
 const days=useMemo(()=>group(sessions.map(x=>({...x,day:new Date(x.started_at).toLocaleDateString("ar-SA",{month:"2-digit",day:"2-digit"})})),"day").reverse(),[sessions]);
 const pages=useMemo(()=>group(events.filter(x=>x.event_name==="page_view").map(x=>({...x,key:x.page_path})),"key"),[events]);
 const actions=useMemo(()=>group(events.filter(x=>x.event_name!=="page_view").map(x=>({...x,key:x.event_name})),"key"),[events]);
 const sections=useMemo(()=>group(events.filter(x=>x.event_name==="section_view").map(x=>({...x,key:x.section_name||x.metadata?.title})),"key"),[events]);
 const countries=useMemo(()=>group(sessions.map(x=>({...x,key:x.country})),"key"),[sessions]);
 const browsers=useMemo(()=>group(sessions.map(x=>({...x,key:x.browser})),"key"),[sessions]);
 const systems=useMemo(()=>group(sessions.map(x=>({...x,key:x.operating_system})),"key"),[sessions]);
 const devices=useMemo(()=>group(sessions.map(x=>({...x,key:x.device_type})),"key"),[sessions]);
 const loginEvents=useMemo(()=>events.filter(x=>/login|sign_in|تسجيل|دخول/i.test(x.event_name||"")), [events]);
 const replay=useMemo(()=>selected?events.filter(x=>x.session_id===selected.id).sort((a,b)=>new Date(a.occurred_at)-new Date(b.occurred_at)):[],[selected,events]);
 const max=Math.max(...days.map(x=>x[1]),1);
 return <div dir="rtl" className="max-w-7xl mx-auto px-4 py-8 space-y-6">
  <div className="flex items-center justify-between gap-3 flex-wrap"><div><p className="text-xs text-[#C9A66B]">مجلس الإدارة / المستخدمون</p><h1 className="text-2xl font-bold text-[#4A3F35]">تحليلات المستخدمين والجلسات</h1><p className="text-sm text-slate-500 mt-1">بيانات فعلية من Supabase وليست بيانات تجريبية.</p></div><div className="flex gap-2"><select value={range} onChange={e=>setRange(+e.target.value)} className="border rounded-lg px-3 py-2"><option value="1">اليوم</option><option value="7">7 أيام</option><option value="30">30 يوم</option></select><button onClick={load} className="border rounded-lg px-3 py-2"><RefreshCw className="w-4 h-4"/></button></div></div>

  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">{[["الجلسات",stats.sessions,Activity],["الزوار",stats.visitors,Globe2],["المستخدمون",stats.users,Users],["متوسط الجلسة",dur(stats.avg),Clock],["الأحداث",stats.events,MousePointerClick],["متوسط التمرير",Math.round(stats.maxScroll)+"%",Activity]].map(([l,v,I])=><Card key={l}><CardContent className="p-4"><I className="w-4 h-4 text-[#C9A66B]"/><div className="text-xs text-slate-500 mt-2">{l}</div><div className="text-xl font-bold">{typeof v==="number"?n(v):v}</div></CardContent></Card>)}</div>

  <div className="grid lg:grid-cols-2 gap-5">
   <Card><CardHeader><CardTitle className="text-base">حركة الزيارات حسب اليوم</CardTitle></CardHeader><CardContent>{days.length?<div className="h-52 flex items-end gap-2 border-b">{days.map(([d,c])=><div key={d} className="flex-1 h-full flex flex-col justify-end items-center gap-1"><b className="text-[10px]">{c}</b><div className="w-full max-w-10 bg-[#C9A66B] rounded-t" style={{height:`${Math.max(8,c/max*75)}%`}}/><span className="text-[9px] text-slate-400">{d}</span></div>)}</div>:<Empty/>}</CardContent></Card>
   <Card><CardHeader><CardTitle className="text-base">أكثر الصفحات مشاهدة</CardTitle></CardHeader><CardContent className="space-y-3">{pages.length?pages.map(([k,c])=><div key={k} className="flex justify-between border-b py-2 text-sm"><span dir="ltr" className="truncate">{k}</span><b>{n(c)}</b></div>):<Empty/>}</CardContent></Card>
  </div>

  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">{[["الدول",countries,Globe2],["المتصفحات",browsers,Chrome],["أنظمة التشغيل",systems,Monitor],["الأجهزة",devices,Monitor]].map(([title,data,I])=><Card key={title}><CardHeader><CardTitle className="text-base flex gap-2 items-center"><I className="w-4 h-4"/>{title}</CardTitle></CardHeader><CardContent className="space-y-2">{data.length?data.map(([k,c])=><div key={k} className="flex justify-between text-sm"><span>{k}</span><b>{n(c)}</b></div>):<Empty/>}</CardContent></Card>)}</div>

  <div className="grid lg:grid-cols-3 gap-5">
   <Card><CardHeader><CardTitle>الأقسام التي تمت مشاهدتها</CardTitle></CardHeader><CardContent>{sections.length?sections.map(([k,c])=><div key={k} className="flex justify-between border-b py-2 text-sm"><span>{k}</span><b>{n(c)}</b></div>):<Empty/>}</CardContent></Card>
   <Card><CardHeader><CardTitle>الإجراءات والتفاعلات</CardTitle></CardHeader><CardContent>{actions.length?actions.map(([k,c])=><div key={k} className="flex justify-between border-b py-2 text-sm"><span>{k}</span><b>{n(c)}</b></div>):<Empty/>}</CardContent></Card>
   <Card><CardHeader><CardTitle>تسجيل الدخول</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{n(loginEvents.length)}</div><p className="text-sm text-slate-500 mt-2">أحداث مرتبطة بالدخول خلال الفترة.</p></CardContent></Card>
  </div>

  <Card><CardHeader><CardTitle>الجلسات المسجلة — اضغط على جلسة لفتح خط سيرها</CardTitle></CardHeader><CardContent className="p-0 overflow-x-auto">{loading?<div className="p-8 text-center">جارٍ التحميل...</div>:<table className="w-full text-sm"><thead><tr className="border-b bg-slate-50"><th className="p-3 text-right">التاريخ</th><th className="p-3 text-right">المستخدم/الزائر</th><th className="p-3 text-right">الدولة</th><th className="p-3 text-right">المدة</th><th className="p-3 text-right">الجهاز</th><th className="p-3 text-right">النظام</th><th className="p-3 text-right">المتصفح</th><th className="p-3 text-right">التمرير</th><th className="p-3 text-right">فتح</th></tr></thead><tbody>{sessions.map(s=><tr key={s.id} className="border-b hover:bg-slate-50"><td className="p-3 text-xs">{new Date(s.started_at).toLocaleString("ar-SA")}</td><td className="p-3">{s.user_id||`زائر ${String(s.visitor_id).slice(0,8)}`}</td><td className="p-3">{s.country||"—"}</td><td className="p-3">{dur(s.duration_seconds)}</td><td className="p-3">{s.device_type||"—"}</td><td className="p-3">{s.operating_system||"—"}</td><td className="p-3">{s.browser||"—"}</td><td className="p-3">{s.max_scroll_percent||0}%</td><td className="p-3"><button onClick={()=>setSelected(s)} className="inline-flex items-center gap-1 px-3 py-1 rounded-lg border"><PlayCircle className="w-4 h-4"/>استعراض</button></td></tr>)}</tbody></table>}</CardContent></Card>

  {selected&&<Card><CardHeader><CardTitle>استعراض جلسة: {new Date(selected.started_at).toLocaleString("ar-SA")}</CardTitle></CardHeader><CardContent><div className="grid md:grid-cols-4 gap-3 mb-4 text-sm"><div>الدولة: <b>{selected.country}</b></div><div>الجهاز: <b>{selected.device_type}</b></div><div>النظام: <b>{selected.operating_system}</b></div><div>المتصفح: <b>{selected.browser}</b></div></div><div className="space-y-2 max-h-96 overflow-auto">{replay.map((e,i)=><div key={e.id} className="flex gap-3 items-start border rounded-lg p-3"><span className="text-xs text-slate-400">{i+1}</span><div><b>{e.event_name}</b><div className="text-xs text-slate-500">{new Date(e.occurred_at).toLocaleTimeString("ar-SA")} — {e.section_name||e.page_path}</div>{e.metadata?.label&&<div className="text-sm mt-1">العنصر: {e.metadata.label}</div>}{e.metadata?.percent!=null&&<div className="text-sm mt-1">التمرير: {e.metadata.percent}%</div>}</div></div>)}</div><p className="text-xs text-amber-700 mt-4">هذا استعراض زمني فعلي للأحداث. التسجيل المرئي الكامل للـDOM يحتاج Recorder مخصص؛ لم يتم اختلاق فيديو.</p></CardContent></Card>}
 </div>
}