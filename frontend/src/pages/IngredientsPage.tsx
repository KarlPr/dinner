import { useState, useEffect, useCallback } from 'react';
import { ingredients as ingredientsApi, ingredientPackages as packagesApi } from '@/api/client';
import { ApiClientError } from '@/api/client';
import type { IngredientResponse, IngredientPackageResponse } from '@/types/api';

const UNIT_OPTIONS = ['g', 'ml', 'pcs'];

export default function IngredientsPage() {
  const [items, setItems] = useState<IngredientResponse[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create/edit modal
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formName, setFormName] = useState('');
  const [formUnit, setFormUnit] = useState('g');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Packages modal
  const [showPackages, setShowPackages] = useState(false);
  const [pkgIngredient, setPkgIngredient] = useState<IngredientResponse | null>(null);
  const [packages, setPackages] = useState<IngredientPackageResponse[]>([]);
  const [pkgLabel, setPkgLabel] = useState('');
  const [pkgQty, setPkgQty] = useState('');
  const [pkgUnit, setPkgUnit] = useState('g');
  const [pkgEditId, setPkgEditId] = useState<number | null>(null);
  const [pkgError, setPkgError] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await ingredientsApi.list(search || undefined);
      setItems(data);
    } catch {
      setError('Failed to load ingredients');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditId(null);
    setFormName('');
    setFormUnit('g');
    setFormError('');
    setShowModal(true);
  }

  function openEdit(item: IngredientResponse) {
    setEditId(item.id);
    setFormName(item.name);
    setFormUnit(item.baseUnit);
    setFormError('');
    setShowModal(true);
  }

  async function handleSave() {
    setFormError('');
    setSaving(true);
    try {
      if (editId) {
        await ingredientsApi.update(editId, { name: formName, baseUnit: formUnit });
      } else {
        await ingredientsApi.create({ name: formName, baseUnit: formUnit });
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
    if (!confirm('Delete this ingredient?')) return;
    try {
      await ingredientsApi.delete(id);
      load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Delete failed');
    }
  }

  // === Packages ===
  async function openPackages(item: IngredientResponse) {
    setPkgIngredient(item);
    setPkgUnit(item.baseUnit);
    setPkgError('');
    setPkgEditId(null);
    setPkgLabel('');
    setPkgQty('');
    setShowPackages(true);
    try {
      const data = await packagesApi.list(item.id);
      setPackages(data);
    } catch {
      setPkgError('Failed to load packages');
    }
  }

  async function handleSavePackage() {
    if (!pkgIngredient) return;
    setPkgError('');
    try {
      if (pkgEditId) {
        await packagesApi.update(pkgIngredient.id, pkgEditId, { label: pkgLabel, packageQuantity: parseFloat(pkgQty), unit: pkgUnit });
      } else {
        await packagesApi.create(pkgIngredient.id, { label: pkgLabel, packageQuantity: parseFloat(pkgQty), unit: pkgUnit });
      }
      const data = await packagesApi.list(pkgIngredient.id);
      setPackages(data);
      setPkgEditId(null);
      setPkgLabel('');
      setPkgQty('');
    } catch (err) {
      setPkgError(err instanceof ApiClientError ? err.message : 'Save failed');
    }
  }

  async function handleDeletePackage(id: number) {
    if (!pkgIngredient) return;
    try {
      await packagesApi.delete(pkgIngredient.id, id);
      const data = await packagesApi.list(pkgIngredient.id);
      setPackages(data);
    } catch (err) {
      setPkgError(err instanceof ApiClientError ? err.message : 'Delete failed');
    }
  }

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Ingredients</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Ingredient</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="search-bar">
        <input
          className="form-input"
          placeholder="Search ingredients..."
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
                <th>Base Unit</th>
                <th style={{ width: '200px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={3} className="empty-state">No ingredients found</td></tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td><span className="badge">{item.baseUnit}</span></td>
                    <td>
                      <div className="flex gap-sm">
                        <button className="btn btn-secondary btn-sm" onClick={() => openPackages(item)}>Packages</button>
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
              <span>{editId ? 'Edit Ingredient' : 'New Ingredient'}</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              {formError && <div className="alert alert-error">{formError}</div>}
              <div className="form-group">
                <label className="form-label">Name</label>
                <input className="form-input" value={formName} onChange={(e) => setFormName(e.target.value)} autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Base Unit</label>
                <select className="form-select" value={formUnit} onChange={(e) => setFormUnit(e.target.value)}>
                  {UNIT_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
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

      {/* Packages Modal */}
      {showPackages && pkgIngredient && (
        <div className="modal-overlay" onClick={() => setShowPackages(false)}>
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span>Packages for {pkgIngredient.name}</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowPackages(false)}>&times;</button>
            </div>
            <div className="modal-body">
              {pkgError && <div className="alert alert-error">{pkgError}</div>}

              <table>
                <thead>
                  <tr>
                    <th>Label</th>
                    <th>Quantity</th>
                    <th>Unit</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {packages.map((pkg) => (
                    <tr key={pkg.id}>
                      <td>{pkg.label}</td>
                      <td>{pkg.packageQuantity}</td>
                      <td>{pkg.unit}</td>
                      <td>
                        <div className="flex gap-sm">
                          <button className="btn btn-secondary btn-sm" onClick={() => {
                            setPkgEditId(pkg.id);
                            setPkgLabel(pkg.label);
                            setPkgQty(String(pkg.packageQuantity));
                            setPkgUnit(pkg.unit);
                          }}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeletePackage(pkg.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-md">
                <h3 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  {pkgEditId ? 'Edit Package' : 'Add Package'}
                </h3>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Label</label>
                    <input className="form-input" value={pkgLabel} onChange={(e) => setPkgLabel(e.target.value)} placeholder="e.g. 1kg bag" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Quantity</label>
                    <input className="form-input" type="number" min="0" step="any" value={pkgQty} onChange={(e) => setPkgQty(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Unit</label>
                    <select className="form-select" value={pkgUnit} onChange={(e) => setPkgUnit(e.target.value)}>
                      {UNIT_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-sm">
                  <button className="btn btn-primary btn-sm" onClick={handleSavePackage} disabled={!pkgLabel.trim() || !pkgQty}>
                    {pkgEditId ? 'Update' : 'Add'}
                  </button>
                  {pkgEditId && (
                    <button className="btn btn-secondary btn-sm" onClick={() => { setPkgEditId(null); setPkgLabel(''); setPkgQty(''); }}>
                      Cancel Edit
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
