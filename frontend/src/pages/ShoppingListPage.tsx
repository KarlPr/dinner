import { useState, useEffect, useCallback } from 'react';
import { shoppingList as shoppingListApi, mealPlans as mealPlanApi } from '@/api/client';
import { ApiClientError } from '@/api/client';
import type { ShoppingListResponse, MealPlanResponse, GeneratedShoppingListResponse } from '@/types/api';

export default function ShoppingListPage() {
  const [savedList, setSavedList] = useState<ShoppingListResponse | null>(null);
  const [generatedList, setGeneratedList] = useState<GeneratedShoppingListResponse | null>(null);
  const [mealPlanEntries, setMealPlanEntries] = useState<MealPlanResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Generate modal
  const [showGenerate, setShowGenerate] = useState(false);
  const [selectedMealPlanIds, setSelectedMealPlanIds] = useState<number[]>([]);
  const [subtractPantry, setSubtractPantry] = useState(true);
  const [applyPackages, setApplyPackages] = useState(true);
  const [generating, setGenerating] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await shoppingListApi.get();
      setSavedList(list);
    } catch {
      // No saved list or error - that's fine
      setSavedList(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function loadMealPlanForGenerate() {
    // Load 2 weeks of meal plan entries
    const today = new Date();
    const from = today.toISOString().split('T')[0];
    const future = new Date(today);
    future.setDate(future.getDate() + 14);
    const to = future.toISOString().split('T')[0];

    try {
      const entries = await mealPlanApi.list(from, to);
      setMealPlanEntries(entries);
      setSelectedMealPlanIds(entries.map((e) => e.id));
    } catch {
      setError('Failed to load meal plan entries');
    }
  }

  async function handleGenerate() {
    if (selectedMealPlanIds.length === 0) return;
    setGenerating(true);
    setError('');
    try {
      const result = await shoppingListApi.generate({
        mealPlanIds: selectedMealPlanIds,
        subtractPantry,
        applyPackages,
      });
      setGeneratedList(result);
      setShowGenerate(false);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  }

  async function handleSaveGenerated() {
    if (!generatedList) return;
    try {
      const result = await shoppingListApi.save({
        items: generatedList.items
          .filter((i) => i.neededQuantity > 0)
          .map((i) => ({
            ingredientId: i.ingredientId,
            quantity: i.neededQuantity,
            checked: false,
          })),
      });
      setSavedList(result);
      setGeneratedList(null);
      setSuccess('Shopping list saved');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Save failed');
    }
  }

  async function handleToggleItem(id: number, checked: boolean) {
    try {
      await shoppingListApi.updateItem(id, { checked });
      load();
    } catch {
      setError('Failed to update item');
    }
  }

  async function handleClear() {
    if (!confirm('Clear the shopping list?')) return;
    try {
      await shoppingListApi.clear();
      setSavedList(null);
      setSuccess('Shopping list cleared');
    } catch {
      setError('Clear failed');
    }
  }

  function toggleMealPlanSelection(id: number) {
    setSelectedMealPlanIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Shopping List</h1>
        <div className="flex gap-sm">
          <button className="btn btn-primary" onClick={() => { setShowGenerate(true); loadMealPlanForGenerate(); }}>
            Generate from Meal Plan
          </button>
          {savedList && (
            <button className="btn btn-danger" onClick={handleClear}>Clear List</button>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Generated (unsaved) list */}
      {generatedList && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="card-header flex justify-between items-center">
            <span>Generated Shopping List</span>
            <div className="flex gap-sm">
              <button className="btn btn-primary btn-sm" onClick={handleSaveGenerated}>Save List</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setGeneratedList(null)}>Dismiss</button>
            </div>
          </div>
          <div className="card-body">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Ingredient</th>
                    <th>Required</th>
                    <th>In Pantry</th>
                    <th>Needed</th>
                    <th>Unit</th>
                    <th>Packages</th>
                  </tr>
                </thead>
                <tbody>
                  {generatedList.items.map((item) => (
                    <tr key={item.ingredientId}>
                      <td>{item.ingredientName}</td>
                      <td>{item.requiredQuantity}</td>
                      <td>{item.pantryQuantity}</td>
                      <td>
                        <span className={item.neededQuantity > 0 ? 'badge badge-warning' : 'badge badge-success'}>
                          {item.neededQuantity}
                        </span>
                      </td>
                      <td>{item.unit}</td>
                      <td>
                        {item.packages?.map((pkg) => (
                          <span key={pkg.packageId} className="badge" style={{ marginRight: '4px' }}>
                            {pkg.count}x {pkg.label}
                          </span>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Saved list */}
      {savedList ? (
        <div className="card">
          <div className="card-header">
            Saved List &middot; {new Date(savedList.createdAt).toLocaleDateString()}
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {savedList.items.length === 0 ? (
              <div className="empty-state">List is empty</div>
            ) : (
              savedList.items.map((item) => (
                <div key={item.id} className={`shopping-item${item.checked ? ' checked' : ''}`}>
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => handleToggleItem(item.id, !item.checked)}
                  />
                  <span className="shopping-item-name">{item.ingredientName}</span>
                  <span className="shopping-item-qty">{item.quantity} {item.unit}</span>
                </div>
              ))
            )}
          </div>
        </div>
      ) : !generatedList && (
        <div className="card">
          <div className="empty-state">
            <p>No shopping list yet.</p>
            <p className="text-sm">Generate one from your meal plan.</p>
          </div>
        </div>
      )}

      {/* Generate Modal */}
      {showGenerate && (
        <div className="modal-overlay" onClick={() => setShowGenerate(false)}>
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span>Generate Shopping List</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowGenerate(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <p className="text-sm text-muted mb-md">Select meal plan entries to include in the shopping list.</p>

              <div className="form-row" style={{ marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">
                    <input
                      type="checkbox"
                      checked={subtractPantry}
                      onChange={(e) => setSubtractPantry(e.target.checked)}
                      style={{ marginRight: '0.5rem' }}
                    />
                    Subtract pantry stock
                  </label>
                </div>
                <div className="form-group">
                  <label className="form-label">
                    <input
                      type="checkbox"
                      checked={applyPackages}
                      onChange={(e) => setApplyPackages(e.target.checked)}
                      style={{ marginRight: '0.5rem' }}
                    />
                    Apply package sizes
                  </label>
                </div>
              </div>

              {mealPlanEntries.length === 0 ? (
                <p className="text-muted text-sm">No upcoming meal plan entries found.</p>
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th style={{ width: '40px' }}></th>
                        <th>Date</th>
                        <th>Meal</th>
                        <th>Recipe</th>
                        <th>Servings</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mealPlanEntries.map((entry) => (
                        <tr key={entry.id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedMealPlanIds.includes(entry.id)}
                              onChange={() => toggleMealPlanSelection(entry.id)}
                            />
                          </td>
                          <td>{entry.date}</td>
                          <td><span className={`badge`}>{entry.mealType}</span></td>
                          <td>{entry.recipeName}</td>
                          <td>{entry.servings}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowGenerate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleGenerate} disabled={generating || selectedMealPlanIds.length === 0}>
                {generating ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
