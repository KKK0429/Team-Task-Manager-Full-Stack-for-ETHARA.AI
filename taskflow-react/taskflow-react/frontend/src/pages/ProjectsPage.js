// src/pages/ProjectsPage.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Card, Button, Modal, Input, Textarea, Spinner, EmptyState } from '../components/UI';
import { Plus, Users, CheckSquare, FolderOpen } from 'lucide-react';

export default function ProjectsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  const fetchProjects = () => {
    setLoading(true);
    api.get('/projects')
      .then(res => setProjects(res.data))
      .catch(() => toast.error('Failed to load projects'))
      .finally(() => setLoading(false));
  };

  useEffect(fetchProjects, []);

  const handleCreate = async () => {
    if (!form.name.trim()) return toast.error('Project name is required');
    setSaving(true);
    try {
      await api.post('/projects', form);
      toast.success('Project created!');
      setModal(false);
      setForm({ name: '', description: '' });
      fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Projects</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: 3 }}>
            {projects.length} project{projects.length !== 1 ? 's' : ''}
          </p>
        </div>
        {user?.role === 'admin' && (
          <Button onClick={() => setModal(true)}>
            <Plus size={15} /> New Project
          </Button>
        )}
      </div>

      {/* Projects grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
          <Spinner size={28} />
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <EmptyState
            icon="📁"
            title="No projects yet"
            subtitle={user?.role === 'admin' ? "Click 'New Project' to create your first project." : "You haven't been added to any projects yet."}
          />
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 16 }}>
          {projects.map(project => (
            <Card
              key={project.id}
              hoverable
              onClick={() => navigate(`/projects/${project.id}`)}
              style={{ cursor: 'pointer' }}
            >
              {/* Project icon */}
              <div style={{
                width: 38, height: 38, borderRadius: 8, marginBottom: 14,
                background: 'var(--primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <FolderOpen size={18} color="var(--primary)" />
              </div>

              <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 6 }}>{project.name}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: 16, minHeight: 40 }}>
                {project.description || 'No description'}
              </p>

              <div style={{ display: 'flex', gap: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  <Users size={13} />
                  {project.member_count} member{project.member_count !== 1 ? 's' : ''}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  <CheckSquare size={13} />
                  {project.task_count} task{project.task_count !== 1 ? 's' : ''}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <Modal open={modal} onClose={() => { setModal(false); setForm({ name: '', description: '' }); }} title="New Project">
        <Input label="Project Name *" placeholder="e.g. Website Redesign" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
        <Textarea label="Description" placeholder="What is this project about?" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={() => setModal(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={saving}>{saving ? 'Creating…' : 'Create Project'}</Button>
        </div>
      </Modal>
    </div>
  );
}
