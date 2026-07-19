import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api";
import "../styles/resumeBuilder.css";
import { useLocation } from "react-router-dom";

function ResumeBuilder() {

    const navigate = useNavigate();

    const location = useLocation();

    const [resumeTitle, setResumeTitle] = useState("");

    const mode = location.state?.mode || "create";

    const isViewMode = mode === "view";

    const [template, setTemplate] = useState("professional");

    const [personal, setPersonal] = useState({
        fullName: "",
        email: "",
        phone: "",
        location: "",
        linkedin: "",
        github: ""
    });

    const [summary, setSummary] = useState("");


    const [education, setEducation] = useState([
        {
            college: "",
            degree: "",
            year: ""
        }
    ]);


    const [experience, setExperience] = useState([
        {
            company: "",
            role: "",
            duration: "",
            responsibilities: ""
        }
    ]);


    const [projects, setProjects] = useState([
        {
            title: "",
            description: ""
        }
    ]);


    const [skills, setSkills] = useState([""]);


    const [loading, setLoading] = useState(false);

    const [achievements, setAchievements] = useState([""]);
console.log("Location State:", location.state);

    // ---------------- PERSONAL ----------------


    function handlePersonalChange(e) {

        setPersonal({

            ...personal,

            [e.target.name]: e.target.value

        });

    }



    // ---------------- EDUCATION ----------------


    function handleEducationChange(index, e) {

        const updated = [...education];

        updated[index][e.target.name] = e.target.value;

        setEducation(updated);

    }



    function addEducation() {

        setEducation([

            ...education,

            {
                college:"",
                degree:"",
                year:""
            }

        ]);

    }



    function removeEducation(index) {

        setEducation(

            education.filter((_,i)=>i!==index)

        );

    }





    // ---------------- EXPERIENCE ----------------


    function handleExperienceChange(index,e){

        const updated=[...experience];

        updated[index][e.target.name]=e.target.value;

        setExperience(updated);

    }



    function addExperience(){

        setExperience([

            ...experience,

            {
                company:"",
                role:"",
                duration:"",
                responsibilities:""
            }

        ]);

    }




    function removeExperience(index){

        setExperience(

            experience.filter((_,i)=>i!==index)

        );

    }






    // ---------------- PROJECTS ----------------



    function handleProjectChange(index,e){

        const updated=[...projects];

        updated[index][e.target.name]=e.target.value;

        setProjects(updated);

    }




    function addProject(){

        setProjects([

            ...projects,

            {
                title:"",
                description:""
            }

        ]);

    }




    function removeProject(index){

        setProjects(

            projects.filter((_,i)=>i!==index)

        );

    }






    // ---------------- SKILLS ----------------



    function handleSkillChange(index,value){

        const updated=[...skills];

        updated[index]=value;

        setSkills(updated);

    }




    function addSkill(){

        setSkills([

            ...skills,

            ""

        ]);

    }





    function removeSkill(index){

        setSkills(

            skills.filter((_,i)=>i!==index)

        );

    }



    // ---------------- ACHIEVEMENTS ----------------



    function handleAchievementChange(index, value) {

        const updated = [...achievements];

        updated[index] = value;

        setAchievements(updated);

    }



    function addAchievement() {

        setAchievements([

            ...achievements,

            ""

        ]);

    }



    function removeAchievement(index) {

        setAchievements(

            achievements.filter((_, i) => i !== index)

        );

    }







    // ---------------- EDIT MODE ----------------



useEffect(() => {
    const resumeId = location.state?.resumeId;

    if (resumeId) {
        loadResume(resumeId);
    }
}, []);



async function loadResume(id) {
    try {
        const res = await api.get(`/resumes/${id}`);

        const data = res.data;

        setResumeTitle(data.title);

        setPersonal(data.personal);

        setSummary(data.summary || "");

        setEducation(data.education);

        setExperience(data.experience);

        setProjects(data.projects);

        setSkills(data.skills.map(skill => skill.name));

        setAchievements(

            data.achievements && data.achievements.length

            ? data.achievements.map(a => (typeof a === "string" ? a : a.text))

            : [""]

        );

    } catch (err) {
        console.error(err);
        alert("Failed to load resume");
    }
}



    // ---------------- SAVE ----------------



    function handleSave(){


        (async()=>{


            try{


                setLoading(true);



                const state = window.history.state || {};

                const resumeId = state?.resumeId;




                const payload={


                    title: resumeTitle || "Untitled Resume",


                    personal,


                    summary,


                    education,


                    experience,


                    projects,


                    skills:

                    skills

                    .filter(
                        skill=>skill.trim()
                    )

                    .map(
                        name=>({name})
                    ),


                    achievements:

                    achievements

                    .filter(

                        a => a.trim()

                    )


                };





                if(resumeId){


                    await api.put(

                        `/resumes/${resumeId}`,

                        payload

                    );


                }

                else{


                    const response = await api.post(

                        "/resumes",

                        payload

                    );


                    if(response?.data?.id){

                        navigate("/my-resumes");

                    }


                }




            }

            catch(error){


                console.error(error);


                alert(

                    error?.response?.data?.detail ||

                    "Failed to save resume"

                );


            }


            finally{


                setLoading(false);


            }



        })();



    }






    return (

        <>

        <Navbar/>


        <div className="resume-builder">


        <div className="builder-container">


        <div className="resume-form">


        <h1>
            Resume Builder
        </h1>

<input
    type="text"
    placeholder="Resume Title"
    value={resumeTitle}
    onChange={(e)=>setResumeTitle(e.target.value)}
    disabled={isViewMode}
/>



        {/* PERSONAL SECTION */}

        <div className="section">


        <h2>
            Personal Details
        </h2>



        <label>Full Name</label>

        <input
            name="fullName"
            value={personal.fullName}
            onChange={handlePersonalChange}
            placeholder="Enter your name"
            disabled={isViewMode}
        />



        <label>Email</label>

        <input
            name="email"
            value={personal.email}
            onChange={handlePersonalChange}
            placeholder="example@gmail.com"
            disabled={isViewMode}
        />



        <label>Phone</label>

        <input
            name="phone"
            value={personal.phone}
            onChange={handlePersonalChange}
            placeholder="Phone number"
            disabled={isViewMode}
        />



        <label>Location</label>

        <input
            name="location"
            value={personal.location}
            onChange={handlePersonalChange}
            placeholder="City, Country"
            disabled={isViewMode}
        />



        <label>LinkedIn</label>

        <input
            name="linkedin"
            value={personal.linkedin}
            onChange={handlePersonalChange}
            placeholder="LinkedIn URL"
            disabled={isViewMode}
        />



        <label>GitHub</label>

        <input
            name="github"
            value={personal.github}
            onChange={handlePersonalChange}
            placeholder="GitHub URL"
            disabled={isViewMode}
        />

        <label>Professional Summary</label>

        <textarea
            placeholder="Professional Summary"
            value={summary}
            onChange={(e)=>setSummary(e.target.value)}
            disabled={isViewMode}
        />



        </div>

        {/* EDUCATION SECTION */}

        <div className="section">

            <h2>
                Education
            </h2>


            {
                education.map((edu,index)=>(

                    <div
                        className="education-card"
                        key={index}
                    >

                        <label>College Name</label>

                        <input
                            name="college"
                            value={edu.college}
                            placeholder="University / College"
                            onChange={(e)=>handleEducationChange(index,e)}
                            disabled={isViewMode}
                        />


                        <label>Degree</label>

                        <input
                            name="degree"
                            value={edu.degree}
                            placeholder="BSc, B.Tech, MCA..."
                            onChange={(e)=>handleEducationChange(index,e)}
                            disabled={isViewMode}
                        />


                        <label>Passing Year</label>

                        <input
                            name="year"
                            value={edu.year}
                            placeholder="2019 - 2022"
                            onChange={(e)=>handleEducationChange(index,e)}
                            disabled={isViewMode}
                        />



                        {
                            education.length > 1 &&

                            <button
                                className="delete-btn"
                                onClick={()=>removeEducation(index)}
                            >
                                Remove
                            </button>


                        }


                    </div>

                ))
            }


{!isViewMode && (

            <button
                className="add-btn"
                onClick={addEducation}
            >

                + Add Education

            </button>

)}
        </div>






        {/* EXPERIENCE SECTION */}


        <div className="section">


            <h2>
                Professional Experience
            </h2>



            {
                experience.map((exp,index)=>(


                    <div
                        className="education-card"
                        key={index}
                    >


                        <label>Company</label>


                        <input

                            name="company"

                            value={exp.company}

                            placeholder="Company Name"

                            onChange={(e)=>
                                handleExperienceChange(index,e)
                            }
                            disabled={isViewMode}

                        />



                        <label>Role</label>


                        <input

                            name="role"

                            value={exp.role}

                            placeholder="Senior Systems Associate"

                            onChange={(e)=>
                                handleExperienceChange(index,e)
                            }
                            disabled={isViewMode}

                        />




                        <label>Duration</label>


                        <input

                            name="duration"

                            value={exp.duration}

                            placeholder="June 2024 - Present"

                            onChange={(e)=>
                                handleExperienceChange(index,e)
                            }
                            disabled={isViewMode}

                        />

                        <label>Work Summary (one bullet per line)</label>

                        <textarea
                            name="responsibilities"
                            rows={6}
                            value={exp.responsibilities}
                            placeholder={`Example:

Developed Angular applications
Integrated REST APIs
Fixed production issues
Worked in Agile team`}
                            onChange={(e)=>handleExperienceChange(index,e)}
                            disabled={isViewMode}
                        />




                        {
                            experience.length > 1 &&


                            <button

                                className="delete-btn"

                                onClick={()=>
                                    removeExperience(index)
                                }

                            >

                                Remove

                            </button>
                            

                        }


                    </div>


                ))

            }



{!isViewMode && (

            <button

                className="add-btn"

                onClick={addExperience}

            >

                + Add Experience

            </button>
)}

        </div>







        {/* PROJECT SECTION */}


        <div className="section">


            <h2>
                Projects
            </h2>



            {
                projects.map((project,index)=>(


                    <div

                        className="education-card"

                        key={index}

                    >



                        <label>
                            Project Title
                        </label>



                        <input

                            name="title"

                            value={project.title}

                            placeholder="Project name"

                            onChange={(e)=>
                                handleProjectChange(index,e)
                            }
                            disabled={isViewMode}

                        />





                        <label>
                            Description
                        </label>



                        <input

                            name="description"

                            value={project.description}

                            placeholder="Explain your project"

                            onChange={(e)=>
                                handleProjectChange(index,e)
                            }
                            disabled={isViewMode}

                        />





                        {
                            projects.length > 1 &&


                            <button

                                className="delete-btn"

                                onClick={()=>
                                    removeProject(index)
                                }

                            >

                                Remove

                            </button>


                        }


                    </div>


                ))

            }




{!isViewMode && (

            <button

                className="add-btn"

                onClick={addProject}

            >

                + Add Project

            </button>
)}


        </div>








        {/* SKILLS SECTION */}



        <div className="section">


            <h2>
                Technical Skills
            </h2>



            {
                skills.map((skill,index)=>(


                    <div

                        className="education-card"

                        key={index}

                    >



                        <input

                            value={skill}

                            placeholder="React, Python, SQL..."

                            onChange={(e)=>
                                handleSkillChange(
                                    index,
                                    e.target.value
                                )
                            }
                            disabled={isViewMode}

                        />




                        {
                            skills.length > 1 &&


                            <button

                                className="delete-btn"

                                onClick={()=>
                                    removeSkill(index)
                                }

                            >

                                Remove

                            </button>


                        }



                    </div>


                ))

            }




{!isViewMode && (

            <button

                className="add-btn"

                onClick={addSkill}

            >

                + Add Skill

            </button>

)}

        </div>



        {/* ACHIEVEMENTS SECTION */}


        <div className="section">


            <h2>
                Achievements
            </h2>



            {
                achievements.map((achievement, index) => (


                    <div

                        className="education-card"

                        key={index}

                    >



                        <input

                            value={achievement}

                            placeholder="e.g. Received the Infosys Insta Award twice..."

                            onChange={(e) =>
                                handleAchievementChange(
                                    index,
                                    e.target.value
                                )
                            }
                            disabled={isViewMode}

                        />




                        {
                            achievements.length > 1 &&


                            <button

                                className="delete-btn"

                                onClick={() =>
                                    removeAchievement(index)
                                }

                            >

                                Remove

                            </button>


                        }



                    </div>


                ))

            }




{!isViewMode && (

            <button

                className="add-btn"

                onClick={addAchievement}

            >

                + Add Achievement

            </button>

)}

        </div>


<label>Resume Template</label>

<select
  value={template}
  onChange={(e) => setTemplate(e.target.value)}
>
  <option value="professional">Professional</option>
  <option value="modern">Modern</option>
  <option value="minimal">Minimal</option>
</select>


{!isViewMode && (
        <button

            className="save-btn"

            onClick={handleSave}

        >

            {
                loading
                ?
                "Saving..."
                :
                "Save Resume"
            }


        </button>

        )}

        </div>










        {/* ================= RESUME PREVIEW ================= */}



<div className="resume-preview">

    {/* HEADER */}

    <div className="resume-header">

        <h1>{personal.fullName || "Your Name"}</h1>


        <div className="contact-info">

            {personal.location && <span>{personal.location}</span>}

            {personal.phone && <span>{personal.phone}</span>}

            {personal.email && <span>{personal.email}</span>}

        </div>

        {(personal.linkedin || personal.github) && (

            <div className="contact-links">

                {personal.linkedin && (
                    <span>LinkedIn: {personal.linkedin}</span>
                )}

                {personal.github && (
                    <span>GitHub: {personal.github}</span>
                )}

            </div>

        )}

    </div>


    {/* SUMMARY */}

    {summary && (

        <div className="preview-section">

            <h2>Professional Summary</h2>

            <p>{summary}</p>

        </div>

    )}


    {/* SKILLS */}

    {skills.filter(skill => skill).length > 0 && (

        <div className="preview-section">

            <h2>Technical Skills</h2>

            <div className="skills-preview">

                {skills
                    .filter(skill => skill)
                    .map((skill, index) => (

                        <span
                            className="skill-chip"
                            key={index}
                        >
                            {skill}
                        </span>

                    ))}

            </div>

        </div>

    )}


    {/* EXPERIENCE */}

    {experience.filter(exp => exp.company || exp.role).length > 0 && (

        <div className="preview-section">

            <h2>Professional Experience</h2>

            {experience.map((exp, index) => (

                (exp.company || exp.role) && (

                    <div
                        className="preview-card"
                        key={index}
                    >

                        <div className="card-header">

                            <div>

                                <h3>{exp.role}</h3>

                                <strong>{exp.company}</strong>

                            </div>

                            <span className="duration">
                                {exp.duration}
                            </span>

                        </div>

                        {exp.responsibilities && (

                            <ul className="responsibilities">

                                {exp.responsibilities

                                    .split("\n")

                                    .map(line => line.trim())

                                    .filter(line => line)

                                    .map((line, i) => (

                                        <li key={i}>{line}</li>

                                    ))}

                            </ul>

                        )}

                    </div>

                )

            ))}

        </div>

    )}


    {/* PROJECTS */}

    {projects.filter(project => project.title || project.description).length > 0 && (

        <div className="preview-section">

            <h2>Projects</h2>

            {projects.map((project, index) => (

                (project.title || project.description) && (

                    <div
                        className="preview-card"
                        key={index}
                    >

                        <h3>{project.title}</h3>

                        <p>{project.description}</p>

                    </div>

                )

            ))}

        </div>

    )}


    {/* EDUCATION */}

    {education.filter(edu => edu.college || edu.degree).length > 0 && (

        <div className="preview-section">

            <h2>Education</h2>

            {education.map((edu, index) => (

                (edu.college || edu.degree) && (

                    <div
                        className="preview-card"
                        key={index}
                    >

                        <div className="card-header">

                            <div>

                                <h3>{edu.degree}</h3>

                                <strong>{edu.college}</strong>

                            </div>

                            <span className="duration">
                                {edu.year}
                            </span>

                        </div>

                    </div>

                )

            ))}

        </div>

    )}


    {/* ACHIEVEMENTS */}

    {achievements.filter(a => a).length > 0 && (

        <div className="preview-section">

            <h2>Achievements</h2>

            <ul className="achievement-list">

                {achievements

                    .filter(a => a)

                    .map((achievement, index) => (

                        <li key={index}>{achievement}</li>

                    ))}

            </ul>

        </div>

    )}

</div>





        </div>


        </div>


        </>

    );

}



export default ResumeBuilder;
