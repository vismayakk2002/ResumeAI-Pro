import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import api from "../api";
import "../styles/interviewPrep.css";

function InterviewPrep() {
  const [resumes, setResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [loadingInterview, setLoadingInterview] = useState(false);
  const [loadingEvaluation, setLoadingEvaluation] = useState(false);
  const [interviewData, setInterviewData] = useState(null);

  const [interviewMode, setInterviewMode] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const [currentAnswer, setCurrentAnswer] = useState("");

  const [evaluation, setEvaluation] = useState(null);

  const [interviewQuestions, setInterviewQuestions] = useState([]);

  const [report, setReport] = useState(null);

  const [interviewResults, setInterviewResults] = useState([]);

  const [showGeneratedQuestions, setShowGeneratedQuestions] = useState(true);

  useEffect(() => {
    loadResumes();
  }, []);


  async function loadResumes() {
    try {
      const res = await api.get("/resumes");
      setResumes(res.data || []);
    } catch (err) {
      console.error(err);
    }
  }


  async function generateInterviewQuestions() {

    if (!selectedResume) {
      alert("Please select a resume.");
      return;
    }

    if (!jobDescription.trim()) {
      alert("Please paste the Job Description.");
      return;
    }


    try {
        setLoadingQuestions(true);

        const res = await api.post(
            `/ai/interview/${selectedResume}`,
            null,
            {
                params: {
                    job_description: jobDescription
                }
            }
        );
        console.log("AI RESPONSE:",res.data);

        setInterviewData({
          technical_questions:
              res.data.technical_questions || [],

          resume_based_questions:
              res.data.resume_based_questions ||
              res.data["resume-based_questions"] ||
              [],

          scenario_based_questions:
              res.data.scenario_based_questions ||
              res.data["scenario-based_questions"] ||
              res.data.scenario_questions ||
              [],

          hr_questions:
              res.data.hr_questions || []
        });

    } catch (err) {
        console.error(err);
        alert("Unable to generate interview questions.");
    } finally {
        setLoadingQuestions(false);
    }

  }

async function startInterview() {

  if (!selectedResume) {
    alert("Please select a resume.");
    return;
  }

  if (!jobDescription.trim()) {
    alert("Please paste the Job Description.");
    return;
  }

  try {

    setLoadingInterview(true);;

  if (!interviewData) {
    alert("Please generate interview questions first.");
    return;
  }

  const technical = shuffle(
    interviewData.technical_questions || []
  ).slice(0, 5);

  const resume = shuffle(
    interviewData.resume_based_questions || []
  ).slice(0, 2);

  const scenario = shuffle(
    interviewData.scenario_based_questions || []
  ).slice(0, 2);

  const hr = shuffle(
    interviewData.hr_questions || []
  ).slice(0, 1);


    const questions = [
      ...technical,
      ...resume,
      ...scenario,
      ...hr,
    ];

    setInterviewQuestions(questions);

    setInterviewMode(true);

    setShowGeneratedQuestions(false);

    setCurrentQuestionIndex(0);

    setEvaluation(null);

    setCurrentAnswer("");

    setReport(null);

    setInterviewResults([]);

  } catch (err) {

    console.error(err);

    alert("Unable to start interview.");

  } finally {

    setLoadingInterview(false);

  }

}

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

async function submitAnswer() {

  if (!currentAnswer.trim()) {
    alert("Please enter your answer.");
    return;
  }

  try {

    setLoadingInterview(true);;

    const question =
      interviewQuestions[currentQuestionIndex].question;

    const res = await api.post("/ai/evaluate-answer", {
      question,
      answer: currentAnswer,
      resume_id: Number(selectedResume),
      job_description: jobDescription,
    });

    setEvaluation(res.data);

    setInterviewResults(prev => [
      ...prev,
      {
        question,
        answer: currentAnswer,
        evaluation: res.data
      }
    ]);
  } catch (err) {

    console.error(err);

    alert("Unable to evaluate answer.");

  } finally {

    setLoadingInterview(false);

  }

}

async function nextQuestion() {

  // Last question?
  if (currentQuestionIndex >= interviewQuestions.length - 1) {

    try {

      setLoadingEvaluation(true);

      const finalResults = [
        ...interviewResults,
        {
          question: interviewQuestions[currentQuestionIndex].question,
          answer: currentAnswer,
          evaluation
        }
      ];

      setLoadingEvaluation(true);

      const res = await api.post("/ai/final-report", {

        results: finalResults,

        resume_id: Number(selectedResume),

        job_description: jobDescription

      });

      console.log("FINAL REPORT RESPONSE:", res.data);

      setReport(res.data);

      setInterviewMode(false);

    } catch (err) {

      console.error(err);

      alert("Unable to generate interview report.");

    } finally {

      setLoadingEvaluation(false);

    }

    return;
  }

  setCurrentQuestionIndex(prev => prev + 1);

  setCurrentAnswer("");

  setEvaluation(null);

}



  const sections = [
    {
      title:"💻 Technical Questions",
      key:"technical_questions",
      icon:"💻"
    },
    {
      title:"📄 Resume Based Questions",
      key:"resume_based_questions",
      icon:"📄"
    },
    {
      title:"🧩 Scenario Based Questions",
      key:"scenario_based_questions",
      icon:"🧩"
    },
    {
      title:"👤 HR Questions",
      key:"hr_questions",
      icon:"👤"
    }
  ];



  return (
    <>
    <Navbar/>


    <div className="interview-page">


      {/* INPUT CARD */}

      <div className="interview-card">


        <div className="page-header">

          <h1>
            🚀 AI Interview Preparation
          </h1>

          <p>
            Generate personalized interview questions using your resume and job description.
          </p>

        </div>



        <div className="form-group">

          <label>
            📄 Select Resume
          </label>


          <select
            value={selectedResume}
            onChange={(e)=>setSelectedResume(e.target.value)}
          >

            <option value="">
              Choose a resume
            </option>


            {
              resumes.map((resume)=>(
                <option
                  key={resume.id}
                  value={resume.id}
                >
                  {resume.title}
                </option>
              ))
            }


          </select>


        </div>




        <div className="form-group">


          <label>
            📝 Job Description
          </label>


          <textarea

            rows="12"

            value={jobDescription}

            onChange={(e)=>setJobDescription(e.target.value)}

            placeholder="
Paste the job description here...

Example:
Angular Developer with REST API experience
"


          />


          <div className="character-count">

            {jobDescription.length} characters

          </div>


        </div>


<div className="button-group">
  <button
    className="generate-btn"
    onClick={generateInterviewQuestions}
    disabled={loadingQuestions}
  >
    {loadingQuestions
      ? "⏳ Generating Questions..."
      : "✨ Generate Interview Questions"}
  </button>

  <button
    className="generate-btn"
    onClick={startInterview}
    disabled={loadingInterview}
  >
    {loadingInterview
      ? "🎤 Starting Interview..."
      : "🎤 Start Live Interview"}
  </button>
</div>


      </div>






      {/* RESULTS */}


      {
        interviewData && showGeneratedQuestions && (

          <div className="results-container">


          {
            sections.map((section)=>(


              <div 
                className="question-section"
                key={section.key}
              >


                <h2>
                  {section.title}
                </h2>



                {

                interviewData[section.key]?.map(
                  (q,index)=>(


                    <div
                      className="question-card"
                      key={index}
                    >


                      <div className="question-number">

                        Q{index+1}

                      </div>



                      <p>

                      {
                        typeof q==="string"
                        ? q
                        : q.question
                      }

                      </p>



                      {
                        q.follow_up?.length > 0 && (


                        <div className="follow-up">


                          <h4>
                            Follow-up Questions
                          </h4>



                          <ul>

                          {
                            q.follow_up.map(
                              (f,i)=>(

                                <li key={i}>
                                  {f}
                                </li>

                              )
                            )
                          }

                          </ul>


                        </div>


                        )
                      }



                    </div>


                  )

                )

                }



              </div>


            ))
          }



          </div>


        )
      }

{interviewMode && interviewQuestions.length > 0 && (

<div className="live-interview-card">

<h2>🎤 Live Interview</h2>

<p>
Question {currentQuestionIndex + 1} of {interviewQuestions.length}
</p>

<div className="question-box">

<h3>
{interviewQuestions[currentQuestionIndex].question}
</h3>

</div>

<textarea

rows={8}

placeholder="Type your answer..."

value={currentAnswer}

onChange={(e)=>setCurrentAnswer(e.target.value)}

/>

<button
className="submit-answer-btn"
onClick={submitAnswer}
disabled={loadingInterview}
>
{
  loadingEvaluation
    ? "Evaluating..."
    : "Submit Answer"
}
</button>

</div>

)}

{evaluation && (

<div className="evaluation-card">

<h2>AI Evaluation</h2>

<h3>Score: {evaluation.score}/10</h3>

<h4>Strengths</h4>

<ul>
  {evaluation.strengths?.map((item, index) => (
    <li key={index}>{item}</li>
  ))}
</ul>

<h4>Missing Points</h4>

{evaluation?.missing_points?.map((item, index) => (
  <li key={index}>{item}</li>
))}

<h4>Ideal Answer</h4>

<p>{evaluation.ideal_answer}</p>

<h4>Follow-up Question</h4>

<p>{evaluation.follow_up}</p>

<button
className="next-btn"
onClick={nextQuestion}
>

Next Question →

</button>

</div>

)}

{loadingEvaluation && (

<div className="loading-report">

<h2>⏳ Generating Interview Report...</h2>

<p>
AI is analyzing your answers and preparing your final performance report.
</p>

</div>

)}


{report && (

<div className="report-card">

<h1>🎉 Interview Completed</h1>

<div className="overall-score">

<h2>{report.overall_score}/100</h2>

<p>{report.rating}</p>

</div>

<h3>Technical Level</h3>

<p>{report.technical_level}</p>

<h3>Communication</h3>

<p>{report.communication}</p>

<h3>Confidence</h3>

<p>{report.confidence}</p>

<h3>Recommendation</h3>

<p>{report.recommendation}</p>

<h3>Strengths</h3>

<ul>

{report.strengths?.map((item,index)=>(

<li key={index}>{item}</li>

))}

</ul>

<h3>Areas to Improve</h3>

<ul>

{report.weaknesses?.map((item,index)=>(

<li key={index}>{item}</li>

))}

</ul>

<h3>Summary</h3>

<p>{report.summary}</p>

</div>

)}


    </div>


    </>
  );
}


export default InterviewPrep;