import { useState, useEffect, useCallback } from "react";
import "./AdminDashboard.css";

const API = "http://localhost:5000/api";

// ─── Blank project form ───────────────────────────────────────────────────────
const BLANK_PROJECT = {
  title: "",
  description: "",
  technologies: "",
  githubUrl: "",
  liveUrl: "",
  featured: false,
};

// ─── Overview Section ─────────────────────────────────────────────────────────
function OverviewSection() {
  const [counts, setCounts] = useState({ projects: "-", messages: "-" });

  useEffect(() => {
    Promise.all([
      fetch(`${API}/projects`, { credentials: "include" }).then((r) => r.json()),
      fetch(`${API}/messages`, { credentials: "include" }).then((r) => r.json()),
    ])
      .then(([proj, msg]) => {
        setCounts({
          projects: proj.success ? proj.count : "—",
          messages: msg.success ? msg.count : "—",
        });
      })
      .catch(() => {});
  }, []);

  return (
    <section>
      <h2>Welcome, Emebet!</h2>
      <p>Manage your projects and visitor messages from here.</p>

      <div className="admin-stats">
        <div className="admin-stat-card">
          <h3>Total Projects</h3>
          <p>{counts.projects}</p>
        </div>
        <div className="admin-stat-card">
          <h3>Contact Messages</h3>
          <p>{counts.messages}</p>
        </div>
      </div>
    </section>
  );
}

