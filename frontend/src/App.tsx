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

function ProtectedRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-spinner"><div className="spinner" /></div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/recipes" replace />} />
        <Route path="recipes" element={<RecipesPage />} />
        <Route path="recipes/:id" element={<RecipeDetailPage />} />
        <Route path="meal-plan" element={<MealPlanPage />} />
        <Route path="pantry" element={<PantryPage />} />
        <Route path="shopping-list" element={<ShoppingListPage />} />
        <Route path="ingredients" element={<IngredientsPage />} />
        <Route path="users" element={<UsersPage />} />
      </Route>
    </Routes>
  );
}

function AuthRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-spinner"><div className="spinner" /></div>;
  }

  if (user) {
    return <Navigate to="/recipes" replace />;
  }

  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route path="register" element={<RegisterPage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<AuthRoutes />} />
          <Route path="/register" element={<AuthRoutes />} />
          <Route path="/*" element={<ProtectedRoutes />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
