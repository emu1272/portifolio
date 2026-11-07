import { useEffect, useState } from "react";
import Login from "./Login";
import CVPage from "./CVPage";
import CertificatePage from "./CertificatePage";
import "./App.css";
import AdminDashboard from "./AdminDashboard";

const BASE_URL    = "https://emuportifolio.onrender.com";
const API_URL     = `${BASE_URL}/api/projects`;
const CONTACT_URL = `${BASE_URL}/api/contact`;

const skills = [
  // Web
  { name: "HTML5",      level: "Intermediate", pct: 75, category: "Web" },
  { name: "CSS3",       level: "Intermediate", pct: 70, category: "Web" },
  { name: "JavaScript", level: "Intermediate", pct: 65, category: "Web" },
  { name: "PHP",        level: "Intermediate", pct: 65, category: "Web" },
  { name: "React",      level: "Intermediate", pct: 60, category: "Web" },
  { name: "Next.js",    level: "Learning",     pct: 45, category: "Web" },
  // Database
  { name: "MySQL",      level: "Intermediate", pct: 65, category: "Database" },
  { name: "MongoDB",    level: "Learning",     pct: 40, category: "Database" },
  // Programming
  { name: "Python",     level: "Basic",        pct: 35, category: "Programming" },
  { name: "Java",       level: "Intermediate", pct: 55, category: "Programming" },
  // System
  { name: "Linux",      level: "Basic",        pct: 35, category: "System" },
];

const TYPING_TEXTS = [
  "Computer Science Student",
  "Web Developer",
  "React Learner",
  "Problem Solver",
];

// Menu — fixed list, no dependency on login state
function getMenu() {
  return ["Home","About","Skills","Projects","CV","Certificates","Contact"];
}

// ── Typing hook ───────────────────────────────────────────────────────────────
function useTyping(texts) {
  const [display, setDisplay] = useState("");
  const [idx, setIdx]         = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = texts[idx];
    const speed   = deleting ? 50 : 100;

    const timer = setTimeout(() => {
      if (!deleting) {
        setDisplay(current.slice(0, charIdx + 1));
        if (charIdx + 1 === current.length) {
          setTimeout(() => setDeleting(true), 1500);
        } else {
          setCharIdx(c => c + 1);
        }
      } else {
        setDisplay(current.slice(0, charIdx - 1));
        if (charIdx - 1 === 0) {
          setDeleting(false);
          setIdx(i => (i + 1) % texts.length);
          setCharIdx(0);
        } else {
          setCharIdx(c => c - 1);
        }
      }
    }, speed);

    return () => clearTimeout(timer);
  }, [charIdx, deleting, idx, texts]);

  return display;
}

