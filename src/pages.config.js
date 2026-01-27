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
import Notifications from './pages/Notifications';
import Packages from './pages/Packages';
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
import Payment from './pages/Payment';
import MyPurchasedProjects from './pages/MyPurchasedProjects';
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
    "Notifications": Notifications,
    "Packages": Packages,
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
    "Payment": Payment,
    "MyPurchasedProjects": MyPurchasedProjects,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};