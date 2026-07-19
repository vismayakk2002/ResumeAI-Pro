import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Button from "../components/Button";
import "../styles/login.css";
import Navbar from "../components/Navbar";

import useAuth from "../hooks/useAuth";

function Signup() {
  const { signup, loading } = useAuth() || {};
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSignup() {
    setError("");
    setSuccess("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      await signup({ name: formData.name, email: formData.email, password: formData.password });
      setSuccess("Account created. Please log in.");
      setTimeout(() => navigate("/login"), 800);
    } catch (e) {
      const msg = e?.response?.data?.detail || e?.message || "Signup failed";
      setError(msg);
    }
  }

  return (
    <>
      <Navbar />

      <div className="login-page">
        <div className="login-card">
          <h1>Create Account</h1>

          <p className="subtitle">Join ResumeAI Pro and build smarter resumes</p>

          <div className="input-group">
            <label>Full Name</label>
            <input
              name="name"
              placeholder="Enter your name"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <label>Email</label>
            <input
              name="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              name="password"
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <label>Confirm Password</label>
            <input
              name="confirmPassword"
              type="password"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
          </div>

          <Button text="Create Account" onClick={handleSignup} />

          {error ? <p className="auth-error">{error}</p> : null}
          {success ? <p className="auth-success">{success}</p> : null}

          <p className="bottom-text">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>
      </div>
    </>
  );
}

export default Signup;

