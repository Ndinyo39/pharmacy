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
    quantity: 1,
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
      [name]: name === 'quantity' ? parseInt(value) || 1 : value,
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

    if ((selectedMedicine.quantity || 0) < formData.quantity) {
      alert(`Not enough stock! Only ${selectedMedicine.quantity} available`);
      return;
    }

    try {
      await salesAPI.create({
        customer_id: formData.customer_id ? parseInt(formData.customer_id) : undefined,
        medicine_id: parseInt(formData.medicine_id),
        quantity: formData.quantity,
        unit_price: Number(selectedMedicine.selling_price) || 0,
        payment_method: formData.payment_method,
      });

      // Store sale data for receipt
      const saleData: ReceiptData = {
        medicine_name: selectedMedicine.name || 'Unknown',
        quantity: formData.quantity,
        unit_price: selectedMedicine.selling_price || 0,
        total_amount: (selectedMedicine.selling_price || 0) * formData.quantity,
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

  const resetForm = () => {
    setFormData({
      customer_id: '',
      medicine_id: '',
      quantity: 1,
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
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; }
            .info { margin-bottom: 20px; }
            .info p { margin: 5px 0; }
            .items { margin-bottom: 20px; }
            .item { display: flex; justify-content: space-between; }
            .total { font-size: 20px; font-weight: bold; border-top: 2px solid #000; padding-top: 10px; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
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

  const totalSales = filteredSales.reduce((sum, s) => sum + (s.total_amount || 0), 0);

  if (loading) {
    return (
      <div className="p-8 bg-gray-100 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-black font-medium">Loading sales...</p>
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
              <h1 className="text-3xl font-bold text-black">💰 Sales Transactions</h1>
              <p className="text-gray-600 mt-1">{sales.length} transactions | Total: Ksh {totalSales.toLocaleString()}</p>
            </div>
            <button
              onClick={() => {
                setShowForm(!showForm);
                if (showForm) resetForm();
              }}
              className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-bold shadow transition"
            >
              {showForm ? '✕ Cancel' : '+ New Sale'}
            </button>
          </div>

          {/* Search */}
          <div className="mt-4">
            <input
              type="text"
              placeholder="🔍 Search sales..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-black bg-gray-50"
            />
          </div>
        </div>

        {/* New Sale Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-black mb-4">🧾 Record New Sale</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-black font-bold mb-2 text-sm">
                  Customer (Optional)
                </label>
                <select
                  name="customer_id"
                  value={formData.customer_id}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black bg-white"
                >
                  <option value="">Walk-in Customer</option>
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black bg-white"
                >
                  <option value="">Select a medicine</option>
                  {medicines.map((medicine) => (
                    <option key={medicine.id} value={medicine.id}>
                      {medicine.name} - Ksh {medicine.selling_price} (Stock: {medicine.quantity})
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
                />
              </div>

              <div>
                <label className="block text-black font-bold mb-2 text-sm">
                  Payment Method
                </label>
                <select
                  name="payment_method"
                  value={formData.payment_method}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black bg-white"
                >
                  <option value="cash">💵 Cash</option>
                  <option value="card">💳 Card</option>
                  <option value="online">📱 Online</option>
                  <option value="cheque">📝 Cheque</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition w-full"
                >
                  ✓ Complete Sale - Ksh {medicines.find(m => m.id === parseInt(formData.medicine_id)) 
                    ? ((medicines.find(m => m.id === parseInt(formData.medicine_id))?.selling_price || 0) * formData.quantity).toFixed(2)
                    : '0.00'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Sales Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredSales.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 text-lg">No sales found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-black text-white">
                  <tr>
                    <th className="text-left py-3 px-4 font-bold">Date</th>
                    <th className="text-left py-3 px-4 font-bold">Customer</th>
                    <th className="text-left py-3 px-4 font-bold">Medicine</th>
                    <th className="text-left py-3 px-4 font-bold">Qty</th>
                    <th className="text-left py-3 px-4 font-bold">Price</th>
                    <th className="text-left py-3 px-4 font-bold">Total</th>
                    <th className="text-left py-3 px-4 font-bold">Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.map((sale) => (
                    <tr key={sale.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-black">
                        {sale.transaction_date ? new Date(sale.transaction_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-gray-700">{sale.customer_name || 'Walk-in'}</td>
                      <td className="py-3 px-4 font-medium text-black">{sale.medicine_name}</td>
                      <td className="py-3 px-4 text-black">{sale.quantity}</td>
                      <td className="py-3 px-4 text-gray-600">Ksh {(sale.unit_price || 0).toFixed(2)}</td>
                      <td className="py-3 px-4 font-bold text-black">Ksh {(sale.total_amount || 0).toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <span className="px-3 py-1 bg-gray-200 rounded-full text-sm font-medium text-black capitalize">
                          {sale.payment_method}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Receipt Modal */}
        {showReceipt && receiptData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4">
              {/* Receipt Header */}
              <div className="bg-black text-white p-4 rounded-t-lg">
                <div className="text-center">
                  <h2 className="text-2xl font-bold">🧾 RECEIPT</h2>
                  <p className="text-sm">EAGLES' Pharmacy</p>
                  <p className="text-xs">Nairobi, Kenya</p>
                  <p className="text-xs mt-1">Receipt: {receiptData.receipt_number}</p>
                </div>
              </div>

              {/* Receipt Body - Printable Area */}
              <div ref={receiptRef} className="p-6">
                <div className="border-b border-gray-300 pb-4 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Date:</span>
                    <span>{new Date(receiptData.transaction_date).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Customer:</span>
                    <span>{receiptData.customer_name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Payment:</span>
                    <span className="font-semibold uppercase">{receiptData.payment_method}</span>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="border-b pb-2">
                    <p className="font-semibold">{receiptData.medicine_name}</p>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{receiptData.quantity} × Ksh {receiptData.unit_price.toFixed(2)}</span>
                      <span>Ksh {receiptData.total_amount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t-2 border-black pt-4 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold">TOTAL</span>
                    <span className="text-2xl font-bold text-green-600">Ksh {receiptData.total_amount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="text-center text-sm text-gray-500">
                  <p>Thank you for choosing</p>
                  <p className="font-semibold">EAGLES' Pharmacy!</p>
                  <p className="mt-2">Please come again</p>
                </div>
              </div>

              {/* Receipt Actions */}
              <div className="p-4 bg-gray-100 rounded-b-lg flex gap-2">
                <button
                  onClick={handlePrint}
                  className="flex-1 bg-black hover:bg-gray-800 text-white font-bold py-3 px-4 rounded transition flex items-center justify-center gap-2"
                >
                  🖨️ Print Receipt
                </button>
                <button
                  onClick={() => setShowReceipt(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-black font-bold py-3 px-4 rounded transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
