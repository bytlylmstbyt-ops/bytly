import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Centralized document.title manager.
 * Ensures every page follows the SEO pattern: "[Page Title] | منصة بيتلي"
 * so <title> is never identical to the in-page <h1> (which stays clean).
 */
const PAGE_TITLES = {
  '/': 'المنظومة الهندسية المتكاملة',
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
};

const SITE_SUFFIX = ' | منصة بيتلي';

export default function RouteTitleManager() {
  const location = useLocation();

  useEffect(() => {
    const base = PAGE_TITLES[location.pathname];
    document.title = base ? `${base}${SITE_SUFFIX}` : 'منصة بيتلي';
  }, [location.pathname]);

  return null;
}