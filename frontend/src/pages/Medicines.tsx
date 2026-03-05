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
    if (window.confirm('Are you sure you want to delete this medicine?')) {
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
    if (quantity === 0) return { label: 'Out of Stock', class: 'bg-red-500 text-white' };
    if (quantity <= 10) return { label: 'Low Stock', class: 'bg-orange-500 text-white' };
    return { label: 'In Stock', class: 'bg-green-500 text-white' };
  };

  if (loading) {
    return (
      <div className="p-8 bg-gray-100 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-black font-medium">Loading medicines...</p>
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
              <h1 className="text-3xl font-bold text-black">💊 Medicines</h1>
              <p className="text-gray-600 mt-1">Manage your pharmacy inventory ({medicines.length} items)</p>
            </div>
            <button
              onClick={() => {
                setShowForm(!showForm);
                if (showForm) resetForm();
                setEditingId(null);
              }}
              className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-bold shadow transition"
            >
              {showForm ? '✕ Cancel' : '+ Add Medicine'}
            </button>
          </div>

          {/* Search */}
          <div className="mt-4">
            <input
              type="text"
              placeholder="🔍 Search medicines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-black bg-gray-50"
            />
          </div>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-black mb-4">
              {editingId ? '✏️ Edit Medicine' : '➕ Add New Medicine'}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-black font-bold mb-2 text-sm">
                  Medicine Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
                />
              </div>

              <div>
                <label className="block text-black font-bold mb-2 text-sm">
                  Generic Name
                </label>
                <input
                  type="text"
                  name="generic_name"
                  value={formData.generic_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
                />
              </div>

              <div>
                <label className="block text-black font-bold mb-2 text-sm">
                  Batch Number
                </label>
                <input
                  type="text"
                  name="batch_number"
                  value={formData.batch_number}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
                />
              </div>

              <div>
                <label className="block text-black font-bold mb-2 text-sm">
                  Barcode
                </label>
                <input
                  type="text"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
                />
              </div>

              <div>
                <label className="block text-black font-bold mb-2 text-sm">
                  Purchase Price (Ksh)
                </label>
                <input
                  type="number"
                  name="purchase_price"
                  value={formData.purchase_price}
                  onChange={handleInputChange}
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
                />
              </div>

              <div>
                <label className="block text-black font-bold mb-2 text-sm">
                  Selling Price (Ksh) *
                </label>
                <input
                  type="number"
                  name="selling_price"
                  value={formData.selling_price}
                  onChange={handleInputChange}
                  step="0.01"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
                />
              </div>

              <div>
                <label className="block text-black font-bold mb-2 text-sm">
                  Quantity *
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
                />
              </div>

              <div>
                <label className="block text-black font-bold mb-2 text-sm">
                  Expiry Date
                </label>
                <input
                  type="date"
                  name="expiry_date"
                  value={formData.expiry_date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
                />
              </div>

              <div className="md:col-span-2 lg:col-span-4">
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition"
                >
                  {editingId ? '✓ Update Medicine' : '✓ Add Medicine'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Medicines Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredMedicines.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 text-lg">No medicines found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-black text-white">
                  <tr>
                    <th className="text-left py-3 px-4 font-bold">Name</th>
                    <th className="text-left py-3 px-4 font-bold">Generic</th>
                    <th className="text-left py-3 px-4 font-bold">Batch</th>
                    <th className="text-left py-3 px-4 font-bold">Cost</th>
                    <th className="text-left py-3 px-4 font-bold">Price</th>
                    <th className="text-left py-3 px-4 font-bold">Qty</th>
                    <th className="text-left py-3 px-4 font-bold">Status</th>
                    <th className="text-left py-3 px-4 font-bold">Expiry</th>
                    <th className="text-left py-3 px-4 font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMedicines.map((medicine) => {
                    const stockStatus = getStockStatus(medicine.quantity);
                    return (
                      <tr key={medicine.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-black">{medicine.name}</td>
                        <td className="py-3 px-4 text-gray-600">{medicine.generic_name || '-'}</td>
                        <td className="py-3 px-4 text-gray-600">{medicine.batch_number || '-'}</td>
                        <td className="py-3 px-4 text-gray-600">Ksh {(medicine.purchase_price || 0).toFixed(2)}</td>
                        <td className="py-3 px-4 font-bold text-black">Ksh {medicine.selling_price.toFixed(2)}</td>
                        <td className="py-3 px-4 font-bold text-black">{medicine.quantity}</td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${stockStatus.class}`}>
                            {stockStatus.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {medicine.expiry_date
                            ? new Date(medicine.expiry_date).toLocaleDateString()
                            : '-'}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleEdit(medicine)}
                            className="text-blue-600 hover:text-blue-800 font-bold mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (medicine.id) handleDelete(medicine.id);
                            }}
                            className="text-red-600 hover:text-red-800 font-bold"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
