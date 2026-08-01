import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api';

interface RegisterFormProps {
  onSwitch: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitch }) => {
  const { login } = useAuthStore();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.register({ username, email, password });
      const { access_token, refresh_token, user } = res.data.data;
      login(access_token, refresh_token, user);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form">
      <h2>Create your account</h2>
      {error && <div className="error-banner">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="your_username"
            minLength={3}
            maxLength={80}
            required
            autoFocus
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 6 characters"
            minLength={6}
            required
          />
        </div>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Creating account…' : 'Create Account'}
        </button>
      </form>
      <p className="auth-switch">
        Already have an account?{' '}
        <button className="link-btn" onClick={onSwitch}>
          Sign In
        </button>
      </p>
    </div>
  );
};

export default RegisterForm;
