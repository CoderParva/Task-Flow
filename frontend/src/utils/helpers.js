export const formatDate = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const isOverdue = (dateStr) => {
  if (!dateStr) return false;
  return new Date(dateStr + 'T00:00:00') < new Date(new Date().setHours(0, 0, 0, 0));
};

export const statusLabel = (s) => ({
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
}[s] || s);

export const priorityLabel = (p) => ({
  low: 'Low',
  medium: 'Med',
  high: 'High',
}[p] || p);

export const statusClass = (s) => ({
  todo: 'badge-todo',
  in_progress: 'badge-progress',
  done: 'badge-done',
}[s] || '');
