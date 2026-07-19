import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api";
import "../styles/myResumes.css";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { createRoot } from "react-dom/client";
import ResumePDF from "../components/ResumePDF";
import { flushSync } from "react-dom";
import { ResumeDocument } from "../components/ResumePDF";
import { pdf } from "@react-pdf/renderer";

function MyResumes() {
  const [resumes, setResumes] = useState([]);
  const [filteredResumes, setFilteredResumes] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    loadResumes();
  }, []);

  useEffect(() => {
    const filtered = resumes.filter((resume) =>
      resume.title.toLowerCase().includes(search.toLowerCase())
    );

    setFilteredResumes(filtered);
  }, [search, resumes]);

  async function loadResumes() {
    try {
      const res = await api.get("/resumes");
      setResumes(res.data || []);
      setFilteredResumes(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function deleteResume(id) {
    if (!window.confirm("Delete this resume?")) return;

    try {
      await api.delete(`/resumes/${id}`);
      loadResumes();
    } catch (err) {
      console.error(err);
      alert("Unable to delete resume.");
    }
  }

async function downloadResume(id) {
  try {
    const res = await api.get(`/resumes/${id}`);

    const resume = res.data;

    console.log("Resume Data:", resume);

    const blob = await pdf(
      <ResumeDocument resume={resume} />
    ).toBlob();

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = `${resume.title}.pdf`;

    link.click();

    URL.revokeObjectURL(url);

  } catch(err) {
    console.error(err);
    alert("Unable to download resume.");
  }
}

  return (
    <>
      <Navbar />

      <div className="my-resumes-page">

        <div className="page-top">

          <div>
            <h1>My Resumes</h1>
            <p>Manage, edit and optimize your resumes.</p>
          </div>

          <button
            className="create-btn"
            onClick={() => navigate("/resume-builder")}
          >
            + Create Resume
          </button>

        </div>

        <div className="search-bar">

          <input
            type="text"
            placeholder="🔍 Search resumes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

        </div>

        {loading ? (
          <div className="loading">
            Loading resumes...
          </div>
        ) : filteredResumes.length === 0 ? (
          <div className="empty-card">

            <h2>📄 No Resumes Found</h2>

            <p>Create your first ATS-friendly resume.</p>

            <button
              className="create-btn"
              onClick={() => navigate("/resume-builder")}
            >
              Create Resume
            </button>

          </div>
        ) : (
          <div className="resume-grid">

            {filteredResumes.map((resume) => (

              <div className="resume-card" key={resume.id}>

                <div className="resume-header">

                  <h2>{resume.title}</h2>

                  <span className="resume-badge">
                    Resume
                  </span>

                </div>

                <p className="resume-date">
                  📅 Updated :
                  {" "}
                  {new Date(
                    resume.updated_at || resume.created_at
                  ).toLocaleDateString()}
                </p>

                <div className="resume-actions">

<button
  className="view-btn"
  onClick={() =>
    navigate("/resume-builder", {
      state: {
        resumeId: resume.id,
        mode: "view",
      },
  })
}
>
  👁 View
</button>

<button
  className="edit-btn"
  onClick={() =>
    navigate("/resume-builder", {
      state: {
        resumeId: resume.id,
        mode: "edit",
      },
    })
  }
>
  ✏ Edit
</button>

                  <button
                    className="optimize-btn"
                    onClick={() =>
                      navigate("/optimize-resume", {
                        state: {
                          resumeId: resume.id,
                        },
                      })
                    }
                  >
                    🤖 Optimize
                  </button>

                  <button
                    className="download-btn"
                    onClick={() => downloadResume(resume.id)}
                  >
                    ⬇ Download
                  </button>

                  <button
                    className="delete-btn"
                    onClick={() => deleteResume(resume.id)}
                  >
                    🗑 Delete
                  </button>

                </div>

              </div>

            ))}

          </div>
        )}

      </div>
    </>
  );
}

export default MyResumes;