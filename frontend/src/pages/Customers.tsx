import React, { useEffect, useState } from 'react';
import { customerAPI } from '../utils/api';
import type { Customer } from '../utils/api';

export const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
  });
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await customerAPI.getAll();
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await customerAPI.update(editingId, formData);
      } else {
        await customerAPI.create(formData);
      }
      fetchCustomers();
      setShowForm(false);
      setEditingId(null);
      resetForm();
    } catch (error) {
      console.error('Error saving customer:', error);
    }
  };

  const handleEdit = (customer: Customer) => {
    setFormData({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      city: customer.city || '',
    });
    setEditingId(customer.id ?? null);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await customerAPI.delete(id);
        fetchCustomers();
      } catch (error) {
        console.error('Error deleting customer:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
    });
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery) ||
    c.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalLoyaltyPoints = customers.reduce((sum, c) => sum + (c.loyalty_points || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-navy-100 border-t-gold-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-navy-900 font-serif font-bold">Loading Customer Directory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gray-100 min-h-screen font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8 border-l-4 border-l-gold-500">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6">
            <div>
              <h1 className="text-3xl font-serif font-bold text-black uppercase tracking-tight">Customer Management</h1>
              <p className="text-gray-500 mt-1">
                <span className="font-bold text-black">{customers.length}</span> Active Profiles
                <span className="mx-2">•</span>
                <span className="text-emerald-600 font-bold">{totalLoyaltyPoints.toLocaleString()}</span> Total Loyalty Points
              </p>
            </div>
            <button
              onClick={() => {
                setShowForm(!showForm);
                if (showForm) {
                  resetForm();
                  setEditingId(null);
                }
              }}
              className="px-8 py-3.5 bg-black text-white font-bold rounded-lg shadow-lg hover:bg-gray-800 transition transform active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
            >
              {showForm ? '✕ Cancel Operation' : '+ Register New Patient'}
            </button>
          </div>

          {/* Search bar integrated into header */}
          <div className="mt-8 flex items-center bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-1 focus-within:border-black transition">
            <span className="text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Query by name, email, or contact number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-3 bg-transparent text-black font-bold outline-none placeholder:text-gray-300 placeholder:font-normal"
            />
          </div>
        </div>

        {/* Form Section */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-2xl overflow-hidden mb-8 border-2 border-black animate-in slide-in-from-top duration-300">
            <div className="bg-black text-white px-6 py-4 font-bold uppercase tracking-[0.2em] text-[10px] flex items-center justify-between">
              <span>{editingId ? 'Updating Customer Profile' : 'New Patient Registry'}</span>
              <span className="text-gold-500 font-serif">PHR-CRM</span>
            </div>
            <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Legal Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-100 rounded-lg text-black font-bold focus:border-black outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-100 rounded-lg text-black font-bold focus:border-black outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Primary Contact *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-100 rounded-lg text-black font-bold focus:border-black outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Residence City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-100 rounded-lg text-black font-bold focus:border-black outline-none transition"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Detailed Physical Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-100 rounded-lg text-black font-bold focus:border-black outline-none transition"
                />
              </div>

              <div className="md:col-span-2 mt-4">
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-lg shadow-lg flex items-center justify-center gap-3 uppercase tracking-widest"
                >
                  {editingId ? '🔒 Save Profile Updates' : '✅ Finalize Patient Registry'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Customer Directory View */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => (
            <div key={customer.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition overflow-hidden group border border-gray-100">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-navy-50 text-navy-900 rounded-full flex items-center justify-center font-serif font-bold text-xl uppercase group-hover:bg-gold-500 group-hover:text-black transition duration-300">
                    {customer.name.charAt(0)}
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Loyalty Points</div>
                    <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-black">
                      ★ {customer.loyalty_points || 0}
                    </div>
                  </div>
                </div>

                <h3 className="text-lg font-serif font-bold text-black group-hover:text-navy-900 transition mb-1">{customer.name}</h3>
                <p className="text-gray-400 text-xs mb-4 truncate">{customer.email || 'No email provided'}</p>

                <div className="space-y-3 pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="w-6 h-6 bg-emerald-50 text-emerald-600 rounded flex items-center justify-center text-xs">📱</span>
                    <span className="font-bold text-gray-700">{customer.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="w-6 h-6 bg-blue-50 text-blue-600 rounded flex items-center justify-center text-xs">📍</span>
                    <span className="text-gray-500">{customer.city || 'Location Unknown'}</span>
                  </div>
                </div>
              </div>

              <div className="flex bg-gray-50 border-t border-gray-100">
                <button
                  onClick={() => handleEdit(customer)}
                  className="flex-1 py-3 text-xs font-bold text-gray-500 hover:text-black hover:bg-white transition uppercase tracking-widest border-r border-gray-100"
                >
                  Modify
                </button>
                <button
                  onClick={() => customer.id && handleDelete(customer.id)}
                  className="flex-1 py-3 text-xs font-bold text-gray-400 hover:text-red-600 hover:bg-red-50 transition uppercase tracking-widest"
                >
                  Archive
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredCustomers.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-20 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl text-gray-200">🔍</span>
            </div>
            <h3 className="text-xl font-serif font-bold text-navy-900 mb-2">No Matching Records</h3>
            <p className="text-gray-400 text-sm max-w-xs mx-auto">Try adjusting your search criteria or register a new customer profile above.</p>
          </div>
        )}
      </div>
    </div>
  );
};
