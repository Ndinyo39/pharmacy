import React, { useEffect, useState } from 'react';
import { reportsAPI } from '../utils/api';

interface TopMedicine {
  id?: number;
  name: string;
  total_sold?: number;
  total_revenue?: number;
  total_profit?: number;
}

interface DailySales {
  date: string;
  transaction_count?: number;
  daily_revenue?: number;
}

export const Reports: React.FC = () => {
  const [topMedicines, setTopMedicines] = useState<TopMedicine[]>([]);
  const [dailySales, setDailySales] = useState<DailySales[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    try {
      const [topMed, daily, summary] = await Promise.all([
        reportsAPI.getTopMedicines(),
        reportsAPI.getDailySales(),
        reportsAPI.getSalesSummary(),
      ]);

      setTopMedicines(topMed.data || []);
      setDailySales(daily.data || []);
      setTotalRevenue(summary.data?.total_revenue || 0);
      setTotalTransactions(summary.data?.total_transactions || 0);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | undefined) => {
    return `Ksh ${(amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-navy-100 border-t-gold-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-navy-900 font-bold font-serif">Compiling Analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8 bg-white rounded-lg shadow-sm p-6 border-l-4 border-l-gold-500">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6">
            <div>
              <h1 className="text-3xl font-serif font-bold text-black uppercase tracking-tight">Reports & Analytics</h1>
              <p className="text-gray-600 mt-1">Strategic performance review for EAGLES' Pharmacy</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-gray-400 uppercase">Analysis Period:</span>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 border-2 border-gray-200 rounded-lg text-black bg-white font-bold focus:border-black outline-none transition"
              >
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
                <option value="90">Last 90 Days</option>
                <option value="365">Last Year</option>
              </select>
            </div>
          </div>
        </div>

        {/* Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: '💰', color: 'border-emerald-500' },
            { label: 'Transactions', value: totalTransactions.toLocaleString(), icon: '🧾', color: 'border-navy-500' },
            { label: 'Top Performing', value: topMedicines[0]?.name || 'N/A', icon: '🏆', color: 'border-gold-500' },
            { label: 'Avg. Daily Sales', value: formatCurrency(dailySales.length > 0 ? totalRevenue / dailySales.length : 0), icon: '📈', color: 'border-purple-500' }
          ].map((stat, i) => (
            <div key={i} className={`bg-white rounded-lg shadow-sm p-6 border-b-4 ${stat.color} hover:shadow-md transition`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{stat.icon}</span>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</span>
              </div>
              <p className="text-xl font-bold text-black truncate">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Medicines Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="bg-black px-6 py-4">
              <h2 className="text-xl font-serif font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>🏆</span> Top Selling Products
              </h2>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b-2 border-gray-100">
                      <th className="py-3 px-2 text-xs font-bold text-gray-400 uppercase tracking-widest">Rank</th>
                      <th className="py-3 px-2 text-xs font-bold text-gray-400 uppercase tracking-widest">Product</th>
                      <th className="py-3 px-2 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Revenue</th>
                      <th className="py-3 px-2 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Profit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {topMedicines.length === 0 ? (
                      <tr><td colSpan={3} className="py-8 text-center text-gray-400">No records found</td></tr>
                    ) : (
                      topMedicines.map((medicine, index) => (
                        <tr key={medicine.id || index} className="hover:bg-gray-50 transition">
                          <td className="py-4 px-2">
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold ${index === 0 ? 'bg-gold-500 text-black' : 'bg-gray-100 text-gray-500'
                              }`}>
                              {index + 1}
                            </span>
                          </td>
                          <td className="py-4 px-2 font-bold text-black">{medicine.name}</td>
                          <td className="py-4 px-2 text-right font-serif font-bold text-emerald-600">
                            {formatCurrency(medicine.total_revenue)}
                          </td>
                          <td className="py-4 px-2 text-right font-serif font-bold text-emerald-800">
                            {formatCurrency(medicine.total_profit)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Daily Trend Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="bg-navy-900 px-6 py-4">
              <h2 className="text-xl font-serif font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>📈</span> Performance Trend
              </h2>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b-2 border-gray-100">
                      <th className="py-3 px-2 text-xs font-bold text-gray-400 uppercase tracking-widest">Date</th>
                      <th className="py-3 px-2 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Daily Sales</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {dailySales.length === 0 ? (
                      <tr><td colSpan={2} className="py-8 text-center text-gray-400">No data projected</td></tr>
                    ) : (
                      dailySales.map((sale, index) => {
                        const avgRevenue = dailySales.length > 0 ? totalRevenue / dailySales.length : 0;
                        const isAboveAvg = (sale.daily_revenue || 0) > avgRevenue;

                        return (
                          <tr key={sale.date || index} className="hover:bg-gray-50 transition">
                            <td className="py-4 px-2 font-medium text-gray-900">
                              {new Date(sale.date).toLocaleDateString('en-KE', {
                                month: 'short', day: 'numeric', weekday: 'short'
                              })}
                            </td>
                            <td className="py-4 px-2 text-right">
                              <span className={`font-bold font-serif ${isAboveAvg ? 'text-black' : 'text-gray-400'}`}>
                                {formatCurrency(sale.daily_revenue)}
                              </span>
                              {isAboveAvg && <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-700 px-1 py-0.5 rounded font-bold uppercase">Peak</span>}
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
      </div>
    </div>
  );
};
