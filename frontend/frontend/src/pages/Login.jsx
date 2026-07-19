import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Button from "../components/Button";

import "../styles/login.css";
import Navbar from "../components/Navbar";

import useAuth from "../hooks/useAuth";

function Login() {
  const { login, loading } = useAuth() || {};

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  async function handleLogin() {
    setError("");
    try {
      await login({ email, password });
      navigate("/dashboard");
    } catch (e) {
      const msg = e?.response?.data?.detail || e?.message || "Login failed";
      setError(msg);
    }
  }

  return (
    <>
      <Navbar />

        <div className="login-container">

            <div className="login-card">

                <h1>Welcome Back</h1>

                <p>Login to continue using ResumeAI Pro</p>

                <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <Button
                    text="Login"
                    onClick={handleLogin}
                />

                {error ? <p className="auth-error">{error}</p> : null}

                <p>

                    Don't have an account?

                    <Link to="/signup">

                        Signup

                    </Link>

                </p>

            </div>

        </div>
    </>

    );

}

export default Login;