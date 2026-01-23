import Home from './pages/Home';
import RegisterChoice from './pages/RegisterChoice';
import RegisterEngineer from './pages/RegisterEngineer';
import RegisterClient from './pages/RegisterClient';
import RegistrationSuccess from './pages/RegistrationSuccess';
import Engineers from './pages/Engineers';
import EngineerProfile from './pages/EngineerProfile';
import Projects from './pages/Projects';
import Gallery from './pages/Gallery';
import Messages from './pages/Messages';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "RegisterChoice": RegisterChoice,
    "RegisterEngineer": RegisterEngineer,
    "RegisterClient": RegisterClient,
    "RegistrationSuccess": RegistrationSuccess,
    "Engineers": Engineers,
    "EngineerProfile": EngineerProfile,
    "Projects": Projects,
    "Gallery": Gallery,
    "Messages": Messages,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};