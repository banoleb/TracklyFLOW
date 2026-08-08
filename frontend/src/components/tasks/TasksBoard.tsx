import React, { useMemo, useState } from 'react';
import { useAuthStore } from '../../store/authStore';

type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'paused' | 'done' | 'reopened' | 'closed';
type Priority = 'low' | 'medium' | 'high';

interface TaskComment {
  id: number;
  author: string;
  content: string;
  createdAt: string;
}

interface BoardTask {
  id: number;
  code: string;
  title: string;
  description: string;
  dueDate: string;
  reporter: string;
  assignee: string;
  labels: string[];
  status: TaskStatus;
  priority: Priority;
  comments: TaskComment[];
}

const STATUS_META: Record<TaskStatus, { title: string; icon: string; color: string }> = {
  backlog: { title: 'Backlog', icon: '📥', color: '#6b7280' },
  todo: { title: 'To Do', icon: '▶️', color: '#3b82f6' },
  in_progress: { title: 'In Progress', icon: '🔄', color: '#f59e0b' },
  paused: { title: 'Paused', icon: '⏸', color: '#8b5cf6' },
  done: { title: 'Done', icon: '✅', color: '#22c55e' },
  reopened: { title: 'Reopened', icon: '🔄', color: '#f97316' },
  closed: { title: 'Closed', icon: '❌', color: '#4b5563' },
};

const STATUS_ORDER: TaskStatus[] = ['backlog', 'todo', 'in_progress', 'paused', 'done', 'reopened', 'closed'];

const PRIORITY_META: Record<Priority, string> = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#ef4444',
};

const actionButtonsByStatus: Record<TaskStatus, Array<{ key: string; label: string; next: TaskStatus; className: string }>> = {
  backlog: [
    { key: 'start', label: '▶ Start', next: 'in_progress', className: 'action-start' },
    { key: 'close', label: '❌ Close', next: 'closed', className: 'action-close' },
  ],
  todo: [
    { key: 'start', label: '▶ Start', next: 'in_progress', className: 'action-start' },
    { key: 'close', label: '❌ Close', next: 'closed', className: 'action-close' },
  ],
  in_progress: [
    { key: 'pause', label: '⏸ Pause', next: 'paused', className: 'action-pause' },
    { key: 'done', label: '✅ Done', next: 'done', className: 'action-done' },
  ],
  paused: [
    { key: 'resume', label: '▶ Resume', next: 'in_progress', className: 'action-resume' },
    { key: 'close', label: '❌ Close', next: 'closed', className: 'action-close' },
  ],
  done: [
    { key: 'reopen', label: '🔄 Reopen', next: 'reopened', className: 'action-reopen' },
    { key: 'close', label: '❌ Close', next: 'closed', className: 'action-close' },
  ],
  reopened: [
    { key: 'resume', label: '▶ Resume', next: 'in_progress', className: 'action-resume' },
    { key: 'close', label: '❌ Close', next: 'closed', className: 'action-close' },
  ],
  closed: [
    { key: 'reopen', label: '🔄 Reopen', next: 'reopened', className: 'action-reopen' },
  ],
};

const defaultForm = {
  title: '',
  description: '',
  dueDate: '',
  reporter: '',
  assignee: '',
  labels: '',
  priority: 'medium' as Priority,
};

