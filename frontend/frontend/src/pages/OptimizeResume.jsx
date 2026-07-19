import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import api from "../api";
import "../styles/optimizeResume.css";
import ResumePDF from "../components/ResumePDF";

// Turns any item the AI service might put in a suggestion array into
// readable text. The AI is inconsistent about returning plain strings vs
// structured objects (e.g. {title, description} for projects, {name,
// level} for skills, {location, suggestion} for grammar notes) — this
// formats the shapes we know about and falls back to a readable
// "key: value" list for anything else, instead of dumping raw JSON.
function formatSuggestionItem(item) {
  if (typeof item === "string") return item;
  if (item === null || item === undefined) return "";

  if (Array.isArray(item)) {
    return item.map(formatSuggestionItem).join(", ");
  }

  if (typeof item === "object") {
    if (item.title && item.description) {
      return `${item.title}: ${item.description}`;
    }
    if (item.name && item.level) {
      return `${item.name} (${item.level})`;
    }
    if (item.location && item.suggestion) {
      return `${item.location} — ${item.suggestion}`;
    }
    if (item.question) {
      return item.question;
    }
    return Object.entries(item)
      .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`)
      .join(", ");
  }

  return String(item);
}

// Renders a list of strings, or a single string, or nothing if empty.
function SuggestionBlock({ title, items }) {
  if (items === undefined || items === null) return null;
  if (Array.isArray(items) && items.length === 0) return null;
  if (typeof items === "string" && items.trim() === "") return null;

  return (
    <div className="suggestion-card" key={title}>
      <h3>{title}</h3>
      {Array.isArray(items) ? (
        <ul>
          {items.map((item, index) => (
            <li key={index}>{formatSuggestionItem(item)}</li>
          ))}
        </ul>
      ) : (
        <p>{items}</p>
      )}
    </div>
  );
}

function OptimizeResume() {
  const [resumes, setResumes] = useState([]); // lightweight list, for the dropdown only
  const [selectedResume, setSelectedResume] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [selectedResumeData, setSelectedResumeData] = useState(null); // FULL resume, fetched by id
  const [resumeLoading, setResumeLoading] = useState(false);

  const [loading, setLoading] = useState(false);

  // Each feature now owns its own result state, instead of everything
  // sharing one "suggestions" object and one "atsScore" value. That
  // sharing was the reason results from one action wiped out another,
  // and why the ATS score circles broke (they expected {current,
  // improved} but the ATS endpoint returns a plain number).
  const [optimizeResult, setOptimizeResult] = useState(null);
  const [atsResult, setAtsResult] = useState(null);
  const [matchResult, setMatchResult] = useState(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [coverLetterError, setCoverLetterError] = useState("");

  useEffect(() => {
    loadResumes();
  }, []);

  async function loadResumes() {
    try {
      // GET /resumes returns ResumeCardOut — a lightweight summary
      // (id, title, maybe a short preview) meant for populating this
      // dropdown. It does NOT include education, achievements, or full
      // skills/experience/projects. Using it directly as the "selected
      // resume" data was why the AI-optimized PDF was missing whole
      // sections — see loadFullResume() below, which is what actually
      // supplies selectedResumeData now.
      const res = await api.get("/resumes");
      setResumes(res.data || []);
    } catch (err) {
      console.error(err);
    }
  }

  // Fetches the FULL resume (education, achievements, all child rows)
  // via GET /resumes/{id} — the same endpoint the resume editor uses —
  // instead of relying on the lightweight dropdown list data.
  async function loadFullResume(id) {
    if (!id) {
      setSelectedResumeData(null);
      return;
    }

    try {
      setResumeLoading(true);
      const res = await api.get(`/resumes/${id}`);
      setSelectedResumeData(res.data);
    } catch (err) {
      console.error("Failed to load full resume:", err);
      setSelectedResumeData(null);
      alert("Couldn't load the full resume details. Please try selecting it again.");
    } finally {
      setResumeLoading(false);
    }
  }

  // True only for a genuine plain object — guards against the AI
  // returning a string, number, or array for ats_optimized_resume,
  // which would otherwise get silently spread character-by-character
  // (or index-by-index) into optimizedResumeForPdf below.
  function isPlainObject(v) {
    return v !== null && typeof v === "object" && !Array.isArray(v);
  }


function clearResults() {
  setOptimizeResult(null);
  setAtsResult(null);
  setMatchResult(null);
  setCoverLetter("");
  setCoverLetterError("");
}

  async function optimizeResume() {
    if (!selectedResume) {
      alert("Please select a resume.");
      return;
    }

    if (!selectedResumeData) {
      alert("Resume details are still loading — please wait a moment and try again.");
      return;
    }

    try {
      setLoading(true);

      clearResults();

      const res = await api.post(`/ai/optimize/${selectedResume}`, null, {
        params: { job_description: jobDescription },
      });

      console.log("Optimize response:", res.data);

      // ats_optimized_resume is a structured resume object (personal,
      // education, experience, projects, skills) — not plain text — so
      // it can't be dumped into a <pre>. We merge it with the FULL
      // original resume (for any fields the AI response omits, like
      // education/achievements, which the backend prompt deliberately
      // leaves out and expects us to preserve) and hand it straight to
      // ResumePDF for a properly formatted export.
      const optimizedResumeObj = res.data.ats_optimized_resume || null;
      const optimizedResumeForPdf = isPlainObject(optimizedResumeObj)
        ? {
            ...selectedResumeData,
            ...optimizedResumeObj,
            // Explicitly carry these over from the full original resume —
            // the AI is not asked to return them, so don't let a missing
            // key in optimizedResumeObj accidentally end up undefined.
            education: selectedResumeData?.education || [],
            achievements: selectedResumeData?.achievements || [],
            personal: optimizedResumeObj.personal || selectedResumeData?.personal || {},
            summary:
              optimizedResumeObj.summary ||
              res.data.improved_summary ||
              selectedResumeData?.summary ||
              "",
            title: `${selectedResumeData?.title || "Resume"} (Optimized)`,
          }
        : null;

      setOptimizeResult({
        optimizedResumeObj: isPlainObject(optimizedResumeObj) ? optimizedResumeObj : null,
        optimizedResumeForPdf,
        improvedSummary: res.data.improved_summary,
        betterExperiencePoints: res.data.better_experience_points,
        betterProjectDescriptions: res.data.better_project_descriptions,
        strongActionVerbs: res.data.strong_action_verbs,
        betterSkillsSection: res.data.better_skills_section,
      });
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.detail || "Optimization failed");
    } finally {
      setLoading(false);
    }
  }

  async function analyzeATS() {
    if (!selectedResume) {
      alert("Please select a resume.");
      return;
    }

    try {
      setLoading(true);

      clearResults();

      const res = await api.post(`/ai/ats/${selectedResume}`);

      console.log("ATS Response:", res.data);

      setAtsResult({
        score: res.data.ats_score,
        overallRating: res.data.overall_rating,

        formattingIssues: res.data.formatting_issues || [],
        missingSections: res.data.missing_sections || [],
        keywordDensityFeedback: res.data.keyword_density_feedback || [],
        lengthFeedback: res.data.length_feedback || [],

        weakActionVerbs: res.data.weak_action_verbs || [],
        strongActionVerbSuggestions:
          res.data.strong_action_verbs_suggestions || [],

        grammarSuggestions: res.data.grammar_suggestions || [],

        contactValidation: res.data.contact_information_validation || {},

        educationValidation: res.data.education_validation || {},

        experienceValidation: res.data.experience_validation || {},

        projectsValidation: res.data.projects_validation || {},
      });
    } catch (err) {
      console.error("ATS Analysis Error:", err);

      alert(err?.response?.data?.detail || "Unable to analyze resume.");
    } finally {
      setLoading(false);
    }
  }

  async function matchResume() {
    if (!selectedResume) {
      alert("Please select a resume.");
      return;
    }

    if (!jobDescription.trim()) {
      alert("Please paste the job description.");
      return;
    }

    try {
      setLoading(true);

      clearResults();

      const res = await api.post(`/ai/match/${selectedResume}`, null, {
        params: { job_description: jobDescription },
      });

      console.log("Match response:", res.data);

      setMatchResult({
        percentage: res.data.match_percentage,
        matchingKeywords: res.data.matching_keywords,
        missingKeywords: res.data.missing_keywords,
        matchingSkills: res.data.matching_skills,
        missingSkills: res.data.missing_skills,
        suggestions: res.data.suggestions,
      });
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.detail || "JD Match failed");
    } finally {
      setLoading(false);
    }
  }

  async function generateCoverLetter() {
    if (!selectedResume) {
      alert("Please select a resume.");
      return;
    }

    setCoverLetterError("");

    try {
      setLoading(true);

      clearResults();

      const res = await api.post(`/ai/cover-letter/${selectedResume}`, null, {
        params: { job_description: jobDescription },
      });

      console.log("Cover letter response:", res.data);

      setCoverLetter(res.data.cover_letter || "");
    } catch (err) {
      console.error(err);

      // A "CORS" error in the console for this endpoint is very often a
      // decoy: if the backend throws an unhandled exception, the
      // response can fail before CORS headers are attached, and the
      // browser reports it as blocked-by-CORS even though the real
      // problem is a server-side 500. Surface whatever the backend
      // actually sent (if anything) instead of a generic alert, so the
      // real cause is visible.
      const backendDetail = err?.response?.data?.detail;
      const status = err?.response?.status;

      if (backendDetail) {
        setCoverLetterError(backendDetail);
      } else if (status) {
        setCoverLetterError(
          `Server returned an error (status ${status}). Check your backend logs for the cover-letter endpoint — it likely threw an unhandled exception.`
        );
      } else {
        setCoverLetterError(
          "Couldn't reach the server, or the request failed before a response was returned. Check that your backend is running and check its logs for a stack trace."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />

      <div
        className="optimize-page"
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 24,
          flexWrap: "wrap",
        }}
      >
        <div className="optimize-card" style={{ flex: "0 0 340px" }}>
          <h1>AI Resume Optimizer</h1>

          <p>
            Paste a job description to get a match score, AI suggestions,
            and an optimized resume — or run the ATS Readability Check
            anytime, with or without a job description, to see how well
            your resume parses in ATS software.
          </p>

          <label>Select Resume</label>

          <select
            value={selectedResume}
            onChange={(e) => {
              const id = e.target.value;
              setSelectedResume(id);
              loadFullResume(id);
            }}
          >
            <option value="">Choose Resume</option>

            {resumes.map((resume) => (
              <option key={resume.id} value={resume.id}>
                {resume.title}
              </option>
            ))}
          </select>

          {resumeLoading && (
            <p style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>
              Loading resume details...
            </p>
          )}

          <label>Job Description</label>

          <textarea
            rows="10"
            placeholder="Paste the Job Description here..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />

          <button
            className="optimize-btn"
            onClick={optimizeResume}
            disabled={loading}
          >
            {loading ? "Analyzing..." : "Optimize Resume"}
          </button>

          <button
            className="optimize-btn"
            onClick={matchResume}
            disabled={loading}
          >
            {loading ? "Matching..." : "Match Resume"}
          </button>

          <button
            className="optimize-btn"
            onClick={generateCoverLetter}
            disabled={loading}
          >
            {loading ? "Generating..." : "Create Cover Letter"}
          </button>

          <button
            className="optimize-btn"
            onClick={analyzeATS}
            disabled={loading}
          >
            {loading ? "Checking..." : "ATS Readability Check"}
          </button>
        </div>

        {(optimizeResult || atsResult || matchResult || coverLetter || coverLetterError) && (
          <div
            style={{
              flex: "1 1 380px",
              display: "flex",
              flexDirection: "column",
              gap: 24,
              minWidth: 0,
            }}
          >
            {/* ---------------- OPTIMIZE RESULT ---------------- */}
            {optimizeResult && (
              <div className="results-card">
                <h2>AI-Optimized Resume</h2>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "12px",
                  }}
                >
                  <h3 style={{ margin: 0 }}>Optimized Resume</h3>

                  {optimizeResult.optimizedResumeForPdf && (
                    <ResumePDF resume={optimizeResult.optimizedResumeForPdf} />
                  )}
                </div>

                {optimizeResult.optimizedResumeObj ? (
                  <div
                    className="optimized-resume"
                    style={{
                      border: "1px solid #E5E7EB",
                      borderRadius: 8,
                      padding: 16,
                      marginBottom: 16,
                      background: "#F9FAFB",
                    }}
                  >
                    {optimizeResult.optimizedResumeForPdf?.summary && (
                      <p style={{ marginTop: 0 }}>
                        {optimizeResult.optimizedResumeForPdf.summary}
                      </p>
                    )}
                    <p style={{ fontSize: 13, color: "#6B7280" }}>
                      Full formatted resume is ready — use the "Download PDF"
                      button above to get it as a one-page PDF.
                    </p>
                  </div>
                ) : (
                  <p style={{ color: "#6B7280" }}>
                    No optimized resume was returned for this run.
                  </p>
                )}

                <div className="suggestions">
                  <SuggestionBlock
                    title="Improved Summary"
                    items={optimizeResult.improvedSummary}
                  />
                  <SuggestionBlock
                    title="Better Experience Points"
                    items={optimizeResult.betterExperiencePoints}
                  />
                  <SuggestionBlock
                    title="Better Project Descriptions"
                    items={optimizeResult.betterProjectDescriptions}
                  />
                  <SuggestionBlock
                    title="Strong Action Verbs"
                    items={optimizeResult.strongActionVerbs}
                  />
                  <SuggestionBlock
                    title="Better Skills Section"
                    items={optimizeResult.betterSkillsSection}
                  />
                </div>
              </div>
            )}

            {/* ---------------- ATS RESULT ---------------- */}
            {atsResult && (
              <div className="results-card">
                <h2>ATS Readability Check</h2>
                <p style={{ marginTop: -8, fontSize: 13, color: "#6B7280" }}>
                  How well this resume parses in ATS software — independent of
                  any specific job.
                </p>

                <div
                  className="score-wrapper"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <div className="score-circle">
                    {atsResult.score}
                    <span>%</span>
                  </div>
                  <p style={{ margin: 0, fontWeight: 600, color: "#374151" }}>
                    ATS Readability Score
                  </p>
                </div>

                <div className="suggestions">
                  <SuggestionBlock
                    title="Overall Rating"
                    items={atsResult.overallRating}
                  />
                  <SuggestionBlock
                    title="Formatting Issues"
                    items={atsResult.formattingIssues}
                  />
                  <SuggestionBlock
                    title="Missing Sections"
                    items={atsResult.missingSections}
                  />
                  <SuggestionBlock
                    title="Keyword Density"
                    items={atsResult.keywordDensityFeedback}
                  />
                  <SuggestionBlock
                    title="Length Feedback"
                    items={atsResult.lengthFeedback}
                  />
                  <SuggestionBlock
                    title="Grammar Suggestions"
                    items={atsResult.grammarSuggestions}
                  />
                </div>
              </div>
            )}

            {/* ---------------- MATCH RESULT ---------------- */}
            {matchResult && (
              <div className="results-card">
                <h2>Resume Match Result</h2>

                <div
                  className="score-wrapper"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <div className="score-circle">
                    {matchResult.percentage}
                    <span>%</span>
                  </div>
                  <p style={{ margin: 0, fontWeight: 600, color: "#374151" }}>
                    Match
                  </p>
                </div>

                <div className="suggestions">
                  <SuggestionBlock
                    title="Matching Keywords"
                    items={matchResult.matchingKeywords}
                  />
                  <SuggestionBlock
                    title="Missing Keywords"
                    items={matchResult.missingKeywords}
                  />
                  <SuggestionBlock
                    title="Matching Skills"
                    items={matchResult.matchingSkills}
                  />
                  <SuggestionBlock
                    title="Missing Skills"
                    items={matchResult.missingSkills}
                  />
                  <SuggestionBlock
                    title="Suggestions"
                    items={matchResult.suggestions}
                  />
                </div>
              </div>
            )}

            {/* ---------------- COVER LETTER ---------------- */}
            {(coverLetter || coverLetterError) && (
              <div className="results-card">
                <h2>AI Cover Letter</h2>

                {coverLetterError ? (
                  <p style={{ color: "#B91C1C" }}>{coverLetterError}</p>
                ) : (
                  <>
                    <textarea
                      rows={18}
                      value={coverLetter}
                      readOnly
                      style={{
                        width: "100%",
                        minHeight: "500px",
                        resize: "vertical",
                        fontSize: "15px",
                        lineHeight: "1.7",
                        padding: "20px",
                        boxSizing: "border-box",
                      }}
                    />

                    <button
                      className="optimize-btn"
                      onClick={() => {
                        navigator.clipboard.writeText(coverLetter);
                        alert("Copied!");
                      }}
                    >
                      Copy Cover Letter
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default OptimizeResume;
