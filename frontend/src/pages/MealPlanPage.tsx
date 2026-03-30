import { useState, useEffect, useCallback } from 'react';
import { mealPlans as mealPlanApi, recipes as recipesApi, users as usersApi } from '@/api/client';
import { ApiClientError } from '@/api/client';
import type { MealPlanResponse, RecipeListResponse, UserResponse, CreateMealPlanRequest } from '@/types/api';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getWeekRange(date: Date): { from: string; to: string; dates: Date[] } {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay() + 1); // Monday
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d);
  }
  const from = dates[0].toISOString().split('T')[0];
  const to = dates[6].toISOString().split('T')[0];
  return { from, to, dates };
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

export default function MealPlanPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [entries, setEntries] = useState<MealPlanResponse[]>([]);
  const [allRecipes, setAllRecipes] = useState<RecipeListResponse[]>([]);
  const [allUsers, setAllUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add modal
  const [showModal, setShowModal] = useState(false);
  const [editEntry, setEditEntry] = useState<MealPlanResponse | null>(null);
  const [formDate, setFormDate] = useState('');
  const [formMealType, setFormMealType] = useState<string>('dinner');
  const [formRecipeId, setFormRecipeId] = useState(0);
  const [formServings, setFormServings] = useState(4);
  const [formUserId, setFormUserId] = useState<number | undefined>(undefined);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const week = getWeekRange(currentDate);

  const load = useCallback(async () => {
    try {
      const [data, recs, usrs] = await Promise.all([
        mealPlanApi.list(week.from, week.to),
        recipesApi.list(),
        usersApi.list(),
      ]);
      setEntries(data);
      setAllRecipes(recs);
      setAllUsers(usrs);
    } catch {
      setError('Failed to load meal plan');
    } finally {
      setLoading(false);
    }
  }, [week.from, week.to]);

  useEffect(() => { load(); }, [load]);

  function prevWeek() {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  }

  function nextWeek() {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  }

  function openAdd(date: string, mealType: string) {
    setEditEntry(null);
    setFormDate(date);
    setFormMealType(mealType);
    setFormRecipeId(allRecipes[0]?.id || 0);
    setFormServings(4);
    setFormUserId(undefined);
    setFormError('');
    setShowModal(true);
  }

  function openEdit(entry: MealPlanResponse) {
    setEditEntry(entry);
    setFormDate(entry.date);
    setFormMealType(entry.mealType);
    setFormRecipeId(entry.recipeId);
    setFormServings(entry.servings);
    setFormUserId(entry.userId || undefined);
    setFormError('');
    setShowModal(true);
  }

  async function handleSave() {
    setFormError('');
    setSaving(true);
    try {
      const payload: CreateMealPlanRequest = {
        date: formDate,
        mealType: formMealType,
        recipeId: formRecipeId,
        servings: formServings,
        userId: formUserId,
      };
      if (editEntry) {
        await mealPlanApi.update(editEntry.id, payload);
      } else {
        await mealPlanApi.create(payload);
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
    try {
      await mealPlanApi.delete(id);
      load();
    } catch {
      setError('Delete failed');
    }
  }

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  const today = formatDate(new Date());

  return (
    <div>
      <div className="page-header">
        <h1>Meal Plan</h1>
        <div className="flex gap-sm items-center">
          <button className="btn btn-secondary" onClick={prevWeek}>&larr;</button>
          <span className="text-sm" style={{ fontWeight: 500 }}>{week.from} &mdash; {week.to}</span>
          <button className="btn btn-secondary" onClick={nextWeek}>&rarr;</button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="calendar-grid">
        {/* Header */}
        {week.dates.map((d, i) => (
          <div key={i} className="calendar-header-cell">
            {DAY_NAMES[(d.getDay())]}
          </div>
        ))}

        {/* Cells */}
        {week.dates.map((d) => {
          const dateStr = formatDate(d);
          const dayEntries = entries.filter((e) => e.date === dateStr);
          const isToday = dateStr === today;

          return (
            <div key={dateStr} className={`calendar-cell${isToday ? ' today' : ''}`}>
              <div className="calendar-date">{d.getDate()}</div>

              {MEAL_TYPES.map((mt) => {
                const meals = dayEntries.filter((e) => e.mealType === mt);
                return meals.map((meal) => (
                  <div
                    key={meal.id}
                    className={`calendar-meal ${mt}`}
                    onClick={() => openEdit(meal)}
                    title={`${meal.recipeName} (${meal.servings} servings)${meal.userName ? ` - ${meal.userName}` : ''}`}
                  >
                    {meal.recipeName}
                    <span
                      style={{ marginLeft: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                      onClick={(e) => { e.stopPropagation(); handleDelete(meal.id); }}
                      title="Remove"
                    >
                      &times;
                    </span>
                  </div>
                ));
              })}

              <button
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '0.7rem', marginTop: '2px' }}
                onClick={() => openAdd(dateStr, 'dinner')}
              >
                + Add
              </button>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span>{editEntry ? 'Edit Meal' : 'Add Meal'}</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              {formError && <div className="alert alert-error">{formError}</div>}

              <div className="form-group">
                <label className="form-label">Date</label>
                <input className="form-input" type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Meal Type</label>
                <select className="form-select" value={formMealType} onChange={(e) => setFormMealType(e.target.value)}>
                  {MEAL_TYPES.map((mt) => <option key={mt} value={mt}>{mt.charAt(0).toUpperCase() + mt.slice(1)}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Recipe</label>
                <select className="form-select" value={formRecipeId} onChange={(e) => setFormRecipeId(parseInt(e.target.value, 10))}>
                  {allRecipes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Servings</label>
                <input className="form-input" type="number" min="1" value={formServings} onChange={(e) => setFormServings(parseInt(e.target.value, 10) || 1)} />
              </div>

              <div className="form-group">
                <label className="form-label">Assign to User (optional)</label>
                <select className="form-select" value={formUserId ?? ''} onChange={(e) => setFormUserId(e.target.value ? parseInt(e.target.value, 10) : undefined)}>
                  <option value="">Everyone</option>
                  {allUsers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving || !formRecipeId}>
                {saving ? 'Saving...' : editEntry ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
