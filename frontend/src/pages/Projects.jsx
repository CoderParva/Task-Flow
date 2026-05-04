import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { useToast } from '../components/Toast';
import './Projects.css';

function CreateProjectModal({ onClose, onCreate }) {
  const toast = useToast();
  const [form, setForm] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const p = await api.post('/projects', form);
      toast.success('Project initialized!');
      onCreate(p);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>// Init New Project</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="field">
            <label>Project Name *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Website Overhaul" required autoFocus />
          </div>
          <div className="field">
            <label>Mission Brief</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What is this project's objective?" />
          </div>
          <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : '→ Initialize'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Projects() {
  const toast = useToast();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    api.get('/projects')
      .then(setProjects)
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">
            // {projects.length} active workspace{projects.length !== 1 ? 's' : ''} · You are a member
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
          New Project
        </button>
      </div>

      <div className="page-body">
        {loading ? (
          <div className="page-loader"><div className="spinner" style={{width:32,height:32}}/></div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">◫</div>
            <h3>No Projects Found</h3>
            <p>Create your first project to assemble your team and begin.</p>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>Initialize Project</button>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map(p => (
              <Link key={p.id} to={`/projects/${p.id}`} className="project-card">
                <div className="project-card-top">
                  <div className="project-card-icon">{p.name.charAt(0).toUpperCase()}</div>
                  <span className={`badge badge-${p.user_role}`}>{p.user_role}</span>
                </div>

                <div className="project-card-name">{p.name}</div>
                {p.description && <div className="project-card-desc">{p.description}</div>}

                <div className="project-card-meta">
                  <span>
                    <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    {p.member_count} operator{p.member_count !== 1 ? 's' : ''}
                  </span>
                  <span>
                    <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M1 7h14" stroke="currentColor" strokeWidth="1.5"/></svg>
                    {p.task_count} task{p.task_count !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="project-card-footer">
                  <span className="project-card-creator">by {p.creator_name}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreate={p => { setProjects(prev => [p, ...prev]); setShowCreate(false); }}
        />
      )}
    </div>
  );
}
