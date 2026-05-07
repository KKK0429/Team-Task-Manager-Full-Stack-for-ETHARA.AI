// src/pages/ProjectDetailPage.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Card, Button, Modal, Input, Textarea, Select, Badge, Spinner, EmptyState } from '../components/UI';
import { ArrowLeft, Plus, UserPlus } from 'lucide-react';

// Priority badge color map
const priorityColor = (p) => ({ high: 'danger', medium: 'warning', low: 'success' })[p] || 'primary';

// A single task card in the Kanban column
function TaskCard({ task, onStatusChange, isAdmin }) {
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';

  return (
    <div
      style={{
        background: 'var(--surface2)', border: `1px solid ${isOverdue ? 'rgba(248,113,113,0.3)' : 'var(--border)'}`,
        borderRadius: 8, padding: 12, cursor: 'pointer',
        transition: 'all 0.15s',
        borderLeft: isOverdue ? '3px solid var(--danger)' : undefined,
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = isOverdue ? 'rgba(248,113,113,0.3)' : 'var(--border)'}
      onClick={() => onStatusChange(task)}
    >
      <div style={{ fontWeight: 500, fontSize: '0.88rem', marginBottom: 8, lineHeight: 1.4 }}>{task.title}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
        <Badge color={priorityColor(task.priority)}>{task.priority}</Badge>
        {task.assigned_to_name && (
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>👤 {task.assigned_to_name}</span>
        )}
      </div>
      {task.due_date && (
        <div style={{ fontSize: '0.75rem', color: isOverdue ? 'var(--danger)' : 'var(--text-muted)', marginTop: 6 }}>
          📅 {task.due_date} {isOverdue && '⚠ Overdue'}
        </div>
      )}
    </div>
  );
}

// A Kanban column
function KanbanCol({ title, icon, color, tasks, onStatusChange, isAdmin }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 12, padding: 16, minHeight: 400, flex: 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, color }}>
        <span>{icon}</span>
        <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{title}</span>
        <span style={{
          background: 'var(--surface2)', color: 'var(--text-muted)',
          fontSize: '0.72rem', padding: '2px 8px', borderRadius: 10, marginLeft: 'auto',
        }}>{tasks.length}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {tasks.length === 0
          ? <div style={{ color: 'var(--text-dim)', fontSize: '0.82rem', textAlign: 'center', padding: '30px 0' }}>Empty</div>
          : tasks.map(t => <TaskCard key={t.id} task={t} onStatusChange={onStatusChange} isAdmin={isAdmin} />)
        }
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [taskModal, setTaskModal] = useState(false);
  const [memberModal, setMemberModal] = useState(false);
  const [statusModal, setStatusModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // Forms
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assigned_to: '', priority: 'medium', due_date: '' });
  const [memberEmail, setMemberEmail] = useState('');
  const [newStatus, setNewStatus] = useState('todo');
  const [allUsers, setAllUsers] = useState([]);
  const [saving, setSaving] = useState(false);

  const isAdmin = user?.role === 'admin';

  const fetchProject = async () => {
    try {
      const res = await api.get(`/projects/${id}`);
      setProject(res.data);
      setTasks(res.data.tasks || []);
      setMembers(res.data.members || []);
    } catch {
      toast.error('Failed to load project');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
    if (isAdmin) {
      api.get('/tasks/users/all').then(res => setAllUsers(res.data)).catch(() => {});
    }
  }, [id]);

  // Split tasks into kanban columns
  const columns = {
    todo: tasks.filter(t => t.status === 'todo'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    done: tasks.filter(t => t.status === 'done'),
  };

  // When a task card is clicked
  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setNewStatus(task.status);
    setStatusModal(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedTask) return;
    setSaving(true);
    try {
      await api.put(`/tasks/${selectedTask.id}`, { status: newStatus });
      toast.success('Status updated!');
      setStatusModal(false);
      fetchProject();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!selectedTask || !window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${selectedTask.id}`);
      toast.success('Task deleted');
      setStatusModal(false);
      fetchProject();
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const handleCreateTask = async () => {
    if (!taskForm.title.trim()) return toast.error('Title is required');
    setSaving(true);
    try {
      await api.post('/tasks', {
        ...taskForm,
        project_id: parseInt(id),
        assigned_to: taskForm.assigned_to ? parseInt(taskForm.assigned_to) : null,
      });
      toast.success('Task created!');
      setTaskModal(false);
      setTaskForm({ title: '', description: '', assigned_to: '', priority: 'medium', due_date: '' });
      fetchProject();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create task');
    } finally {
      setSaving(false);
    }
  };

  const handleAddMember = async () => {
    if (!memberEmail.trim()) return toast.error('Email is required');
    setSaving(true);
    try {
      await api.post(`/projects/${id}/members`, { email: memberEmail });
      toast.success('Member added!');
      setMemberModal(false);
      setMemberEmail('');
      fetchProject();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add member');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <Spinner size={28} />
    </div>
  );

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <button
            onClick={() => navigate('/projects')}
            style={{
              background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.85rem',
              marginBottom: 8, fontFamily: 'var(--font)',
            }}
          >
            <ArrowLeft size={14} /> Back to Projects
          </button>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em' }}>{project?.name}</h1>
          {project?.description && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: 4 }}>{project.description}</p>
          )}
        </div>
        {isAdmin && (
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="ghost" size="sm" onClick={() => setMemberModal(true)}>
              <UserPlus size={14} /> Add Member
            </Button>
            <Button size="sm" onClick={() => setTaskModal(true)}>
              <Plus size={14} /> New Task
            </Button>
          </div>
        )}
      </div>

      {/* Main layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 20, alignItems: 'start' }}>
        {/* Kanban Board */}
        <div style={{ display: 'flex', gap: 14 }}>
          <KanbanCol title="To Do" icon="📋" color="var(--todo)" tasks={columns.todo} onStatusChange={handleTaskClick} isAdmin={isAdmin} />
          <KanbanCol title="In Progress" icon="⚡" color="var(--inprogress)" tasks={columns.in_progress} onStatusChange={handleTaskClick} isAdmin={isAdmin} />
          <KanbanCol title="Done" icon="✅" color="var(--done)" tasks={columns.done} onStatusChange={handleTaskClick} isAdmin={isAdmin} />
        </div>

        {/* Members panel */}
        <Card style={{ padding: 16 }}>
          <h3 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: 12 }}>Team Members</h3>
          {members.length === 0
            ? <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>No members yet</div>
            : members.map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                  background: 'var(--primary-dim)', color: 'var(--primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '0.8rem',
                }}>
                  {m.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{m.role}</div>
                </div>
              </div>
            ))
          }
        </Card>
      </div>

      {/* Create Task Modal */}
      <Modal open={taskModal} onClose={() => setTaskModal(false)} title="New Task">
        <Input label="Task Title *" placeholder="e.g. Design homepage mockup" value={taskForm.title} onChange={e => setTaskForm(p => ({ ...p, title: e.target.value }))} />
        <Textarea label="Description" placeholder="What needs to be done?" value={taskForm.description} onChange={e => setTaskForm(p => ({ ...p, description: e.target.value }))} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Select label="Assign To" value={taskForm.assigned_to} onChange={e => setTaskForm(p => ({ ...p, assigned_to: e.target.value }))}>
            <option value="">Unassigned</option>
            {allUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </Select>
          <Select label="Priority" value={taskForm.priority} onChange={e => setTaskForm(p => ({ ...p, priority: e.target.value }))}>
            <option value="low">🟢 Low</option>
            <option value="medium">🟡 Medium</option>
            <option value="high">🔴 High</option>
          </Select>
        </div>
        <Input label="Due Date" type="date" value={taskForm.due_date} onChange={e => setTaskForm(p => ({ ...p, due_date: e.target.value }))} />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={() => setTaskModal(false)}>Cancel</Button>
          <Button onClick={handleCreateTask} disabled={saving}>{saving ? 'Creating…' : 'Create Task'}</Button>
        </div>
      </Modal>

      {/* Add Member Modal */}
      <Modal open={memberModal} onClose={() => setMemberModal(false)} title="Add Team Member">
        <Input label="Member Email *" type="email" placeholder="member@example.com" value={memberEmail} onChange={e => setMemberEmail(e.target.value)} />
        <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>The user must have already signed up for TaskFlow.</div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={() => setMemberModal(false)}>Cancel</Button>
          <Button onClick={handleAddMember} disabled={saving}>{saving ? 'Adding…' : 'Add Member'}</Button>
        </div>
      </Modal>

      {/* Task Status Modal */}
      <Modal open={statusModal} onClose={() => setStatusModal(false)} title={selectedTask?.title || 'Task'}>
        {selectedTask && (
          <>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.5 }}>
              {selectedTask.description || 'No description.'}
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Badge color={priorityColor(selectedTask.priority)}>{selectedTask.priority} priority</Badge>
              {selectedTask.assigned_to_name && <Badge color="blue">👤 {selectedTask.assigned_to_name}</Badge>}
              {selectedTask.due_date && <Badge color="primary">📅 {selectedTask.due_date}</Badge>}
            </div>
            <Select label="Update Status" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
              <option value="todo">📋 To Do</option>
              <option value="in_progress">⚡ In Progress</option>
              <option value="done">✅ Done</option>
            </Select>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
              {isAdmin && (
                <Button variant="danger" onClick={handleDeleteTask}>Delete Task</Button>
              )}
              <div style={{ display: 'flex', gap: 10, marginLeft: 'auto' }}>
                <Button variant="ghost" onClick={() => setStatusModal(false)}>Cancel</Button>
                <Button onClick={handleUpdateStatus} disabled={saving}>{saving ? 'Saving…' : 'Update'}</Button>
              </div>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
