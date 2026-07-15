import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import NotFoundError from './lib/NotFoundError';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import React, { Suspense } from 'react';

// Auth pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// ── Lazy-loaded explicit routes ──────────────────────────────────────────────
const TechnicalResources       = React.lazy(() => import('./pages/TechnicalResources'));
const AdManager                = React.lazy(() => import('./pages/AdManager'));
const AIEngineers              = React.lazy(() => import('./pages/AIEngineers'));
const AddPortfolio             = React.lazy(() => import('./pages/AddPortfolio'));
const AIInteriorDesigner       = React.lazy(() => import('./pages/AIInteriorDesigner'));
const AIArchitect              = React.lazy(() => import('./pages/AIArchitect'));
const AIBudgetEstimator        = React.lazy(() => import('./pages/AIBudgetEstimator'));
const AIRenovation             = React.lazy(() => import('./pages/AIRenovation'));
const AIMaterialAdvisor        = React.lazy(() => import('./pages/AIMaterialAdvisor'));
const AIRecommender            = React.lazy(() => import('./pages/AIRecommender'));
const MarketingHub             = React.lazy(() => import('./pages/MarketingHub'));
const LeadsManager             = React.lazy(() => import('./pages/LeadsManager'));
const SocialAnalytics          = React.lazy(() => import('./pages/SocialAnalytics'));
const EngineerFinancialDashboard = React.lazy(() => import('./pages/EngineerFinancialDashboard'));
const MyContracts              = React.lazy(() => import('./pages/MyContracts'));
const FinancialReports          = React.lazy(() => import('./pages/FinancialReports'));
const EngineerMatcher          = React.lazy(() => import('./pages/EngineerMatcher'));
const EngineerReviews          = React.lazy(() => import('./pages/EngineerReviews'));
const Certificates             = React.lazy(() => import('./pages/Certificates'));
const RequestQuote             = React.lazy(() => import('./pages/RequestQuote'));
const BuildingProgress         = React.lazy(() => import('./pages/BuildingProgress'));
const PermitApplication        = React.lazy(() => import('./pages/PermitApplication'));
const PermitPaymentSuccess     = React.lazy(() => import('./pages/PermitPaymentSuccess'));
const CostEstimator            = React.lazy(() => import('./pages/CostEstimator'));
const ProjectStages            = React.lazy(() => import('./pages/ProjectStages'));
const ConstructionTracker      = React.lazy(() => import('./pages/ConstructionTracker'));
const RiskDashboard            = React.lazy(() => import('./pages/RiskDashboard'));
const MarketEntities           = React.lazy(() => import('./pages/MarketEntities'));
const AdminMarketEntities      = React.lazy(() => import('./pages/AdminMarketEntities'));
const MarketContracts          = React.lazy(() => import('./pages/MarketContracts'));
const ProjectProposals         = React.lazy(() => import('./pages/ProjectProposals'));
const DataClassification       = React.lazy(() => import('./pages/DataClassification'));
const SurveyClientDashboard    = React.lazy(() => import('./pages/SurveyClientDashboard'));
const SurveyorGigs             = React.lazy(() => import('./pages/SurveyorGigs'));
const SBCProgressDashboard     = React.lazy(() => import('./pages/SBCProgressDashboard'));
const LaunchDashboard          = React.lazy(() => import('./pages/LaunchDashboard'));
const LaunchInvitations        = React.lazy(() => import('./pages/LaunchInvitations'));
const PendingApprovals         = React.lazy(() => import('./pages/PendingApprovals'));
const LaunchPerformanceDashboard = React.lazy(() => import('./pages/LaunchPerformanceDashboard'));
const CommissionManager          = React.lazy(() => import('./pages/CommissionManager'));
const NotificationCenter         = React.lazy(() => import('./pages/NotificationCenter'));
const EngineerCalendar           = React.lazy(() => import('./pages/EngineerCalendar'));
const About                      = React.lazy(() => import('./pages/About'));
const RegisterContractor         = React.lazy(() => import('./pages/RegisterContractor'));
const ContractorDashboard        = React.lazy(() => import('./pages/ContractorDashboard'));
const RegisterSupplier           = React.lazy(() => import('./pages/RegisterSupplier'));
const SupplierDashboard          = React.lazy(() => import('./pages/SupplierDashboard'));
const AdvertiseWithUs            = React.lazy(() => import('./pages/AdvertiseWithUs'));
const AdvertiserPortal           = React.lazy(() => import('./pages/AdvertiserPortal'));

