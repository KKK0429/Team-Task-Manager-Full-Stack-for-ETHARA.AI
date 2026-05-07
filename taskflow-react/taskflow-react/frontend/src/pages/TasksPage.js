// src/pages/TasksPage.js
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { Card, Badge, Spinner, EmptyState, Select, Modal, Button } from '../components/UI';

const priorityColor = (p) => ({ high: 'danger', medium: 'warning', low: 'success' })[p] || 'primary';

const STATUS_LABELS = {
  todo: { label: '📋 To Do', color: 'var(--todo)' },
  in_progress: { label: '⚡ In Progress', color: 'var(--inprogress)' },
  done: { label: '✅ Done', color: 'var(--done)' },
};

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedTask, setSelectedTask] = useState(null);
  const [newStatus, setNewStatus] = useState('todo');
  const [saving, setSaving] = useState(false);

  const fetchTasks = () => {
    api.get('/tasks/dashboard')
      .then(res => setTasks(res.data.recent_tasks || []))
      .catch(() => toast.error('Failed to load tasks'))
      .finally(() => setLoading(false));
  };

  useEffect(fetchTasks, []);

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

  const handleUpdateStatus = async () => {
    setSaving(true);
    try {
      await api.put(`/tasks/${selectedTask.id}`, { status: newStatus });
      toast.success('Status updated!');
      setSelectedTask(null);
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em' }}>My Tasks</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: 3 }}>Tasks assigned to you</p>
        </div>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '8px 12px', color: 'var(--text)',
            fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'var(--font)', outline: 'none',
          }}
        >
          <option value="all">All Status</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}><Spinner size={28} /></div>
      ) : filtered.length === 0 ? (
        <Card><EmptyState icon="✅" title="No tasks" subtitle="No tasks match this filter." /></Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(task => {
            const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
            const statusInfo = STATUS_LABELS[task.status] || STATUS_LABELS.todo;
            return (
              <Card
                key={task.id}
                hoverable
                onClick={() => { setSelectedTask(task); setNewStatus(task.status); }}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px' }}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusInfo.color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: '0.92rem' }}>{task.title}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 2, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {task.project_name && <span>📁 {task.project_name}</span>}
                    {task.due_date && <span>📅 {task.due_date}</span>}
                    {isOverdue && <span style={{ color: 'var(--danger)' }}>⚠ Overdue</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Badge color={priorityColor(task.priority)}>{task.priority}</Badge>
                  <span style={{ fontSize: '0.78rem', color: statusInfo.color }}>{statusInfo.label}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Update status modal */}
      <Modal open={!!selectedTask} onClose={() => setSelectedTask(null)} title={selectedTask?.title || ''}>
        {selectedTask && (
          <>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              {selectedTask.description || 'No description.'}
            </div>
            <Select label="Update Status" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
              <option value="todo">📋 To Do</option>
              <option value="in_progress">⚡ In Progress</option>
              <option value="done">✅ Done</option>
            </Select>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setSelectedTask(null)}>Cancel</Button>
              <Button onClick={handleUpdateStatus} disabled={saving}>{saving ? 'Saving…' : 'Update Status'}</Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
