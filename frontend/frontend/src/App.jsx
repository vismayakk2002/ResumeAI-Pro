import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import ResumeBuilder from "./pages/ResumeBuilder";
import UploadResume from "./pages/UploadResume";
import OptimizeResume from "./pages/OptimizeResume";
import MyResumes from "./pages/MyResumes";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";
import InterviewPrep from "./pages/InterviewPrep";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/resume-builder" element={<ResumeBuilder />} />
        <Route path="/upload-resume" element={<UploadResume />} />
        <Route path="/optimize-resume" element={<OptimizeResume />} />
        <Route path="/my-resumes" element={<MyResumes />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/interview-prep" element={<InterviewPrep />}
/>
      </Route>
    </Routes>
  );
}

export default App;
