import React, { useState, useEffect } from 'react';
import api from '../utils/api';

interface User {
  id?: number;
  name: string;
  email: string;
  role: string;
  status?: string;
  branch_id?: number;
  created_at?: string;
  last_login?: string;
}

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [newRole, setNewRole] = useState('pharmacist');

  const roles = ['super-admin', 'admin', 'pharmacist', 'cashier', 'storekeeper', 'accountant'];

  const roleColors: Record<string, string> = {
    'super-admin': 'bg-navy-900 text-gold-500',
    'admin': 'bg-navy-50 text-navy-900',
    'pharmacist': 'bg-emerald-50 text-emerald-800',
    'cashier': 'bg-amber-50 text-amber-800',
    'storekeeper': 'bg-purple-50 text-purple-800',
    'accountant': 'bg-blue-50 text-blue-800',
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/superadmin/users');
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (userId: number | undefined) => {
    if (!userId) return;
    if (confirm('Authorize suspension of this operator account? Access will be revoked immediately.')) {
      try {
        await api.put(`/superadmin/users/${userId}/suspend`, {});
        fetchUsers();
      } catch (error) {
        console.error('Error suspending user:', error);
      }
    }
  };

  const handleActivate = async (userId: number | undefined) => {
    if (!userId) return;
    if (confirm('Re-authorize this operator account? Full access will be restored.')) {
      try {
        await api.put(`/superadmin/users/${userId}/activate`, {});
        fetchUsers();
      } catch (error) {
        console.error('Error activating user:', error);
      }
    }
  };

  const handleResetPassword = async (userId: number | undefined) => {
    if (!userId) return;
    if (confirm('Force reset of authorization credentials for this user?')) {
      try {
        const response = await api.post(`/superadmin/users/${userId}/reset-password`, {});
        alert(response.data.message);
        fetchUsers();
      } catch (error) {
        console.error('Error resetting password:', error);
      }
    }
  };

  const handleChangeRole = async (userId: number | undefined) => {
    if (!userId) return;
    try {
      await api.put(`/superadmin/users/${userId}/role`, { role: newRole });
      setShowModal(false);
      fetchUsers();
    } catch (error) {
      console.error('Error changing role:', error);
    }
  };

  const handleDelete = async (userId: number | undefined) => {
    if (!userId) return;
    if (confirm('PERMANENTLY archive and purge this user profile from active management?')) {
      try {
        await api.delete(`/superadmin/users/${userId}`);
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const activeUsers = users.filter(u => u.status === 'active').length;
  const suspendedUsers = users.filter(u => u.status !== 'active').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-navy-100 border-t-gold-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-navy-900 font-serif font-bold">Synchronizing Identity Directory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8 border-l-4 border-l-gold-500">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6">
            <div>
              <h1 className="text-3xl font-serif font-bold text-black uppercase tracking-tight">Identity & Access Control</h1>
              <p className="text-gray-500 mt-1">
                <span className="text-black font-bold">{users.length}</span> Registered Principals
                <span className="mx-2">•</span>
                <span className="text-emerald-600 font-bold">{activeUsers} Active</span>
                <span className="mx-2">•</span>
                <span className="text-red-600 font-bold">{suspendedUsers} Suspended</span>
              </p>
            </div>
            <button
              onClick={fetchUsers}
              className="px-8 py-3.5 bg-black text-white font-bold rounded-lg shadow-lg hover:bg-gray-800 transition transform active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
            >
              🔄 Refresh Directory
            </button>
          </div>

          <div className="mt-8 flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex items-center bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-1 focus-within:border-black transition">
              <span className="text-gray-400">🔍</span>
              <input
                type="text"
                placeholder="Search by Identity Name or Email Protocol..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-3 bg-transparent text-black font-bold outline-none placeholder:text-gray-300 placeholder:font-normal"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-6 py-3 border-2 border-gray-100 rounded-xl text-black bg-white font-bold focus:border-black outline-none transition cursor-pointer"
            >
              <option value="all">Every Staff Rank</option>
              {roles.map((role) => <option key={role} value={role}>{role}</option>)}
            </select>
          </div>
        </div>

        {/* Identity Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <div key={user.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition overflow-hidden group border border-gray-200">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 bg-navy-50 text-navy-900 rounded-full flex items-center justify-center font-serif font-bold text-2xl uppercase group-hover:bg-navy-900 group-hover:text-gold-500 transition duration-300">
                    {user.name.charAt(0)}
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${roleColors[user.role]}`}>
                      {user.role}
                    </span>
                    <div className="mt-2 text-[8px] font-bold text-gray-400 uppercase tracking-widest">
                      Status: <span className={user.status === 'active' ? 'text-emerald-600' : 'text-red-600'}>{user.status?.toUpperCase() || 'ACTIVE'}</span>
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-serif font-bold text-black mb-1 truncate">{user.name}</h3>
                <p className="text-gray-400 text-xs mb-6 truncate">{user.email}</p>

                <div className="pt-4 border-t border-gray-50 flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                  <div>Registered On</div>
                  <div className="text-black">{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Historical'}</div>
                </div>
              </div>

              <div className="grid grid-cols-4 bg-gray-50 border-t border-gray-100 divide-x divide-gray-100">
                <button onClick={() => { setSelectedUser(user); setNewRole(user.role); setShowModal(true); }} className="py-3 hover:bg-white transition flex justify-center group/btn" title="Privilege Shift">
                  <span className="text-gray-400 group-hover/btn:text-black">⚡</span>
                </button>
                <button onClick={() => handleResetPassword(user.id)} className="py-3 hover:bg-white transition flex justify-center group/btn" title="Credential Reset">
                  <span className="text-gray-400 group-hover/btn:text-black">🔑</span>
                </button>
                {user.status === 'active' ? (
                  <button onClick={() => handleSuspend(user.id)} className="py-3 hover:bg-white transition flex justify-center group/btn" title="Revoke Access">
                    <span className="text-gray-400 group-hover/btn:text-amber-600">⏸️</span>
                  </button>
                ) : (
                  <button onClick={() => handleActivate(user.id)} className="py-3 hover:bg-emerald-50 transition flex justify-center group/btn" title="Restore Protocol">
                    <span className="text-gray-400 group-hover/btn:text-emerald-600">▶️</span>
                  </button>
                )}
                <button onClick={() => handleDelete(user.id)} className="py-3 hover:bg-red-50 transition flex justify-center group/btn" title="Purge Record">
                  <span className="text-gray-400 group-hover/btn:text-red-600">🗑️</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-20 text-center mt-8">
            <span className="text-4xl">👥</span>
            <h3 className="text-xl font-serif font-bold text-navy-900 mt-4">Database Empty</h3>
            <p className="text-gray-400 text-sm">No identity profiles match your filtered criteria.</p>
          </div>
        )}
      </div>

      {/* Role Elevation Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full animate-in zoom-in duration-200">
            <div className="p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-navy-900 text-gold-500 rounded-full flex items-center justify-center mx-auto mb-4 font-serif font-bold text-2xl uppercase">{selectedUser.name.charAt(0)}</div>
                <h3 className="font-serif font-bold text-xl">Escalate Privileges</h3>
                <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">{selectedUser.name}</p>
              </div>

              <div className="space-y-4 mb-8">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">New Rank Assignment</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl text-black font-bold focus:border-black outline-none transition appearance-none bg-gray-50"
                >
                  {roles.map((role) => <option key={role} value={role}>{role}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => handleChangeRole(selectedUser.id)} className="bg-emerald-600 text-white font-bold py-3 rounded-lg text-sm hover:bg-emerald-700 transition">Confirm Rank</button>
                <button onClick={() => setShowModal(false)} className="bg-gray-100 text-black font-bold py-3 rounded-lg text-sm hover:bg-gray-200 transition">Abort</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
