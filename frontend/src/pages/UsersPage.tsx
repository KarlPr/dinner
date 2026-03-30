import { useState, useEffect, useCallback } from 'react';
import { users as usersApi } from '@/api/client';
import { ApiClientError } from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import type { UserResponse } from '@/types/api';

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [items, setItems] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Edit modal
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<UserResponse | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await usersApi.list();
      setItems(data);
    } catch {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openEdit(user: UserResponse) {
    setEditUser(user);
    setFormName(user.name);
    setFormEmail(user.email || '');
    setFormError('');
    setShowModal(true);
  }

  async function handleSave() {
    if (!editUser) return;
    setFormError('');
    setSaving(true);
    try {
      await usersApi.update(editUser.id, { name: formName, email: formEmail || undefined });
      setShowModal(false);
      load();
    } catch (err) {
      setFormError(err instanceof ApiClientError ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Users</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((user) => (
                <tr key={user.id}>
                  <td>
                    {user.name}
                    {user.id === currentUser?.id && <span className="badge" style={{ marginLeft: '0.5rem' }}>You</span>}
                  </td>
                  <td className="text-muted">{user.email || '—'}</td>
                  <td>
                    {user.id === currentUser?.id && (
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(user)}>Edit</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {showModal && editUser && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span>Edit Profile</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              {formError && <div className="alert alert-error">{formError}</div>}
              <div className="form-group">
                <label className="form-label">Name</label>
                <input className="form-input" value={formName} onChange={(e) => setFormName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email (optional)</label>
                <input className="form-input" type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving || !formName.trim()}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
