import { Toaster } from "@/components/ui/toaster"
import { Toaster as HotToastToaster } from "react-hot-toast"
import { Toaster as SonnerToaster } from "sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import AnalyticsTracker from '@/lib/AnalyticsTracker'
import RouteTitleManager from '@/lib/RouteTitleManager'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import NotFoundError from './lib/NotFoundError';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import RegistrationGate from '@/components/RegistrationGate';
import React, { Suspense } from 'react';

function lazyWithRetry(factory, retries = 2) {
  return React.lazy(() => factory().catch((err) => {
    if (retries <= 0) throw err;
    return new Promise((resolve) => setTimeout(() => resolve(lazyWithRetry(factory, retries - 1)()), 1200));
  }));
}

import Login from './pages/Login';
import Register from './pages/Register';
import AuthCallback from './pages/AuthCallback';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import PublicLanding from './pages/PublicLanding';
import MCPConsent from './pages/MCPConsent';

const TechnicalResources = React.lazy(() => import('./pages/TechnicalResources'));
const AdManager = React.lazy(() => import('./pages/AdManager'));
const AIEngineers = React.lazy(() => import('./pages/AIEngineers'));
const AddPortfolio = React.lazy(() => import('./pages/AddPortfolio'));
const AIInteriorDesigner = React.lazy(() => import('./pages/AIInteriorDesigner'));
const AIArchitect = React.lazy(() => import('./pages/AIArchitect'));
const AIBudgetEstimator = React.lazy(() => import('./pages/AIBudgetEstimator'));
const AIRenovation = React.lazy(() => import('./pages/AIRenovation'));
const AIMaterialAdvisor = React.lazy(() => import('./pages/AIMaterialAdvisor'));
const AIRecommender = React.lazy(() => import('./pages/AIRecommender'));
const MarketingHub = React.lazy(() => import('./pages/MarketingHub'));
const LeadsManager = React.lazy(() => import('./pages/LeadsManager'));
const SocialAnalytics = React.lazy(() => import('./pages/SocialAnalytics'));
const EngineerFinancialDashboard = React.lazy(() => import('./pages/EngineerFinancialDashboard'));
const MyContracts = React.lazy(() => import('./pages/MyContracts'));
const FinancialReports = React.lazy(() => import('./pages/FinancialReports'));
const EngineerMatcher = React.lazy(() => import('./pages/EngineerMatcher'));
const EngineerReviews = React.lazy(() => import('./pages/EngineerReviews'));
const Certificates = React.lazy(() => import('./pages/Certificates'));
const RequestQuote = React.lazy(() => import('./pages/RequestQuote'));
const BuildingProgress = React.lazy(() => import('./pages/BuildingProgress'));
const PermitApplication = React.lazy(() => import('./pages/PermitApplication'));
const PermitPaymentSuccess = React.lazy(() => import('./pages/PermitPaymentSuccess'));
const CostEstimator = React.lazy(() => import('./pages/CostEstimator'));
const ProjectStages = React.lazy(() => import('./pages/ProjectStages'));
const ConstructionTracker = React.lazy(() => import('./pages/ConstructionTracker'));
const RiskDashboard = React.lazy(() => import('./pages/RiskDashboard'));
const MarketEntities = React.lazy(() => import('./pages/MarketEntities'));
const AdminMarketEntities = React.lazy(() => import('./pages/AdminMarketEntities'));
const MarketContracts = React.lazy(() => import('./pages/MarketContracts'));
const ProjectProposals = React.lazy(() => import('./pages/ProjectProposals'));
const DataClassification = React.lazy(() => import('./pages/DataClassification'));
const SurveyClientDashboard = React.lazy(() => import('./pages/SurveyClientDashboard'));
const SurveyorGigs = React.lazy(() => import('./pages/SurveyorGigs'));
const SBCProgressDashboard = React.lazy(() => import('./pages/SBCProgressDashboard'));
const LaunchDashboard = React.lazy(() => import('./pages/LaunchDashboard'));
const LaunchInvitations = React.lazy(() => import('./pages/LaunchInvitations'));
const PendingApprovals = React.lazy(() => import('./pages/PendingApprovals'));
const LaunchPerformanceDashboard = React.lazy(() => import('./pages/LaunchPerformanceDashboard'));
const CommissionManager = React.lazy(() => import('./pages/CommissionManager'));
const NotificationCenter = React.lazy(() => import('./pages/NotificationCenter'));
const AdminAnalytics = React.lazy(() => import('./pages/AdminAnalytics'));
const EngineerCalendar = React.lazy(() => import('./pages/EngineerCalendar'));
const About = React.lazy(() => import('./pages/About'));
const RegisterContractor = React.lazy(() => import('./pages/RegisterContractor'));
const ContractorDashboard = React.lazy(() => import('./pages/ContractorDashboard'));
const RegisterSupplier = React.lazy(() => import('./pages/RegisterSupplier'));
const SupplierDashboard = React.lazy(() => import('./pages/SupplierDashboard'));
const AdvertiseWithUs = React.lazy(() => import('./pages/AdvertiseWithUs'));
const AdvertiserPortal = React.lazy(() => import('./pages/AdvertiserPortal'));
const ServiceReviews = React.lazy(() => import('./pages/ServiceReviews'));
const CompareProposals = React.lazy(() => import('./pages/CompareProposals'));
const Solutions = React.lazy(() => import('./pages/Solutions'));
const CaseStudies = React.lazy(() => import('./pages/CaseStudies'));
const Resources = React.lazy(() => import('./pages/Resources'));
const ProviderSubscription = React.lazy(() => import('./pages/ProviderSubscription'));
const CreateMeetLink = React.lazy(() => import('./pages/CreateMeetLink'));
const SquareInvoicePayment = React.lazy(() => import('./pages/SquareInvoicePayment'));
const RevenueDashboard = React.lazy(() => import('./pages/RevenueDashboard'));
const ProviderWallet = React.lazy(() => import('./pages/ProviderWallet'));
const EngineeringFirmsLanding = React.lazy(() => import('./pages/audiences/EngineeringFirmsLanding'));
const GithubIssuesDashboard = React.lazy(() => import('./pages/GithubIssuesDashboard'));
const AdminPlatformSettings = React.lazy(() => import('./pages/AdminPlatformSettings'));
const ContractorsLanding = React.lazy(() => import('./pages/audiences/ContractorsLanding'));
const ConsultingTeamsLanding = React.lazy(() => import('./pages/audiences/ConsultingTeamsLanding'));

