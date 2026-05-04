import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { formatDate, isOverdue, statusLabel, statusClass, priorityLabel } from '../utils/helpers';
import './ProjectDetail.css';

/* ─── Task Form Modal ──────────────────────────────────────────────── */
function TaskModal({ task, members, projectId, onClose, onSave }) {
  const toast = useToast();
  const [form, setForm] = useState({
    title: task?.title ?? '',
    description: task?.description ?? '',
    assigned_to: task?.assigned_to ?? '',
    due_date: task?.due_date ?? '',
    priority: task?.priority ?? 'medium',
    status: task?.status ?? 'todo',
  });
  const [loading, setLoading] = useState(false);
  const isEdit = !!task;
  const h = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, project_id: projectId, assigned_to: form.assigned_to || null, due_date: form.due_date || null };
      const saved = isEdit ? await api.put(`/tasks/${task.id}`, payload) : await api.post('/tasks', payload);
      toast.success(isEdit ? 'Task updated!' : 'Task deployed!');
      onSave(saved, isEdit);
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <h2>{isEdit ? '// Edit Task' : '// Deploy New Task'}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="field">
            <label>Task Title *</label>
            <input name="title" value={form.title} onChange={h} placeholder="Describe the mission objective" required autoFocus />
          </div>
          <div className="field">
            <label>Details</label>
            <textarea name="description" value={form.description} onChange={h} placeholder="Additional context..." />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field">
              <label>Priority</label>
              <select name="priority" value={form.priority} onChange={h}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="field">
              <label>Status</label>
              <select name="status" value={form.status} onChange={h}>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field">
              <label>Assign Operator</label>
              <select name="assigned_to" value={form.assigned_to} onChange={h}>
                <option value="">Unassigned</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Deadline</label>
              <input type="date" name="due_date" value={form.due_date} onChange={h} />
            </div>
          </div>
          <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : (isEdit ? '→ Save Changes' : '→ Deploy Task')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Status Modal (for members) ──────────────────────────────────── */
