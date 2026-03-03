import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Navigation Link Component
interface NavLinkProps {
  to: string;
  icon: string;
  children: React.ReactNode;
}

const NavLink: React.FC<NavLinkProps> = ({ to, icon, children }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-4 py-3 text-sm font-bold transition-all duration-200 rounded-lg mx-2 ${
        isActive
          ? 'bg-yellow-400 text-black shadow-md'
          : 'text-black hover:bg-gray-200'
      }`}
    >
      <span className="text-lg w-6 text-center">{icon}</span>
      <span>{children}</span>
    </Link>
  );
};

// Section Header Component
const SectionHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="px-4 py-2 mt-4 mb-2">
    <p className="text-xs font-bold text-black uppercase tracking-wider">{children}</p>
  </div>
);

export const Navigation: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className="fixed left-0 top-0 h-screen bg-white text-black shadow-2xl z-50 w-64 flex flex-col border-r-4 border-gray-300">
      {/* Logo Section */}
      <div className="h-24 flex items-center px-4 border-b border-gray-300 bg-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-yellow-400 rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-black font-serif font-bold text-xl">E</span>
          </div>
          <div>
            <h1 className="text-lg font-serif font-bold text-black tracking-wide">EAGLES'</h1>
            <p className="text-xs text-gray-600">Pharmacy System</p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto py-4 bg-gray-50">
        {/* Main Menu */}
        <div>
          <SectionHeader>MAIN MENU</SectionHeader>
          <NavLink to="/dashboard" icon="🏠">Home</NavLink>
          <NavLink to="/medicines" icon="💊">Medicines</NavLink>
          <NavLink to="/customers" icon="👥">Customers</NavLink>
          <NavLink to="/sales" icon="💰">Sales</NavLink>
          <NavLink to="/prescriptions" icon="📋">Prescriptions</NavLink>
          <NavLink to="/reports" icon="📊">Reports</NavLink>
        </div>

        {/* Administration - Only show for super-admin */}
        {user?.role === 'super-admin' && (
          <div>
            <SectionHeader>ADMINISTRATION</SectionHeader>
            <NavLink to="/superadmin" icon="🛡️">Admin Panel</NavLink>
            <NavLink to="/superadmin/users" icon="👤">Users</NavLink>
            <NavLink to="/superadmin/pharmacies" icon="🏥">Pharmacies</NavLink>
            <NavLink to="/superadmin/audit-logs" icon="📝">Audit Logs</NavLink>
            <NavLink to="/superadmin/settings" icon="⚙️">Settings</NavLink>
          </div>
        )}
      </div>

      {/* User Section */}
      <div className="p-4 border-t border-gray-300 bg-gray-100">
        <div className="flex items-center gap-3 mb-3 p-2 bg-gray-200 rounded-lg">
          <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
            <span className="text-black font-bold text-lg">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-black truncate">{user?.name}</p>
            <p className="text-xs text-gray-600 capitalize">{user?.role?.replace('-', ' ')}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full bg-red-600 hover:bg-red-500 text-white text-sm font-bold py-2.5 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
        >
          <span>🚪</span>
          <span>Sign Out</span>
        </button>
      </div>
    </nav>
  );
};