class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error(`Bytly route failed to render: ${this.props.pageName || "unknown"}`, error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    const pageName = this.props.pageName || "هذه الصفحة";
    return (
      <main dir="rtl" className="min-h-[60vh] flex items-center justify-center p-6 bg-slate-50">
        <section role="alert" className="max-w-lg w-full rounded-2xl border border-amber-200 bg-white p-6 shadow-sm text-right">
          <h1 className="text-xl font-semibold text-slate-900">تعذر تحميل الصفحة</h1>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            حدث خطأ أثناء فتح {pageName}. لم نترك الصفحة على شاشة تحميل مستمرة.
            يمكنك إعادة المحاولة أو العودة للرئيسية.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={() => window.location.reload()} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">
              إعادة المحاولة
            </button>
            <button type="button" onClick={() => { window.location.href = "/"; }} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">
              العودة للرئيسية
            </button>
          </div>
        </section>
      </main>
    );
  }
}

function PageSpinner() {
  const [slow, setSlow] = React.useState(false);
  React.useEffect(() => {
    const timer = window.setTimeout(() => setSlow(true), 15000);
    return () => window.clearTimeout(timer);
  }, []);
  return (
    <div role="status" aria-live="polite" className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 p-6">
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#C9A66B]" />
        <p className="text-sm text-slate-700">{slow ? "تأخر تحميل الصفحة عن المعتاد." : "جارٍ تحميل الصفحة..."}</p>
        {slow && (
          <div className="flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => window.location.reload()} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">
              إعادة المحاولة
            </button>
            <button type="button" onClick={() => { window.location.href = "/"; }} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">
              العودة للرئيسية
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
function PublicHomeRoute() {
  const { isAuthenticated, isLoadingPublicSettings } = useAuth();
  if (isLoadingPublicSettings) return <PageSpinner />;
  if (isAuthenticated) return <Navigate to="/Home" replace />;
  // Returning users who have already created/logged into an account should
  // start from the login form when their session is no longer active.
  try {
    if (localStorage.getItem("bytly_has_account") === "1") return <Navigate to="/login" replace />;
  } catch {}
  return <PublicLanding />;
}
const { Pages, Layout } = pagesConfig;
const LayoutWrapper = ({ children, currentPageName }) => Layout ? <Layout currentPageName={currentPageName}>{children}</Layout> : <>{children}</>;
const lazyRoute = (Component, name) => <RouteErrorBoundary pageName={name}><LayoutWrapper currentPageName={name}><Suspense fallback={<PageSpinner />}><Component /></Suspense></LayoutWrapper></RouteErrorBoundary>;
const protectedRoute = (Component, name) => <RouteErrorBoundary pageName={name}><ProtectedRoute><RegistrationGate><LayoutWrapper currentPageName={name}><Suspense fallback={<PageSpinner />}><Component /></Suspense></LayoutWrapper></RegistrationGate></ProtectedRoute></RouteErrorBoundary>;

function PreviewModeBanner() {
  const [preview, setPreview] = React.useState(() => {
    try { return JSON.parse(window.sessionStorage.getItem("bytly_admin_preview") || "null"); } catch { return null; }
  });
  React.useEffect(() => {
    const sync = () => { try { setPreview(JSON.parse(window.sessionStorage.getItem("bytly_admin_preview") || "null")); } catch { setPreview(null); } };
    window.addEventListener("bytly-preview-change", sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener("bytly-preview-change", sync); window.removeEventListener("storage", sync); };
  }, []);
  if (!preview) return null;
  const endPreview = () => {
    window.sessionStorage.removeItem("bytly_admin_preview");
    setPreview(null);
    window.location.href = "/AdminControlCenter";
  };
  return <div dir="rtl" className="sticky top-0 z-[100] flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#C9A66B] bg-[#2F2945] px-4 py-3 text-white shadow-lg">
    <div><strong>وضع معاينة الواجهة</strong><span className="mr-2 text-sm text-white/80">نوع الحساب: {preview.label} — هذه معاينة للواجهة وليست دخولًا بحساب المستخدم الحقيقي.</span></div>
    <button type="button" onClick={endPreview} className="rounded-lg bg-[#C9A66B] px-4 py-2 text-sm font-bold text-[#211B2C]">إنهاء المعاينة والعودة للأدمن</button>
  </div>;
}

const AuthenticatedApp = () => {
  const { isLoadingPublicSettings } = useAuth();
  if (isLoadingPublicSettings) return <PageSpinner />;
  const publicPages = [
    'ContactUs','Terms','Privacy','Copyright','Complaints','Support','RegisterChoice','RegisterAccount','RegistrationSuccess','About',
    'RegisterClient','RegisterEngineer','RegisterFirm','RegisterLegalConsultant','RegisterConsultant','RegisterContractor','RegisterSupplier'
  ];
  return <Routes>
    <Route path="/" element={<PublicHomeRoute />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/auth/callback" element={<AuthCallback />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/mcp-consent" element={<MCPConsent />} />
    <Route path="/audiences/contractors" element={lazyRoute(ContractorsLanding, "ContractorsLanding")} />
    <Route path="/audiences/engineering-firms" element={lazyRoute(EngineeringFirmsLanding, "EngineeringFirmsLanding")} />
    <Route path="/audiences/consulting-teams" element={lazyRoute(ConsultingTeamsLanding, "ConsultingTeamsLanding")} />
    {Object.entries(Pages).map(([name, Component]) => <Route key={name} path={`/${name}`} element={publicPages.includes(name) ? lazyRoute(Component, name) : protectedRoute(Component, name)} />)}
    <Route path="*" element={<NotFoundError />} />
  </Routes>;
};

export default function App() {
  return <QueryClientProvider client={queryClientInstance}><Router><AuthProvider><PreviewModeBanner /><NavigationTracker /><AnalyticsTracker /><RouteTitleManager /><AuthenticatedApp /><Toaster /><HotToastToaster /><SonnerToaster /></AuthProvider></Router></QueryClientProvider>;
}
