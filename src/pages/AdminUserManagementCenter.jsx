import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HardHat, Building2, UserRound, Star, Handshake, ShieldCheck, ClipboardCheck, UserCog } from "lucide-react";
import { createPageUrl } from "@/utils";

const sections=[
 {title:"إدارة المهندسين",desc:"المهندسون والملفات المهنية والاعتمادات",icon:HardHat,page:"AdminEngineers"},
 {title:"إدارة العملاء",desc:"حسابات العملاء وبياناتهم واحتياجاتهم",icon:UserRound,page:"AdminClients"},
 {title:"الشركات ومقدمو الخدمة",desc:"الشركات والمقاولون والاستشاريون والموردون",icon:Building2,page:"AdminProviders"},
 {title:"تقييمات العملاء",desc:"مراجعة تقييمات العملاء وملاحظاتهم",icon:Star,page:"AdminReviews"},
 {title:"علاقات العملاء CRM",desc:"متابعة العلاقات والتواصل وحالات العملاء",icon:Handshake,page:"AdminClients"},
 {title:"طلبات التسجيل والموافقات",desc:"مراجعة الطلبات والموافقات المعلقة",icon:ClipboardCheck,page:"PendingApprovals"},
 {title:"الأدوار والصلاحيات",desc:"إدارة أدوار المستخدمين وتعيين الصلاحيات",icon:ShieldCheck,page:"RoleManagement"},
 {title:"تعيين الأدوار للمستخدمين",desc:"تحديد الدور المناسب لكل موظف إداري",icon:UserCog,page:"UserRoleAssignment"},
];
export default function AdminUserManagementCenter(){return <div className="max-w-7xl mx-auto px-4 py-8" dir="rtl"><div className="mb-7"><p className="text-xs text-[#C9A66B] font-medium">مجلس الإدارة / الإدارة التنفيذية</p><h1 className="text-2xl font-bold text-[#4A3F35] mt-1">إدارة المستخدمين</h1><p className="text-sm text-slate-500 mt-1">مركز موحد لكل ما يتعلق بالمستخدمين والعملاء ومقدمي الخدمة والأدوار.</p></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{sections.map(({title,desc,icon:Icon,page})=><Link key={title} to={createPageUrl(page)}><Card className="h-full hover:shadow-md transition-shadow"><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base text-[#4A3F35]"><Icon className="w-5 h-5 text-[#C9A66B]"/>{title}</CardTitle></CardHeader><CardContent><p className="text-sm text-slate-500">{desc}</p></CardContent></Card></Link>)}</div></div>}
