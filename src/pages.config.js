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
import AdminDisputeManage from './pages/AdminDisputeManage';
import AdminDisputes from './pages/AdminDisputes';
import AdminEngineers from './pages/AdminEngineers';
import AdminReports from './pages/AdminReports';
import AdminReviews from './pages/AdminReviews';
import AdminWallet from './pages/AdminWallet';
import AllCertifications from './pages/AllCertifications';
import AllWithdrawalRequests from './pages/AllWithdrawalRequests';
import Analytics from './pages/Analytics';
import CRMDashboard from './pages/CRMDashboard';
import CertificationPage from './pages/CertificationPage';
import ClientDashboard from './pages/ClientDashboard';
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
import DisputeDetails from './pages/DisputeDetails';
import EngineerDashboard from './pages/EngineerDashboard';
import EngineerProfile from './pages/EngineerProfile';
import EngineerProjects from './pages/EngineerProjects';
import Engineers from './pages/Engineers';
import FileDispute from './pages/FileDispute';
import FirmDashboard from './pages/FirmDashboard';
import FirmMilestoneControl from './pages/FirmMilestoneControl';
import Gallery from './pages/Gallery';
import Home from './pages/Home';
import InvoiceManager from './pages/InvoiceManager';
import LegalConsultantProfile from './pages/LegalConsultantProfile';
import Messages from './pages/Messages';
import MyDisputes from './pages/MyDisputes';
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
import ProjectTools from './pages/ProjectTools';
import ProjectWorkspace from './pages/ProjectWorkspace';
import Projects from './pages/Projects';
import RegisterChoice from './pages/RegisterChoice';
import RegisterClient from './pages/RegisterClient';
import RegisterConsultant from './pages/RegisterConsultant';
import RegisterEngineer from './pages/RegisterEngineer';
import RegisterFirm from './pages/RegisterFirm';
import RegisterLegalConsultant from './pages/RegisterLegalConsultant';
import RegistrationSuccess from './pages/RegistrationSuccess';
import RoleManagement from './pages/RoleManagement';
import Settings from './pages/Settings';
import Subscription from './pages/Subscription';
import Support from './pages/Support';
import TechnicalReviewPage from './pages/TechnicalReviewPage';
import Terms from './pages/Terms';
import UserRoleAssignment from './pages/UserRoleAssignment';
import Wallet from './pages/Wallet';
import WorkflowBuilder from './pages/WorkflowBuilder';
import NotificationCenter from './pages/NotificationCenter';
import FirmProfile from './pages/FirmProfile';
import FirmSettings from './pages/FirmSettings';
import ClientProfile from './pages/ClientProfile';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AddEngineer": AddEngineer,
    "AddPortfolio": AddPortfolio,
    "AdminCategories": AdminCategories,
    "AdminClients": AdminClients,
    "AdminDisputeManage": AdminDisputeManage,
    "AdminDisputes": AdminDisputes,
    "AdminEngineers": AdminEngineers,
    "AdminReports": AdminReports,
    "AdminReviews": AdminReviews,
    "AdminWallet": AdminWallet,
    "AllCertifications": AllCertifications,
    "AllWithdrawalRequests": AllWithdrawalRequests,
    "Analytics": Analytics,
    "CRMDashboard": CRMDashboard,
    "CertificationPage": CertificationPage,
    "ClientDashboard": ClientDashboard,
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
    "DisputeDetails": DisputeDetails,
    "EngineerDashboard": EngineerDashboard,
    "EngineerProfile": EngineerProfile,
    "EngineerProjects": EngineerProjects,
    "Engineers": Engineers,
    "FileDispute": FileDispute,
    "FirmDashboard": FirmDashboard,
    "FirmMilestoneControl": FirmMilestoneControl,
    "Gallery": Gallery,
    "Home": Home,
    "InvoiceManager": InvoiceManager,
    "LegalConsultantProfile": LegalConsultantProfile,
    "Messages": Messages,
    "MyDisputes": MyDisputes,
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
    "ProjectTools": ProjectTools,
    "ProjectWorkspace": ProjectWorkspace,
    "Projects": Projects,
    "RegisterChoice": RegisterChoice,
    "RegisterClient": RegisterClient,
    "RegisterConsultant": RegisterConsultant,
    "RegisterEngineer": RegisterEngineer,
    "RegisterFirm": RegisterFirm,
    "RegisterLegalConsultant": RegisterLegalConsultant,
    "RegistrationSuccess": RegistrationSuccess,
    "RoleManagement": RoleManagement,
    "Settings": Settings,
    "Subscription": Subscription,
    "Support": Support,
    "TechnicalReviewPage": TechnicalReviewPage,
    "Terms": Terms,
    "UserRoleAssignment": UserRoleAssignment,
    "Wallet": Wallet,
    "WorkflowBuilder": WorkflowBuilder,
    "NotificationCenter": NotificationCenter,
    "FirmProfile": FirmProfile,
    "FirmSettings": FirmSettings,
    "ClientProfile": ClientProfile,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};