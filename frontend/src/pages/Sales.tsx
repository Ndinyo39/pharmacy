import React, { useEffect, useState, useRef } from 'react';
import { salesAPI, customerAPI, medicineAPI } from '../utils/api';

interface Sale {
  id?: number;
  customer_id?: number;
  medicine_id?: number;
  quantity?: number;
  unit_price?: number;
  total_amount?: number;
  transaction_date?: string;
  payment_method?: string;
  customer_name?: string;
  medicine_name?: string;
}

interface Customer {
  id?: number;
  name?: string;
}

interface Medicine {
  id?: number;
  name?: string;
  quantity?: number;
  selling_price?: number;
}

interface ReceiptData {
  medicine_name: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  payment_method: string;
  customer_name: string;
  transaction_date: string;
  receipt_number: string;
}

export const Sales: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [formData, setFormData] = useState({
    customer_id: '',
    medicine_id: '',
    quantity: 1 as number | string,
    payment_method: 'cash',
  });

  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [salesResponse, customersResponse, medicinesResponse] = await Promise.all([
        salesAPI.getAll(),
        customerAPI.getAll(),
        medicineAPI.getAll(),
      ]);

      setSales(salesResponse.data || []);
      setCustomers(customersResponse.data || []);
      setMedicines(medicinesResponse.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'quantity' ? (value === '' ? '' : parseInt(value)) : value,
    }));
  };

  const generateReceiptNumber = () => {
    const date = new Date();
    const timestamp = date.getTime().toString().slice(-6);
    return `RCP-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}-${timestamp}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedMedicine = medicines.find(
      (m) => m.id === parseInt(formData.medicine_id as string)
    );

    if (!selectedMedicine) {
      alert('Please select a medicine');
      return;
    }

    if ((selectedMedicine.quantity || 0) < Number(formData.quantity)) {
      alert(`Not enough stock! Only ${selectedMedicine.quantity} available`);
      return;
    }

    try {
      await salesAPI.create({
        customer_id: formData.customer_id ? parseInt(formData.customer_id) : undefined,
        medicine_id: parseInt(formData.medicine_id),
        quantity: Number(formData.quantity) || 1,
        unit_price: Number(selectedMedicine.selling_price) || 0,
        payment_method: formData.payment_method,
      });

      const saleData: ReceiptData = {
        medicine_name: selectedMedicine.name || 'Unknown',
        quantity: Number(formData.quantity) || 1,
        unit_price: selectedMedicine.selling_price || 0,
        total_amount: (selectedMedicine.selling_price || 0) * (Number(formData.quantity) || 1),
        payment_method: formData.payment_method,
        customer_name: customers.find(c => c.id === parseInt(formData.customer_id))?.name || 'Walk-in Customer',
        transaction_date: new Date().toISOString(),
        receipt_number: generateReceiptNumber(),
      };

      setReceiptData(saleData);
      fetchData();
      setShowForm(false);
      resetForm();
      setShowReceipt(true);
    } catch (error) {
      console.error('Error creating sale:', error);
      alert('Error creating sale');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this sales record? This will also restore the medicine quantity to inventory.')) {
      return;
    }

    try {
      await salesAPI.delete(id);
      fetchData(); // Refresh both sales and medicines list
    } catch (error) {
      console.error('Error deleting sale:', error);
      alert('Error deleting sale');
    }
  };

  const resetForm = () => {
    setFormData({
      customer_id: '',
      medicine_id: '',
      quantity: 1 as number | string,
      payment_method: 'cash',
    });
  };

  const handlePrint = () => {
    const printContent = receiptRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank', 'height=600,width=400');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${receiptData?.receipt_number}</title>
          <style>
            body { font-family: monospace; padding: 20px; color: #333; }
            .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 15px; }
            .logo { font-size: 20px; font-weight: bold; }
            .info { font-size: 12px; margin-bottom: 15px; }
            .items { border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 15px; }
            .item-row { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 5px; }
            .total { display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; font-size: 10px; font-style: italic; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">EAGLES' PHARMACY</div>
            <div>Home Based Nursing Care</div>
          </div>
          <div class="info">
            <p>RCP: ${receiptData?.receipt_number}</p>
            <p>Date: ${new Date(receiptData?.transaction_date || '').toLocaleString()}</p>
            <p>Customer: ${receiptData?.customer_name}</p>
          </div>
          <div class="items">
            <div class="item-row">
              <span>${receiptData?.medicine_name} x${receiptData?.quantity}</span>
              <span>Ksh ${receiptData?.total_amount.toFixed(2)}</span>
            </div>
          </div>
          <div class="total">
            <span>TOTAL</span>
            <span>Ksh ${receiptData?.total_amount.toFixed(2)}</span>
          </div>
          <div class="footer">
            <p>Payment: ${receiptData?.payment_method?.toUpperCase()}</p>
            <p>Thank you for choosing Eagles' Pharmacy</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const filteredSales = sales.filter(s =>
    s.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.medicine_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalRevenueAllTime = filteredSales.reduce((sum, s) => sum + (s.total_amount || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header POS UI */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8 border-t-4 border-t-black">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6">
            <div>
              <h1 className="text-3xl font-serif font-bold text-black uppercase tracking-tight">Sales & Billing</h1>
              <div className="flex items-center gap-3 mt-1 text-gray-500">
                <span className="font-bold text-black">{sales.length}</span> Transactions
                <span className="h-4 w-[1px] bg-gray-300"></span>
                Total Revenue: <span className="font-bold text-emerald-600">Ksh {totalRevenueAllTime.toLocaleString()}</span>
              </div>
            </div>
            <button
              onClick={() => {
                setShowForm(!showForm);
                if (showForm) resetForm();
              }}
              className={`px-8 py-3 rounded-lg font-bold shadow-lg transition transform active:scale-95 flex items-center gap-2 ${showForm ? 'bg-gray-100 text-gray-900 border-2 border-gray-200' : 'bg-black text-white hover:bg-gray-800'
                }`}
            >
              {showForm ? '✕ Close Terminal' : '🧾 New Transaction'}
            </button>
          </div>
        </div>

        {/* Transaction Terminal (Form) */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-xl overflow-hidden mb-8 border-2 border-black animate-in slide-in-from-top duration-300">
            <div className="bg-black text-white px-6 py-3 font-bold uppercase text-sm tracking-widest flex items-center justify-between">
              <span>Create Fresh Invoice</span>
              <span className="text-yellow-400">POS ACTIVE</span>
            </div>
            <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
              <div className="col-span-1 lg:col-span-2">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Medicine Product</label>
                <select
                  name="medicine_id"
                  value={formData.medicine_id}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-100 rounded-lg text-black bg-gray-50 font-bold focus:border-black outline-none transition"
                >
                  <option value="">Select Medicine</option>
                  {medicines.map((m) => (
                    <option key={m.id} value={m.id} disabled={(m.quantity || 0) <= 0}>
                      {m.name} - Ksh {m.selling_price} (Stock: {m.quantity})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Quantity</label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, quantity: Math.max(1, (Number(prev.quantity) || 1) - 1) }))}
                    className="px-4 py-3 bg-gray-100 border-2 border-r-0 border-gray-100 rounded-l-lg hover:bg-gray-200 text-black font-bold outline-none transition"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    required
                    min="1"
                    className="w-full px-4 py-3 border-2 border-gray-100 text-center text-black bg-gray-50 font-bold focus:border-black outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, quantity: (Number(prev.quantity) || 0) + 1 }))}
                    className="px-4 py-3 bg-gray-100 border-2 border-l-0 border-gray-100 rounded-r-lg hover:bg-gray-200 text-black font-bold outline-none transition"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Payment</label>
                <select
                  name="payment_method"
                  value={formData.payment_method}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-100 rounded-lg text-black bg-gray-50 font-bold focus:border-black outline-none transition"
                >
                  <option value="cash">💵 Cash</option>
                  <option value="card">💳 Card</option>
                  <option value="online">📱 Mpesa/Online</option>
                </select>
              </div>

              <div className="col-span-1 lg:col-span-2">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Customer Profile (Option)</label>
                <select
                  name="customer_id"
                  value={formData.customer_id}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-100 rounded-lg text-black bg-gray-50 font-bold focus:border-black outline-none transition"
                >
                  <option value="">Walk-in Customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-2">
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-lg shadow-lg shadow-emerald-100 transition flex items-center justify-center gap-3 uppercase tracking-widest"
                >
                  Confirm & Finalize - Ksh {(medicines.find(m => m.id === parseInt(formData.medicine_id))?.selling_price || 0) * (Number(formData.quantity) || 0)}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Ledger Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Transaction Ledger</h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Find invoice..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-full text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-100 bg-gray-50">
                  <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Reference</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Detail</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Qty</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Settlement</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50 transition">
                    <td className="py-4 px-6">
                      <div className="font-bold text-black border-l-2 border-l-gold-500 pl-3">
                        {sale.transaction_date ? new Date(sale.transaction_date).toLocaleDateString() : 'N/A'}
                      </div>
                      <div className="text-[10px] text-gray-400 pl-3 uppercase">ID: {sale.id}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-navy-900">{sale.medicine_name}</div>
                      <div className="text-xs text-gray-400">By {sale.customer_name || 'Walk-in'} • {sale.payment_method}</div>
                    </td>
                    <td className="py-4 px-6 italic text-gray-500">{sale.quantity} units</td>
                    <td className="py-4 px-6 text-right">
                      <div className="font-serif font-bold text-black">Ksh {(sale.total_amount || 0).toLocaleString()}</div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleDelete(sale.id!)}
                        className="text-red-500 hover:text-red-700 transition font-bold text-xs uppercase tracking-widest"
                        title="Delete Sale"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modern Receipt Modal */}
      {showReceipt && receiptData && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full animate-in zoom-in duration-200">
            <div className="p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-navy-900 text-gold-500 rounded-full flex items-center justify-center mx-auto mb-4 font-serif font-bold text-2xl">E</div>
                <h3 className="font-serif font-bold text-xl uppercase tracking-tighter">Eagles' Pharmacy</h3>
                <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em]">Transaction Record</p>
              </div>

              <div className="space-y-4 border-y border-dashed py-6 mb-6">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400 uppercase font-bold">Transaction #:</span>
                  <span className="font-bold text-black">{receiptData.receipt_number}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400 uppercase font-bold">Client:</span>
                  <span className="font-bold text-black">{receiptData.customer_name}</span>
                </div>
                <div className="border-t border-gray-100 pt-3">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-bold">{receiptData.medicine_name}</span>
                    <span className="font-bold">Ksh {receiptData.total_amount.toFixed(2)}</span>
                  </div>
                  <div className="text-[10px] text-gray-400">{receiptData.quantity} Units × Ksh {receiptData.unit_price}</div>
                </div>
              </div>

              <div className="flex justify-between items-center mb-8">
                <span className="text-xs font-bold text-gray-400 uppercase">Paid Via {receiptData.payment_method}</span>
                <span className="text-2xl font-serif font-bold text-black">Ksh {receiptData.total_amount.toFixed(2)}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button onClick={handlePrint} className="bg-black text-white font-bold py-3 rounded-lg text-sm hover:bg-gray-800 transition">Print PDF</button>
                <button onClick={() => setShowReceipt(false)} className="bg-gray-100 text-black font-bold py-3 rounded-lg text-sm hover:bg-gray-200 transition">Return</button>
              </div>
            </div>
            <div className="bg-gray-50 py-3 text-center rounded-b-lg">
              <p className="text-[8px] text-gray-400 uppercase tracking-widest font-bold">Generated by Eagles' System • © 2026</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

