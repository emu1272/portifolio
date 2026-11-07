import "./CVPage.css";

export default function CertificatePage({ onBack }) {
  const certUrl = "/certificate.pdf";

  return (
    <section className="cv-page-section page-fade">
      <p className="eyebrow">MY ACHIEVEMENTS</p>
      <h1>Certificate</h1>
      <p style={{ color: "var(--text2)", marginBottom: 40 }}>
        View and download my certificate below.
      </p>

      {/* ── Two buttons ─────────────────────── */}
      <div className="cv-buttons-row">
        <a
          href={certUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="cv-btn cv-btn-view"
        >
          👁️ View Certificate
        </a>
        <a
          href={certUrl}
          download="certificate.pdf"
          className="cv-btn cv-btn-download"
        >
          ⬇️ Download Certificate
        </a>
      </div>

      {/* ── Info card ────────────────────────── */}
      <div className="cv-info-card">
        <div className="cv-info-icon">🏆</div>
        <div>
          <h3>Emebet Morde — Certificate</h3>
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
