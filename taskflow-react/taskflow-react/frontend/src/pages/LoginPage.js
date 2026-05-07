// src/pages/LoginPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Button, Input, Select } from '../components/UI';
import { Zap } from 'lucide-react';

export default function LoginPage() {
  const [tab, setTab] = useState('login');   // 'login' or 'signup'
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member' });

  const { login } = useAuth();
  const navigate = useNavigate();

  const update = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Fill in all fields');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email: form.email, password: form.password });
      login(data.user, data.token);
      toast.success(`Welcome back, ${data.user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error('Fill in all fields');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/signup', form);
      login(data.user, data.token);
      toast.success('Account created!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)',
      backgroundImage: 'radial-gradient(ellipse at 15% 25%, rgba(124,111,255,0.12) 0%, transparent 55%), radial-gradient(ellipse at 85% 75%, rgba(255,107,157,0.08) 0%, transparent 55%)',
      padding: 20,
    }}>
      <div style={{ display: 'flex', gap: 64, alignItems: 'center', maxWidth: 900, width: '100%' }}>

        {/* Left: info */}
        <div style={{ flex: 1, display: 'none' }} className="auth-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'linear-gradient(135deg, var(--primary), var(--accent))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Zap size={20} color="white" />
            </div>
            <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>TaskFlow</span>
          </div>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 800, lineHeight: 1.2, marginBottom: 20, letterSpacing: '-0.03em' }}>
            Manage your team,<br />ship faster.
          </h1>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {['Create projects and assign tasks', 'Track progress on a Kanban board', 'Role-based access: Admin & Member', 'Dashboard with overdue alerts'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-muted)' }}>
                <span style={{ color: 'var(--success)', fontSize: '1rem' }}>✓</span>
                <span style={{ fontSize: '0.95rem' }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: form card */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 20, padding: 36, width: '100%', maxWidth: 400,
          animation: 'fadeIn 0.3s ease',
        }}>
          {/* Brand (mobile) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg, var(--primary), var(--accent))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Zap size={15} color="white" />
            </div>
            <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>TaskFlow</span>
          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex', background: 'var(--surface2)', borderRadius: 8,
            padding: 3, marginBottom: 24,
          }}>
            {['login', 'signup'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  flex: 1, padding: '9px', border: 'none', borderRadius: 6,
                  background: tab === t ? 'var(--primary)' : 'transparent',
                  color: tab === t ? 'white' : 'var(--text-muted)',
                  fontWeight: tab === t ? 600 : 400, cursor: 'pointer',
                  fontSize: '0.9rem', fontFamily: 'var(--font)', transition: 'all 0.15s',
                  textTransform: 'capitalize',
                }}
              >
                {t === 'login' ? 'Login' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Login Form */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Input label="Email" type="email" placeholder="you@example.com" value={form.email} onChange={update('email')} />
              <Input label="Password" type="password" placeholder="Your password" value={form.password} onChange={update('password')} />
              <Button type="submit" disabled={loading} style={{ marginTop: 4, justifyContent: 'center' }}>
                {loading ? 'Logging in…' : 'Login →'}
              </Button>
            </form>
          )}

          {/* Signup Form */}
          {tab === 'signup' && (
            <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Input label="Full Name" placeholder="John Doe" value={form.name} onChange={update('name')} />
              <Input label="Email" type="email" placeholder="you@example.com" value={form.email} onChange={update('email')} />
              <Input label="Password" type="password" placeholder="Min 6 characters" value={form.password} onChange={update('password')} />
              <Select label="Role" value={form.role} onChange={update('role')}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </Select>
              <Button type="submit" disabled={loading} style={{ marginTop: 4, justifyContent: 'center' }}>
                {loading ? 'Creating…' : 'Create Account →'}
              </Button>
            </form>
          )}
        </div>
      </div>

      <style>{`
        @media (min-width: 700px) { .auth-info { display: block !important; } }
      `}</style>
    </div>
  );
}
