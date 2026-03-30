import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { recipes as recipesApi } from '@/api/client';
import type { RecipeListResponse } from '@/types/api';

export default function RecipesPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<RecipeListResponse[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await recipesApi.list(search || undefined);
      setItems(data);
    } catch {
      setError('Failed to load recipes');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id: number) {
    if (!confirm('Delete this recipe? This will also remove it from any meal plans.')) return;
    try {
      await recipesApi.delete(id);
      load();
    } catch {
      setError('Delete failed');
    }
  }

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Recipes</h1>
        <button className="btn btn-primary" onClick={() => navigate('/recipes/new')}>+ New Recipe</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="search-bar">
        <input
          className="form-input"
          placeholder="Search recipes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {items.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <p>No recipes found</p>
            <button className="btn btn-primary" onClick={() => navigate('/recipes/new')}>Create your first recipe</button>
          </div>
        </div>
      ) : (
        <div className="grid-2">
          {items.map((recipe) => (
            <div key={recipe.id} className="card" style={{ cursor: 'pointer' }} onClick={() => navigate(`/recipes/${recipe.id}`)}>
              <div className="card-body">
                <div className="flex justify-between items-center" style={{ marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{recipe.name}</h3>
                  <span className="badge">{recipe.servings} servings</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted text-sm">by {recipe.createdByName}</span>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={(e) => { e.stopPropagation(); handleDelete(recipe.id); }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
