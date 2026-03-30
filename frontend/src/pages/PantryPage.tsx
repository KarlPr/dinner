import { useState, useEffect, useCallback } from 'react';
import { pantry as pantryApi, ingredients as ingredientsApi, recipes as recipesApi } from '@/api/client';
import { ApiClientError } from '@/api/client';
import type { PantryItemResponse, IngredientResponse, RecipeListResponse } from '@/types/api';

export default function PantryPage() {
  const [items, setItems] = useState<PantryItemResponse[]>([]);
  const [allIngredients, setAllIngredients] = useState<IngredientResponse[]>([]);
  const [allRecipes, setAllRecipes] = useState<RecipeListResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Add/Edit
  const [showModal, setShowModal] = useState(false);
  const [editIngredientId, setEditIngredientId] = useState<number | null>(null);
  const [formIngredientId, setFormIngredientId] = useState(0);
  const [formQuantity, setFormQuantity] = useState('0');
  const [formError, setFormError] = useState('');

  // Consume Recipe
  const [showConsume, setShowConsume] = useState(false);
  const [consumeRecipeId, setConsumeRecipeId] = useState(0);
  const [consumeServings, setConsumeServings] = useState(4);

  const load = useCallback(async () => {
    try {
      const [data, ingr, recs] = await Promise.all([
        pantryApi.list(),
        ingredientsApi.list(),
        recipesApi.list(),
      ]);
      setItems(data);
      setAllIngredients(ingr);
      setAllRecipes(recs);
    } catch {
      setError('Failed to load pantry');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setEditIngredientId(null);
    const available = allIngredients.find((i) => !items.some((p) => p.ingredientId === i.id));
    setFormIngredientId(available?.id || allIngredients[0]?.id || 0);
    setFormQuantity('0');
    setFormError('');
    setShowModal(true);
  }

  function openEdit(item: PantryItemResponse) {
    setEditIngredientId(item.ingredientId);
    setFormIngredientId(item.ingredientId);
    setFormQuantity(String(item.quantity));
    setFormError('');
    setShowModal(true);
  }

  async function handleSave() {
    setFormError('');
    try {
      const ingredientId = editIngredientId || formIngredientId;
      await pantryApi.set(ingredientId, { quantity: parseFloat(formQuantity) || 0 });
      setShowModal(false);
      load();
    } catch (err) {
      setFormError(err instanceof ApiClientError ? err.message : 'Save failed');
    }
  }

  async function handleDelete(ingredientId: number) {
    if (!confirm('Remove this item from the pantry?')) return;
    try {
      await pantryApi.delete(ingredientId);
      load();
    } catch {
      setError('Delete failed');
    }
  }

  async function handleConsume() {
    setSuccess('');
    setError('');
    try {
      await pantryApi.consumeRecipe({ recipeId: consumeRecipeId, servings: consumeServings });
      setShowConsume(false);
      setSuccess('Recipe ingredients deducted from pantry');
      load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Consume failed');
    }
  }

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Pantry</h1>
        <div className="flex gap-sm">
          <button className="btn btn-secondary" onClick={() => { setShowConsume(true); setConsumeRecipeId(allRecipes[0]?.id || 0); }}>
            Consume Recipe
          </button>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Item</button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Ingredient</th>
                <th>Quantity</th>
                <th>Unit</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={5} className="empty-state">Pantry is empty</td></tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.ingredientName}</td>
                    <td>
                      <span className={item.quantity <= 0 ? 'badge badge-danger' : item.quantity < 100 ? 'badge badge-warning' : 'badge badge-success'}>
                        {item.quantity}
                      </span>
                    </td>
                    <td>{item.unit}</td>
                    <td className="text-muted text-sm">{new Date(item.updatedAt).toLocaleDateString()}</td>
                    <td>
                      <div className="flex gap-sm">
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(item)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.ingredientId)}>Remove</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Set Quantity Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span>{editIngredientId ? 'Update Quantity' : 'Add Pantry Item'}</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              {formError && <div className="alert alert-error">{formError}</div>}

              {!editIngredientId && (
                <div className="form-group">
                  <label className="form-label">Ingredient</label>
                  <select className="form-select" value={formIngredientId} onChange={(e) => setFormIngredientId(parseInt(e.target.value, 10))}>
                    {allIngredients.map((i) => (
                      <option key={i.id} value={i.id}>{i.name} ({i.baseUnit})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Quantity</label>
                <input className="form-input" type="number" min="0" step="any" value={formQuantity} onChange={(e) => setFormQuantity(e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Consume Recipe Modal */}
      {showConsume && (
        <div className="modal-overlay" onClick={() => setShowConsume(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span>Consume Recipe Ingredients</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowConsume(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <p className="text-sm text-muted mb-md">Deduct ingredient quantities used by a recipe from the pantry.</p>
              <div className="form-group">
                <label className="form-label">Recipe</label>
                <select className="form-select" value={consumeRecipeId} onChange={(e) => setConsumeRecipeId(parseInt(e.target.value, 10))}>
                  {allRecipes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Servings</label>
                <input className="form-input" type="number" min="1" value={consumeServings} onChange={(e) => setConsumeServings(parseInt(e.target.value, 10) || 1)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowConsume(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleConsume}>Consume</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