// ─── Projects Section ─────────────────────────────────────────────────────────
function ProjectsSection() {
  const [projects, setProjects] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [form, setForm] = useState(BLANK_PROJECT);
  const [editingId, setEditingId] = useState(null);
  const [formVisible, setFormVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadProjects = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch(`${API}/projects`, { credentials: "include" });
      const data = await res.json();
      setProjects(data.success ? data.data : []);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  function openAdd() {
    setEditingId(null);
    setForm(BLANK_PROJECT);
    setFormVisible(true);
  }

  function openEdit(project) {
    setEditingId(project.id);
    setForm({
      title: project.title,
      description: project.description,
      technologies: Array.isArray(project.technologies)
        ? project.technologies.join(", ")
        : project.technologies,
      githubUrl: project.githubUrl,
      liveUrl: project.liveUrl,
      featured: project.featured,
    });
    setFormVisible(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      ...form,
      technologies: form.technologies.split(",").map((t) => t.trim()).filter(Boolean),
    };

    try {
      const url = editingId ? `${API}/projects/${editingId}` : `${API}/projects`;
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Save failed.");

      setFormVisible(false);
      loadProjects();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id, title) {
    if (!window.confirm(`Delete "${title}"?`)) return;

    try {
      const res = await fetch(`${API}/projects/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Delete failed.");
      loadProjects();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <h2 style={{ margin: 0 }}>Project Management</h2>
        <button onClick={openAdd}>+ Add Project</button>
      </div>

      {formVisible && (
        <form onSubmit={handleSave} className="admin-project-form">
          <h3>{editingId ? "Edit Project" : "New Project"}</h3>

          <label>Title *
            <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </label>

          <label>Description *
            <textarea required rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </label>

          <label>Technologies (comma-separated)
            <input value={form.technologies} placeholder="React, Node.js, MySQL" onChange={e => setForm(f => ({ ...f, technologies: e.target.value }))} />
          </label>

          <label>GitHub URL
            <input type="url" value={form.githubUrl} onChange={e => setForm(f => ({ ...f, githubUrl: e.target.value }))} />
          </label>

          <label>Live URL
            <input type="url" value={form.liveUrl} onChange={e => setForm(f => ({ ...f, liveUrl: e.target.value }))} />
          </label>

          <label className="admin-checkbox-label">
            <input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} />
            Featured project
          </label>

          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</button>
            <button type="button" className="btn-secondary" onClick={() => setFormVisible(false)}>Cancel</button>
          </div>
        </form>
      )}

      {status === "loading" && <p>Loading projects…</p>}
      {status === "error" && <p style={{ color: "#e74c3c" }}>Failed to load projects.</p>}

      {status === "ready" && projects.length === 0 && (
        <p>No projects yet. Click "+ Add Project" to create one.</p>
      )}

      {status === "ready" && projects.length > 0 && (
        <ul className="admin-project-list">
          {projects.map((p) => (
            <li key={p.id}>
              <div>
                <strong>{p.title}</strong>
                {p.featured && <span className="badge-featured">Featured</span>}
                <p style={{ margin: "4px 0", color: "#64748b", fontSize: 14 }}>{p.description}</p>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button onClick={() => openEdit(p)}>Edit</button>
                <button className="btn-danger" onClick={() => handleDelete(p.id, p.title)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ─── Certificates Section ─────────────────────────────────────────────────────
function CertificatesSection() {
  const [certs, setCerts]       = useState([]);
  const [status, setStatus]     = useState("loading");
  const [saving, setSaving]     = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [form, setForm]         = useState({ title: "", issuer: "", date: "", file_url: "" });

  function loadCerts() {
    setStatus("loading");
    fetch(`${API}/certificates`, { credentials: "include" })
      .then(r => r.json())
      .then(data => { setCerts(data.success ? data.data : []); setStatus("ready"); })
      .catch(() => setStatus("error"));
  }

  useEffect(() => { loadCerts(); }, []);

  async function handleAdd(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API}/certificates`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      setForm({ title: "", issuer: "", date: "", file_url: "" });
      setFormVisible(false);
      loadCerts();
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id, title) {
    if (!window.confirm(`Delete "${title}"?`)) return;
    try {
      const res = await fetch(`${API}/certificates/${id}`, { method: "DELETE", credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      loadCerts();
    } catch (err) { alert(err.message); }
  }

  return (
    <section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <h2 style={{ margin: 0 }}>Certificates</h2>
        <button onClick={() => setFormVisible(!formVisible)}>+ Add Certificate</button>
      </div>

      {formVisible && (
        <form onSubmit={handleAdd} className="admin-project-form">
          <h3>New Certificate</h3>
          <label>Title *
            <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Web Development" />
          </label>
          <label>Issuer *
            <input required value={form.issuer} onChange={e => setForm(f => ({ ...f, issuer: e.target.value }))} placeholder="e.g. Coursera, Udemy" />
          </label>
          <label>Date *
            <input required value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} placeholder="e.g. 2024" />
          </label>
          <label>File URL (optional)
            <input value={form.file_url} onChange={e => setForm(f => ({ ...f, file_url: e.target.value }))} placeholder="/certificate1.pdf" />
          </label>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</button>
            <button type="button" className="btn-secondary" onClick={() => setFormVisible(false)}>Cancel</button>
          </div>
        </form>
      )}

      {status === "loading" && <p>Loading…</p>}
      {status === "error"   && <p style={{ color: "#e74c3c" }}>Failed to load.</p>}
      {status === "ready" && certs.length === 0 && <p>No certificates yet. Click "+ Add Certificate".</p>}

      {status === "ready" && certs.length > 0 && (
        <ul className="admin-project-list" style={{ marginTop: 20 }}>
          {certs.map(c => (
            <li key={c.id}>
              <div>
                <strong>🏆 {c.title}</strong>
                <p style={{ margin: "4px 0", color: "var(--text3)", fontSize: 14 }}>{c.issuer} — {c.date}</p>
                {c.file_url && (
                  <a href={c.file_url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)", fontSize: 13 }}>
                    View Certificate ↗
                  </a>
                )}
              </div>
              <button className="btn-danger" onClick={() => handleDelete(c.id, c.title)}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
function MessagesSection() {
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    fetch(`${API}/messages`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        setMessages(data.success ? data.data : []);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);

  return (
    <section>
      <h2>Visitor Messages</h2>

      {status === "loading" && <p>Loading messages…</p>}
      {status === "error" && <p style={{ color: "#e74c3c" }}>Failed to load messages. Make sure the backend and database are running.</p>}

      {status === "ready" && messages.length === 0 && (
        <p>No messages yet.</p>
      )}

      {status === "ready" && messages.length > 0 && (
        <ul className="admin-message-list">
          {messages.map((m) => (
            <li key={m.id}>
              <div className="msg-header">
                <strong>{m.name}</strong>
                <a href={`mailto:${m.email}`}>{m.email}</a>
                <span className="msg-date">{new Date(m.received_at).toLocaleString()}</span>
              </div>
              <p className="msg-body">{m.message}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ─── Settings Section ─────────────────────────────────────────────────────────
function SettingsSection() {
  return (
    <section>
      <h2>Admin Settings</h2>
      <p>To change your admin password or email, update the environment variables in <code>backend/.env</code>:</p>
      <ul>
        <li><code>ADMIN_EMAIL</code> — your login email</li>
        <li><code>ADMIN_PASSWORD_HASH</code> — bcrypt hash of your new password</li>
        <li><code>JWT_SECRET</code> — random string (min 32 characters)</li>
      </ul>
      <p>Generate a new password hash with:<br />
        <code>node -e "const b=require('bcryptjs');b.hash('yourpassword',10).then(console.log)"</code>
      </p>
    </section>
  );
}

// ─── Root AdminDashboard ──────────────────────────────────────────────────────
export default function AdminDashboard({ onLogout }) {
  const [activePage, setActivePage] = useState("Overview");

  const menuItems = [
    { label: "Overview",     icon: "📊" },
    { label: "Projects",     icon: "🗂️" },
    { label: "Certificates", icon: "🏆" },
    { label: "Messages",     icon: "💬" },
    { label: "Settings",     icon: "⚙️" },
  ];

  return (
    <div className="admin-dashboard">
      <aside className="admin-sidebar">
        <h2>⚡ Admin</h2>
        <p className="admin-sidebar-subtitle">Portfolio Manager</p>

        <nav>
          {menuItems.map((item) => (
            <button
              key={item.label}
              type="button"
              className={activePage === item.label ? "active" : ""}
              onClick={() => setActivePage(item.label)}
            >
              <span className="menu-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <button type="button" className="admin-logout" onClick={onLogout}>
          🚪 Logout
        </button>
      </aside>

      <main className="admin-content">
        <h1>
          {menuItems.find(m => m.label === activePage)?.icon} {activePage}
        </h1>

        {activePage === "Overview"     && <OverviewSection />}
        {activePage === "Projects"     && <ProjectsSection />}
        {activePage === "Certificates" && <CertificatesSection />}
        {activePage === "Messages"     && <MessagesSection />}
        {activePage === "Settings"     && <SettingsSection />}      </main>
    </div>
  );
}
