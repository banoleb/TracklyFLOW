import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { disconnectSocket } from '../../utils/socket';

const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    disconnectSocket();
    await logout();
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="brand-icon">💬</span>
        <span className="brand-name">TracklyFlow</span>
      </div>
      <div className="navbar-user">
        <span className="nav-username">{user?.username}</span>
        <button className="btn-logout" onClick={handleLogout}>
          Sign Out
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
