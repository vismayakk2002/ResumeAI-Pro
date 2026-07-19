import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import FeatureCard from "../components/FeatureCard";
import Button from "../components/Button";
import Footer from "../components/Footer";

function LandingPage() {

  const navigate = useNavigate();

  const features = [
    {
      title: "AI Resume Optimization",
      description: "Improve your resume using Generative AI.",
    },
    {
      title: "ATS Score",
      description: "Check how ATS-friendly your resume is.",
    },
    {
      title: "JD Matching",
      description: "Match your resume with any job description.",
    },
    {
      title: "PDF Export",
      description: "Download your resume as PDF.",
    },
  ];

  return (
    <>
      <Navbar />

      <Hero />

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "20px",
          margin: "40px 0",
        }}
      >

        <Button
          text="Dashboard"
          onClick={() => navigate("/dashboard")}
        />
      </div>

      <section
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "20px",
          flexWrap: "wrap",
          padding: "40px",
        }}
      >
        {features.map((feature, index) => (
          <FeatureCard
            key={index}
            title={feature.title}
            description={feature.description}
          />
        ))}
      </section>

      <Footer />
    </>
  );
}

export default LandingPage;