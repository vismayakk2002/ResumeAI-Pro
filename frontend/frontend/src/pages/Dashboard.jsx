import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api";
import "../styles/dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    total: 0,
    latest: null,
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const res = await api.get("/resumes");
      const resumes = res.data || [];

      setStats({
        total: resumes.length,
        latest: resumes[0] || null,
      });
    } catch (err) {
      console.log(err);
    }
  }

  const actions = [
    {
      icon: "📝",
      title: "Create Resume",
      desc: "Build a professional ATS-friendly resume.",
      path: "/resume-builder",
      color: "#2563eb",
    },
    {
      icon: "📤",
      title: "Upload Resume",
      desc: "Upload an existing PDF or DOCX resume.",
      path: "/upload-resume",
      color: "#7c3aed",
    },
    {
      icon: "🤖",
      title: "Optimize Resume",
      desc: "Improve ATS score using AI.",
      path: "/optimize-resume",
      color: "#059669",
    },
    {
      icon: "📂",
      title: "My Resumes",
      desc: "View, edit and manage resumes.",
      path: "/my-resumes",
      color: "#ea580c",
    },
    {
      icon: "👤",
      title: "Profile",
      desc: "Manage account information.",
      path: "/profile",
      color: "#dc2626",
    },
  ];

  return (
    <>
      <Navbar />

      <div className="dashboard">

        <div className="hero">

          <div>

            <h1>Welcome to ResumeAI Pro 👋</h1>

            <p>
              Create professional resumes, optimize them for ATS,
              upload existing resumes and manage everything in one place.
            </p>

            <button
              className="hero-btn"
              onClick={() => navigate("/resume-builder")}
            >
              Create Resume
            </button>

          </div>

          <div className="hero-image">

            <div className="circle"></div>

          </div>

        </div>

        <div className="stats">

          <div className="stat-card">

            <h3>{stats.total}</h3>

            <p>Total Resumes</p>

          </div>

          <div className="stat-card">

            <h3>{stats.latest ? "Available" : "None"}</h3>

            <p>Latest Resume</p>

          </div>

          <div className="stat-card">

            <h3>AI Ready</h3>

            <p>Resume Optimizer</p>

          </div>

        </div>

        <h2 className="section-title">Quick Actions</h2>

        <div className="dashboard-grid">

          {actions.map((action) => (

            <div
              key={action.title}
              className="dashboard-card"
              onClick={() => navigate(action.path)}
            >

              <div
                className="card-icon"
                style={{ background: action.color }}
              >
                {action.icon}
              </div>

              <h3>{action.title}</h3>

              <p>{action.desc}</p>

              <button>Open</button>

            </div>

          ))}

        </div>

        <div className="recent-section">

          <div className="recent-header">

            <h2>Recent Resume</h2>

            <button
              onClick={() => navigate("/my-resumes")}
            >
              View All
            </button>

          </div>

          {stats.latest ? (

            <div className="recent-card">

              <h3>{stats.latest.title}</h3>

              <p>
                Created resume ready for editing or optimization.
              </p>

              <div className="recent-actions">

                <button
                  onClick={() => navigate("/my-resumes")}
                >
                  Open
                </button>

                <button
                  onClick={() => navigate("/optimize-resume")}
                >
                  Optimize
                </button>

              </div>

            </div>

          ) : (

            <div className="empty-card">

              <h2>No resumes yet</h2>

              <p>Create your first professional resume.</p>

              <button
                onClick={() => navigate("/resume-builder")}
              >
                Create Resume
              </button>

            </div>

          )}

        </div>

      </div>
    </>
  );
}

export default Dashboard;