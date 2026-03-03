import React, { useEffect, useState } from 'react';
import { prescriptionAPI, customerAPI, medicineAPI } from '../utils/api';
import type { Prescription, Customer, Medicine } from '../utils/api';

export const Prescriptions: React.FC = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState({
    customer_id: '',
    medicine_id: '',
    quantity: 1,
    prescribed_by: '',
    prescription_date: '',
    expiry_date: '',
    notes: '',
  });
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [prescriptionsResponse, customersResponse, medicinesResponse] = await Promise.all([
        prescriptionAPI.getAll(),
        customerAPI.getAll(),
        medicineAPI.getAll(),
      ]);

      setPrescriptions(prescriptionsResponse.data);
      setCustomers(customersResponse.data);
      setMedicines(medicinesResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'quantity' ? parseInt(value) || 1 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        await prescriptionAPI.update(editingId, { status: formData as any });
      } else {
        await prescriptionAPI.create(formData);
      }

      fetchData();
      setShowForm(false);
      setEditingId(null);
      resetForm();
    } catch (error) {
      console.error('Error saving prescription:', error);
    }
  };

  const handleEdit = (prescription: Prescription) => {
    setFormData({
      customer_id: prescription.customer_id?.toString() || '',
      medicine_id: prescription.medicine_id?.toString() || '',
      quantity: prescription.quantity || 1,
      prescribed_by: prescription.prescribed_by || '',
      prescription_date: prescription.prescription_date || '',
      expiry_date: prescription.expiry_date || '',
      notes: prescription.notes || '',
    });
    setEditingId(prescription.id ?? null);
    setShowForm(true);
  };

  const handleStatusChange = async (id: number | undefined, status: string) => {
    if (!id) return;
    try {
      await prescriptionAPI.update(id, { status });
      fetchData();
    } catch (error) {
      console.error('Error updating prescription status:', error);
    }
  };

  const handleDelete = async (id: number | undefined) => {
    if (!id) return;
    if (window.confirm('Are you sure you want to delete this prescription?')) {
      try {
        await prescriptionAPI.delete(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting prescription:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      customer_id: '',
      medicine_id: '',
      quantity: 1,
      prescribed_by: '',
      prescription_date: '',
      expiry_date: '',
      notes: '',
    });
  };

  const filteredPrescriptions = prescriptions.filter(p => {
    const matchesSearch = 
      p.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.medicine_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.prescribed_by?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = prescriptions.filter(p => p.status === 'pending').length;
  const completedCount = prescriptions.filter(p => p.status === 'completed').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold">✓ Completed</span>;
      case 'pending':
        return <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-bold">⏳ Pending</span>;
      case 'cancelled':
        return <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-bold">✕ Cancelled</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-bold">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="p-8 bg-gray-100 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-black font-medium">Loading prescriptions...</p>
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
              <h1 className="text-3xl font-bold text-black">💊 Prescription Management</h1>
              <p className="text-gray-600 mt-1">
                {prescriptions.length} prescriptions | 
                <span className="text-yellow-600 font-bold"> {pendingCount} pending</span> | 
                <span className="text-green-600 font-bold"> {completedCount} completed</span>
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
              className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-bold shadow transition"
            >
              {showForm ? '✕ Cancel' : '+ New Prescription'}
            </button>
          </div>

          {/* Search and Filter */}
          <div className="mt-4 flex flex-col md:flex-row gap-3">
            <input
              type="text"
              placeholder="🔍 Search prescriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-black bg-gray-50"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg text-black bg-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Prescription Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-black mb-4">
              {editingId ? '✏️ Update Prescription Status' : '📝 Create New Prescription'}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-black font-bold mb-2 text-sm">
                  Customer *
                </label>
                <select
                  name="customer_id"
                  value={formData.customer_id}
                  onChange={handleInputChange}
                  required
                  disabled={!!editingId}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black bg-white disabled:bg-gray-100"
                >
                  <option value="">Select a customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-black font-bold mb-2 text-sm">
                  Medicine *
                </label>
                <select
                  name="medicine_id"
                  value={formData.medicine_id}
                  onChange={handleInputChange}
                  required
                  disabled={!!editingId}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black bg-white disabled:bg-gray-100"
                >
                  <option value="">Select a medicine</option>
                  {medicines.map((medicine) => (
                    <option key={medicine.id} value={medicine.id}>
                      {medicine.name}
                    </option>
                  ))}
                </select>
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
                  min="1"
                  disabled={!!editingId}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-black font-bold mb-2 text-sm">
                  Prescribed By
                </label>
                <input
                  type="text"
                  name="prescribed_by"
                  value={formData.prescribed_by}
                  onChange={handleInputChange}
                  disabled={!!editingId}
                  placeholder="Dr. Name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-black font-bold mb-2 text-sm">
                  Prescription Date
                </label>
                <input
                  type="date"
                  name="prescription_date"
                  value={formData.prescription_date}
                  onChange={handleInputChange}
                  disabled={!!editingId}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black disabled:bg-gray-100"
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
                  disabled={!!editingId}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black disabled:bg-gray-100"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-black font-bold mb-2 text-sm">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  disabled={!!editingId}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black disabled:bg-gray-100"
                  rows={3}
                  placeholder="Additional notes..."
                />
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition w-full"
                >
                  {editingId ? '✓ Update Status' : '✓ Create Prescription'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Prescription Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPrescriptions.map((prescription) => (
            <div key={prescription.id} className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-black text-lg">{prescription.medicine_name}</h3>
                  <p className="text-gray-500 text-sm">Customer: {prescription.customer_name || 'N/A'}</p>
                </div>
                {getStatusBadge(prescription.status || 'pending')}
              </div>
              
              <div className="space-y-2 text-sm">
                <p className="text-gray-600">
                  <span className="font-semibold">📦</span> Quantity: {prescription.quantity}
                </p>
                <p className="text-gray-600">
                  <span className="font-semibold">👨‍⚕️</span> Prescribed by: {prescription.prescribed_by || 'N/A'}
                </p>
                <p className="text-gray-600">
                  <span className="font-semibold">📅</span> Date: {prescription.prescription_date ? new Date(prescription.prescription_date).toLocaleDateString() : 'N/A'}
                </p>
                {prescription.notes && (
                  <p className="text-gray-500 italic">"{prescription.notes}"</p>
                )}
              </div>

              <div className="flex gap-2 mt-4 pt-3 border-t">
                <select
                  value={prescription.status || 'pending'}
                  onChange={(e) => handleStatusChange(prescription.id, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded text-black text-sm bg-white"
                >
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button
                  onClick={() => handleDelete(prescription.id)}
                  className="bg-red-50 hover:bg-red-100 text-red-600 font-medium py-2 px-3 rounded transition text-sm"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredPrescriptions.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg">No prescriptions found</p>
          </div>
        )}
      </div>
    </div>
  );
};
