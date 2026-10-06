import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import AuthMenu from "./AuthMenu.jsx";

export default function NavBar() {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isHome = location.pathname === "/";

  return (
    <header className={`navbar ${scrolled ? "navbar-scrolled" : ""}`}>
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="navbar-brand-mark">Cambio Labs</span>
          <span className="navbar-brand-sep">×</span>
          <span className="navbar-brand-sub">Prep for Prep</span>
        </Link>
        <nav className="navbar-links">
          {isHome ? (
            <>
              <a href="#onboarding">Onboarding</a>
              <a href="#growth">Growth</a>
              <a href="#teams">Teams</a>
              <a href="#conclusions">Findings</a>
              <AuthMenu />
            </>
          ) : (
            <>
              <Link to="/#teams" className="btn btn-ghost btn-small">
                ← All Teams
              </Link>
              <AuthMenu />
            </>
          )}
        </nav>
      </div>
    </header>
  );
}