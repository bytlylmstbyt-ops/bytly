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
import AddPortfolio from './pages/AddPortfolio';
import AdminWallet from './pages/AdminWallet';
import Complaints from './pages/Complaints';
import ConsultantApproval from './pages/ConsultantApproval';
import ConsultantDashboard from './pages/ConsultantDashboard';
import Contract from './pages/Contract';
import Copyright from './pages/Copyright';
import CreateProject from './pages/CreateProject';
import Dashboard from './pages/Dashboard';
import EngineerProfile from './pages/EngineerProfile';
import Engineers from './pages/Engineers';
import Gallery from './pages/Gallery';
import Home from './pages/Home';
import Messages from './pages/Messages';
import MyPurchasedProjects from './pages/MyPurchasedProjects';
import Notifications from './pages/Notifications';
import Packages from './pages/Packages';
import Payment from './pages/Payment';
import Privacy from './pages/Privacy';
import ProjectDetails from './pages/ProjectDetails';
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
import Terms from './pages/Terms';
import Wallet from './pages/Wallet';
import CertificationPage from './pages/CertificationPage';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AddPortfolio": AddPortfolio,
    "AdminWallet": AdminWallet,
    "Complaints": Complaints,
    "ConsultantApproval": ConsultantApproval,
    "ConsultantDashboard": ConsultantDashboard,
    "Contract": Contract,
    "Copyright": Copyright,
    "CreateProject": CreateProject,
    "Dashboard": Dashboard,
    "EngineerProfile": EngineerProfile,
    "Engineers": Engineers,
    "Gallery": Gallery,
    "Home": Home,
    "Messages": Messages,
    "MyPurchasedProjects": MyPurchasedProjects,
    "Notifications": Notifications,
    "Packages": Packages,
    "Payment": Payment,
    "Privacy": Privacy,
    "ProjectDetails": ProjectDetails,
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
    "Terms": Terms,
    "Wallet": Wallet,
    "CertificationPage": CertificationPage,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};