function StatusModal({ task, onClose, onSave }) {
  const toast = useToast();
  const [status, setStatus] = useState(task.status);
  const [loading, setLoading] = useState(false);

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/tasks/${task.id}`, { status });
      toast.success('Status updated!');
      onSave({ ...task, status });
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 360 }}>
        <div className="modal-header">
          <h2>// Update Status</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20, fontFamily: 'var(--font-mono)' }}>
          {task.title}
        </p>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="field">
            <label>New Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)}>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : '→ Confirm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Add Member Modal ─────────────────────────────────────────────── */
function AddMemberModal({ projectId, onClose, onAdd }) {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [role, setRole]   = useState('member');
  const [loading, setLoading] = useState(false);

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post(`/projects/${projectId}/members`, { email, role });
      toast.success('Operator added to project!');
      onAdd(res.user);
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <h2>// Add Operator</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 12, fontFamily: 'var(--font-mono)', marginBottom: 20, lineHeight: 1.6 }}>
          User must have a registered TaskFlow account.
        </p>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="field">
            <label>Email Address *</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="operator@domain.io" required autoFocus />
          </div>
          <div className="field">
            <label>Access Level</label>
            <select value={role} onChange={e => setRole(e.target.value)}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : '→ Add Operator'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Task Card ─────────────────────────────────────────────────────── */
function TaskCard({ task, isAdmin, currentUserId, onEdit, onStatusUpdate, onDelete }) {
  const overdue = isOverdue(task.due_date) && task.status !== 'done';
  const canStatus = isAdmin || Number(task.assigned_to) === Number(currentUserId);
  const canEdit   = isAdmin;

  return (
    <div className={`task-card priority-${task.priority} ${task.status === 'done' ? 'task-done' : ''}`}>
      <div className="task-card-header">
        <span className={`badge ${statusClass(task.status)}`}>{statusLabel(task.status)}</span>
        <div className="flex items-center gap-2">
          <span className={`badge badge-${task.priority}`}>{priorityLabel(task.priority)}</span>
          <div className="task-card-actions">
            {canStatus && task.status !== 'done' && (
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => onStatusUpdate(task)} title="Update status" style={{ fontSize: 12, padding: '4px 6px' }}>
                ↺
              </button>
            )}
            {canEdit && (
              <>
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => onEdit(task)} title="Edit" style={{ fontSize: 11, padding: '4px 6px' }}>
                  ✎
                </button>
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => onDelete(task.id)} title="Delete" style={{ fontSize: 11, padding: '4px 6px', color: 'var(--danger)' }}>
                  ✕
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="task-card-title">{task.title}</div>
      {task.description && <p className="task-card-desc">{task.description}</p>}

      <div className="task-card-footer">
        <div className="task-card-assignee">
          {task.assigned_to_name ? (
            <>
              <div className="mini-avatar-sm">{task.assigned_to_name.charAt(0)}</div>
              <span className="text-xs text-muted" style={{ fontFamily: 'var(--font-body)' }}>{task.assigned_to_name}</span>
            </>
          ) : (
            <span className="text-xs text-muted" style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>— Unassigned</span>
          )}
        </div>
        {task.due_date && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: overdue ? 'var(--danger)' : 'var(--text-muted)' }}>
            {overdue ? '! ' : ''}{formatDate(task.due_date)}
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Main ──────────────────────────────────────────────────────────── */
export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [project, setProject]       = useState(null);
  const [tasks, setTasks]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState('tasks');
  const [filter, setFilter]         = useState({ status: '', priority: '' });
  const [editTask, setEditTask]     = useState(null);
  const [statusTask, setStatusTask] = useState(null);
  const [showTaskForm, setShowTaskForm]   = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);

  const load = useCallback(async () => {
    try {
      const [proj, taskList] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks/project/${id}`)
      ]);
      setProject(proj);
      setTasks(taskList);
    } catch (err) {
      toast.error(err.message);
      if (err.status === 403 || err.status === 404) navigate('/projects');
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const isAdmin = project?.user_role === 'admin';

  const filtered = tasks.filter(t => {
    if (filter.status   && t.status   !== filter.status)   return false;
    if (filter.priority && t.priority !== filter.priority) return false;
    return true;
  });

  const columns = [
    { key: 'todo',        label: 'To Do',       dotColor: 'rgba(61,107,138,0.6)' },
    { key: 'in_progress', label: 'In Progress',  dotColor: 'var(--cyan)' },
    { key: 'done',        label: 'Done',         dotColor: 'var(--success)' },
  ];

  const handleTaskSave = (saved, isEdit) => {
    setTasks(prev => isEdit ? prev.map(t => t.id === saved.id ? saved : t) : [saved, ...prev]);
    setEditTask(null); setShowTaskForm(false);
  };

  const handleStatusSave = updated => {
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    setStatusTask(null);
  };

  const handleDelete = async taskId => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      toast.success('Task removed');
    } catch (err) { toast.error(err.message); }
  };

  const handleRemoveMember = async memberId => {
    if (!confirm('Remove this operator from the project?')) return;
    try {
      await api.delete(`/projects/${id}/members/${memberId}`);
      setProject(p => ({ ...p, members: p.members.filter(m => m.id !== memberId) }));
      toast.success('Operator removed');
    } catch (err) { toast.error(err.message); }
  };

  const handleDeleteProject = async () => {
    if (!confirm(`Permanently delete "${project.name}"?`)) return;
    try {
      await api.delete(`/projects/${id}`);
      toast.success('Project terminated');
      navigate('/projects');
    } catch (err) { toast.error(err.message); }
  };

  if (loading) return (
    <div className="page-loader" style={{ height: '100vh' }}>
      <div className="spinner" style={{ width: 36, height: 36 }} />
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
            <Link to="/projects" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
              Projects
            </Link>
            <span style={{ color: 'var(--border-bright)', fontFamily: 'var(--font-mono)' }}>/</span>
            <span style={{ color: 'var(--cyan)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{project?.name}</span>
          </div>
          <h1 className="page-title">{project?.name}</h1>
          {project?.description && <p className="page-subtitle">// {project.description}</p>}
        </div>
        <div className="flex gap-2 items-center">
          {isAdmin && (
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowAddMember(true)}>
                + Operator
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => setShowTaskForm(true)}>
                + Deploy Task
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="project-tabs">
        {['tasks', 'members'].map(tab => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'tab-active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'tasks'
              ? `Tasks [${tasks.length}]`
              : `Operators [${project?.members?.length ?? 0}]`
            }
          </button>
        ))}
      </div>

      <div className="page-body">

        {/* ── Tasks Tab ── */}
        {activeTab === 'tasks' && (
          <>
            <div className="task-filters">
              <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))} style={{ width: 'auto' }}>
                <option value="">All Statuses</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
              <select value={filter.priority} onChange={e => setFilter(f => ({ ...f, priority: e.target.value }))} style={{ width: 'auto' }}>
                <option value="">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              {(filter.status || filter.priority) && (
                <button className="btn btn-ghost btn-sm" onClick={() => setFilter({ status: '', priority: '' })}>
                  Clear
                </button>
              )}
              <span className="ml-auto" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
                {filtered.length} / {tasks.length} tasks
              </span>
            </div>

            {tasks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">▦</div>
                <h3>No Tasks Deployed</h3>
                {isAdmin ? <p>Deploy your first task to get the mission started.</p> : <p>No tasks have been assigned yet.</p>}
                {isAdmin && <button className="btn btn-primary" onClick={() => setShowTaskForm(true)}>Deploy First Task</button>}
              </div>
            ) : (
              <div className="kanban">
                {columns.map(col => {
                  const colTasks = filtered.filter(t => t.status === col.key);
                  return (
                    <div key={col.key} className={`kanban-col kanban-col-${col.key}`}>
                      <div className="kanban-col-header">
                        <div className="flex items-center gap-2">
                          <div className="col-dot" style={{ background: col.dotColor, boxShadow: `0 0 6px ${col.dotColor}` }} />
                          <span className="col-title" style={{ color: col.dotColor }}>{col.label}</span>
                        </div>
                        <span className="kanban-count">{colTasks.length}</span>
                      </div>
                      <div className="kanban-cards">
                        {colTasks.map(task => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            isAdmin={isAdmin}
                            currentUserId={user?.id}
                            onEdit={t => setEditTask(t)}
                            onStatusUpdate={t => setStatusTask(t)}
                            onDelete={handleDelete}
                          />
                        ))}
                        {colTasks.length === 0 && (
                          <div className="kanban-empty">// empty</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── Members Tab ── */}
        {activeTab === 'members' && (
          <div className="members-section">
            <div className="members-list">
              {project?.members?.map(m => (
                <div key={m.id} className="member-row">
                  <div className="member-avatar">{m.name.charAt(0).toUpperCase()}</div>
                  <div className="member-info">
                    <div className="member-name">
                      {m.name}
                      {m.id === user?.id && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--cyan)', opacity: 0.7 }}>[YOU]</span>
                      )}
                    </div>
                    <div className="member-email">{m.email}</div>
                  </div>
                  <span className={`badge badge-${m.role}`}>{m.role}</span>
                  {isAdmin && m.id !== user?.id && (
                    <button className="btn btn-danger btn-sm" onClick={() => handleRemoveMember(m.id)}>
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>

            {isAdmin && (
              <div className="danger-zone">
                <h3>⚠ Danger Zone</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                  This action is permanent. All tasks will be deleted.
                </p>
                <button className="btn btn-danger" onClick={handleDeleteProject}>
                  Terminate Project
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {(showTaskForm || editTask) && (
        <TaskModal
          task={editTask}
          members={project?.members ?? []}
          projectId={parseInt(id)}
          onClose={() => { setEditTask(null); setShowTaskForm(false); }}
          onSave={handleTaskSave}
        />
      )}
      {statusTask && (
        <StatusModal task={statusTask} onClose={() => setStatusTask(null)} onSave={handleStatusSave} />
      )}
      {showAddMember && (
        <AddMemberModal
          projectId={id}
          onClose={() => setShowAddMember(false)}
          onAdd={m => { setProject(p => ({ ...p, members: [...p.members, m] })); setShowAddMember(false); }}
        />
      )}
    </div>
  );
}
