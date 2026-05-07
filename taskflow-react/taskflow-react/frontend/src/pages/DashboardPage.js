// src/pages/DashboardPage.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Card, Badge, Spinner, EmptyState } from '../components/UI';
import { TrendingUp, Clock, CheckCircle, AlertTriangle, FolderOpen, ListTodo } from 'lucide-react';

// A single stat card on the dashboard
function StatCard({ icon: Icon, label, value, color = 'var(--primary)', bg = 'var(--primary-dim)' }) {
  return (
    <Card style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{
        width: 46, height: 46, borderRadius: 10, background: bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <div style={{ fontSize: '1.8rem', fontWeight: 800, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 3 }}>{label}</div>
      </div>
    </Card>
  );
}

// Status dot
function StatusDot({ status }) {
  const colors = { todo: 'var(--todo)', in_progress: 'var(--inprogress)', done: 'var(--done)' };
  return (
    <div style={{ width: 8, height: 8, borderRadius: '50%', background: colors[status] || 'var(--text-dim)', flexShrink: 0 }} />
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tasks/dashboard')
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <Spinner size={32} />
    </div>
  );

  const priorityColor = (p) => ({ high: 'danger', medium: 'warning', low: 'success' })[p] || 'primary';

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
          {greeting}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: '0.9rem' }}>
          Here's what's happening with your tasks today.
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 32 }}>
        <StatCard icon={FolderOpen} label="Projects" value={stats?.total_projects ?? 0} />
        <StatCard icon={ListTodo} label="Total Tasks" value={stats?.total_tasks ?? 0} />
        <StatCard icon={TrendingUp} label="In Progress" value={stats?.in_progress ?? 0} color="var(--inprogress)" bg="rgba(251,191,36,0.12)" />
        <StatCard icon={CheckCircle} label="Completed" value={stats?.done ?? 0} color="var(--done)" bg="rgba(74,222,128,0.12)" />
        <StatCard icon={Clock} label="To Do" value={stats?.todo ?? 0} color="var(--todo)" bg="rgba(96,165,250,0.12)" />
        <StatCard icon={AlertTriangle} label="Overdue" value={stats?.overdue ?? 0} color="var(--danger)" bg="rgba(248,113,113,0.12)" />
      </div>

      {/* Recent Tasks */}
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Recent Tasks</h2>
      </div>

      {!stats?.recent_tasks?.length ? (
        <Card>
          <EmptyState icon="✅" title="No tasks yet" subtitle={user?.role === 'admin' ? 'Create a project and add tasks to get started.' : 'Ask an admin to assign tasks to you.'} />
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {stats.recent_tasks.map(task => {
            const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
            return (
              <Card
                key={task.id}
                hoverable
                onClick={() => navigate('/projects')}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px' }}
              >
                <StatusDot status={task.status} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: '0.92rem' }}>{task.title}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 2 }}>
                    {task.project_name && `📁 ${task.project_name}`}
                    {task.due_date && ` · 📅 ${task.due_date}`}
                    {isOverdue && <span style={{ color: 'var(--danger)', marginLeft: 6 }}>⚠ Overdue</span>}
                  </div>
                </div>
                <Badge color={priorityColor(task.priority)}>{task.priority}</Badge>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
