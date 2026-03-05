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
        return 'bg-emerald-100 text-emerald-800';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      case 'SUSPEND':
        return 'bg-amber-100 text-amber-800';
      case 'ACTIVATE':
        return 'bg-emerald-600 text-white';
      case 'LOGIN':
        return 'bg-navy-100 text-navy-900';
      default:
        return 'bg-gray-100 text-gray-800';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-navy-100 border-t-gold-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-navy-900 font-serif font-bold">Retrieving Security Logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8 border-l-4 border-l-navy-900">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6">
            <div>
              <h1 className="text-3xl font-serif font-bold text-black uppercase tracking-tight">Security Audit Logs</h1>
              <p className="text-gray-500 mt-1">Real-time system transaction surveillance and change tracking</p>
            </div>
            <button
              onClick={fetchLogs}
              className="px-8 py-3.5 bg-black text-white font-bold rounded-lg shadow-lg hover:bg-gray-800 transition transform active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
            >
              🔄 Refresh Stream
            </button>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-1 focus-within:border-black transition">
              <span className="text-gray-400">🔍</span>
              <input
                type="text"
                placeholder="Search by User, Action, or Entity..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-3 bg-transparent text-black font-bold outline-none placeholder:text-gray-300 placeholder:font-normal"
              />
            </div>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="px-6 py-3 border-2 border-gray-100 rounded-xl text-black bg-white font-bold focus:border-black outline-none transition cursor-pointer"
            >
              <option value="">All Protocol Actions</option>
              {uniqueActions.map((action) => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>
            <select
              value={filterEntity}
              onChange={(e) => setFilterEntity(e.target.value)}
              className="px-6 py-3 border-2 border-gray-100 rounded-xl text-black bg-white font-bold focus:border-black outline-none transition cursor-pointer"
            >
              <option value="">All Managed Entities</option>
              {uniqueEntities.map((entity) => (
                <option key={entity} value={entity}>{entity}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Audit Ledger */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="py-4 px-6 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Protocol Timestamp</th>
                  <th className="py-4 px-6 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Operator</th>
                  <th className="py-4 px-6 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Action Sequence</th>
                  <th className="py-4 px-6 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Modifications / Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredLogs.length === 0 ? (
                  <tr><td colSpan={4} className="py-12 text-center text-gray-400 font-serif">No security events detected in period</td></tr>
                ) : (
                  filteredLogs.map((log, index) => (
                    <tr key={log.id || index} className="hover:bg-gray-50 transition">
                      <td className="py-5 px-6">
                        <div className="font-bold text-black border-l-2 border-l-gold-500 pl-3">
                          {log.timestamp ? new Date(log.timestamp).toLocaleDateString() : 'N/A'}
                        </div>
                        <div className="text-[10px] text-gray-400 pl-3 uppercase">
                          {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : '---'}
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="font-bold text-navy-900">{log.user_name || 'System Auto'}</div>
                        <div className="text-[10px] text-gray-400 uppercase truncate max-w-[150px]">{log.email || 'Automated Protocol'}</div>
                      </td>
                      <td className="py-5 px-6">
                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                        <div className="mt-1 text-[10px] font-bold text-gray-400 uppercase">
                          {log.entity_type} <span className="text-black">ID: {log.entity_id}</span>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        {log.old_value || log.new_value ? (
                          <div className="space-y-1 text-[11px]">
                            {log.old_value && (
                              <div className="flex gap-2">
                                <span className="font-bold text-red-500 uppercase tracking-tighter">PRE:</span>
                                <span className="text-gray-500 truncate max-w-[200px]">{log.old_value}</span>
                              </div>
                            )}
                            {log.new_value && (
                              <div className="flex gap-2">
                                <span className="font-bold text-emerald-600 uppercase tracking-tighter">POST:</span>
                                <span className="text-navy-900 font-medium truncate max-w-[200px]">{log.new_value}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-300 italic text-xs underline decoration-dotted">No metadata captured</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
