import { useState } from "react";
import Navbar from "../components/Navbar";
import api from "../api";
import {
  FiUploadCloud,
  FiFileText,
  FiTrash2,
  FiCheckCircle,
} from "react-icons/fi";
import "../styles/uploadResume.css";

function UploadResume() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploaded, setUploaded] = useState(false);
  const [extractedText, setExtractedText] = useState("");

  function handleFileSelect(e) {
    if (e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setUploaded(false);
      setExtractedText("");
    }
  }

  function handleDrop(e) {
    e.preventDefault();

    if (e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
      setUploaded(false);
      setExtractedText("");
    }
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  function removeFile() {
    setFile(null);
    setProgress(0);
    setUploaded(false);
    setExtractedText("");
  }

  async function onUpload() {
    if (!file) {
      alert("Please select a resume first.");
      return;
    }

    try {
      setLoading(true);
      setProgress(0);

      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post("/upload-resume", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (event) => {
          if (event.total) {
            setProgress(Math.round((event.loaded * 100) / event.total));
          }
        },
      });

      setUploaded(true);

      setExtractedText(
        `Uploaded File : ${
          res.data?.uploaded?.filename || file.name
        }

(Mock Extracted Resume)

Name:
Email:
Phone:
Skills:
Experience:
Education:

This data will later be replaced with AI extracted resume information.`
      );
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.detail || "Upload Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />

      <div className="upload-page">

        <div className="upload-card">

          <div className="upload-icon">
            <FiUploadCloud />
          </div>

          <h1>Upload Your Resume</h1>

          <p className="upload-subtitle">
            Upload your existing resume and let ResumeAI extract your details.
          </p>

          <div
            className="drop-zone"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <input
              id="resumeInput"
              type="file"
              accept=".pdf,.doc,.docx"
              hidden
              onChange={handleFileSelect}
            />

            <label htmlFor="resumeInput" className="drop-label">

              <FiUploadCloud size={50} />

              <h3>Drag & Drop Resume Here</h3>

              <p>or click to browse files</p>

              <span>PDF • DOC • DOCX</span>

            </label>

          </div>

          {file && (
            <div className="selected-file">

              <div className="file-info">

                <FiFileText className="file-icon" />

                <div>

                  <h4>{file.name}</h4>

                  <small>
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </small>

                </div>

              </div>

              <button
                className="remove-btn"
                onClick={removeFile}
              >
                <FiTrash2 />
              </button>

            </div>
          )}

          {loading && (
            <div className="progress-wrapper">

              <div className="progress-bar">

                <div
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                ></div>

              </div>

              <p>{progress}% Uploaded</p>

            </div>
          )}

          <button
            className="upload-btn"
            onClick={onUpload}
            disabled={loading}
          >
            {loading ? "Uploading..." : "Upload Resume"}
          </button>

          {uploaded && (
            <div className="success-box">

              <FiCheckCircle className="success-icon" />

              Resume Uploaded Successfully

            </div>
          )}

        </div>

        {extractedText && (
          <div className="extracted-card">

            <h2>Extracted Resume</h2>

            <pre>{extractedText}</pre>

            <button className="create-btn">
              Create Resume from Extracted Data
            </button>

          </div>
        )}

      </div>
    </>
  );
}

export default UploadResume;