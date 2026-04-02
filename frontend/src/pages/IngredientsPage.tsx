import { useState, useEffect, useCallback } from 'react';
import { ingredients as ingredientsApi, ingredientPackages as packagesApi, ingredientCategories as categoriesApi, ingredientSubstitutions as substitutionsApi } from '@/api/client';
import { ApiClientError } from '@/api/client';
import type { IngredientResponse, IngredientPackageResponse, IngredientCategoryResponse, IngredientSubstitutionResponse } from '@/types/api';

const UNIT_OPTIONS = ['g', 'ml', 'pcs'];

export default function IngredientsPage() {
  const [items, setItems] = useState<IngredientResponse[]>([]);
  const [categories, setCategories] = useState<IngredientCategoryResponse[]>([]);
  const [search, setSearch] = useState('');
  const [filterCategoryId, setFilterCategoryId] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create/edit modal
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formName, setFormName] = useState('');
  const [formUnit, setFormUnit] = useState('g');
  const [formCategoryId, setFormCategoryId] = useState<number | null>(null);
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

  // Substitutions modal
  const [showSubs, setShowSubs] = useState(false);
  const [subsIngredient, setSubsIngredient] = useState<IngredientResponse | null>(null);
  const [substitutions, setSubstitutions] = useState<IngredientSubstitutionResponse[]>([]);
  const [subsError, setSubsError] = useState('');
  const [subSubstituteId, setSubSubstituteId] = useState('');
  const [subNote, setSubNote] = useState('');
  const [subEditId, setSubEditId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await ingredientsApi.list(search || undefined, filterCategoryId);
      setItems(data);
    } catch {
      setError('Failed to load ingredients');
    } finally {
      setLoading(false);
    }
  }, [search, filterCategoryId]);

  const loadCategories = useCallback(async () => {
    try {
      const data = await categoriesApi.list();
      setCategories(data);
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadCategories(); }, [loadCategories]);

  function openCreate() {
    setEditId(null);
    setFormName('');
    setFormUnit('g');
    setFormCategoryId(null);
    setFormError('');
    setShowModal(true);
  }

  function openEdit(item: IngredientResponse) {
    setEditId(item.id);
    setFormName(item.name);
    setFormUnit(item.baseUnit);
    setFormCategoryId(item.categoryId);
    setFormError('');
    setShowModal(true);
  }

  async function handleSave() {
    setFormError('');
    setSaving(true);
    try {
      if (editId) {
        await ingredientsApi.update(editId, { name: formName, baseUnit: formUnit, categoryId: formCategoryId });
      } else {
        await ingredientsApi.create({ name: formName, baseUnit: formUnit, categoryId: formCategoryId });
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

  // === Substitutions ===
  async function openSubstitutions(item: IngredientResponse) {
    setSubsIngredient(item);
    setSubsError('');
    setSubEditId(null);
    setSubSubstituteId('');
    setSubNote('');
    setShowSubs(true);
    try {
      const data = await substitutionsApi.list(item.id);
      setSubstitutions(data);
    } catch {
      setSubsError('Failed to load substitutions');
    }
  }

  async function handleSaveSubstitution() {
    if (!subsIngredient) return;
    setSubsError('');
    try {
      if (subEditId) {
        await substitutionsApi.update(subsIngredient.id, subEditId, { note: subNote || null });
      } else {
        await substitutionsApi.create(subsIngredient.id, { substituteId: parseInt(subSubstituteId), note: subNote || null });
      }
      const data = await substitutionsApi.list(subsIngredient.id);
      setSubstitutions(data);
      setSubEditId(null);
      setSubSubstituteId('');
      setSubNote('');
    } catch (err) {
      setSubsError(err instanceof ApiClientError ? err.message : 'Save failed');
    }
  }

  async function handleDeleteSubstitution(id: number) {
    if (!subsIngredient) return;
    try {
      await substitutionsApi.delete(subsIngredient.id, id);
      const data = await substitutionsApi.list(subsIngredient.id);
      setSubstitutions(data);
    } catch (err) {
      setSubsError(err instanceof ApiClientError ? err.message : 'Delete failed');
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

      <div className="search-bar" style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          className="form-input"
          placeholder="Search ingredients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1 }}
        />
        <select
          className="form-select"
          value={filterCategoryId ?? ''}
          onChange={(e) => setFilterCategoryId(e.target.value ? Number(e.target.value) : undefined)}
          style={{ width: 'auto' }}
        >
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Base Unit</th>
                <th style={{ width: '280px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={4} className="empty-state">No ingredients found</td></tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.categoryName ?? <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    <td><span className="badge">{item.baseUnit}</span></td>
                    <td>
                      <div className="flex gap-sm">
                        <button className="btn btn-secondary btn-sm" onClick={() => openPackages(item)}>Packages</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => openSubstitutions(item)}>Subs</button>
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
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" value={formCategoryId ?? ''} onChange={(e) => setFormCategoryId(e.target.value ? Number(e.target.value) : null)}>
                  <option value="">None</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
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

      {/* Substitutions Modal */}
      {showSubs && subsIngredient && (
        <div className="modal-overlay" onClick={() => setShowSubs(false)}>
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span>Substitutions for {subsIngredient.name}</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowSubs(false)}>&times;</button>
            </div>
            <div className="modal-body">
              {subsError && <div className="alert alert-error">{subsError}</div>}

              <table>
                <thead>
                  <tr>
                    <th>Ingredient</th>
                    <th>Substitute</th>
                    <th>Note</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {substitutions.length === 0 ? (
                    <tr><td colSpan={4} className="empty-state">No substitutions defined</td></tr>
                  ) : (
                    substitutions.map((sub) => (
                      <tr key={sub.id}>
                        <td>{sub.ingredientName}</td>
                        <td>{sub.substituteName}</td>
                        <td>{sub.note ?? <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                        <td>
                          <div className="flex gap-sm">
                            <button className="btn btn-secondary btn-sm" onClick={() => {
                              setSubEditId(sub.id);
                              setSubNote(sub.note ?? '');
                            }}>Edit Note</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDeleteSubstitution(sub.id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              <div className="mt-md">
                <h3 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  {subEditId ? 'Edit Substitution Note' : 'Add Substitution'}
                </h3>
                {!subEditId && (
                  <div className="form-group">
                    <label className="form-label">Substitute Ingredient</label>
                    <select className="form-select" value={subSubstituteId} onChange={(e) => setSubSubstituteId(e.target.value)}>
                      <option value="">Select ingredient...</option>
                      {items.filter((i) => i.id !== subsIngredient.id).map((i) => (
                        <option key={i.id} value={i.id}>{i.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Note</label>
                  <input className="form-input" value={subNote} onChange={(e) => setSubNote(e.target.value)} placeholder="Optional note about this substitution" />
                </div>
                <div className="flex gap-sm">
                  <button className="btn btn-primary btn-sm" onClick={handleSaveSubstitution} disabled={!subEditId && !subSubstituteId}>
                    {subEditId ? 'Update' : 'Add'}
                  </button>
                  {subEditId && (
                    <button className="btn btn-secondary btn-sm" onClick={() => { setSubEditId(null); setSubSubstituteId(''); setSubNote(''); }}>
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
