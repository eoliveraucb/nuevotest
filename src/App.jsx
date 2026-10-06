import { Routes, Route } from "react-router-dom";
import AuthProvider from "./context/AuthContext.jsx";
import ContentProvider from "./context/ContentContext.jsx";
import NavBar from "./components/shared/NavBar.jsx";
import Footer from "./components/shared/Footer.jsx";
import HomePage from "./pages/HomePage.jsx";
import TeamPage from "./pages/TeamPage.jsx";
import StudentPage from "./pages/StudentPage.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import ScrollToTop from "./components/shared/ScrollToTop.jsx";

export default function App() {
  return (
    <AuthProvider>
      <ContentProvider>
        <div className="app-shell">
          <ScrollToTop />
          <NavBar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/team/:teamId" element={<TeamPage />} />
            <Route path="/student/:studentId" element={<StudentPage />} />
          </Routes>
          <Footer />
        </div>
      </ContentProvider>
    </AuthProvider>
  );
}