import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
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
import RegistrationAuth from './pages/RegistrationAuth';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import PublicLanding from './pages/PublicLanding';

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

function PageSpinner() { return <div className="fixed inset-0 flex items-center justify-center bg-white/60"><div className="w-8 h-8 border-4 border-slate-200 border-t-[#C9A66B] rounded-full animate-spin" /></div>; }
function PublicHomeRoute() { const { isAuthenticated, isLoadingPublicSettings } = useAuth(); if (isLoadingPublicSettings) return <PageSpinner />; if (isAuthenticated) return <Navigate to="/Home" replace />; return <PublicLanding />; }
const { Pages, Layout } = pagesConfig;
const LayoutWrapper = ({ children, currentPageName }) => Layout ? <Layout currentPageName={currentPageName}>{children}</Layout> : <>{children}</>;
const lazyRoute = (Component, name) => <LayoutWrapper currentPageName={name}><Suspense fallback={<PageSpinner />}><Component /></Suspense></LayoutWrapper>;
const protectedRoute = (Component, name) => <ProtectedRoute><RegistrationGate><LayoutWrapper currentPageName={name}><Suspense fallback={<PageSpinner />}><Component /></Suspense></LayoutWrapper></RegistrationGate></ProtectedRoute>;

const AuthenticatedApp = () => {
  const { isLoadingPublicSettings } = useAuth();
  if (isLoadingPublicSettings) return <PageSpinner />;
  const publicPages = ['ContactUs','Terms','Privacy','Copyright','Complaints','Support','RegisterChoice','RegisterAccount','RegistrationSuccess','About'];
  return <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/register-auth" element={<RegistrationAuth />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/" element={<PublicHomeRoute />} />
    <Route path="/About" element={lazyRoute(About, "About")} />
    <Route path="/RegisterContractor" element={protectedRoute(RegisterContractor, "RegisterContractor")} />
    <Route path="/RegisterSupplier" element={protectedRoute(RegisterSupplier, "RegisterSupplier")} />
    <Route path="/AdvertiseWithUs" element={lazyRoute(AdvertiseWithUs, "AdvertiseWithUs")} />
    <Route path="/landing" element={lazyRoute(React.lazy(() => import('./pages/Landing')), "Landing")} />
    <Route path="/FAQ" element={lazyRoute(React.lazy(() => import('./pages/FAQ')), "FAQ")} />
    <Route path="/Solutions" element={lazyRoute(Solutions, "Solutions")} />
    <Route path="/CaseStudies" element={lazyRoute(CaseStudies, "CaseStudies")} />
    <Route path="/Resources" element={lazyRoute(Resources, "Resources")} />
    <Route path="/audiences/engineering-firms" element={lazyRoute(EngineeringFirmsLanding, "EngineeringFirmsLanding")} />
    <Route path="/audiences/contractors" element={lazyRoute(ContractorsLanding, "ContractorsLanding")} />
    {Object.entries(Pages).map(([name, Component]) => <Route key={name} path={`/${name}`} element={publicPages.includes(name) ? lazyRoute(Component, name) : protectedRoute(Component, name)} />)}
    <Route path="*" element={<NotFoundError />} />
  </Routes>;
};

export default function App() { return <QueryClientProvider client={queryClientInstance}><Router><AuthProvider><NavigationTracker /><RouteTitleManager /><AuthenticatedApp /><Toaster /></AuthProvider></Router></QueryClientProvider>; }
