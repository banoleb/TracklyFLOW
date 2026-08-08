import React, { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useTasksStore } from '../../store/tasksStore';
import { Task, TaskStatus } from '../../types';

const STATUS_META: Record<TaskStatus, { title: string; icon: string; color: string }> = {
  todo: { title: 'To Do', icon: '▶️', color: '#3b82f6' },
  in_progress: { title: 'In Progress', icon: '🔄', color: '#f59e0b' },
  review: { title: 'Review', icon: '🔍', color: '#8b5cf6' },
  done: { title: 'Done', icon: '✅', color: '#22c55e' },
};

const STATUS_ORDER: TaskStatus[] = ['todo', 'in_progress', 'review', 'done'];

const actionButtonsByStatus: Record<TaskStatus, Array<{ key: string; label: string; next: TaskStatus; className: string }>> = {
  todo: [
    { key: 'start', label: '▶ Start', next: 'in_progress', className: 'action-start' },
  ],
  in_progress: [
    { key: 'review', label: '🔍 Review', next: 'review', className: 'action-pause' },
    { key: 'done', label: '✅ Done', next: 'done', className: 'action-done' },
  ],
  review: [
    { key: 'resume', label: '▶ Resume', next: 'in_progress', className: 'action-resume' },
    { key: 'done', label: '✅ Done', next: 'done', className: 'action-done' },
  ],
  done: [
    { key: 'reopen', label: '🔄 Reopen', next: 'todo', className: 'action-reopen' },
  ],
};

const defaultForm = {
  title: '',
  description: '',
};

const TasksBoard: React.FC = () => {
  const { user } = useAuthStore();
  const { tasks, loading, fetchTasks, createTask, updateTask, deleteTask } = useTasksStore();
  const [form, setForm] = useState({ ...defaultForm });
  const [submitting, setSubmitting] = useState(false);
  const [dragTaskId, setDragTaskId] = useState<number | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const activeTask = useMemo(
    () => tasks.find((task) => task.id === activeTaskId) || null,
    [tasks, activeTaskId]
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = form.title.trim();
    if (!title) return;
    setSubmitting(true);
    try {
      await createTask({
        title,
        description: form.description.trim() || undefined,
        status: 'todo',
      });
      setForm({ ...defaultForm });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (taskId: number, status: TaskStatus) => {
    await updateTask(taskId, { status });
  };

  const onDropToStatus = async (status: TaskStatus) => {
    if (dragTaskId === null) return;
    await handleStatusChange(dragTaskId, status);
    setDragTaskId(null);
  };

  const handleDelete = async (taskId: number) => {
    if (!window.confirm('Delete this task?')) return;
    await deleteTask(taskId);
    if (activeTaskId === taskId) setActiveTaskId(null);
  };

  const assigneeName = (task: Task) =>
    task.assignee?.username || 'Unassigned';

  return (
    <div className="tasks-layout">
      <section className="task-create-panel">
        <h3>Создать задачу</h3>
        <form className="task-create-form" onSubmit={handleCreate}>
          <input
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="Название"
            required
            disabled={submitting}
          />
          <textarea
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Описание"
            rows={3}
            disabled={submitting}
          />
          <button className="btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : 'Add Task'}
          </button>
        </form>
      </section>

      <section className="tasks-board">
        {loading && <p style={{ padding: '1rem' }}>Loading…</p>}
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
                      <span className="task-code">TSK-{task.id}</span>
                    </div>
                    <h4>{task.title}</h4>
                    <div className="task-assignee-avatar">{(assigneeName(task)[0] || '?').toUpperCase()}</div>
                    <div className="task-card-actions">
                      {actionButtonsByStatus[task.status].map((action) => (
                        <button
                          key={action.key}
                          type="button"
                          className={`task-action-btn ${action.className}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(task.id, action.next);
                          }}
                        >
                          {action.label}
                        </button>
                      ))}
                      {task.created_by === user?.id && (
                        <button
                          type="button"
                          className="task-action-btn action-close"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(task.id);
                          }}
                        >
                          🗑 Delete
                        </button>
                      )}
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
              <h3>TSK-{activeTask.id}: {activeTask.title}</h3>
              <button className="btn-close" onClick={() => setActiveTaskId(null)}>✕</button>
            </div>
            <div className="modal-body task-modal-body">
              <p>{activeTask.description || 'Без описания'}</p>
              <div className="task-meta-list">
                <span>Reporter: {activeTask.creator?.username || '—'}</span>
                <span>Assignee: {assigneeName(activeTask)}</span>
                <span>Status: {STATUS_META[activeTask.status].title}</span>
                <span>Created: {new Date(activeTask.created_at).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksBoard;
