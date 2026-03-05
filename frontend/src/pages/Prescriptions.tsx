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

    const formattedData: Omit<Prescription, 'id'> = {
      customer_id: parseInt(formData.customer_id),
      medicine_id: parseInt(formData.medicine_id),
      quantity: formData.quantity,
      prescribed_by: formData.prescribed_by,
      prescription_date: formData.prescription_date,
      expiry_date: formData.expiry_date,
      notes: formData.notes,
      status: editingId ? undefined : 'pending',
    };

    try {
      if (editingId) {
        await prescriptionAPI.update(editingId, { status: (formData as any).status || 'pending' });
      } else {
        await prescriptionAPI.create(formattedData);
      }

      fetchData();
      setShowForm(false);
      setEditingId(null);
      resetForm();
    } catch (error) {
      console.error('Error saving prescription:', error);
    }
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
    if (window.confirm('Delete this clinical record definitively?')) {
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">Verified ✓</span>;
      case 'pending':
        return <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">In Queue ⏳</span>;
      case 'cancelled':
        return <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">Revoked ✕</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-navy-100 border-t-gold-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-navy-900 font-serif font-bold">Verifying Clinical Records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8 border-l-4 border-l-gold-500">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6">
            <div>
              <h1 className="text-3xl font-serif font-bold text-black uppercase tracking-tight">Prescription Registry</h1>
              <p className="text-gray-500 mt-1">
                <span className="text-black font-bold">{prescriptions.length}</span> Total Logs
                <span className="mx-2">•</span>
                <span className="text-amber-600 font-bold">{pendingCount}</span> Pending Validation
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
              {showForm ? '✕ Close Terminal' : '📝 Log New Prescription'}
            </button>
          </div>

          <div className="mt-8 flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex items-center bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-1 focus-within:border-black transition">
              <span className="text-gray-400">🔍</span>
              <input
                type="text"
                placeholder="Search by Patient, Medicine, or Doctor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-3 bg-transparent text-black font-bold outline-none placeholder:text-gray-300 placeholder:font-normal"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-6 py-3 border-2 border-gray-100 rounded-xl text-black bg-white font-bold focus:border-black outline-none transition cursor-pointer"
            >
              <option value="all">Global Status</option>
              <option value="pending">Pending Only</option>
              <option value="completed">Completed Records</option>
              <option value="cancelled">Cancelled/Void</option>
            </select>
          </div>
        </div>

        {/* Prescription Modal/Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-2xl overflow-hidden mb-8 border-2 border-black animate-in slide-in-from-top duration-300">
            <div className="bg-black text-white px-6 py-4 font-bold uppercase tracking-[0.2em] text-[10px] flex items-center justify-between">
              <span>Clinical Registry Entry</span>
              <span className="text-gold-500 font-serif">PHR-RX-2026</span>
            </div>
            <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Patient Name *</label>
                <select name="customer_id" value={formData.customer_id} onChange={handleInputChange} required className="w-full px-4 py-3 border-2 border-gray-100 rounded-lg text-black font-bold focus:border-black outline-none transition">
                  <option value="">Select Patient</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="lg:col-span-1">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Medicine Product *</label>
                <select name="medicine_id" value={formData.medicine_id} onChange={handleInputChange} required className="w-full px-4 py-3 border-2 border-gray-100 rounded-lg text-black font-bold focus:border-black outline-none transition">
                  <option value="">Select Medicine</option>
                  {medicines.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Quantity Log *</label>
                <input type="number" name="quantity" value={formData.quantity} onChange={handleInputChange} required min="1" className="w-full px-4 py-3 border-2 border-gray-100 rounded-lg text-black font-bold focus:border-black outline-none transition" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Prescribing Physician</label>
                <input type="text" name="prescribed_by" value={formData.prescribed_by} onChange={handleInputChange} className="w-full px-4 py-3 border-2 border-gray-100 rounded-lg text-black font-bold focus:border-black outline-none transition" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Issue Date</label>
                <input type="date" name="prescription_date" value={formData.prescription_date} onChange={handleInputChange} className="w-full px-4 py-3 border-2 border-gray-100 rounded-lg text-black font-bold focus:border-black outline-none transition" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Clinical Void Date</label>
                <input type="date" name="expiry_date" value={formData.expiry_date} onChange={handleInputChange} className="w-full px-4 py-3 border-2 border-gray-100 rounded-lg text-black font-bold focus:border-black outline-none transition" />
              </div>

              <div className="lg:col-span-3">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Physician Notes / Instructions</label>
                <textarea name="notes" value={formData.notes} onChange={handleInputChange} className="w-full px-4 py-3 border-2 border-gray-100 rounded-lg text-black font-bold focus:border-black outline-none transition" rows={2} />
              </div>

              <div className="lg:col-span-3 mt-2">
                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-lg shadow-lg flex items-center justify-center gap-3 uppercase tracking-widest">
                  ✅ Standardize Prescription Entry
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Prescription List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrescriptions.map((p) => (
            <div key={p.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition overflow-hidden group border border-gray-100">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 bg-navy-50 text-gold-600 rounded-lg flex items-center justify-center font-bold text-lg group-hover:bg-navy-900 group-hover:text-gold-500 transition duration-300">
                    Rx
                  </div>
                  {getStatusBadge(p.status || 'pending')}
                </div>

                <h3 className="text-xl font-serif font-bold text-black mb-1 group-hover:text-navy-900 transition">{p.medicine_name}</h3>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-6">Patient: {p.customer_name || 'Anonymous'}</p>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  <div>
                    <p className="mb-1">Physician</p>
                    <p className="text-black text-sm capitalize">{p.prescribed_by || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="mb-1">Dosage/Qty</p>
                    <p className="text-black text-sm">{p.quantity} Units</p>
                  </div>
                  <div className="col-span-2">
                    <p className="mb-1">Registry Date</p>
                    <p className="text-black text-sm">{p.prescription_date ? new Date(p.prescription_date).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>

                {p.notes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg border-l-2 border-l-navy-200">
                    <p className="text-xs text-gray-500 italic">"{p.notes}"</p>
                  </div>
                )}
              </div>

              <div className="flex bg-gray-50 border-t border-gray-100 items-center justify-between px-6 py-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Status:</span>
                  <select
                    value={p.status || 'pending'}
                    onChange={(e) => handleStatusChange(p.id, e.target.value)}
                    className="bg-transparent text-xs font-black text-black outline-none cursor-pointer hover:underline"
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Verified</option>
                    <option value="cancelled">Void</option>
                  </select>
                </div>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredPrescriptions.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-20 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl text-gray-200">💊</span>
            </div>
            <h3 className="text-xl font-serif font-bold text-navy-900 mb-2">No Records Found</h3>
            <p className="text-gray-400 text-sm max-w-xs mx-auto">Try refining your search or log a new clinical prescription above.</p>
          </div>
        )}
      </div>
    </div>
  );
};
