import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import NotFoundError from './lib/NotFoundError';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import React, { Suspense } from 'react';

// ── Lazy-loaded explicit routes ──────────────────────────────────────────────
const TechnicalResources       = React.lazy(() => import('./pages/TechnicalResources'));
const AdManager                = React.lazy(() => import('./pages/AdManager'));
const AIEngineers              = React.lazy(() => import('./pages/AIEngineers'));
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
const EngineerMatcher          = React.lazy(() => import('./pages/EngineerMatcher'));
const EngineerReviews          = React.lazy(() => import('./pages/EngineerReviews'));
const Certificates             = React.lazy(() => import('./pages/Certificates'));
const RequestQuote             = React.lazy(() => import('./pages/RequestQuote'));
const BuildingProgress         = React.lazy(() => import('./pages/BuildingProgress'));
const PermitApplication        = React.lazy(() => import('./pages/PermitApplication'));
const PermitPaymentSuccess     = React.lazy(() => import('./pages/PermitPaymentSuccess'));
const CostEstimator            = React.lazy(() => import('./pages/CostEstimator'));
const ConstructionTracker      = React.lazy(() => import('./pages/ConstructionTracker'));
const RiskDashboard            = React.lazy(() => import('./pages/RiskDashboard'));
const MarketEntities           = React.lazy(() => import('./pages/MarketEntities'));

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
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return <PageSpinner />;
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      {/* Main page (from pagesConfig) */}
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />

      {/* pagesConfig dynamic routes */}
      {Object.entries(Pages).map(([path, Page]) => (
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

      {/* Explicit lazy routes */}
      <Route path="/BuildingProgress"           element={lazyRoute(BuildingProgress, "BuildingProgress")} />
      <Route path="/PermitApplication"          element={lazyRoute(PermitApplication, "PermitApplication")} />
      <Route path="/PermitPaymentSuccess"       element={lazyRoute(PermitPaymentSuccess, "PermitPaymentSuccess")} />
      <Route path="/CostEstimator"              element={lazyRoute(CostEstimator, "CostEstimator")} />
      <Route path="/ConstructionTracker"        element={lazyRoute(ConstructionTracker, "ConstructionTracker")} />
      <Route path="/TechnicalResources"         element={lazyRoute(TechnicalResources, "TechnicalResources")} />
      <Route path="/RequestQuote"               element={lazyRoute(RequestQuote, "RequestQuote")} />
      <Route path="/EngineerFinancialDashboard" element={lazyRoute(EngineerFinancialDashboard, "EngineerFinancialDashboard")} />
      <Route path="/EngineerReviews"            element={lazyRoute(EngineerReviews, "EngineerReviews")} />
      <Route path="/Certificates"               element={lazyRoute(Certificates, "Certificates")} />
      <Route path="/MyContracts"                element={lazyRoute(MyContracts, "MyContracts")} />
      <Route path="/EngineerMatcher"            element={lazyRoute(EngineerMatcher, "EngineerMatcher")} />
      <Route path="/AdManager"                  element={lazyRoute(AdManager, "AdManager")} />
      <Route path="/AIEngineers"                element={lazyRoute(AIEngineers, "AIEngineers")} />
      <Route path="/AIInteriorDesigner"         element={lazyRoute(AIInteriorDesigner, "AIInteriorDesigner")} />
      <Route path="/AIArchitect"                element={lazyRoute(AIArchitect, "AIArchitect")} />
      <Route path="/AIBudgetEstimator"          element={lazyRoute(AIBudgetEstimator, "AIBudgetEstimator")} />
      <Route path="/AIRenovation"               element={lazyRoute(AIRenovation, "AIRenovation")} />
      <Route path="/AIMaterialAdvisor"          element={lazyRoute(AIMaterialAdvisor, "AIMaterialAdvisor")} />
      <Route path="/AIRecommender"              element={lazyRoute(AIRecommender, "AIRecommender")} />
      <Route path="/MarketingHub"               element={lazyRoute(MarketingHub, "MarketingHub")} />
      <Route path="/SocialAnalytics"            element={lazyRoute(SocialAnalytics, "SocialAnalytics")} />
      <Route path="/LeadsManager"               element={lazyRoute(LeadsManager, "LeadsManager")} />
      <Route path="/RiskDashboard"              element={lazyRoute(RiskDashboard, "RiskDashboard")} />
      <Route path="/MarketEntities"             element={lazyRoute(MarketEntities, "MarketEntities")} />

      <Route path="*" element={<NotFoundError />} />
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