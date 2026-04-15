import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../api';
import toast from 'react-hot-toast';

function Register({ setAuth }) {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.register(formData);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setAuth(true);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative shadow-none">
      <div className="mesh-bg"></div>
      <div className="glass-panel p-8 w-full max-w-md z-10 animate-fade-in-up m-4">
        <h2 className="text-3xl font-bold text-center mb-6" style={{ color: 'var(--text-primary)' }}>Create Account</h2>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Name</label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-lg outline-none transition-all glow-border text-inherit"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Email</label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-lg outline-none transition-all glow-border text-inherit"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Password</label>
            <input
              type="password"
              required
              minLength={6}
              className="w-full px-4 py-3 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-lg outline-none transition-all glow-border text-inherit"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full glass-button font-semibold py-3 px-4 rounded-lg mt-2"
          >
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="mt-6 text-center" style={{ color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent-1)' }} className="hover:opacity-80 font-medium transition-opacity">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
