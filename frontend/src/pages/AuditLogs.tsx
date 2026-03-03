import React, { useState, useEffect } from 'react';
import api from '../utils/api';

interface AuditLog {
  id?: number;
  user_id?: number;
  action: string;
  entity_type: string;
  entity_id?: number;
  old_value?: string;
  new_value?: string;
  timestamp?: string;
  user_name?: string;
  email?: string;
}

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterAction, setFilterAction] = useState('');
  const [filterEntity, setFilterEntity] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/superadmin/audit-logs');
      setLogs(response.data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-100 text-green-800';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      case 'SUSPEND':
        return 'bg-yellow-100 text-yellow-800';
      case 'ACTIVATE':
        return 'bg-emerald-100 text-emerald-800';
      case 'RESET_PASSWORD':
        return 'bg-orange-100 text-orange-800';
      case 'LOGIN':
        return 'bg-purple-100 text-purple-800';
      case 'LOGOUT':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE':
        return '✨';
      case 'UPDATE':
        return '✏️';
      case 'DELETE':
        return '🗑️';
      case 'SUSPEND':
        return '⏸️';
      case 'ACTIVATE':
        return '▶️';
      case 'RESET_PASSWORD':
        return '🔑';
      case 'LOGIN':
        return '🔓';
      case 'LOGOUT':
        return '🔒';
      default:
        return '📋';
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = 
      log.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity_type?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = !filterAction || log.action === filterAction;
    const matchesEntity = !filterEntity || log.entity_type === filterEntity;
    return matchesSearch && matchesAction && matchesEntity;
  });

  const uniqueActions = [...new Set(logs.map((log) => log.action).filter(Boolean))];
  const uniqueEntities = [...new Set(logs.map((log) => log.entity_type).filter(Boolean))];

  const createCount = logs.filter((l) => l.action === 'CREATE').length;
  const updateCount = logs.filter((l) => l.action === 'UPDATE').length;
  const deleteCount = logs.filter((l) => l.action === 'DELETE').length;

  if (loading) {
    return (
      <div className="p-8 bg-gray-100 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-black font-medium">Loading audit logs...</p>
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
              <h1 className="text-3xl font-bold text-black">🔍 Audit Logs</h1>
              <p className="text-gray-600 mt-1">
                {logs.length} total logs | Track all system activities
              </p>
            </div>
            <button
              onClick={fetchLogs}
              className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-bold shadow transition"
            >
              🔄 Refresh
            </button>
          </div>

          {/* Search and Filters */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="🔍 Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg text-black bg-gray-50"
            />
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg text-black bg-white"
            >
              <option value="">All Actions</option>
              {uniqueActions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
            <select
              value={filterEntity}
              onChange={(e) => setFilterEntity(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg text-black bg-white"
            >
              <option value="">All Entities</option>
              {uniqueEntities.map((entity) => (
                <option key={entity} value={entity}>
                  {entity}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">📋</span>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Total Logs</p>
                <p className="text-2xl font-bold text-black">{logs.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">✨</span>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Created</p>
                <p className="text-2xl font-bold text-black">{createCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">✏️</span>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Updated</p>
                <p className="text-2xl font-bold text-black">{updateCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">🗑️</span>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Deleted</p>
                <p className="text-2xl font-bold text-black">{deleteCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 text-lg">No audit logs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-black text-white">
                  <tr>
                    <th className="text-left py-3 px-4 font-bold">Timestamp</th>
                    <th className="text-left py-3 px-4 font-bold">User</th>
                    <th className="text-left py-3 px-4 font-bold">Action</th>
                    <th className="text-left py-3 px-4 font-bold">Entity</th>
                    <th className="text-left py-3 px-4 font-bold">Changes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log, index) => (
                    <tr key={log.id || index} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-600 text-sm">
                        {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-semibold text-black">{log.user_name || 'System'}</p>
                          <p className="text-sm text-gray-500">{log.email || 'N/A'}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${getActionColor(log.action)}`}>
                          {getActionIcon(log.action)} {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-bold">
                          {log.entity_type}
                        </span>
                        <span className="text-gray-500 text-sm ml-2">#{log.entity_id}</span>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {log.old_value || log.new_value ? (
                          <div className="space-y-1">
                            {log.old_value && (
                              <p className="text-red-600">
                                <span className="font-semibold">From:</span> {log.old_value}
                              </p>
                            )}
                            {log.new_value && (
                              <p className="text-green-600">
                                <span className="font-semibold">To:</span> {log.new_value}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-gray-400">-</p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
