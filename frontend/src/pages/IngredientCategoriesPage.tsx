import { useState, useEffect, useCallback } from 'react';
import { ingredientCategories as categoriesApi } from '@/api/client';
import { ApiClientError } from '@/api/client';
import type { IngredientCategoryResponse, IngredientCategoryDetailResponse } from '@/types/api';

export default function IngredientCategoriesPage() {
  const [items, setItems] = useState<IngredientCategoryResponse[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create/edit modal
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formName, setFormName] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Detail modal
  const [showDetail, setShowDetail] = useState(false);
  const [detail, setDetail] = useState<IngredientCategoryDetailResponse | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await categoriesApi.list(search || undefined);
      setItems(data);
    } catch {
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditId(null);
    setFormName('');
    setFormError('');
    setShowModal(true);
  }

  function openEdit(item: IngredientCategoryResponse) {
    setEditId(item.id);
    setFormName(item.name);
    setFormError('');
    setShowModal(true);
  }

  async function handleSave() {
    setFormError('');
    setSaving(true);
    try {
      if (editId) {
        await categoriesApi.update(editId, { name: formName });
      } else {
        await categoriesApi.create({ name: formName });
      }
      setShowModal(false);
      load();
    } catch (err) {
      setFormError(err instanceof ApiClientError ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this category?')) return;
    try {
      await categoriesApi.delete(id);
      load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Delete failed');
    }
  }

  async function openDetail(id: number) {
    try {
      const data = await categoriesApi.get(id);
      setDetail(data);
      setShowDetail(true);
    } catch {
      setError('Failed to load category details');
    }
  }

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Ingredient Categories</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Category</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="search-bar">
        <input
          className="form-input"
          placeholder="Search categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th style={{ width: '200px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={2} className="empty-state">No categories found</td></tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <button className="btn btn-ghost" onClick={() => openDetail(item.id)} style={{ padding: 0, textDecoration: 'underline' }}>
                        {item.name}
                      </button>
                    </td>
                    <td>
                      <div className="flex gap-sm">
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(item)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span>{editId ? 'Edit Category' : 'New Category'}</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              {formError && <div className="alert alert-error">{formError}</div>}
              <div className="form-group">
                <label className="form-label">Name</label>
                <input className="form-input" value={formName} onChange={(e) => setFormName(e.target.value)} autoFocus />
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

      {/* Detail Modal */}
      {showDetail && detail && (
        <div className="modal-overlay" onClick={() => setShowDetail(false)}>
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span>{detail.name} — Ingredients</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowDetail(false)}>&times;</button>
            </div>
            <div className="modal-body">
              {detail.ingredients.length === 0 ? (
                <p className="empty-state">No ingredients in this category</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Base Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.ingredients.map((ing) => (
                      <tr key={ing.id}>
                        <td>{ing.name}</td>
                        <td><span className="badge">{ing.baseUnit}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
