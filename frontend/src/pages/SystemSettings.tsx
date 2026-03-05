import React, { useState, useEffect } from 'react';
import api from '../utils/api';

interface SystemSetting {
  id: number;
  setting_key: string;
  setting_value: string;
  updated_at: string;
}

export const SystemSettings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingSetting, setEditingSetting] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSetting, setNewSetting] = useState({ key: '', value: '', category: 'General' });
  const [query, setQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const settingCategories = {
    'General': ['system_name', 'system_version', 'timezone', 'language'],
    'Financial': ['currency', 'currency_symbol', 'tax_rate', 'tax_enabled', 'discount_enabled'],
    'Inventory': ['low_stock_threshold', 'expiry_alert_days', 'auto_reorder'],
    'Security': ['session_timeout', 'password_expiry', '2fa_enabled', 'max_login_attempts'],
    'Email': ['smtp_host', 'smtp_port', 'smtp_email', 'smtp_password', 'email_from'],
    'Business': ['business_phone', 'business_address', 'business_email', 'business_license'],
    'Customer': ['loyalty_points_enabled', 'points_per_100'],
    'Prescription': ['prescription_required', 'prescription_validity_days'],
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await api.get('/superadmin/settings');
      setSettings(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSetting = async (key: string, value: string) => {
    setActionLoading(true);
    try {
      await api.post('/superadmin/settings', { setting_key: key, setting_value: value });
      setEditingSetting(null);
      fetchSettings();
    } catch (error) {
      console.error('Error updating setting:', error);
      alert('Failed to update protocol value.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddSetting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSetting.key || !newSetting.value) return;

    setActionLoading(true);
    try {
      await api.post('/superadmin/settings', { setting_key: newSetting.key, setting_value: newSetting.value });
      setNewSetting({ key: '', value: '', category: 'General' });
      setShowAddForm(false);
      fetchSettings();
    } catch (error) {
      console.error('Error creating setting:', error);
      alert('Error defining new protocol.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSetting = async (key: string) => {
    if (!confirm(`Permanently decommission protocol "${key}"?`)) return;
    setActionLoading(true);
    try {
      await api.delete(`/superadmin/settings/${encodeURIComponent(key)}`);
      await fetchSettings();
    } catch (err) {
      console.error('Error deleting setting', err);
    } finally {
      setActionLoading(false);
    }
  };

  const initializeDefaultSettings = async () => {
    if (!confirm('Initialize root system protocols? This will overwrite or add standard configurations.')) return;

    const defaultSettings = [
      { key: 'system_name', value: "EAGLES' Pharmacy", category: 'General' },
      { key: 'system_version', value: '1.0.0-PRO', category: 'General' },
      { key: 'timezone', value: 'Africa/Nairobi', category: 'General' },
      { key: 'language', value: 'en-GB', category: 'General' },
      { key: 'currency', value: 'KES', category: 'Financial' },
      { key: 'currency_symbol', value: 'Ksh', category: 'Financial' },
      { key: 'tax_rate', value: '16', category: 'Financial' },
      { key: 'tax_enabled', value: 'true', category: 'Financial' },
      { key: 'discount_enabled', value: 'true', category: 'Financial' },
      { key: 'low_stock_threshold', value: '15', category: 'Inventory' },
      { key: 'expiry_alert_days', value: '60', category: 'Inventory' },
      { key: 'session_timeout', value: '120', category: 'Security' },
      { key: 'max_login_attempts', value: '3', category: 'Security' },
      { key: 'loyalty_points_enabled', value: 'true', category: 'Customer' },
      { key: 'prescription_required', value: 'true', category: 'Prescription' },
    ];

    setActionLoading(true);
    try {
      for (const setting of defaultSettings) {
        await api.post('/superadmin/settings', { setting_key: setting.key, setting_value: setting.value });
      }
      await fetchSettings();
      alert('Core protocols initialized successfully!');
    } catch (err) {
      console.error('Error initializing settings', err);
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = settings.filter((s) =>
    s.setting_key.toLowerCase().includes(query.toLowerCase()) ||
    s.setting_value.toLowerCase().includes(query.toLowerCase())
  );

  const getSettingsByCategory = (category: string) => {
    if (category === 'all') return filtered;
    const keys = settingCategories[category as keyof typeof settingCategories] || [];
    return filtered.filter((s) => keys.includes(s.setting_key));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-navy-100 border-t-gold-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-navy-900 font-serif font-bold tracking-widest uppercase text-xs">Accessing System Core...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Superior Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8 border-b-4 border-gold-500 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-8 relative z-10">
            <div>
              <h1 className="text-4xl font-serif font-black text-black uppercase tracking-tighter">System Protocols</h1>
              <p className="text-gray-400 mt-2 font-medium max-w-lg">Master configuration interface for EAGLES' Enterprise resources. Altering these values affects all connected terminal nodes.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-6 py-3 bg-black text-white font-bold rounded-lg shadow-lg hover:bg-gray-800 transition transform active:scale-95 text-xs uppercase tracking-widest"
              >
                {showAddForm ? '✕ Close Terminal' : '➕ Add Protocol'}
              </button>
              <button
                onClick={initializeDefaultSettings}
                disabled={actionLoading}
                className="px-6 py-3 bg-white border-2 border-gold-500 text-gold-600 font-bold rounded-lg hover:bg-gold-500 hover:text-white transition text-xs uppercase tracking-widest"
              >
                🛡️ Reset Roots
              </button>
            </div>
          </div>
        </div>

        {/* Global Control Bar */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          <div className="lg:w-1/3">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 h-full">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Search Registry</label>
              <div className="flex items-center bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-1 focus-within:border-black transition">
                <span className="text-gray-400">🔍</span>
                <input
                  type="text"
                  placeholder="Protocol Key / Value..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full px-3 py-3 bg-transparent text-black font-bold outline-none placeholder:text-gray-300"
                />
              </div>
            </div>
          </div>
          <div className="lg:w-2/3">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 h-full overflow-x-auto whitespace-nowrap scrollbar-hide">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Functional Domains</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition ${activeTab === 'all' ? 'bg-navy-900 text-gold-500 shadow-md' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                >
                  Infrastructure
                </button>
                {Object.keys(settingCategories).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveTab(cat)}
                    className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition ${activeTab === cat ? 'bg-navy-900 text-gold-500 shadow-md' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* New Setting Registry */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-2xl p-8 mb-8 border-2 border-black animate-in slide-in-from-top duration-300">
            <h3 className="text-xl font-serif font-black text-black uppercase tracking-widest mb-6">Initialize New Configuration Protocol</h3>
            <form onSubmit={handleAddSetting} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Protocol Reference Key</label>
                <input type="text" value={newSetting.key} onChange={(e) => setNewSetting({ ...newSetting, key: e.target.value })} required className="w-full px-4 py-3 border-2 border-gray-100 rounded-lg text-black font-bold focus:border-black outline-none transition" placeholder="e.g. system_alias" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Assigned Value</label>
                <input type="text" value={newSetting.value} onChange={(e) => setNewSetting({ ...newSetting, value: e.target.value })} required className="w-full px-4 py-3 border-2 border-gray-100 rounded-lg text-black font-bold focus:border-black outline-none transition" placeholder="Protocol data..." />
              </div>
              <div className="flex items-end">
                <button type="submit" disabled={actionLoading} className="w-full bg-emerald-600 text-white font-bold py-3.5 rounded-lg shadow-lg hover:bg-emerald-700 transition uppercase tracking-widest text-xs">Authorize Provisioning</button>
              </div>
            </form>
          </div>
        )}

        {/* Protocol Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {getSettingsByCategory(activeTab).map((setting) => {
            const keyLabel = setting.setting_key.replace(/_/g, ' ').toUpperCase();
            const isEditing = editingSetting === setting.setting_key;
            const val = isEditing ? editValue : setting.setting_value;
            const isBool = val === 'true' || val === 'false';

            return (
              <div key={setting.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition border border-gray-100 overflow-hidden flex flex-col group">
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <span className="w-8 h-8 bg-gray-50 text-[10px] flex items-center justify-center font-black text-gray-300 rounded border border-gray-100 uppercase group-hover:border-navy-900 group-hover:text-navy-900 transition">Cfg</span>
                    {!isEditing && (
                      <button onClick={() => handleDeleteSetting(setting.setting_key)} className="text-gray-200 hover:text-red-500 transition text-xs">🗑️ Decommission</button>
                    )}
                  </div>
                  <h3 className="text-xs font-black text-navy-900 uppercase tracking-[0.2em] mb-3">{keyLabel}</h3>

                  <div className="mt-4">
                    {isEditing ? (
                      <div className="animate-in fade-in zoom-in duration-200">
                        {isBool ? (
                          <div className="flex items-center p-3 bg-gray-50 rounded-lg border-2 border-black">
                            <input type="checkbox" checked={editValue === 'true'} onChange={(e) => setEditValue(e.target.checked ? 'true' : 'false')} className="w-5 h-5 accent-black" />
                            <span className="ml-3 font-black text-xs uppercase">Enabled Status</span>
                          </div>
                        ) : (
                          <textarea value={editValue} onChange={(e) => setEditValue(e.target.value)} className="w-full p-3 bg-gray-50 border-2 border-black rounded-lg text-sm font-bold focus:outline-none" rows={2} />
                        )}
                      </div>
                    ) : (
                      <div className="py-2">
                        {setting.setting_key.includes('password') ? (
                          <span className="text-gray-300 font-black tracking-widest text-lg">••••••</span>
                        ) : isBool ? (
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${val === 'true' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                            {val === 'true' ? 'ACTIVE' : 'DISABLED'}
                          </span>
                        ) : (
                          <p className="text-black font-serif font-bold text-lg leading-tight truncate" title={setting.setting_value}>{setting.setting_value || 'NULL'}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[8px] font-bold text-gray-400 uppercase">Rev: {new Date(setting.updated_at).toLocaleDateString()}</span>
                  {isEditing ? (
                    <div className="flex gap-2">
                      <button onClick={() => handleEditSetting(setting.setting_key, editValue)} className="px-4 py-1.5 bg-black text-white rounded font-black text-[10px] uppercase hover:bg-gray-800 transition">Commit</button>
                      <button onClick={() => setEditingSetting(null)} className="px-4 py-1.5 bg-white border border-gray-200 text-gray-400 rounded font-black text-[10px] uppercase hover:bg-gray-100 transition">Abort</button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditingSetting(setting.setting_key); setEditValue(setting.setting_value); }} className="px-4 py-1.5 bg-navy-50 text-navy-900 rounded font-black text-[10px] uppercase group-hover:bg-navy-900 group-hover:text-gold-500 transition">Modify Protocol</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {getSettingsByCategory(activeTab).length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-20 text-center mt-8">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🛠️</span>
            </div>
            <h3 className="text-xl font-serif font-bold text-navy-900 mb-2">No Active Protocols</h3>
            <p className="text-gray-400 text-sm max-w-xs mx-auto">This domain currently lacks governing parameters. Use the Reset Roots button to restore standard configurations.</p>
          </div>
        )}
      </div>
    </div>
  );
};
