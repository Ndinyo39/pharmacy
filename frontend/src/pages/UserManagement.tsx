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
    'super-admin': 'bg-purple-100 text-purple-800',
    'admin': 'bg-blue-100 text-blue-800',
    'pharmacist': 'bg-green-100 text-green-800',
    'cashier': 'bg-yellow-100 text-yellow-800',
    'storekeeper': 'bg-orange-100 text-orange-800',
    'accountant': 'bg-cyan-100 text-cyan-800',
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
    if (confirm('Are you sure you want to suspend this user?')) {
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
    if (confirm('Are you sure you want to activate this user?')) {
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
    if (confirm('Reset password for this user? A temporary password will be generated.')) {
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
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
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
      <div className="p-8 bg-gray-100 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-black font-medium">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-black">👥 User Management</h1>
              <p className="text-gray-600 mt-1">
                {users.length} users | 
                <span className="text-green-600 font-bold"> {activeUsers} active</span> | 
                <span className="text-red-600 font-bold"> {suspendedUsers} suspended</span>
              </p>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="mt-4 flex flex-col md:flex-row gap-3">
            <input
              type="text"
              placeholder="🔍 Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-black bg-gray-50"
            />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg text-black bg-white"
            >
              <option value="all">All Roles</option>
              {roles.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredUsers.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 text-lg">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-black text-white">
                  <tr>
                    <th className="text-left py-3 px-4 font-bold">Name</th>
                    <th className="text-left py-3 px-4 font-bold">Email</th>
                    <th className="text-left py-3 px-4 font-bold">Role</th>
                    <th className="text-left py-3 px-4 font-bold">Status</th>
                    <th className="text-left py-3 px-4 font-bold">Created</th>
                    <th className="text-left py-3 px-4 font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-semibold text-black">{user.name}</td>
                      <td className="py-3 px-4 text-gray-600">{user.email}</td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${roleColors[user.role] || 'bg-gray-100 text-gray-800'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                          user.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.status || 'active'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-sm">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1 flex-wrap">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setNewRole(user.role);
                              setShowModal(true);
                            }}
                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm font-medium"
                            title="Change Role"
                          >
                            🔄 Role
                          </button>
                          <button
                            onClick={() => handleResetPassword(user.id)}
                            className="px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm font-medium"
                            title="Reset Password"
                          >
                            🔑
                          </button>
                          {user.status === 'active' ? (
                            <button
                              onClick={() => handleSuspend(user.id)}
                              className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm font-medium"
                              title="Suspend User"
                            >
                              ⏸️
                            </button>
                          ) : (
                            <button
                              onClick={() => handleActivate(user.id)}
                              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm font-medium"
                              title="Activate User"
                            >
                              ▶️
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm font-medium"
                            title="Delete User"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Change Role Modal */}
        {showModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl">
              <h3 className="text-2xl font-bold text-black mb-4">
                Change Role for {selectedUser.name}
              </h3>
              <p className="text-gray-600 mb-6">Current role: <span className="font-bold">{selectedUser.role}</span></p>

              <div className="mb-6">
                <label className="block text-black font-bold mb-2">New Role:</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black bg-white"
                >
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => handleChangeRole(selectedUser.id)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-bold"
                >
                  ✓ Update Role
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-black py-2 rounded-lg font-bold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
