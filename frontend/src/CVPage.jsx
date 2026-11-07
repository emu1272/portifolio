import "./CVPage.css";

export default function CVPage({ onBack }) {
  const cvUrl = "/emebetcv.pdf";

  return (
    <section className="cv-page-section page-fade">
      <p className="eyebrow">MY RESUME</p>
      <h1>CV / Resume</h1>
      <p style={{ color: "var(--text2)", marginBottom: 40 }}>
        Download or view my full CV below.
      </p>

      {/* ── Two buttons only ─────────────────── */}
      <div className="cv-buttons-row">

        {/* View button — opens PDF in new tab */}
        <a
          href={cvUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="cv-btn cv-btn-view"
        >
          👁️ View CV
        </a>

        {/* Download button */}
        <a
          href={cvUrl}
          download="emebetcv.pdf"
          className="cv-btn cv-btn-download"
        >
          ⬇️ Download CV
        </a>

      </div>

      {/* ── Info card ────────────────────────── */}
      <div className="cv-info-card">
        <div className="cv-info-icon">📄</div>
        <div>
          <h3>Emebet Morde — CV</h3>
          <p>Computer Science Student & Web Developer</p>
          <p>Wollo University — Kombolcha Institute of Technology</p>
        </div>
      </div>

      <button className="cv-back-btn" onClick={onBack}>
        ← Back to Portfolio
      </button>
    </section>
  );
}
