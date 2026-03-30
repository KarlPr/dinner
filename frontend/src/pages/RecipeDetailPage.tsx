import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { recipes as recipesApi, ingredients as ingredientsApi } from '@/api/client';
import { ApiClientError } from '@/api/client';
import type { RecipeDetailResponse, IngredientResponse, RecipeIngredientInput } from '@/types/api';

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [recipe, setRecipe] = useState<RecipeDetailResponse | null>(null);
  const [allIngredients, setAllIngredients] = useState<IngredientResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(isNew);

  // Form state
  const [formName, setFormName] = useState('');
  const [formInstructions, setFormInstructions] = useState('');
  const [formServings, setFormServings] = useState(4);
  const [formIngredients, setFormIngredients] = useState<RecipeIngredientInput[]>([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const ingr = await ingredientsApi.list();
      setAllIngredients(ingr);

      if (!isNew && id) {
        const data = await recipesApi.get(parseInt(id, 10));
        setRecipe(data);
        setFormName(data.name);
        setFormInstructions(data.instructions || '');
        setFormServings(data.servings);
        setFormIngredients(data.ingredients.map((i) => ({ ingredientId: i.ingredientId, quantity: i.quantity })));
      }
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [id, isNew]);

  useEffect(() => { load(); }, [load]);

  function addIngredientRow() {
    const firstAvailable = allIngredients.find(
      (i) => !formIngredients.some((fi) => fi.ingredientId === i.id)
    );
    if (firstAvailable) {
      setFormIngredients([...formIngredients, { ingredientId: firstAvailable.id, quantity: 0 }]);
    }
  }

  function updateIngredientRow(index: number, field: 'ingredientId' | 'quantity', value: number) {
    const updated = [...formIngredients];
    updated[index] = { ...updated[index], [field]: value };
    setFormIngredients(updated);
  }

  function removeIngredientRow(index: number) {
    setFormIngredients(formIngredients.filter((_, i) => i !== index));
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);

    const payload = {
      name: formName,
      instructions: formInstructions || undefined,
      servings: formServings,
      ingredients: formIngredients.filter((i) => i.quantity > 0),
    };

    try {
      if (isNew) {
        const created = await recipesApi.create(payload);
        navigate(`/recipes/${created.id}`, { replace: true });
      } else if (id) {
        const updated = await recipesApi.update(parseInt(id, 10), payload);
        setRecipe(updated);
        setEditing(false);
      }
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleImageUpload(file: File) {
    if (!id || isNew) return;
    try {
      const result = await recipesApi.uploadImage(parseInt(id, 10), file);
      setRecipe((prev) => prev ? { ...prev, imagePath: result.imagePath } : prev);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Image upload failed');
    }
  }

  async function handleImageDelete() {
    if (!id || isNew) return;
    try {
      await recipesApi.deleteImage(parseInt(id, 10));
      setRecipe((prev) => prev ? { ...prev, imagePath: null } : prev);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Image delete failed');
    }
  }

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  // View mode
  if (!editing && recipe) {
    return (
      <div>
        <div className="page-header">
          <div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/recipes')} style={{ marginBottom: '0.5rem' }}>
              &larr; Back to Recipes
            </button>
            <h1>{recipe.name}</h1>
          </div>
          <div className="flex gap-sm">
            <button className="btn btn-secondary" onClick={() => setEditing(true)}>Edit</button>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="grid-2">
          <div className="card">
            <div className="card-header">Details</div>
            <div className="card-body">
              <p className="text-sm text-muted" style={{ marginBottom: '0.5rem' }}>
                {recipe.servings} servings &middot; by {recipe.createdByName}
              </p>
              {recipe.imagePath && (
                <div style={{ marginBottom: '1rem' }}>
                  <img src={recipe.imagePath} alt={recipe.name} style={{ maxWidth: '100%', borderRadius: 'var(--radius-md)' }} />
                  <button className="btn btn-danger btn-sm mt-md" onClick={handleImageDelete}>Remove Image</button>
                </div>
              )}
              {!recipe.imagePath && (
                <div style={{ marginBottom: '1rem' }}>
                  <label className="btn btn-secondary btn-sm">
                    Upload Image
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      style={{ display: 'none' }}
                      onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                    />
                  </label>
                </div>
              )}
              {recipe.instructions && (
                <div>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Instructions</h3>
                  <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{recipe.instructions}</p>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">Ingredients</div>
            <div className="card-body">
              {recipe.ingredients.length === 0 ? (
                <p className="text-muted text-sm">No ingredients</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Ingredient</th>
                      <th>Quantity</th>
                      <th>Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recipe.ingredients.map((ing) => (
                      <tr key={ing.id}>
                        <td>{ing.ingredientName}</td>
                        <td>{ing.quantity}</td>
                        <td>{ing.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Edit/Create mode
  return (
    <div>
      <div className="page-header">
        <div>
          <button className="btn btn-ghost btn-sm" onClick={() => isNew ? navigate('/recipes') : setEditing(false)} style={{ marginBottom: '0.5rem' }}>
            &larr; {isNew ? 'Back to Recipes' : 'Cancel'}
          </button>
          <h1>{isNew ? 'New Recipe' : `Edit ${recipe?.name}`}</h1>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSave}>
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="card-header">Recipe Details</div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Name</label>
              <input className="form-input" value={formName} onChange={(e) => setFormName(e.target.value)} required maxLength={200} />
            </div>
            <div className="form-group">
              <label className="form-label">Servings</label>
              <input className="form-input" type="number" min="1" value={formServings} onChange={(e) => setFormServings(parseInt(e.target.value, 10) || 1)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Instructions</label>
              <textarea className="form-textarea" value={formInstructions} onChange={(e) => setFormInstructions(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="card-header flex justify-between items-center">
            <span>Ingredients</span>
            <button type="button" className="btn btn-secondary btn-sm" onClick={addIngredientRow}>+ Add</button>
          </div>
          <div className="card-body">
            {formIngredients.length === 0 ? (
              <p className="text-muted text-sm">No ingredients added yet.</p>
            ) : (
              formIngredients.map((fi, idx) => {
                const ingr = allIngredients.find((i) => i.id === fi.ingredientId);
                return (
                  <div key={idx} className="form-row" style={{ marginBottom: '0.5rem', alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
                      {idx === 0 && <label className="form-label">Ingredient</label>}
                      <select
                        className="form-select"
                        value={fi.ingredientId}
                        onChange={(e) => updateIngredientRow(idx, 'ingredientId', parseInt(e.target.value, 10))}
                      >
                        {allIngredients.map((i) => (
                          <option key={i.id} value={i.id}>{i.name} ({i.baseUnit})</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                      {idx === 0 && <label className="form-label">Quantity ({ingr?.baseUnit})</label>}
                      <input
                        className="form-input"
                        type="number"
                        min="0"
                        step="any"
                        value={fi.quantity}
                        onChange={(e) => updateIngredientRow(idx, 'quantity', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => removeIngredientRow(idx)} style={{ marginBottom: '2px' }}>
                      &times;
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="flex gap-sm">
          <button className="btn btn-primary" type="submit" disabled={saving || !formName.trim()}>
            {saving ? 'Saving...' : isNew ? 'Create Recipe' : 'Save Changes'}
          </button>
          <button className="btn btn-secondary" type="button" onClick={() => isNew ? navigate('/recipes') : setEditing(false)}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
