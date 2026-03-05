import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Navigation Link Component
interface NavLinkProps {
  to: string;
  icon: string;
  children: React.ReactNode;
  onClick?: () => void;
}

const NavLink: React.FC<NavLinkProps> = ({ to, icon, children, onClick }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 text-sm font-bold transition-all duration-200 rounded-lg mx-2 ${isActive
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
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) {
    return null;
  }

  const closeMobile = () => setMobileOpen(false);

  const sidebarContent = (
    <>
      {/* Logo Section */}
      <div className="h-24 flex items-center px-4 border-b border-gray-300 bg-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <img
            src="/logo.jpeg"
            alt="Eagles' Home Based Nursing Care"
            className="w-14 h-14 object-contain"
          />
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
          <NavLink to="/dashboard" icon="🏠" onClick={closeMobile}>Home</NavLink>
          <NavLink to="/medicines" icon="💊" onClick={closeMobile}>Medicines</NavLink>
          <NavLink to="/customers" icon="👥" onClick={closeMobile}>Customers</NavLink>
          <NavLink to="/sales" icon="💰" onClick={closeMobile}>Sales</NavLink>
          <NavLink to="/prescriptions" icon="📋" onClick={closeMobile}>Prescriptions</NavLink>
          <NavLink to="/reports" icon="📊" onClick={closeMobile}>Reports</NavLink>
        </div>

        {/* Administration - Only show for super-admin */}
        {user?.role === 'super-admin' && (
          <div>
            <SectionHeader>ADMINISTRATION</SectionHeader>
            <NavLink to="/superadmin" icon="🛡️" onClick={closeMobile}>Admin Panel</NavLink>
            <NavLink to="/superadmin/users" icon="👤" onClick={closeMobile}>Users</NavLink>
            <NavLink to="/superadmin/pharmacies" icon="🏥" onClick={closeMobile}>Pharmacies</NavLink>
            <NavLink to="/superadmin/audit-logs" icon="📝" onClick={closeMobile}>Audit Logs</NavLink>
            <NavLink to="/superadmin/settings" icon="⚙️" onClick={closeMobile}>Settings</NavLink>
          </div>
        )}
      </div>

      {/* User Section */}
      <div className="p-4 border-t border-gray-300 bg-gray-100 flex-shrink-0">
        <div className="flex items-center gap-3 mb-3 p-2 bg-gray-200 rounded-lg">
          <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
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
    </>
  );

  return (
    <>
      {/* === DESKTOP SIDEBAR (hidden on mobile) === */}
      <nav className="fixed left-0 top-0 h-screen bg-white text-black shadow-2xl z-50 w-64 flex-col border-r-4 border-gray-300 hidden lg:flex">
        {sidebarContent}
      </nav>

      {/* === MOBILE TOP BAR (hidden on desktop) === */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b-4 border-yellow-400 shadow-md flex items-center justify-between px-4 h-16">
        <div className="flex items-center gap-3">
          <img
            src="/logo.jpeg"
            alt="Eagles' Home Based Nursing Care"
            className="w-10 h-10 object-contain"
          />
          <h1 className="text-base font-serif font-bold text-black">EAGLES' Pharmacy</h1>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg hover:bg-gray-100 transition"
          aria-label="Open menu"
        >
          {/* Hamburger icon */}
          <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* === MOBILE DRAWER OVERLAY === */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-50"
          onClick={closeMobile}
        />
      )}

      {/* === MOBILE DRAWER PANEL === */}
      <nav
        className={`lg:hidden fixed left-0 top-0 h-screen bg-white text-black shadow-2xl z-[60] w-72 flex flex-col border-r-4 border-gray-300 transform transition-transform duration-300 ease-in-out ${mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {/* Close button inside drawer */}
        <button
          onClick={closeMobile}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-200 transition z-10"
          aria-label="Close menu"
        >
          <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {sidebarContent}
      </nav>
    </>
  );
};
