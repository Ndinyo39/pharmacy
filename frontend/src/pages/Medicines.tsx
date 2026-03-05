import React, { useEffect, useState } from 'react';
import { medicineAPI, type Medicine } from '../utils/api';

export const Medicines: React.FC = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    generic_name: '',
    batch_number: '',
    barcode: '',
    purchase_price: 0,
    selling_price: 0,
    quantity: 0,
    expiry_date: '',
  });
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      const response = await medicineAPI.getAll();
      setMedicines(response.data);
    } catch (error) {
      console.error('Error fetching medicines:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name.includes('price') || name === 'quantity' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await medicineAPI.update(editingId, formData);
      } else {
        await medicineAPI.create(formData);
      }
      fetchMedicines();
      setShowForm(false);
      setEditingId(null);
      resetForm();
    } catch (error) {
      console.error('Error saving medicine:', error);
    }
  };

  const handleEdit = (medicine: Medicine) => {
    setFormData({
      name: medicine.name,
      generic_name: medicine.generic_name || '',
      batch_number: medicine.batch_number || '',
      barcode: medicine.barcode || '',
      purchase_price: medicine.purchase_price || 0,
      selling_price: medicine.selling_price,
      quantity: medicine.quantity,
      expiry_date: medicine.expiry_date || '',
    });
    setEditingId(medicine.id ?? null);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Archive this medicine from active inventory?')) {
      try {
        await medicineAPI.delete(id);
        fetchMedicines();
      } catch (error) {
        console.error('Error deleting medicine:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      generic_name: '',
      batch_number: '',
      barcode: '',
      purchase_price: 0,
      selling_price: 0,
      quantity: 0,
      expiry_date: '',
    });
  };

  const filteredMedicines = medicines.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.generic_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.batch_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { label: 'DEFICIT', class: 'bg-red-600 text-white' };
    if (quantity <= 10) return { label: 'CRITICAL', class: 'bg-amber-500 text-white' };
    return { label: 'STOCKED', class: 'bg-emerald-600 text-white' };
  };

  const isExpired = (date: string) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-navy-100 border-t-gold-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-navy-900 font-serif font-bold">Synchronizing Inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Inventory Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8 border-b-4 border-b-gold-500">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6">
            <div>
              <h1 className="text-3xl font-serif font-bold text-black uppercase tracking-tight">Medicine Inventory</h1>
              <p className="text-gray-500 font-medium">Managing <span className="text-black font-bold">{medicines.length}</span> active pharmaceutical products</p>
            </div>
            <button
              onClick={() => {
                setShowForm(!showForm);
                if (showForm) resetForm();
                setEditingId(null);
              }}
              className="px-10 py-3.5 bg-black text-white font-bold rounded-lg shadow-lg hover:bg-gray-800 transition transform active:scale-95 flex items-center gap-3 uppercase tracking-widest text-xs"
            >
              {showForm ? '✕ Cancel Entry' : '+ Catalog New Item'}
            </button>
          </div>

          <div className="mt-6 flex items-center bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-1 focus-within:border-black transition">
            <span className="text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Filter by name, generic, or batch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-3 bg-transparent text-black font-bold outline-none placeholder:text-gray-300 placeholder:font-normal"
            />
          </div>
        </div>

        {/* Catalog Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-2xl overflow-hidden mb-8 border-2 border-black animate-in slide-in-from-top duration-300">
            <div className="bg-black text-white px-6 py-4 font-bold uppercase tracking-[0.2em] text-[10px] flex items-center justify-between">
              <span>{editingId ? 'Updating Catalog Record' : 'Registry Entry'}</span>
              <span className="text-gold-500 font-serif">PHR-2026</span>
            </div>
            <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-2">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Product Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="w-full px-4 py-3 border-2 border-gray-100 rounded-lg text-black font-bold focus:border-black outline-none transition" />
              </div>
              <div className="lg:col-span-2">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Generic Designation</label>
                <input type="text" name="generic_name" value={formData.generic_name} onChange={handleInputChange} className="w-full px-4 py-3 border-2 border-gray-100 rounded-lg text-black font-bold focus:border-black outline-none transition" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Batch #</label>
                <input type="text" name="batch_number" value={formData.batch_number} onChange={handleInputChange} className="w-full px-4 py-3 border-2 border-gray-100 rounded-lg text-black font-bold focus:border-black outline-none transition" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Barcode</label>
                <input type="text" name="barcode" value={formData.barcode} onChange={handleInputChange} className="w-full px-4 py-3 border-2 border-gray-100 rounded-lg text-black font-bold focus:border-black outline-none transition" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Acquisition Cost (Ksh)</label>
                <input type="number" name="purchase_price" value={formData.purchase_price} onChange={handleInputChange} step="0.01" className="w-full px-4 py-3 border-2 border-gray-100 rounded-lg text-black font-bold focus:border-black outline-none transition" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Retail Price (Ksh) *</label>
                <input type="number" name="selling_price" value={formData.selling_price} onChange={handleInputChange} step="0.01" required className="w-full px-4 py-3 border-2 border-gray-100 rounded-lg text-black font-bold focus:border-black outline-none transition" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Registry Quantity *</label>
                <input type="number" name="quantity" value={formData.quantity} onChange={handleInputChange} required className="w-full px-4 py-3 border-2 border-gray-100 rounded-lg text-black font-bold focus:border-black outline-none transition" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Expiry Threshold</label>
                <input type="date" name="expiry_date" value={formData.expiry_date} onChange={handleInputChange} className="w-full px-4 py-3 border-2 border-gray-100 rounded-lg text-black font-bold focus:border-black outline-none transition" />
              </div>
              <div className="lg:col-span-4 mt-4">
                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-lg shadow-lg flex items-center justify-center gap-3 uppercase tracking-widest">
                  {editingId ? '🔒 Save Catalog Changes' : '✅ Authorize New Item'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Medicines Ledger */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="py-4 px-6 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Description</th>
                  <th className="py-4 px-6 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Batch/Expiry</th>
                  <th className="py-4 px-6 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Pricing</th>
                  <th className="py-4 px-6 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">Availability</th>
                  <th className="py-4 px-6 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredMedicines.length === 0 ? (
                  <tr><td colSpan={5} className="py-12 text-center text-gray-400 font-serif">No pharmaceutical matches found</td></tr>
                ) : (
                  filteredMedicines.map((m) => {
                    const stock = getStockStatus(m.quantity);
                    const expired = isExpired(m.expiry_date || '');

                    return (
                      <tr key={m.id} className="hover:bg-gray-50 transition">
                        <td className="py-5 px-6">
                          <div className="font-bold text-navy-900 text-lg leading-tight">{m.name}</div>
                          <div className="text-xs text-gray-400 font-medium uppercase">{m.generic_name || 'Generic Not Specified'}</div>
                        </td>
                        <td className="py-5 px-6">
                          <div className="text-sm font-bold text-black font-serif">{m.batch_number || '---'}</div>
                          <div className={`text-[10px] font-bold uppercase mt-1 ${expired ? 'text-red-600' : 'text-gray-400'}`}>
                            {expired ? '🚨 EXPIRED' : (m.expiry_date ? new Date(m.expiry_date).toLocaleDateString() : 'NO EXPIRY')}
                          </div>
                        </td>
                        <td className="py-5 px-6 text-right">
                          <div className="text-lg font-bold text-black font-serif">Ksh {m.selling_price.toLocaleString()}</div>
                          <div className="text-[10px] text-gray-400 uppercase">Cost: {m.purchase_price || 0}</div>
                        </td>
                        <td className="py-5 px-6 text-center">
                          <div className="font-black text-xl text-black mb-1">{m.quantity}</div>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${stock.class}`}>
                            {stock.label}
                          </span>
                        </td>
                        <td className="py-5 px-6 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => handleEdit(m)} className="p-2 text-navy-400 hover:text-black hover:bg-gray-100 rounded-lg transition" title="Modify Record">
                              ✏️
                            </button>
                            <button onClick={() => { if (m.id) handleDelete(m.id) }} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition" title="Archive Item">
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
