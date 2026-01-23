import Home from './pages/Home';
import RegisterChoice from './pages/RegisterChoice';
import RegisterEngineer from './pages/RegisterEngineer';
import RegisterClient from './pages/RegisterClient';
import RegistrationSuccess from './pages/RegistrationSuccess';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "RegisterChoice": RegisterChoice,
    "RegisterEngineer": RegisterEngineer,
    "RegisterClient": RegisterClient,
    "RegistrationSuccess": RegistrationSuccess,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};