import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import NotFoundError from './lib/NotFoundError';
import TechnicalResources from './pages/TechnicalResources';
import AdManager from './pages/AdManager';
import AIEngineers from './pages/AIEngineers';
import AIInteriorDesigner from './pages/AIInteriorDesigner';
import AIArchitect from './pages/AIArchitect';
import AIBudgetEstimator from './pages/AIBudgetEstimator';
import AIRenovation from './pages/AIRenovation';
import AIMaterialAdvisor from './pages/AIMaterialAdvisor';
import AIRecommender from './pages/AIRecommender';
import MarketingHub from './pages/MarketingHub';
import LeadsManager from './pages/LeadsManager';
import SocialAnalytics from './pages/SocialAnalytics';
import EngineerFinancialDashboard from './pages/EngineerFinancialDashboard';
import MyContracts from './pages/MyContracts';
import EngineerMatcher from './pages/EngineerMatcher';
import EngineerReviews from './pages/EngineerReviews';
import Certificates from './pages/Certificates';
import RequestQuote from './pages/RequestQuote';
import BuildingProgress from './pages/BuildingProgress';
import CostEstimator from './pages/CostEstimator';
import ConstructionTracker from './pages/ConstructionTracker';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
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
      <Route path="/BuildingProgress" element={<LayoutWrapper currentPageName="BuildingProgress"><BuildingProgress /></LayoutWrapper>} />
      <Route path="/CostEstimator" element={<LayoutWrapper currentPageName="CostEstimator"><CostEstimator /></LayoutWrapper>} />
      <Route path="/ConstructionTracker" element={<LayoutWrapper currentPageName="ConstructionTracker"><ConstructionTracker /></LayoutWrapper>} />
      <Route path="/TechnicalResources" element={<LayoutWrapper currentPageName="TechnicalResources"><TechnicalResources /></LayoutWrapper>} />
      <Route path="/RequestQuote" element={<LayoutWrapper currentPageName="RequestQuote"><RequestQuote /></LayoutWrapper>} />
      <Route path="/EngineerFinancialDashboard" element={<LayoutWrapper currentPageName="EngineerFinancialDashboard"><EngineerFinancialDashboard /></LayoutWrapper>} />
      <Route path="/EngineerReviews" element={<LayoutWrapper currentPageName="EngineerReviews"><EngineerReviews /></LayoutWrapper>} />
      <Route path="/Certificates" element={<LayoutWrapper currentPageName="Certificates"><Certificates /></LayoutWrapper>} />
      <Route path="/MyContracts" element={<LayoutWrapper currentPageName="MyContracts"><MyContracts /></LayoutWrapper>} />
      <Route path="/EngineerMatcher" element={<LayoutWrapper currentPageName="EngineerMatcher"><EngineerMatcher /></LayoutWrapper>} />
      <Route path="/AdManager" element={<LayoutWrapper currentPageName="AdManager"><AdManager /></LayoutWrapper>} />
      <Route path="/AIEngineers" element={<LayoutWrapper currentPageName="AIEngineers"><AIEngineers /></LayoutWrapper>} />
      <Route path="/AIInteriorDesigner" element={<LayoutWrapper currentPageName="AIInteriorDesigner"><AIInteriorDesigner /></LayoutWrapper>} />
      <Route path="/AIArchitect" element={<LayoutWrapper currentPageName="AIArchitect"><AIArchitect /></LayoutWrapper>} />
      <Route path="/AIBudgetEstimator" element={<LayoutWrapper currentPageName="AIBudgetEstimator"><AIBudgetEstimator /></LayoutWrapper>} />
      <Route path="/AIRenovation" element={<LayoutWrapper currentPageName="AIRenovation"><AIRenovation /></LayoutWrapper>} />
      <Route path="/AIMaterialAdvisor" element={<LayoutWrapper currentPageName="AIMaterialAdvisor"><AIMaterialAdvisor /></LayoutWrapper>} />
      <Route path="/AIRecommender" element={<LayoutWrapper currentPageName="AIRecommender"><AIRecommender /></LayoutWrapper>} />
      <Route path="/MarketingHub" element={<LayoutWrapper currentPageName="MarketingHub"><MarketingHub /></LayoutWrapper>} />
      <Route path="/SocialAnalytics" element={<LayoutWrapper currentPageName="SocialAnalytics"><SocialAnalytics /></LayoutWrapper>} />
      <Route path="/LeadsManager" element={<LayoutWrapper currentPageName="LeadsManager"><LeadsManager /></LayoutWrapper>} />
      <Route path="*" element={<NotFoundError />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
         <Router future={{v7_startTransition:true,v7_relativeSplatPath:true}}>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App