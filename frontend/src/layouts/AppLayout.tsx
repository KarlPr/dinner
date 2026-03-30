import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">Dinner</div>
        <nav className="sidebar-nav">
          <NavLink to="/recipes" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
            Recipes
          </NavLink>
          <NavLink to="/meal-plan" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
            Meal Plan
          </NavLink>
          <NavLink to="/pantry" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
            Pantry
          </NavLink>
          <NavLink to="/shopping-list" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
            Shopping List
          </NavLink>
          <NavLink to="/ingredients" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
            Ingredients
          </NavLink>
          <NavLink to="/users" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
            Users
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          <span className="sidebar-user">{user?.name}</span>
          <button className="btn btn-ghost btn-sm" onClick={logout}>Logout</button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