// ── Page-level spinner fallback ───────────────────────────────────────────────
function PageSpinner() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white/60">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-[#C9A66B] rounded-full animate-spin" />
    </div>
  );
}

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

// Helper to create a lazy-wrapped route element
const lazyRoute = (Component, name) => (
  <LayoutWrapper currentPageName={name}>
    <Suspense fallback={<PageSpinner />}>
      <Component />
    </Suspense>
  </LayoutWrapper>
);

const AuthenticatedApp = () => {
  const { isLoadingPublicSettings } = useAuth();

  // Only block on public settings; auth check is handled per-route by ProtectedRoute
  if (isLoadingPublicSettings) {
    return <PageSpinner />;
  }

  const publicPages = [
    'Home',
    'Engineers',
    'EngineerProfile',
    'Gallery',
    'Projects',
    'ConsultingFirms',
    'ContactUs',
    'Terms',
    'Privacy',
    'Copyright',
    'Complaints',
    'Support',
    'RegisterChoice',
    'RegisterEngineer',
    'RegisterClient',
    'RegisterConsultant',
    'RegisterFirm',
    'RegisterLegalConsultant',
    'RegistrationSuccess',
    'About'
  ];

  return (
    <Routes>
      {/* Auth routes — no layout wrapper */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* ── Public explicit lazy routes ─────────────────────────────── */}
      <Route path="/CostEstimator"              element={lazyRoute(CostEstimator, "CostEstimator")} />
      <Route path="/ProjectStages"             element={lazyRoute(ProjectStages, "ProjectStages")} />
      <Route path="/ConstructionTracker"        element={lazyRoute(ConstructionTracker, "ConstructionTracker")} />
      <Route path="/TechnicalResources"         element={lazyRoute(TechnicalResources, "TechnicalResources")} />
      <Route path="/EngineerMatcher"            element={lazyRoute(EngineerMatcher, "EngineerMatcher")} />
      <Route path="/MarketEntities"             element={lazyRoute(MarketEntities, "MarketEntities")} />
      <Route path="/AIEngineers"                element={lazyRoute(AIEngineers, "AIEngineers")} />
      <Route path="/AIInteriorDesigner"         element={lazyRoute(AIInteriorDesigner, "AIInteriorDesigner")} />
      <Route path="/AIArchitect"                element={lazyRoute(AIArchitect, "AIArchitect")} />
      <Route path="/AIBudgetEstimator"          element={lazyRoute(AIBudgetEstimator, "AIBudgetEstimator")} />
      <Route path="/AIRenovation"               element={lazyRoute(AIRenovation, "AIRenovation")} />
      <Route path="/AIMaterialAdvisor"          element={lazyRoute(AIMaterialAdvisor, "AIMaterialAdvisor")} />
      <Route path="/AIRecommender"              element={lazyRoute(AIRecommender, "AIRecommender")} />
      <Route path="/About"                      element={lazyRoute(About, "About")} />
      <Route path="/RegisterContractor"         element={lazyRoute(RegisterContractor, "RegisterContractor")} />
      <Route path="/RegisterSupplier"           element={lazyRoute(RegisterSupplier, "RegisterSupplier")} />
      <Route path="/AdvertiseWithUs"            element={lazyRoute(AdvertiseWithUs, "AdvertiseWithUs")} />
      <Route path="/AdvertiserPortal"           element={lazyRoute(AdvertiserPortal, "AdvertiserPortal")} />

      {/* Public registration-related pages */}
      {Object.entries(Pages)
        .filter(([path]) => publicPages.includes(path))
        .map(([path, Page]) => (
          <Route
            key={path}
            path={`/${path}`}
            element={
              <LayoutWrapper currentPageName={path}>
                <Page />
              </LayoutWrapper>
            }
          />
        ))}

      {/* ── All other routes — protected by auth middleware ─────────── */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        {/* Main page (from pagesConfig) */}
        <Route path="/" element={
          <LayoutWrapper currentPageName={mainPageKey}>
            <MainPage />
          </LayoutWrapper>
        } />

        {/* pagesConfig dynamic routes */}
        {Object.entries(Pages)
          .filter(([path]) => !publicPages.includes(path))
          .map(([path, Page]) => (
            <Route
              key={path}
              path={`/${path}`}
              element={
                <LayoutWrapper currentPageName={path}>
                  <Page />
                </LayoutWrapper>
              }
            />
          ))}

      {/* ── Private explicit lazy routes ──────────────────────────── */}
        <Route path="/BuildingProgress"           element={lazyRoute(BuildingProgress, "BuildingProgress")} />
        <Route path="/PermitApplication"          element={lazyRoute(PermitApplication, "PermitApplication")} />
        <Route path="/PermitPaymentSuccess"       element={lazyRoute(PermitPaymentSuccess, "PermitPaymentSuccess")} />
        <Route path="/RequestQuote"               element={lazyRoute(RequestQuote, "RequestQuote")} />
        <Route path="/EngineerFinancialDashboard" element={lazyRoute(EngineerFinancialDashboard, "EngineerFinancialDashboard")} />
        <Route path="/EngineerReviews"            element={lazyRoute(EngineerReviews, "EngineerReviews")} />
        <Route path="/Certificates"               element={lazyRoute(Certificates, "Certificates")} />
        <Route path="/MyContracts"                element={lazyRoute(MyContracts, "MyContracts")} />
        <Route path="/AdManager"                  element={lazyRoute(AdManager, "AdManager")} />
        <Route path="/MarketingHub"               element={lazyRoute(MarketingHub, "MarketingHub")} />
        <Route path="/SocialAnalytics"            element={lazyRoute(SocialAnalytics, "SocialAnalytics")} />
        <Route path="/LeadsManager"               element={lazyRoute(LeadsManager, "LeadsManager")} />
        <Route path="/RiskDashboard"              element={lazyRoute(RiskDashboard, "RiskDashboard")} />
        <Route path="/AdminMarketEntities"        element={lazyRoute(AdminMarketEntities, "AdminMarketEntities")} />
        <Route path="/MarketContracts"            element={lazyRoute(MarketContracts, "MarketContracts")} />
        <Route path="/ProjectProposals"           element={lazyRoute(ProjectProposals, "ProjectProposals")} />
        <Route path="/DataClassification"         element={lazyRoute(DataClassification, "DataClassification")} />
        <Route path="/SurveyClientDashboard"       element={lazyRoute(SurveyClientDashboard, "SurveyClientDashboard")} />
        <Route path="/SurveyorGigs"                element={lazyRoute(SurveyorGigs, "SurveyorGigs")} />
        <Route path="/SurveyorTerms"              element={lazyRoute(React.lazy(() => import('./pages/SurveyorTerms')), "SurveyorTerms")} />
        <Route path="/ComplianceDashboard"        element={lazyRoute(React.lazy(() => import('./pages/ComplianceDashboard')), "ComplianceDashboard")} />
        <Route path="/BudgetCalculator"           element={lazyRoute(React.lazy(() => import('./pages/BudgetCalculator')), "BudgetCalculator")} />
        <Route path="/PlatformDashboard"          element={lazyRoute(React.lazy(() => import('./pages/PlatformDashboard')), "PlatformDashboard")} />
        <Route path="/ContractManager"           element={lazyRoute(React.lazy(() => import('./pages/ContractManager')), "ContractManager")} />
        <Route path="/FinancialReports"         element={lazyRoute(FinancialReports, "FinancialReports")} />
        <Route path="/Subscription"               element={lazyRoute(React.lazy(() => import('./pages/Subscription')), "Subscription")} />
        <Route path="/SBCProgressDashboard"       element={lazyRoute(SBCProgressDashboard, "SBCProgressDashboard")} />
        <Route path="/LaunchDashboard"            element={lazyRoute(LaunchDashboard, "LaunchDashboard")} />
        <Route path="/LaunchInvitations"           element={lazyRoute(LaunchInvitations, "LaunchInvitations")} />
        <Route path="/PendingApprovals"            element={lazyRoute(PendingApprovals, "PendingApprovals")} />
        <Route path="/LaunchPerformanceDashboard" element={lazyRoute(LaunchPerformanceDashboard, "LaunchPerformanceDashboard")} />
        <Route path="/CommissionManager"           element={lazyRoute(CommissionManager, "CommissionManager")} />
        <Route path="/NotificationCenter"          element={lazyRoute(NotificationCenter, "NotificationCenter")} />
        <Route path="/AddPortfolio"                element={lazyRoute(AddPortfolio, "AddPortfolio")} />
        <Route path="/EngineerCalendar"            element={lazyRoute(EngineerCalendar, "EngineerCalendar")} />
        <Route path="/ContractorDashboard"          element={lazyRoute(ContractorDashboard, "ContractorDashboard")} />
        <Route path="/SupplierDashboard"             element={lazyRoute(SupplierDashboard, "SupplierDashboard")} />
        <Route path="/SentEmailsLog"               element={lazyRoute(React.lazy(() => import('./pages/SentEmailsLog')), "SentEmailsLog")} />
        <Route path="*" element={<NotFoundError />} />
      </Route>
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;