const TasksBoard: React.FC = () => {
  const { user } = useAuthStore();
  const [form, setForm] = useState({ ...defaultForm, reporter: user?.username || 'Unknown' });
  const [tasks, setTasks] = useState<BoardTask[]>([]);
  const [dragTaskId, setDragTaskId] = useState<number | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);
  const [commentDraft, setCommentDraft] = useState('');

  const activeTask = useMemo(
    () => tasks.find((task) => task.id === activeTaskId) || null,
    [tasks, activeTaskId]
  );

  const createTask = (e: React.FormEvent) => {
    e.preventDefault();
    const title = form.title.trim();
    if (!title) return;

    const nextId = tasks.length > 0 ? Math.max(...tasks.map((t) => t.id)) + 1 : 1;
    const newTask: BoardTask = {
      id: nextId,
      code: `TSK-${nextId}`,
      title,
      description: form.description.trim(),
      dueDate: form.dueDate,
      reporter: form.reporter.trim() || user?.username || 'Unknown',
      assignee: form.assignee.trim() || 'Unassigned',
      labels: form.labels
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      status: 'todo',
      priority: form.priority,
      comments: [],
    };

    setTasks((prev) => [newTask, ...prev]);
    setForm({ ...defaultForm, reporter: user?.username || 'Unknown' });
  };

  const updateTaskStatus = (taskId: number, status: TaskStatus) => {
    setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, status } : task)));
  };

  const onDropToStatus = (status: TaskStatus) => {
    if (dragTaskId === null) return;
    updateTaskStatus(dragTaskId, status);
    setDragTaskId(null);
  };

  const addComment = () => {
    const text = commentDraft.trim();
    if (!activeTask || !text) return;
    const comment: TaskComment = {
      id: Date.now(),
      author: user?.username || 'User',
      content: text,
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) =>
      prev.map((task) =>
        task.id === activeTask.id
          ? { ...task, comments: [...task.comments, comment] }
          : task
      )
    );
    setCommentDraft('');
  };

  return (
    <div className="tasks-layout">
      <section className="task-create-panel">
        <h3>Создать задачу</h3>
        <form className="task-create-form" onSubmit={createTask}>
          <input
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="Название"
            required
          />
          <textarea
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Описание"
            rows={3}
          />
          <div className="task-create-grid">
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))}
            />
            <input
              value={form.reporter}
              onChange={(e) => setForm((prev) => ({ ...prev, reporter: e.target.value }))}
              placeholder="Reporter"
            />
            <input
              value={form.assignee}
              onChange={(e) => setForm((prev) => ({ ...prev, assignee: e.target.value }))}
              placeholder="Assignee"
            />
            <select
              value={form.priority}
              onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value as Priority }))}
            >
              <option value="low">Low priority</option>
              <option value="medium">Medium priority</option>
              <option value="high">High priority</option>
            </select>
          </div>
          <input
            value={form.labels}
            onChange={(e) => setForm((prev) => ({ ...prev, labels: e.target.value }))}
            placeholder="Лейблы/теги (через запятую)"
          />
          <button className="btn-primary" type="submit">Add Task</button>
        </form>
      </section>

      <section className="tasks-board">
        {STATUS_ORDER.map((status) => {
          const meta = STATUS_META[status];
          const columnTasks = tasks.filter((task) => task.status === status);
          return (
            <div
              key={status}
              className="tasks-column"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDropToStatus(status)}
            >
              <div className="tasks-column-header" style={{ borderColor: meta.color }}>
                <span>{meta.icon} {meta.title}</span>
                <span className="tasks-column-count">{columnTasks.length}</span>
              </div>
              <div className="tasks-column-list">
                {columnTasks.map((task) => (
                  <article
                    key={task.id}
                    className="task-card"
                    draggable
                    onDragStart={() => setDragTaskId(task.id)}
                    onClick={() => setActiveTaskId(task.id)}
                  >
                    <div className="task-card-top">
                      <span className="task-code">{task.code}</span>
                      <span className="task-priority" style={{ backgroundColor: PRIORITY_META[task.priority] }}>
                        {task.priority.toUpperCase()}
                      </span>
                    </div>
                    <h4>{task.title}</h4>
                    <div className="task-assignee-avatar">{(task.assignee[0] || '?').toUpperCase()}</div>
                    <div className="task-card-actions">
                      {actionButtonsByStatus[task.status].map((action) => (
                        <button
                          key={action.key}
                          type="button"
                          className={`task-action-btn ${action.className}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            updateTaskStatus(task.id, action.next);
                          }}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      {activeTask && (
        <div className="modal-overlay" onClick={() => setActiveTaskId(null)}>
          <div className="modal task-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{activeTask.code}: {activeTask.title}</h3>
              <button className="btn-close" onClick={() => setActiveTaskId(null)}>✕</button>
            </div>
            <div className="modal-body task-modal-body">
              <p>{activeTask.description || 'Без описания'}</p>
              <div className="task-meta-list">
                <span>Reporter: {activeTask.reporter}</span>
                <span>Assignee: {activeTask.assignee}</span>
                <span>Due: {activeTask.dueDate || '—'}</span>
                <span>Labels: {activeTask.labels.join(', ') || '—'}</span>
              </div>
              <div className="task-comments">
                <h4>Комментарии</h4>
                {activeTask.comments.length === 0 && <p className="task-comments-empty">Комментариев пока нет.</p>}
                {activeTask.comments.map((comment) => (
                  <div key={comment.id} className="task-comment-item">
                    <strong>{comment.author}</strong>
                    <span>{new Date(comment.createdAt).toLocaleString()}</span>
                    <p>{comment.content}</p>
                  </div>
                ))}
                <div className="task-comment-create">
                  <textarea
                    value={commentDraft}
                    onChange={(e) => setCommentDraft(e.target.value)}
                    rows={2}
                    placeholder="Добавить комментарий"
                  />
                  <button className="btn-primary" type="button" onClick={addComment}>Add Comment</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksBoard;
