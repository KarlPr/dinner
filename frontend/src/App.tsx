import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/layouts/AppLayout';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import RecipesPage from '@/pages/RecipesPage';
import RecipeDetailPage from '@/pages/RecipeDetailPage';
import MealPlanPage from '@/pages/MealPlanPage';
import PantryPage from '@/pages/PantryPage';
import ShoppingListPage from '@/pages/ShoppingListPage';
import IngredientsPage from '@/pages/IngredientsPage';
import UsersPage from '@/pages/UsersPage';
import type { ReactNode } from 'react';

function LoadingSpinner() {
  return <div className="loading-spinner"><div className="spinner" /></div>;
}

function PublicGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (user) return <Navigate to="/recipes" replace />;
  return <>{children}</>;
}

function PrivateGuard() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  return <AppLayout />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<PublicGuard><LoginPage /></PublicGuard>} />
          <Route path="/register" element={<PublicGuard><RegisterPage /></PublicGuard>} />
          <Route element={<PrivateGuard />}>
            <Route index element={<Navigate to="/recipes" replace />} />
            <Route path="recipes" element={<RecipesPage />} />
            <Route path="recipes/:id" element={<RecipeDetailPage />} />
            <Route path="meal-plan" element={<MealPlanPage />} />
            <Route path="pantry" element={<PantryPage />} />
            <Route path="shopping-list" element={<ShoppingListPage />} />
            <Route path="ingredients" element={<IngredientsPage />} />
            <Route path="users" element={<UsersPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/recipes" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
