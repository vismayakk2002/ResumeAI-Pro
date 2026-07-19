import { useNavigate } from "react-router-dom";
import Button from "./Button";
import "../styles/hero.css";

function Hero() {

    const navigate = useNavigate();

    return (

        <section className="hero">

            <h1 className="hero-title">
                Build ATS-Friendly Resumes with AI
            </h1>

            <p className="hero-description">
                Create, optimize and tailor your resume for every
                job description using Generative AI.
            </p>

            <Button
                text="Build My Resume"
                onClick={() => navigate("/resume-builder")}
            />

        </section>

    );

}

export default Hero;