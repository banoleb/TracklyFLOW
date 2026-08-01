import React, { useState } from 'react';
import { chatsApi, usersApi } from '../../api';
import { useChatStore } from '../../store/chatStore';
import { User } from '../../types';

interface NewChatModalProps {
  onClose: () => void;
}

const NewChatModal: React.FC<NewChatModalProps> = ({ onClose }) => {
  const { addChat, setActiveChat } = useChatStore();
  const [type, setType] = useState<'personal' | 'group' | 'channel'>('personal');
  const [name, setName] = useState('');
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selected, setSelected] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!search.trim()) return;
    try {
      const res = await usersApi.search(search.trim());
      setSearchResults(res.data.data.users);
    } catch {}
  };

  const toggleUser = (user: User) => {
    if (selected.find((u) => u.id === user.id)) {
      setSelected(selected.filter((u) => u.id !== user.id));
    } else {
      if (type === 'personal') {
        setSelected([user]);
      } else {
        setSelected([...selected, user]);
      }
    }
  };

  const handleCreate = async () => {
    setError('');
    if (type !== 'personal' && !name.trim()) {
      setError('Please enter a chat name');
      return;
    }
    if (selected.length === 0) {
      setError('Please select at least one user');
      return;
    }
    setLoading(true);
    try {
      const res = await chatsApi.create({
        type,
        name: name.trim() || undefined,
        member_ids: selected.map((u) => u.id),
      });
      const chat = res.data.data;
      addChat(chat);
      setActiveChat(chat);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create chat');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>New Chat</h3>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>Type</label>
            <select value={type} onChange={(e) => setType(e.target.value as any)}>
              <option value="personal">Personal</option>
              <option value="group">Group</option>
              <option value="channel">Channel</option>
            </select>
          </div>

          {type !== 'personal' && (
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Chat name"
              />
            </div>
          )}

          <div className="form-group">
            <label>Add members</label>
            <div className="search-row">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search users…"
              />
              <button className="btn-secondary" onClick={handleSearch}>Search</button>
            </div>
          </div>

          {searchResults.length > 0 && (
            <ul className="user-search-results">
              {searchResults.map((u) => (
                <li
                  key={u.id}
                  className={`user-result${selected.find((s) => s.id === u.id) ? ' selected' : ''}`}
                  onClick={() => toggleUser(u)}
                >
                  <span className="user-avatar-placeholder">{u.username[0].toUpperCase()}</span>
                  {u.username}
                  {selected.find((s) => s.id === u.id) && <span className="checkmark">✓</span>}
                </li>
              ))}
            </ul>
          )}

          {selected.length > 0 && (
            <div className="selected-users">
              {selected.map((u) => (
                <span key={u.id} className="tag">
                  {u.username}
                  <button onClick={() => toggleUser(u)}>✕</button>
                </span>
              ))}
            </div>
          )}

          {error && <div className="error-banner">{error}</div>}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleCreate} disabled={loading}>
            {loading ? 'Creating…' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewChatModal;
