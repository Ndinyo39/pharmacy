import React, { useState, useEffect } from 'react';
import api from '../utils/api';

interface Pharmacy {
  id?: number;
  name: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  license_number?: string;
  status?: string;
  created_at?: string;
}

interface Branch {
  id?: number;
  pharmacy_id?: number;
  name: string;
  address?: string;
  city?: string;
  phone?: string;
  manager_id?: number;
  status?: string;
  pharmacy_name?: string;
  manager_name?: string;
}

export const PharmacyManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pharmacies' | 'branches'>('pharmacies');
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPharmacyForm, setShowPharmacyForm] = useState(false);
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [pharmacyForm, setPharmacyForm] = useState({
    name: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    license_number: '',
  });

  const [branchForm, setBranchForm] = useState({
    pharmacy_id: '',
    name: '',
    address: '',
    city: '',
    phone: '',
  });

  useEffect(() => {
    if (activeTab === 'pharmacies') {
      fetchPharmacies();
    } else {
      fetchBranches();
    }
  }, [activeTab]);

  const fetchPharmacies = async () => {
    setLoading(true);
    try {
      const response = await api.get('/superadmin/pharmacies');
      setPharmacies(response.data || []);
    } catch (error) {
      console.error('Error fetching pharmacies:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const response = await api.get('/superadmin/branches');
      setBranches(response.data || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePharmacy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pharmacyForm.name || !pharmacyForm.address) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await api.post('/superadmin/pharmacies', pharmacyForm);
      setPharmacyForm({
        name: '',
        address: '',
        city: '',
        phone: '',
        email: '',
        license_number: '',
      });
      setShowPharmacyForm(false);
      fetchPharmacies();
      alert('Pharmacy created successfully!');
    } catch (error) {
      console.error('Error creating pharmacy:', error);
      alert('Error creating pharmacy');
    }
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchForm.pharmacy_id || !branchForm.name || !branchForm.address) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await api.post('/superadmin/branches', {
        ...branchForm,
        pharmacy_id: parseInt(branchForm.pharmacy_id),
      });
      setBranchForm({
        pharmacy_id: '',
        name: '',
        address: '',
        city: '',
        phone: '',
      });
      setShowBranchForm(false);
      fetchBranches();
      alert('Branch created successfully!');
    } catch (error) {
      console.error('Error creating branch:', error);
      alert('Error creating branch');
    }
  };

  const filteredPharmacies = pharmacies.filter(p =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBranches = branches.filter(b =>
    b.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.pharmacy_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activePharmacies = pharmacies.filter(p => p.status === 'active').length;
  const activeBranches = branches.filter(b => b.status === 'active').length;

  if (loading) {
    return (
      <div className="p-8 bg-gray-100 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-black font-medium">Loading...</p>
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
              <h1 className="text-3xl font-bold text-black">🏥 Pharmacy & Branch Management</h1>
              <p className="text-gray-600 mt-1">
                {pharmacies.length} pharmacies | {branches.length} branches
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="mt-4">
            <input
              type="text"
              placeholder="🔍 Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-black bg-gray-50"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('pharmacies')}
            className={`px-6 py-3 font-bold rounded-lg transition-all ${
              activeTab === 'pharmacies'
                ? 'bg-black text-white shadow-lg'
                : 'bg-white text-black border border-gray-300 hover:bg-gray-50'
            }`}
          >
            🏥 Pharmacies ({activePharmacies})
          </button>
          <button
            onClick={() => setActiveTab('branches')}
            className={`px-6 py-3 font-bold rounded-lg transition-all ${
              activeTab === 'branches'
                ? 'bg-black text-white shadow-lg'
                : 'bg-white text-black border border-gray-300 hover:bg-gray-50'
            }`}
          >
            🏪 Branches ({activeBranches})
          </button>
        </div>

        {/* Pharmacies Tab */}
        {activeTab === 'pharmacies' && (
          <div>
            <button
              onClick={() => setShowPharmacyForm(!showPharmacyForm)}
              className="mb-6 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow"
            >
              {showPharmacyForm ? '✕ Cancel' : '➕ Add Pharmacy'}
            </button>

            {showPharmacyForm && (
              <form
                onSubmit={handleCreatePharmacy}
                className="bg-white rounded-lg p-6 shadow-lg mb-6 grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <div>
                  <label className="block text-black font-bold mb-2 text-sm">Pharmacy Name *</label>
                  <input
                    type="text"
                    placeholder="Main Pharmacy"
                    value={pharmacyForm.name}
                    onChange={(e) => setPharmacyForm({ ...pharmacyForm, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-black font-bold mb-2 text-sm">City</label>
                  <input
                    type="text"
                    placeholder="Nairobi"
                    value={pharmacyForm.city}
                    onChange={(e) => setPharmacyForm({ ...pharmacyForm, city: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-black font-bold mb-2 text-sm">Address *</label>
                  <input
                    type="text"
                    placeholder="123 Main Street"
                    value={pharmacyForm.address}
                    onChange={(e) => setPharmacyForm({ ...pharmacyForm, address: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-black font-bold mb-2 text-sm">Email</label>
                  <input
                    type="email"
                    placeholder="pharmacy@example.com"
                    value={pharmacyForm.email}
                    onChange={(e) => setPharmacyForm({ ...pharmacyForm, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
                  />
                </div>
                <div>
                  <label className="block text-black font-bold mb-2 text-sm">Phone</label>
                  <input
                    type="tel"
                    placeholder="+254 700 000 000"
                    value={pharmacyForm.phone}
                    onChange={(e) => setPharmacyForm({ ...pharmacyForm, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
                  />
                </div>
                <div>
                  <label className="block text-black font-bold mb-2 text-sm">License Number</label>
                  <input
                    type="text"
                    placeholder="LIC/2024/001"
                    value={pharmacyForm.license_number}
                    onChange={(e) => setPharmacyForm({ ...pharmacyForm, license_number: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
                  />
                </div>
                <div className="md:col-span-2 flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-bold"
                  >
                    ✓ Create Pharmacy
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPharmacyForm(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-black py-2 rounded-lg font-bold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Pharmacies Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPharmacies.map((pharmacy) => (
                <div key={pharmacy.id} className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-black text-lg">{pharmacy.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                      pharmacy.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {pharmacy.status || 'active'}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-600">
                      <span className="font-semibold">📍</span> {pharmacy.address || 'N/A'}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-semibold">🏙️</span> {pharmacy.city || 'N/A'}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-semibold">📞</span> {pharmacy.phone || 'N/A'}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-semibold">📧</span> {pharmacy.email || 'N/A'}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-semibold">🔖</span> {pharmacy.license_number || 'N/A'}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {filteredPharmacies.length === 0 && (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-500 text-lg">No pharmacies found</p>
              </div>
            )}
          </div>
        )}

        {/* Branches Tab */}
        {activeTab === 'branches' && (
          <div>
            <button
              onClick={() => setShowBranchForm(!showBranchForm)}
              className="mb-6 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow"
            >
              {showBranchForm ? '✕ Cancel' : '➕ Add Branch'}
            </button>

            {showBranchForm && (
              <form
                onSubmit={handleCreateBranch}
                className="bg-white rounded-lg p-6 shadow-lg mb-6 grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <div>
                  <label className="block text-black font-bold mb-2 text-sm">Select Pharmacy *</label>
                  <select
                    value={branchForm.pharmacy_id}
                    onChange={(e) => setBranchForm({ ...branchForm, pharmacy_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black bg-white"
                    required
                  >
                    <option value="">Select Pharmacy</option>
                    {pharmacies.map((pharmacy) => (
                      <option key={pharmacy.id} value={pharmacy.id}>
                        {pharmacy.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-black font-bold mb-2 text-sm">Branch Name *</label>
                  <input
                    type="text"
                    placeholder="Downtown Branch"
                    value={branchForm.name}
                    onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-black font-bold mb-2 text-sm">Address *</label>
                  <input
                    type="text"
                    placeholder="456 Street Name"
                    value={branchForm.address}
                    onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-black font-bold mb-2 text-sm">City</label>
                  <input
                    type="text"
                    placeholder="Mombasa"
                    value={branchForm.city}
                    onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
                  />
                </div>
                <div>
                  <label className="block text-black font-bold mb-2 text-sm">Phone</label>
                  <input
                    type="tel"
                    placeholder="+254 700 000 000"
                    value={branchForm.phone}
                    onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
                  />
                </div>
                <div className="md:col-span-2 flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-bold"
                  >
                    ✓ Create Branch
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBranchForm(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-black py-2 rounded-lg font-bold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Branches Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {filteredBranches.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-gray-500 text-lg">No branches found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-black text-white">
                      <tr>
                        <th className="text-left py-3 px-4 font-bold">Branch Name</th>
                        <th className="text-left py-3 px-4 font-bold">Pharmacy</th>
                        <th className="text-left py-3 px-4 font-bold">City</th>
                        <th className="text-left py-3 px-4 font-bold">Phone</th>
                        <th className="text-left py-3 px-4 font-bold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBranches.map((branch) => (
                        <tr key={branch.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-semibold text-black">{branch.name}</td>
                          <td className="py-3 px-4 text-gray-600">{branch.pharmacy_name || 'N/A'}</td>
                          <td className="py-3 px-4 text-gray-600">{branch.city || 'N/A'}</td>
                          <td className="py-3 px-4 text-gray-600">{branch.phone || 'N/A'}</td>
                          <td className="py-3 px-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                              branch.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {branch.status || 'active'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
