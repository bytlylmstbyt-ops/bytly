import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const PAGE_TITLES = {
  '/': 'الرئيسية',
  '/Home': 'الرئيسية',
  '/Engineers': 'المهندسون',
  '/EngineerProfile': 'ملف المهندس',
  '/Projects': 'المشاريع',
  '/Gallery': 'معرض الأعمال',
  '/About': 'من نحن',
  '/ContactUs': 'تواصل معنا',
  '/Solutions': 'الحلول',
  '/CaseStudies': 'دراسات الحالة',
  '/Resources': 'مركز الموارد',
  '/FAQ': 'الأسئلة الشائعة',
  '/CostEstimator': 'حاسبة التكلفة',
  '/ProjectStages': 'محاكي مراحل المشروع',
  '/ConstructionTracker': 'متتبع التنفيذ',
  '/TechnicalResources': 'الموارد التقنية',
  '/PermitApplication': 'رخصة البناء',
  '/EngineerMatcher': 'إيجاد مهندس',
  '/DesignMarketplace': 'سوق التصاميم',
  '/MarketEntities': 'الكيانات الهندسية',
  '/AIEngineers': 'مساعد بيتلي الذكي',
  '/SurveyClientDashboard': 'خدمات المساح',
  '/SurveyorGigs': 'لوحة المساحين',
  '/ContractorDashboard': 'لوحة المقاولين',
  '/SupplierDashboard': 'لوحة الموردين',
  '/AdvertiseWithUs': 'أعلن معنا',
  '/ConsultingFirms': 'الشركات الاستشارية',
  '/Messages': 'المحادثات',
  '/Dashboard': 'لوحة التحكم',
  '/Wallet': 'المحفظة',
  '/Settings': 'الإعدادات',
  '/MyContracts': 'العقود',
  '/ServiceReviews': 'تقييم الخدمات',
  '/RequestQuote': 'طلب عرض سعر',
  '/RegisterChoice': 'إنشاء حساب',
  '/login': 'تسجيل الدخول',
  '/register': 'إنشاء حساب',
  '/forgot-password': 'استعادة كلمة المرور',
  '/reset-password': 'تعيين كلمة مرور جديدة',
  '/audiences/engineering-firms': 'شركات الهندسة',
  '/audiences/contractors': 'للمقاولين',
  '/audiences/consulting-teams': 'للاستشاريين',
  '/Terms': 'الشروط والأحكام',
  '/Privacy': 'سياسة الخصوصية',
  '/Copyright': 'حقوق الملكية',
  '/Complaints': 'الشكاوى',
  '/Support': 'الدعم الفني',
};

const DESCRIPTIONS = {
  '/': 'منصة بيتلي الهندسية في السعودية تربط أصحاب المشاريع بالمهندسين والاستشاريين ومقدمي الخدمات، وتساعد على طلب الخدمات ومتابعة المشاريع والعقود ومراحل العمل في مكان واحد.',
  '/About': 'تعرّف على بيتلي، المنظومة الهندسية المتكاملة التي تربط أصحاب المشاريع بالمهندسين والاستشاريين ومقدمي الخدمات في السعودية.',
  '/ContactUs': 'تواصل مع فريق بيتلي للاستفسارات والدعم حول الخدمات الهندسية وإدارة المشاريع في السعودية.',
  '/audiences/contractors': 'اكتشف كيف تساعد بيتلي المقاولين على الوصول إلى فرص المشاريع والتواصل مع أصحاب المشاريع في السعودية.',
  '/audiences/engineering-firms': 'منصة بيتلي تساعد المكاتب والشركات الهندسية على عرض خدماتها والتواصل مع أصحاب المشاريع في السعودية.',
  '/audiences/consulting-teams': 'تعرّف على خدمات بيتلي للفرق والاستشاريين الهندسيين وإدارة فرص العمل والمشاريع في السعودية.',
  '/Terms': 'اطلع على الشروط والأحكام المنظمة لاستخدام منصة بيتلي وخدماتها الهندسية.',
  '/Privacy': 'تعرف على سياسة الخصوصية وكيفية تعامل منصة بيتلي مع بيانات المستخدمين.',
  '/Support': 'احصل على الدعم والمساعدة عند استخدام منصة بيتلي وخدماتها.',
  '/Complaints': 'قنوات تقديم الشكاوى ومتابعتها لدى منصة بيتلي.',
};
const SITE_SUFFIX = ' | منصة بيتلي';

function setMeta(name, content, attribute = 'name') {
  let element = document.head.querySelector(`meta[${attribute}="${name}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

export default function RouteTitleManager() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    const base = PAGE_TITLES[path] || 'منصة الخدمات الهندسية';
    const title = path === '/' ? 'بيتلي | منصة الخدمات وإدارة المشاريع الهندسية في السعودية' : `${base}${SITE_SUFFIX}`;
    const description = DESCRIPTIONS[path] || `استخدم منصة بيتلي للوصول إلى ${base} والخدمات الهندسية وإدارة المشاريع في السعودية.`;
    const canonicalUrl = `https://www.mybytly.com${path === '/' ? '/' : path}`;

    document.title = title;
    setMeta('description', description);
    setMeta('robots', /^(\/login|\/register|\/forgot-password|\/reset-password|\/Dashboard|\/Home|\/Wallet|\/Messages|\/Settings|\/AdminControlCenter)/i.test(path) ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');
    setMeta('og:title', title, 'property');
    setMeta('og:description', description, 'property');
    setMeta('og:url', canonicalUrl, 'property');
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalUrl);
  }, [location.pathname]);

  return null;
}
