import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import api from "../api";
import "../styles/profile.css";

function Profile() {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    github: "",
    portfolio: "",
    jobTitle: "",
    summary: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

async function loadProfile() {
  try {
    const res = await api.get("/profile");

    setProfile({
      name: res.data.user.name || "",
      email: res.data.user.email || "",
      phone: res.data.user.phone || "",
      location: res.data.user.location || "",
      linkedin: res.data.user.linkedin || "",
      github: res.data.user.github || "",
      portfolio: res.data.user.portfolio || "",
      jobTitle: res.data.user.job_title || "",
      summary: res.data.user.summary || "",
    });
  } catch (err) {
    console.log(err);
  }
}
  function handleChange(e) {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  }

async function saveProfile() {
  try {
    setLoading(true);

    await api.put("/profile", {
      name: profile.name,
      phone: profile.phone,
      location: profile.location,
      linkedin: profile.linkedin,
      github: profile.github,
      portfolio: profile.portfolio,
      job_title: profile.jobTitle,
      summary: profile.summary,
    });

    setMessage("Profile updated successfully!");

    setTimeout(() => setMessage(""), 3000);
  } catch (err) {
    alert(err?.response?.data?.detail || "Failed to update profile");
  } finally {
    setLoading(false);
  }
}

  return (
    <>
      <Navbar />

      <div className="profile-page">

        <div className="profile-card">

          <div className="profile-header">

            <div className="avatar">
              {profile.name
                ? profile.name.charAt(0).toUpperCase()
                : "U"}
            </div>

            <div>
              <h1>{profile.name || "Your Profile"}</h1>
              <p>Manage your ResumeAI account</p>
            </div>

          </div>

          <div className="profile-grid">

            <div>

              <label>Full Name</label>

              <input
                name="name"
                value={profile.name}
                onChange={handleChange}
              />

            </div>

            <div>

              <label>Email</label>

              <input
                name="email"
                value={profile.email}
                onChange={handleChange}
              />

            </div>

            <div>

              <label>Phone</label>

              <input
                name="phone"
                value={profile.phone}
                onChange={handleChange}
              />

            </div>

            <div>

              <label>Location</label>

              <input
                name="location"
                value={profile.location}
                onChange={handleChange}
              />

            </div>

            <div>

              <label>Job Title</label>

              <input
                name="jobTitle"
                value={profile.jobTitle}
                onChange={handleChange}
              />

            </div>

            <div>

              <label>Portfolio</label>

              <input
                name="portfolio"
                value={profile.portfolio}
                onChange={handleChange}
              />

            </div>

            <div>

              <label>LinkedIn</label>

              <input
                name="linkedin"
                value={profile.linkedin}
                onChange={handleChange}
              />

            </div>

            <div>

              <label>GitHub</label>

              <input
                name="github"
                value={profile.github}
                onChange={handleChange}
              />

            </div>

          </div>

          <label>Professional Summary</label>

          <textarea
            rows="6"
            name="summary"
            value={profile.summary}
            onChange={handleChange}
          />

          <button
            className="save-profile-btn"
            onClick={saveProfile}
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>

          {message && <p className="success">{message}</p>}

        </div>

      </div>
    </>
  );
}

export default Profile;