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
    try {
      await api.post('/superadmin/settings', { setting_key: key, setting_value: value });
      setEditingSetting(null);
      fetchSettings();
      alert('Setting updated successfully!');
    } catch (error) {
      console.error('Error updating setting:', error);
      alert('Error updating setting');
    }
  };

  const handleAddSetting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSetting.key || !newSetting.value) {
      alert('Please fill in all fields');
      return;
    }

    try {
      await api.post('/superadmin/settings', { setting_key: newSetting.key, setting_value: newSetting.value });
      setNewSetting({ key: '', value: '', category: 'General' });
      setShowAddForm(false);
      fetchSettings();
      alert('Setting created successfully!');
    } catch (error) {
      console.error('Error creating setting:', error);
      alert('Error creating setting');
    }
  };

  const handleDeleteSetting = async (key: string) => {
    if (!confirm(`Delete setting "${key}"? This action cannot be undone.`)) return;
    setActionLoading(true);
    try {
      await api.delete(`/superadmin/settings/${encodeURIComponent(key)}`);
      await fetchSettings();
      alert('Setting deleted');
    } catch (err) {
      console.error('Error deleting setting', err);
      alert('Error deleting setting');
    } finally {
      setActionLoading(false);
    }
  };

  const initializeDefaultSettings = async () => {
    if (!confirm('Initialize default system settings? This will add common settings.')) return;
    
    const defaultSettings = [
      { key: 'system_name', value: 'EAGLES\' Pharmacy', category: 'General' },
      { key: 'system_version', value: '1.0.0', category: 'General' },
      { key: 'timezone', value: 'Africa/Nairobi', category: 'General' },
      { key: 'language', value: 'en', category: 'General' },
      { key: 'currency', value: 'KES', category: 'Financial' },
      { key: 'currency_symbol', value: 'Ksh', category: 'Financial' },
      { key: 'tax_rate', value: '16', category: 'Financial' },
      { key: 'tax_enabled', value: 'true', category: 'Financial' },
      { key: 'discount_enabled', value: 'true', category: 'Financial' },
      { key: 'low_stock_threshold', value: '10', category: 'Inventory' },
      { key: 'expiry_alert_days', value: '30', category: 'Inventory' },
      { key: 'auto_reorder', value: 'false', category: 'Inventory' },
      { key: 'session_timeout', value: '480', category: 'Security' },
      { key: 'password_expiry', value: '90', category: 'Security' },
      { key: '2fa_enabled', value: 'false', category: 'Security' },
      { key: 'max_login_attempts', value: '5', category: 'Security' },
      { key: 'smtp_host', value: '', category: 'Email' },
      { key: 'smtp_port', value: '587', category: 'Email' },
      { key: 'smtp_email', value: '', category: 'Email' },
      { key: 'smtp_password', value: '', category: 'Email' },
      { key: 'email_from', value: 'noreply@pharmacy.com', category: 'Email' },
      { key: 'business_phone', value: '', category: 'Business' },
      { key: 'business_address', value: '', category: 'Business' },
      { key: 'business_email', value: '', category: 'Business' },
      { key: 'business_license', value: '', category: 'Business' },
      { key: 'loyalty_points_enabled', value: 'true', category: 'Customer' },
      { key: 'points_per_100', value: '1', category: 'Customer' },
      { key: 'prescription_required', value: 'true', category: 'Prescription' },
      { key: 'prescription_validity_days', value: '30', category: 'Prescription' },
    ];

    setActionLoading(true);
    try {
      for (const setting of defaultSettings) {
        await api.post('/superadmin/settings', { setting_key: setting.key, setting_value: setting.value });
      }
      await fetchSettings();
      alert('Default settings initialized!');
    } catch (err) {
      console.error('Error initializing settings', err);
      alert('Error initializing settings');
    } finally {
      setActionLoading(false);
    }
  };

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

  const filtered = settings.filter((s) => 
    s.setting_key.includes(query) || s.setting_value.includes(query)
  );

  const getSettingsByCategory = (category: string) => {
    if (category === 'all') return filtered;
    const keys = settingCategories[category as keyof typeof settingCategories] || [];
    return filtered.filter((s) => keys.includes(s.setting_key));
  };

  const getCategoryCount = (category: string) => {
    const keys = settingCategories[category as keyof typeof settingCategories] || [];
    return settings.filter((s) => keys.includes(s.setting_key)).length;
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="mb-8 bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-black mb-2">⚙️ System Settings</h1>
        <p className="text-gray-600">Configure and manage system parameters</p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-black hover:bg-gray-800 text-white font-bold rounded-lg"
        >
          ➕ Add Setting
        </button>

        <button
          onClick={initializeDefaultSettings}
          disabled={actionLoading}
          className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg"
        >
          📋 Initialize Defaults
        </button>
      </div>

      {/* Add Setting Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddSetting}
          className="bg-white rounded-lg shadow-lg p-6 mb-6"
        >
          <h3 className="text-lg font-bold text-black mb-4">Add New Setting</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input
              type="text"
              placeholder="Setting Key (e.g., system_name)"
              value={newSetting.key}
              onChange={(e) => setNewSetting({ ...newSetting, key: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg text-black"
              required
            />
            <input
              type="text"
              placeholder="Setting Value"
              value={newSetting.value}
              onChange={(e) => setNewSetting({ ...newSetting, value: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg text-black"
              required
            />
            <select
              value={newSetting.category}
              onChange={(e) => setNewSetting({ ...newSetting, category: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg text-black bg-white"
            >
              {Object.keys(settingCategories).map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-4">
            <button
              type="submit"
              className="px-6 py-2 bg-black hover:bg-gray-800 text-white font-bold rounded-lg"
            >
              Create Setting
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-black font-bold rounded-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-lg font-bold ${
            activeTab === 'all' 
              ? 'bg-black text-white' 
              : 'bg-white text-black hover:bg-gray-200'
          }`}
        >
          All ({settings.length})
        </button>
        {Object.keys(settingCategories).map((category) => (
          <button
            key={category}
            onClick={() => setActiveTab(category)}
            className={`px-4 py-2 rounded-lg font-bold ${
              activeTab === category 
                ? 'bg-black text-white' 
                : 'bg-white text-black hover:bg-gray-200'
            }`}
          >
            {category} ({getCategoryCount(category)})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          placeholder="🔍 Search settings..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-black bg-white"
        />
      </div>

      {/* Settings List */}
      {loading ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-black">Loading settings...</p>
        </div>
      ) : getSettingsByCategory(activeTab).length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-600 text-lg">No settings found</p>
          <p className="text-gray-500 mt-2">Click "Initialize Defaults" to add common settings</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {getSettingsByCategory(activeTab).map((setting) => {
            const value = editingSetting === setting.setting_key ? editValue : setting.setting_value;
            const isBoolean = value === 'true' || value === 'false';
            const isNumber = !isNaN(Number(value)) && value !== '';

            return (
              <div
                key={setting.id}
                className="bg-white rounded-lg p-5 shadow border-l-4 border-yellow-400"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-black text-lg">{setting.setting_key.replace(/_/g, ' ').toUpperCase()}</h3>
                    
                    {editingSetting === setting.setting_key ? (
                      <div className="mt-3">
                        {isBoolean ? (
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={editValue === 'true'}
                              onChange={(e) => setEditValue(e.target.checked ? 'true' : 'false')}
                              className="w-5 h-5"
                            />
                            <span className="text-sm text-black">Enabled</span>
                          </label>
                        ) : isNumber ? (
                          <input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-black"
                          />
                        ) : (
                          <textarea
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-black"
                            rows={2}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="mt-2">
                        {setting.setting_key.includes('password') || setting.setting_key.includes('smtp_password') ? (
                          <p className="text-gray-400">••••••••</p>
                        ) : setting.setting_key.endsWith('_enabled') || setting.setting_key.endsWith('_required') ? (
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${value === 'true' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {value === 'true' ? '✓ Enabled' : '✗ Disabled'}
                          </span>
                        ) : (
                          <p className="text-gray-700 font-medium">{setting.setting_value || '-'}</p>
                        )}
                      </div>
                    )}

                    <p className="text-xs text-gray-400 mt-2">
                      Updated: {new Date(setting.updated_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {editingSetting === setting.setting_key ? (
                      <>
                        <button
                          onClick={() => handleEditSetting(setting.setting_key, editValue)}
                          disabled={actionLoading}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded font-bold text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingSetting(null)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded font-bold text-sm"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingSetting(setting.setting_key);
                            setEditValue(setting.setting_value);
                          }}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteSetting(setting.setting_key)}
                          disabled={actionLoading}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded font-bold text-sm"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Reference */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-black mb-4">📚 Settings Quick Reference</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div>
            <h3 className="font-bold text-black mb-2">General</h3>
            <ul className="text-gray-600 space-y-1">
              <li>• system_name: Pharmacy name</li>
              <li>• timezone: Africa/Nairobi</li>
              <li>• language: en</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-black mb-2">Financial</h3>
            <ul className="text-gray-600 space-y-1">
              <li>• currency: KES</li>
              <li>• currency_symbol: Ksh</li>
              <li>• tax_rate: 16</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-black mb-2">Inventory</h3>
            <ul className="text-gray-600 space-y-1">
              <li>• low_stock_threshold: 10</li>
              <li>• expiry_alert_days: 30</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-black mb-2">Security</h3>
            <ul className="text-gray-600 space-y-1">
              <li>• session_timeout: 480 min</li>
              <li>• password_expiry: 90 days</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-black mb-2">Customer</h3>
            <ul className="text-gray-600 space-y-1">
              <li>• loyalty_points_enabled</li>
              <li>• points_per_100</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-black mb-2">Prescription</h3>
            <ul className="text-gray-600 space-y-1">
              <li>• prescription_required</li>
              <li>• prescription_validity_days</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
