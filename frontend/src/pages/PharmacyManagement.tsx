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
    try {
      await api.post('/superadmin/pharmacies', pharmacyForm);
      setPharmacyForm({ name: '', address: '', city: '', phone: '', email: '', license_number: '' });
      setShowPharmacyForm(false);
      fetchPharmacies();
    } catch (error) {
      console.error('Error creating pharmacy:', error);
    }
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/superadmin/branches', {
        ...branchForm,
        pharmacy_id: parseInt(branchForm.pharmacy_id),
      });
      setBranchForm({ pharmacy_id: '', name: '', address: '', city: '', phone: '' });
      setShowBranchForm(false);
      fetchBranches();
    } catch (error) {
      console.error('Error creating branch:', error);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-navy-100 border-t-gold-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-navy-900 font-serif font-bold tracking-widest uppercase text-xs">Synchronizing Global Network...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Superior Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8 border-b-4 border-gold-500">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6">
            <div>
              <h1 className="text-4xl font-serif font-black text-black uppercase tracking-tighter">Network Management</h1>
              <p className="text-gray-400 mt-2 font-medium">Enterprise oversight across all registered pharmacies and retail nodes.</p>
            </div>
          </div>

          <div className="mt-8 flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex items-center bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-1 focus-within:border-black transition">
              <span className="text-gray-400">🔍</span>
              <input
                type="text"
                placeholder="Filter network by identity or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-3 bg-transparent text-black font-bold outline-none placeholder:text-gray-300 placeholder:font-normal"
              />
            </div>
            <div className="flex bg-gray-50 p-1.5 rounded-xl border-2 border-gray-100">
              <button
                onClick={() => setActiveTab('pharmacies')}
                className={`px-8 py-2.5 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'pharmacies' ? 'bg-black text-white shadow-lg' : 'text-gray-400 hover:text-black'}`}
              >
                Pharmacies ({pharmacies.length})
              </button>
              <button
                onClick={() => setActiveTab('branches')}
                className={`px-8 py-2.5 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'branches' ? 'bg-black text-white shadow-lg' : 'text-gray-400 hover:text-black'}`}
              >
                Retail Nodes ({branches.length})
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Action Zone */}
        {activeTab === 'pharmacies' ? (
          <div className="animate-in slide-in-from-left duration-500">
            <button
              onClick={() => setShowPharmacyForm(!showPharmacyForm)}
              className="mb-8 px-8 py-3.5 bg-black text-white font-bold rounded-lg shadow-xl hover:bg-gray-800 transition transform active:scale-95 flex items-center gap-3 uppercase tracking-widest text-xs"
            >
              {showPharmacyForm ? '✕ Cancel Entry' : '➕ Authorize New Pharmacy'}
            </button>

            {showPharmacyForm && (
              <div className="bg-white rounded-lg shadow-2xl overflow-hidden mb-8 border-2 border-black animate-in zoom-in duration-300">
                <div className="bg-black text-white px-6 py-4 font-bold uppercase tracking-[0.2em] text-[10px] flex items-center justify-between">
                  <span>Authorized Pharmacy Registry</span>
                  <span className="text-gold-500 font-serif">PHR-CORP</span>
                </div>
                <form onSubmit={handleCreatePharmacy} className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Legal Entity Name *</label>
                    <input type="text" value={pharmacyForm.name} onChange={(e) => setPharmacyForm({ ...pharmacyForm, name: e.target.value })} required className="w-full px-4 py-3 border-2 border-gray-100 rounded-lg text-black font-bold focus:border-black outline-none transition" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Domain City</label>
                    <input type="text" value={pharmacyForm.city} onChange={(e) => setPharmacyForm({ ...pharmacyForm, city: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-100 rounded-lg text-black font-bold focus:border-black outline-none transition" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Practice License #</label>
                    <input type="text" value={pharmacyForm.license_number} onChange={(e) => setPharmacyForm({ ...pharmacyForm, license_number: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-100 rounded-lg text-black font-bold focus:border-black outline-none transition" />
                  </div>
                  <div className="lg:col-span-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Global Headquarters Address *</label>
                    <input type="text" value={pharmacyForm.address} onChange={(e) => setPharmacyForm({ ...pharmacyForm, address: e.target.value })} required className="w-full px-4 py-3 border-2 border-gray-100 rounded-lg text-black font-bold focus:border-black outline-none transition" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Primary Protocol Contact</label>
                    <input type="tel" value={pharmacyForm.phone} onChange={(e) => setPharmacyForm({ ...pharmacyForm, phone: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-100 rounded-lg text-black font-bold focus:border-black outline-none transition" />
                  </div>
                  <div className="lg:col-span-3 mt-4">
                    <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-lg shadow-lg flex items-center justify-center gap-3 uppercase tracking-widest text-xs">
                      ✅ Finalize Entity Provisioning
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPharmacies.map((p) => (
                <div key={p.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition border border-gray-100 overflow-hidden flex flex-col group">
                  <div className="p-8 flex-1">
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-14 h-14 bg-navy-50 text-navy-900 rounded-2xl flex items-center justify-center font-serif font-black text-2xl uppercase group-hover:bg-navy-900 group-hover:text-gold-500 transition duration-300">
                        {p.name.charAt(0)}
                      </div>
                      <span className={`px-3 py-1 rounded text-[8px] font-black uppercase tracking-widest ${p.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                        {p.status || 'Verified'}
                      </span>
                    </div>
                    <h3 className="text-xl font-serif font-black text-black group-hover:text-navy-900 transition mb-1">{p.name}</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-6">License: {p.license_number || 'Historical'}</p>

                    <div className="space-y-4 pt-4 border-t border-gray-50">
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-blue-600">📍</span>
                        <span className="text-gray-500 truncate">{p.address}, {p.city}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-emerald-600">📱</span>
                        <span className="font-bold text-gray-700">{p.phone || 'Protocol Missing'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="animate-in slide-in-from-right duration-500">
            <button
              onClick={() => setShowBranchForm(!showBranchForm)}
              className="mb-8 px-8 py-3.5 bg-black text-white font-bold rounded-lg shadow-xl hover:bg-gray-800 transition transform active:scale-95 flex items-center gap-3 uppercase tracking-widest text-xs"
            >
              {showBranchForm ? '✕ Cancel Operation' : '➕ Commission New Node'}
            </button>

            {showBranchForm && (
              <div className="bg-white rounded-lg shadow-2xl overflow-hidden mb-8 border-2 border-black animate-in zoom-in duration-300">
                <div className="bg-black text-white px-6 py-4 font-bold uppercase tracking-[0.2em] text-[10px] flex items-center justify-between">
                  <span>Branch Neural Entry</span>
                  <span className="text-gold-500 font-serif">PHR-NODE</span>
                </div>
                <form onSubmit={handleCreateBranch} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Parent Entity Authorization *</label>
                    <select value={branchForm.pharmacy_id} onChange={(e) => setBranchForm({ ...branchForm, pharmacy_id: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-100 rounded-lg text-black font-bold focus:border-black outline-none transition bg-white" required>
                      <option value="">Select Parent Pharmacy</option>
                      {pharmacies.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Node Specification Name *</label>
                    <input type="text" value={branchForm.name} onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })} required className="w-full px-4 py-3 border-2 border-gray-100 rounded-lg text-black font-bold focus:border-black outline-none transition" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Regional Domain</label>
                    <input type="text" value={branchForm.city} onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-100 rounded-lg text-black font-bold focus:border-black outline-none transition" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Secure Link Contact</label>
                    <input type="tel" value={branchForm.phone} onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-100 rounded-lg text-black font-bold focus:border-black outline-none transition" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Tactical Operations Address *</label>
                    <input type="text" value={branchForm.address} onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })} required className="w-full px-4 py-3 border-2 border-gray-100 rounded-lg text-black font-bold focus:border-black outline-none transition" />
                  </div>
                  <div className="md:col-span-2 mt-4">
                    <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-lg shadow-lg flex items-center justify-center gap-3 uppercase tracking-widest text-xs">
                      ✅ Standardize Node Commissioning
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="py-5 px-8 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Node Name</th>
                    <th className="py-5 px-8 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Parent Protocol</th>
                    <th className="py-5 px-8 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Location</th>
                    <th className="py-5 px-8 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredBranches.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50 transition">
                      <td className="py-6 px-8">
                        <div className="font-serif font-black text-navy-900 tracking-tight">{b.name}</div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase mt-1">ID: #00{b.id}</div>
                      </td>
                      <td className="py-6 px-8">
                        <span className="px-3 py-1 bg-navy-900 text-gold-500 rounded text-[9px] font-black uppercase tracking-widest">{b.pharmacy_name}</span>
                      </td>
                      <td className="py-6 px-8 text-xs font-bold text-gray-500">
                        {b.city} <span className="mx-1 text-gray-200">•</span> {b.phone || 'N/A'}
                      </td>
                      <td className="py-6 px-8">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${b.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                          {b.status || 'OPERATIONAL'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
