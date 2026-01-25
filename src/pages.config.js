import AddPortfolio from './pages/AddPortfolio';
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
import RegisterEngineer from './pages/RegisterEngineer';
import RegistrationSuccess from './pages/RegistrationSuccess';
import Settings from './pages/Settings';
import Subscription from './pages/Subscription';
import Terms from './pages/Terms';
import Wallet from './pages/Wallet';
import AdminWallet from './pages/AdminWallet';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AddPortfolio": AddPortfolio,
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
    "RegisterEngineer": RegisterEngineer,
    "RegistrationSuccess": RegistrationSuccess,
    "Settings": Settings,
    "Subscription": Subscription,
    "Terms": Terms,
    "Wallet": Wallet,
    "AdminWallet": AdminWallet,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};