// ── Skill bar component ───────────────────────────────────────────────────────
function SkillCard({ skill, animate }) {
  return (
    <article className="skill-card">
      <h3>{skill.name}</h3>
      <div className="skill-level-label">
        <span>Proficiency</span>
        <span>{skill.level}</span>
      </div>
      <div className="skill-bar-bg">
        <div
          className="skill-bar-fill"
          style={{ width: animate ? `${skill.pct}%` : "0%" }}
        />
      </div>
    </article>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [isAdmin, setIsAdmin]       = useState(false);
  const [activePage, setActivePage] = useState("Home");
  const [projects, setProjects]     = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [form, setForm]             = useState({ name: "", email: "", message: "" });
  const [photoError, setPhotoError] = useState(false);
  const [theme, setTheme]           = useState("dark");
  const [scrollPct, setScrollPct]   = useState(0);
  const [showTop, setShowTop]       = useState(false);
  const [skillsAnimate, setSkillsAnimate] = useState(false);
  const [activeFilter, setActiveFilter]   = useState("All");
  const [filters, setFilters]             = useState(["All"]);
  const [skillCat, setSkillCat]           = useState("");

  const typingText = useTyping(TYPING_TEXTS);

  // Apply theme class to body
  useEffect(() => {
    document.body.classList.remove("dark", "light");
    document.body.classList.add(theme);
  }, [theme]);

  // Check admin session on load
  useEffect(() => {
    fetch("https://emuportifolio.onrender.com/api/auth/me", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.user?.role === "admin") setIsAdmin(true); })
      .catch(() => {});
  }, []);

  // Scroll progress bar + back-to-top visibility
  useEffect(() => {
    function onScroll() {
      const el  = document.documentElement;
      const pct = (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100;
      setScrollPct(isNaN(pct) ? 0 : pct);
      setShowTop(el.scrollTop > 300);
    }
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Animate skill bars when Skills page opens
  useEffect(() => {
    if (activePage === "Skills") {
      setSkillsAnimate(false);
      const t = setTimeout(() => setSkillsAnimate(true), 100);
      return () => clearTimeout(t);
    }
  }, [activePage]);

  // Build project filters from loaded projects
  useEffect(() => {
    if (projects.length === 0) return;
    const techs = new Set();
    projects.forEach(p => (p.technologies || []).forEach(t => techs.add(t)));
    setFilters(["All", ...Array.from(techs)]);
  }, [projects]);

  // Load projects when page opens
  useEffect(() => {
    if (activePage !== "Projects") return;
    const ctrl = new AbortController();

    async function load() {
      setLoading(true); setError("");
      try {
        const r = await fetch(API_URL, { signal: ctrl.signal });
        if (!r.ok) throw new Error(`Server returned ${r.status}`);
        const res = await r.json();
        if (!res.success || !Array.isArray(res.data)) throw new Error("Bad response");
        setProjects(res.data);
      } catch (e) {
        if (e.name !== "AbortError") setError("Could not load projects. Please check your backend.");
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => ctrl.abort();
  }, [activePage]);

  function showPage(page) {
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateForm(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  async function submitContact(e) {
    e.preventDefault();
    try {
      const r = await fetch(CONTACT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!r.ok) throw new Error("Failed");
      setForm({ name: "", email: "", message: "" });
      alert("Message sent successfully!");
    } catch {
      alert("Message was not sent. Check your backend.");
    }
  }

  // Filtered projects
  const visibleProjects = activeFilter === "All"
    ? projects
    : projects.filter(p => (p.technologies || []).includes(activeFilter));

  return (
    <div className="portfolio">
      {/* Scroll progress bar */}
      <div className="scroll-progress" style={{ width: `${scrollPct}%` }} />

      {/* Navbar */}
      <header className="navbar">
        <button className="logo" onClick={() => showPage("Home")}>
          EM<span>.</span>
        </button>

        <nav aria-label="Main navigation">
          {getMenu().map(page => (
            <button
              key={page}
              className={`nav-link ${
                activePage === page ||
                (page === "Admin" && activePage === "AdminDashboard")
                  ? "active" : ""
              } ${page === "Admin" ? "nav-admin" : ""}`}
              onClick={() => page === "Admin" ? showPage("AdminDashboard") : showPage(page)}
              aria-current={activePage === page ? "page" : undefined}
            >
              {page === "Admin" ? "⚡ Admin" : page}
            </button>
          ))}
        </nav>

        <div className="navbar-right">
          <button
            className="theme-toggle"
            onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>

          {/* Show login button when not admin, Dashboard+Logout when admin */}
          {!isAdmin ? (
            <button
              className="nav-admin-btn"
              onClick={() => showPage("Login")}
            >
              🔐 Login
            </button>
          ) : (
            <div className="navbar-admin-group">
              <button
                className="nav-admin-btn active"
                onClick={() => showPage("AdminDashboard")}
              >
                ⚡ Dashboard
              </button>
              <button
                className="nav-logout-btn"
                onClick={async () => {
                  await fetch("https://emuportifolio.onrender.com/api/auth/logout", {
                    method: "POST",
                    credentials: "include",
                  });
                  setIsAdmin(false);
                  showPage("Home");
                }}
              >
                🚪 Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="main-content">

        {/* ── HOME ─────────────────────────────── */}
        {activePage === "Home" && (
          <section className="hero page-section page-fade">
            <div className="hero-text">
              <p className="eyebrow">WELCOME TO MY PORTFOLIO</p>
              <h1>Hi, I'm <span>Emebet Morde</span></h1>
              <h2>
                <span className="typing-text">{typingText}</span>
              </h2>
              <p>
                I build responsive websites and enjoy learning new technologies
                to solve real-world problems.
              </p>

              <div className="hero-buttons">
                <button onClick={() => showPage("Projects")}>View My Projects</button>
                <button className="secondary-button" onClick={() => showPage("Contact")}>Contact Me</button>
                <a
                  className="hero-buttons cv-button"
                  href="/emebetcv.pdf"
                  download
                  style={{
                    padding: "12px 20px",
                    border: "1px solid #a78bfa",
                    borderRadius: "8px",
                    background: "transparent",
                    color: "#a78bfa",
                    textDecoration: "none",
                    fontSize: "inherit",
                    transition: "all 0.2s",
                  }}
                >
                  📄 Download CV
                </a>
              </div>

              {/* Social links */}
              <div className="social-links">
                <a className="social-link" href="https://github.com/emu1272" target="_blank" rel="noopener noreferrer">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.73.083-.73 1.205.085 1.84 1.238 1.84 1.238 1.07 1.835 2.807 1.305 3.492.998.108-.776.418-1.305.762-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.468-2.382 1.236-3.22-.124-.303-.536-1.523.117-3.176 0 0 1.008-.322 3.3 1.23A11.5 11.5 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.29-1.552 3.297-1.23 3.297-1.23.655 1.653.243 2.873.12 3.176.77.838 1.235 1.91 1.235 3.22 0 4.61-2.807 5.625-5.48 5.92.43.372.823 1.102.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .322.216.694.825.577C20.565 21.797 24 17.3 24 12c0-6.63-5.37-12-12-12z"/></svg>
                  GitHub
                </a>
                <a className="social-link" href="https://linkedin.com/in/emebet-morde" target="_blank" rel="noopener noreferrer">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  LinkedIn
                </a>
                <a className="social-link" href="mailto:emebt12321@gmail.com">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/></svg>
                  Email
                </a>
              </div>
            </div>

            <div className="photo-frame">
              {!photoError ? (
                <img
                  src="/images/profil.png"
                  alt="Emebet Morde"
                  onError={e => {
                    if (e.target.src.includes("profil.png")) {
                      e.target.src = "/images/profil.jpg";
                    } else if (e.target.src.includes("profil.jpg")) {
                      e.target.src = "/images/profil.svg";
                    } else {
                      setPhotoError(true);
                    }
                  }}
                />
              ) : (
                <div className="photo-placeholder">
                  <span>EM</span>
                  <p>Add your profile photo</p>
                </div>
              )}
            </div>
          </section>
        )}



        {/* ── CV PAGE ──────────────────────────── */}
        {activePage === "CV" && (
          <CVPage onBack={() => showPage("Home")} />
        )}

        {/* ── CERTIFICATES ─────────────────────── */}
        {activePage === "Certificates" && (
          <CertificatePage onBack={() => showPage("Home")} />
        )}

        {/* ── LOGIN ─────────────────────────────── */}
        {activePage === "Login" && (
          <Login
            onBack={() => showPage("Home")}
            onLogin={() => { setIsAdmin(true); showPage("AdminDashboard"); }}
          />
        )}

        {/* ── ADMIN DASHBOARD ──────────────────── */}
        {activePage === "AdminDashboard" && isAdmin && (
          <section className="page-section content-section page-fade">
            <AdminDashboard
              onLogout={() => { setIsAdmin(false); showPage("Home"); }}
            />
          </section>
        )}

        {/* ── ABOUT ─────────────────────────────── */}
        {activePage === "About" && (
          <section className="page-section content-section page-fade">
            <p className="eyebrow">GET TO KNOW ME</p>
            <h1>About Me</h1>

            {/* ── About + Contact info side by side ── */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: 40,
              alignItems: "start",
              marginBottom: 40
            }}>
              <div>
                <p>
                  I am <strong style={{ color: "var(--accent)" }}>Emebet Morde</strong>, a Computer Science student at Wollo University, Kombolcha Institute of Technology. I am passionate about web development, software engineering, and database systems.
                </p>
                <p>
                  I build practical projects using HTML, CSS, JavaScript, PHP, React, Node.js, Express, and MySQL. I enjoy solving real-world problems through clean and efficient code.
                </p>

                <h2 style={{ marginTop: 28 }}>My Goal</h2>
                <p>
                  My goal is to become a skilled full-stack web developer and build useful, reliable, and user-friendly applications that make a difference.
                </p>
              </div>

              {/* Contact info card */}
              <div style={{
                padding: "24px 28px",
                borderRadius: 14,
                background: "var(--bg2)",
                border: "1px solid var(--border)",
                boxShadow: "var(--card-shadow)",
                minWidth: 220,
                flexShrink: 0
              }}>
                <h3 style={{ margin: "0 0 16px", color: "var(--accent)", fontSize: 14, textTransform: "uppercase", letterSpacing: 1 }}>Contact Info</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <a href="tel:+251941658537" style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--text2)", textDecoration: "none", fontSize: 14 }}>
                    <span style={{ fontSize: 18 }}>📞</span>
                    <span>0941658537</span>
                  </a>
                  <a href="mailto:emebt12321@gmail.com" style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--text2)", textDecoration: "none", fontSize: 14 }}>
                    <span style={{ fontSize: 18 }}>📧</span>
                    <span>emebt12321@gmail.com</span>
                  </a>
                  <a href="https://github.com/emu1272" target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--text2)", textDecoration: "none", fontSize: 14 }}>
                    <span style={{ fontSize: 18 }}>🐙</span>
                    <span>github.com/emu1272</span>
                  </a>
                </div>
              </div>
            </div>

            {/* ── Education ───────────────────── */}
            <div style={{
              paddingTop: 40,
              borderTop: "1px solid var(--border)"
            }}>
              <p className="eyebrow">MY ACADEMIC BACKGROUND</p>
              <h2>Education</h2>

              {/* Degree card */}
              <div style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 20,
                padding: 28,
                marginTop: 20,
                marginBottom: 40,
                borderRadius: 16,
                background: "var(--bg2)",
                border: "1px solid var(--border)",
                boxShadow: "var(--card-shadow)"
              }}>
                <div style={{ fontSize: 42, flexShrink: 0 }}>🎓</div>
                <div>
                  <h3 style={{ margin: "0 0 6px", color: "var(--text)", fontSize: 20 }}>
                    Bachelor of Science in Computer Science
                  </h3>
                  <p style={{ margin: "0 0 4px", color: "var(--accent)", fontWeight: 600 }}>
                    Wollo University — Kombolcha Institute of Technology
                  </p>
                  <p style={{ margin: "0 0 12px", color: "var(--text3)", fontSize: 14 }}>
                    Department of Computer Science
                  </p>
                  <span style={{
                    display: "inline-block",
                    padding: "5px 14px",
                    borderRadius: 20,
                    background: "var(--bg3)",
                    color: "var(--accent)",
                    fontSize: 13,
                    fontWeight: 600,
                    border: "1px solid var(--accent)"
                  }}>
                    Currently Studying
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── SKILLS ───────────────────────────── */}
        {activePage === "Skills" && (
          <section className="page-section page-fade">
            <div className="skills-layout">
              {/* Left — title & description */}
              <div className="skills-left reveal-left">
                <p className="eyebrow">WHAT I CAN DO</p>
                <h1>My Skills</h1>
                <p>Technologies I know and am currently learning across web development, databases, programming languages, and networking.</p>

                {/* Category filter */}
                <div className="skills-filter">
                  {["All", "Web", "Database", "Programming", "System"].map(cat => (
                    <button
                      key={cat}
                      className={`filter-btn ${(skillCat === cat || (!skillCat && cat === "All")) ? "active" : ""}`}
                      onClick={() => setSkillCat(cat === "All" ? "" : cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Right — skill cards */}
              <div className="skills-right">
                <div className="skills-grid">
                  {skills
                    .filter(s => !skillCat || s.category === skillCat)
                    .map(skill => (
                      <SkillCard key={skill.name} skill={skill} animate={skillsAnimate} />
                    ))}
                </div>
              </div>
            </div>
          </section>
        )}



        {/* ── PROJECTS ─────────────────────────── */}
        {activePage === "Projects" && (
          <section className="page-section content-section page-fade">
            <p className="eyebrow">MY WORK</p>
            <h1>My Projects</h1>

            {loading && <p>Loading projects…</p>}
            {error   && <p className="error-message">{error}</p>}

            {!loading && !error && projects.length > 0 && (
              <div className="project-filter">
                {filters.map(f => (
                  <button
                    key={f}
                    className={`filter-btn ${activeFilter === f ? "active" : ""}`}
                    onClick={() => setActiveFilter(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>
            )}

            {!loading && !error && visibleProjects.length === 0 && (
              <p>No projects match this filter.</p>
            )}

            <div className="projects-grid">
              {visibleProjects.map(project => (
                <article className="project-card" key={project.id}>
                  {project.featured && <span className="featured">⭐ Featured</span>}
                  <h2>{project.title}</h2>
                  <p>{project.description}</p>

                  <div className="technology-list">
                    {project.technologies?.map(t => <span key={t}>{t}</span>)}
                  </div>

                  <div className="project-links">
                    {project.githubUrl && (
                      <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">GitHub ↗</a>
                    )}
                    {project.liveUrl && (
                      <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">Live Demo ↗</a>
                    )}
                    {!project.githubUrl && !project.liveUrl && (
                      <span style={{ color: "var(--text3)", fontSize: 13 }}>🔒 Coming Soon</span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* ── CONTACT ──────────────────────────── */}
        {activePage === "Contact" && (
          <section className="page-section content-section contact-section page-fade">
            <p className="eyebrow">LET'S TALK</p>
            <h1>Contact Me</h1>
            <p>Have a project idea or question? Send me a message.</p>

            <form onSubmit={submitContact} className="contact-form">
              <label htmlFor="name">Your name</label>
              <input id="name" name="name" value={form.name} onChange={updateForm} required placeholder="Enter your name" />

              <label htmlFor="email">Email address</label>
              <input id="email" name="email" type="email" value={form.email} onChange={updateForm} required placeholder="Enter your email" />

              <label htmlFor="message">Message</label>
              <textarea id="message" name="message" value={form.message} onChange={updateForm} required rows={5} placeholder="Write your message" />

              <button type="submit">Send Message</button>
            </form>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>© {new Date().getFullYear()} Emebet Morde. All rights reserved.</p>
      </footer>

      {/* Back to top button */}
      <button
        className={`back-to-top ${showTop ? "visible" : ""}`}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Back to top"
      >
        ↑
      </button>
    </div>
  );
}
