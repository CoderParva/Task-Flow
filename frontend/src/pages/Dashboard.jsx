import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { formatDate, isOverdue, statusClass, priorityLabel } from '../utils/helpers';
import './Dashboard.css';

const STATS = [
  {
    key: 'totalTasks',
    label: 'Total Tasks',
    icon: '▦',
    color: 'var(--cyan)',
    border: 'rgba(0,212,255,0.25)',
    bg: 'rgba(0,212,255,0.08)',
  },
  {
    key: 'done',
    label: 'Completed',
    icon: '◈',
    color: 'var(--success)',
    border: 'rgba(0,255,157,0.2)',
    bg: 'rgba(0,255,157,0.06)',
    sub: d => `${d.totalTasks ? Math.round(((d.byStatus?.find(b=>b.status==='done')?.count??0)/d.totalTasks)*100) : 0}% done`,
  },
  {
    key: 'in_progress',
    label: 'In Progress',
    icon: '⟳',
    color: 'var(--cyan)',
    border: 'rgba(0,212,255,0.2)',
    bg: 'rgba(0,212,255,0.06)',
  },
  {
    key: 'overdue',
    label: 'Overdue',
    icon: '◉',
    color: 'var(--danger)',
    border: 'rgba(255,51,102,0.25)',
    bg: 'rgba(255,51,102,0.08)',
    sub: () => 'Needs action',
  },
  {
    key: 'myActiveTasks',
    label: 'My Tasks',
    icon: '◎',
    color: 'var(--amber)',
    border: 'rgba(255,184,0,0.25)',
    bg: 'rgba(255,184,0,0.06)',
    sub: () => 'Assigned to me',
  },
  {
    key: 'todo',
    label: 'To Do',
    icon: '□',
    color: 'var(--text-muted)',
    border: 'rgba(61,107,138,0.2)',
    bg: 'rgba(61,107,138,0.06)',
  },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tasks/dashboard')
      .then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  const getStatus = s => data?.byStatus?.find(b => b.status === s)?.count ?? 0;

  const statValue = (key, d) => {
    if (key === 'done') return getStatus('done');
    if (key === 'in_progress') return getStatus('in_progress');
    if (key === 'todo') return getStatus('todo');
    return d?.[key] ?? 0;
  };

  if (loading) return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Dashboard</h1><p className="page-subtitle">// Loading system data...</p></div>
      </div>
      <div className="page-body page-loader"><div className="spinner" style={{width:32,height:32}}/></div>
    </div>
  );

  const total = data?.totalTasks ?? 0;
  const doneCount = getStatus('done');
  const progressCount = getStatus('in_progress');
  const todoCount = getStatus('todo');

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title welcome-title">
            SYS_HI / {user?.name?.split(' ')[0].toUpperCase()}
          </h1>
          <p className="page-subtitle">// {new Date().toISOString().split('T')[0]} · Mission control active</p>
        </div>
        <Link to="/projects" className="btn btn-primary">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
          New Project
        </Link>
      </div>

      <div className="page-body">
        {/* Stat Cards */}
        <div className="stats-grid">
          {STATS.map(s => {
            const val = statValue(s.key, data);
            return (
              <div
                key={s.key}
                className="stat-card"
                style={{ '--glow-color': s.color }}
              >
                <div className="stat-icon" style={{ background: s.bg, borderColor: s.border, color: s.color }}>
                  <span style={{ fontSize: 22, lineHeight: 1 }}>{s.icon}</span>
                </div>
                <div className="stat-body">
                  <div className="stat-value" style={{ color: s.color, filter: `drop-shadow(0 0 12px ${s.color})` }}>
                    {val.toString().padStart(2, '0')}
                  </div>
                  <div className="stat-label">{s.label}</div>
                  {s.sub && <div className="stat-sub">{s.sub(data)}</div>}
                </div>
              </div>
            );
          })}
        </div>

        <div className="dashboard-row">
          {/* Recent Tasks */}
          <div className="card">
            <div className="dash-section-header">
              <h3>// Recent Tasks</h3>
              <Link to="/projects" className="btn btn-ghost btn-sm">View all →</Link>
            </div>
            {!data?.recentTasks?.length ? (
              <div className="empty-state" style={{ padding: 32 }}>
                <div className="empty-icon">▦</div>
                <p>No tasks yet. Create a project to begin.</p>
              </div>
            ) : (
              <div className="task-list">
                {data.recentTasks.map(task => (
                  <Link key={task.id} to={`/projects/${task.project_id}`} className="task-row">
                    <div className="task-row-left">
                      <div className={`task-dot ${task.status === 'done' ? 'done' : task.status === 'in_progress' ? 'progress' : ''}`} />
                      <div style={{ minWidth: 0 }}>
                        <div className="task-row-title" style={{ opacity: task.status === 'done' ? 0.5 : 1, textDecoration: task.status === 'done' ? 'line-through' : 'none' }}>
                          {task.title}
                        </div>
                        <div className="task-row-meta">
                          {task.project_name} · {task.assigned_to_name ?? 'Unassigned'}
                        </div>
                      </div>
                    </div>
                    <div className="task-row-right">
                      {task.due_date && (
                        <span className={`text-xs font-mono ${isOverdue(task.due_date) && task.status !== 'done' ? 'text-danger' : 'text-muted'}`}>
                          {formatDate(task.due_date)}
                        </span>
                      )}
                      <span className={`badge badge-${task.priority}`}>{priorityLabel(task.priority)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Side Panel */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div className="dash-section-header">
              <h3>// Status Matrix</h3>
            </div>
            <div className="status-bars">
              {[
                { label: 'Done',        val: doneCount,     color: 'var(--success)', glow: 'rgba(0,255,157,0.4)' },
                { label: 'In Progress', val: progressCount, color: 'var(--cyan)',    glow: 'rgba(0,212,255,0.4)' },
                { label: 'To Do',       val: todoCount,     color: 'rgba(61,107,138,0.6)', glow: '' },
              ].map(({ label, val, color, glow }) => {
                const pct = total ? Math.round(val / total * 100) : 0;
                return (
                  <div key={label} className="status-bar-item">
                    <div className="status-bar-header">
                      <span className="status-bar-label">{label}</span>
                      <span className="status-bar-count">{val}</span>
                    </div>
                    <div className="status-bar-track">
                      <div className="status-bar-fill" style={{
                        width: `${pct}%`,
                        background: color,
                        boxShadow: glow ? `0 0 8px ${glow}` : 'none'
                      }} />
                    </div>
                    <div className="status-bar-pct">{pct}%</div>
                  </div>
                );
              })}
            </div>

            {data?.byUser?.length > 0 && (
              <>
                <hr />
                <div className="dash-section-header">
                  <h3>// Load per Operator</h3>
                </div>
                <div className="user-task-list">
                  {data.byUser.slice(0, 5).map(u => (
                    <div key={u.id} className="user-task-row">
                      <div className="mini-avatar">{u.name?.charAt(0).toUpperCase()}</div>
                      <span className="text-sm" style={{ flex: 1, fontFamily: 'var(--font-body)', fontSize: 13 }}>{u.name}</span>
                      <span className="badge badge-todo" style={{ fontFamily: 'var(--font-mono)' }}>{u.task_count}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
