import React, { useState } from 'react';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';

const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-brand">
          <span className="brand-icon-large">💬</span>
          <h1>TracklyFlow</h1>
          <p>Team chat &amp; task tracking</p>
        </div>
        {mode === 'login' ? (
          <LoginForm onSwitch={() => setMode('register')} />
        ) : (
          <RegisterForm onSwitch={() => setMode('login')} />
        )}
      </div>
    </div>
  );
};

export default AuthPage;
