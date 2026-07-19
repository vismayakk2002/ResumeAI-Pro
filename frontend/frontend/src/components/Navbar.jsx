import { Link, NavLink, useLocation } from "react-router-dom";
import { useMemo } from "react";
import useAuth from "../hooks/useAuth";
import "../styles/navbar.css";
import "../styles/app.css";

// (No static logo asset required for now)

function Navbar() {
  const location = useLocation();
  const auth = useAuth();

  const navItems = useMemo(
    () => [
      { to: "/dashboard", label: "Dashboard", icon: "📊" },
      { to: "/resume-builder", label: "Create Resume", icon: "✍️" },
      { to: "/upload-resume", label: "Upload Resume", icon: "📁" },
      { to: "/optimize-resume", label: "Optimize Resume", icon: "🤖" },
      { to: "/interview-prep", label: "Interview Prep", icon: "🎯" },
      { to: "/my-resumes", label: "My Resumes", icon: "🗂️" },
      { to: "/profile", label: "Profile", icon: "👤" },
    ],
    []
  );

  const initials = useMemo(() => {
    const n = auth?.user?.name || "";
    const parts = n.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "U";
    const a = parts[0]?.[0] || "U";
    const b = parts[1]?.[0] || "";
    return (a + b).toUpperCase();
  }, [auth?.user?.name]);

  return (
    <nav className="navbar" style={{ position: "sticky", top: 0, zIndex: 100 }}>
      <div className="navbar-left">
        <Link className="logo" to="/dashboard" aria-label="ResumeAI Pro">
          <span style={{ marginRight: 10, color: "var(--primary)" }} aria-hidden>
            <b>●</b>
          </span>
          ResumeAI Pro
        </Link>
      </div>

      <div className="nav-links" aria-label="Primary navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => (isActive || location.pathname === item.to ? "nav-link active" : "nav-link")}
          >
            <span className="nav-icon" aria-hidden>
              {item.icon}
            </span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </div>

      <div className="navbar-right">
        <div className="user-pill" title={auth?.user?.email || "User"}>
          <div className="avatar">{initials}</div>
          <div className="user-meta">
            <div className="user-name">{auth?.user?.name || ""}</div>
            <div className="user-email">{auth?.user?.email || ""}</div>
          </div>
        </div>

        <button className="btn btn-ghost btn-logout" onClick={auth?.logout}>
          <span aria-hidden>🚪</span>
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;

