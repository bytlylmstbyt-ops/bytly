/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AddEngineer from './pages/AddEngineer';
import AddPortfolio from './pages/AddPortfolio';
import AdminCategories from './pages/AdminCategories';
import AdminClients from './pages/AdminClients';
import AdminEngineers from './pages/AdminEngineers';
import AdminReports from './pages/AdminReports';
import AdminWallet from './pages/AdminWallet';
import AllCertifications from './pages/AllCertifications';
import AllWithdrawalRequests from './pages/AllWithdrawalRequests';
import CRMDashboard from './pages/CRMDashboard';
import CertificationPage from './pages/CertificationPage';
import ClientOnboarding from './pages/ClientOnboarding';
import Complaints from './pages/Complaints';
import ConsultantApproval from './pages/ConsultantApproval';
import ConsultantDashboard from './pages/ConsultantDashboard';
import Contract from './pages/Contract';
import ContractAmendments from './pages/ContractAmendments';
import ContractArchive from './pages/ContractArchive';
import ContractTemplates from './pages/ContractTemplates';
import Copyright from './pages/Copyright';
import CreateProject from './pages/CreateProject';
import Dashboard from './pages/Dashboard';
import EngineerProfile from './pages/EngineerProfile';
import EngineerProjects from './pages/EngineerProjects';
import Engineers from './pages/Engineers';
import Gallery from './pages/Gallery';
import Home from './pages/Home';
import InvoiceManager from './pages/InvoiceManager';
import LegalConsultantProfile from './pages/LegalConsultantProfile';
import Messages from './pages/Messages';
import MyFavorites from './pages/MyFavorites';
import MyPurchasedProjects from './pages/MyPurchasedProjects';
import NotificationSettings from './pages/NotificationSettings';
import Notifications from './pages/Notifications';
import Packages from './pages/Packages';
import Payment from './pages/Payment';
import PaymentSuccess from './pages/PaymentSuccess';
import Privacy from './pages/Privacy';
import ProjectChat from './pages/ProjectChat';
import ProjectDetails from './pages/ProjectDetails';
import ProjectKanban from './pages/ProjectKanban';
import ProjectMilestones from './pages/ProjectMilestones';
import ProjectWorkspace from './pages/ProjectWorkspace';
import Projects from './pages/Projects';
import RegisterChoice from './pages/RegisterChoice';
import RegisterClient from './pages/RegisterClient';
import RegisterConsultant from './pages/RegisterConsultant';
import RegisterEngineer from './pages/RegisterEngineer';
import RegisterLegalConsultant from './pages/RegisterLegalConsultant';
import RegistrationSuccess from './pages/RegistrationSuccess';
import Settings from './pages/Settings';
import Subscription from './pages/Subscription';
import Support from './pages/Support';
import TechnicalReviewPage from './pages/TechnicalReviewPage';
import Terms from './pages/Terms';
import Wallet from './pages/Wallet';
import WorkflowBuilder from './pages/WorkflowBuilder';
import AdminReviews from './pages/AdminReviews';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AddEngineer": AddEngineer,
    "AddPortfolio": AddPortfolio,
    "AdminCategories": AdminCategories,
    "AdminClients": AdminClients,
    "AdminEngineers": AdminEngineers,
    "AdminReports": AdminReports,
    "AdminWallet": AdminWallet,
    "AllCertifications": AllCertifications,
    "AllWithdrawalRequests": AllWithdrawalRequests,
    "CRMDashboard": CRMDashboard,
    "CertificationPage": CertificationPage,
    "ClientOnboarding": ClientOnboarding,
    "Complaints": Complaints,
    "ConsultantApproval": ConsultantApproval,
    "ConsultantDashboard": ConsultantDashboard,
    "Contract": Contract,
    "ContractAmendments": ContractAmendments,
    "ContractArchive": ContractArchive,
    "ContractTemplates": ContractTemplates,
    "Copyright": Copyright,
    "CreateProject": CreateProject,
    "Dashboard": Dashboard,
    "EngineerProfile": EngineerProfile,
    "EngineerProjects": EngineerProjects,
    "Engineers": Engineers,
    "Gallery": Gallery,
    "Home": Home,
    "InvoiceManager": InvoiceManager,
    "LegalConsultantProfile": LegalConsultantProfile,
    "Messages": Messages,
    "MyFavorites": MyFavorites,
    "MyPurchasedProjects": MyPurchasedProjects,
    "NotificationSettings": NotificationSettings,
    "Notifications": Notifications,
    "Packages": Packages,
    "Payment": Payment,
    "PaymentSuccess": PaymentSuccess,
    "Privacy": Privacy,
    "ProjectChat": ProjectChat,
    "ProjectDetails": ProjectDetails,
    "ProjectKanban": ProjectKanban,
    "ProjectMilestones": ProjectMilestones,
    "ProjectWorkspace": ProjectWorkspace,
    "Projects": Projects,
    "RegisterChoice": RegisterChoice,
    "RegisterClient": RegisterClient,
    "RegisterConsultant": RegisterConsultant,
    "RegisterEngineer": RegisterEngineer,
    "RegisterLegalConsultant": RegisterLegalConsultant,
    "RegistrationSuccess": RegistrationSuccess,
    "Settings": Settings,
    "Subscription": Subscription,
    "Support": Support,
    "TechnicalReviewPage": TechnicalReviewPage,
    "Terms": Terms,
    "Wallet": Wallet,
    "WorkflowBuilder": WorkflowBuilder,
    "AdminReviews": AdminReviews,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};