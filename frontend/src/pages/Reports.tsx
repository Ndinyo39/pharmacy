import React, { useEffect, useState } from 'react';
import { reportsAPI } from '../utils/api';

interface TopMedicine {
  id?: number;
  name: string;
  total_sold?: number;
  total_revenue?: number;
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
      <div className="p-8 bg-gray-100 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-black font-medium">Loading reports...</p>
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
              <h1 className="text-3xl font-bold text-black">📊 Reports & Analytics</h1>
              <p className="text-gray-600 mt-1">View sales performance and analytics</p>
            </div>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-black bg-white"
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
              <option value="365">Last Year</option>
            </select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-400 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold text-black">{formatCurrency(totalRevenue)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🧾</span>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Transactions</p>
                <p className="text-2xl font-bold text-black">{totalTransactions.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💊</span>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Top Medicine</p>
                <p className="text-xl font-bold text-black truncate">{topMedicines[0]?.name || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📅</span>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Avg. Daily Sales</p>
                <p className="text-2xl font-bold text-black">
                  {formatCurrency(dailySales.length > 0 ? totalRevenue / dailySales.length : 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Medicines */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-black mb-4">🏆 Top Selling Medicines</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black text-white">
                <tr>
                  <th className="text-left py-3 px-4 font-bold">Rank</th>
                  <th className="text-left py-3 px-4 font-bold">Medicine Name</th>
                  <th className="text-left py-3 px-4 font-bold">Units Sold</th>
                  <th className="text-left py-3 px-4 font-bold">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topMedicines.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500">No data available</td>
                  </tr>
                ) : (
                  topMedicines.map((medicine, index) => (
                    <tr key={medicine.id || index} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                          index === 0 ? 'bg-yellow-400 text-black' :
                          index === 1 ? 'bg-gray-300 text-black' :
                          index === 2 ? 'bg-amber-600 text-white' :
                          'bg-gray-100 text-black'
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-black">{medicine.name}</td>
                      <td className="py-3 px-4 text-gray-600">{medicine.total_sold || 0} units</td>
                      <td className="py-3 px-4 font-bold text-black">{formatCurrency(medicine.total_revenue)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Daily Sales */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-black mb-4">📈 Daily Sales Trend</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black text-white">
                <tr>
                  <th className="text-left py-3 px-4 font-bold">Date</th>
                  <th className="text-left py-3 px-4 font-bold">Transactions</th>
                  <th className="text-left py-3 px-4 font-bold">Daily Revenue</th>
                  <th className="text-left py-3 px-4 font-bold">Trend</th>
                </tr>
              </thead>
              <tbody>
                {dailySales.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500">No data available</td>
                  </tr>
                ) : (
                  dailySales.map((sale, index) => {
                    const avgRevenue = dailySales.length > 0 ? totalRevenue / dailySales.length : 0;
                    const isAboveAvg = (sale.daily_revenue || 0) > avgRevenue;
                    
                    return (
                      <tr key={sale.date || index} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-black">
                          {new Date(sale.date).toLocaleDateString('en-GB', { 
                            weekday: 'short', 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </td>
                        <td className="py-3 px-4 text-gray-600">{sale.transaction_count || 0}</td>
                        <td className="py-3 px-4 font-bold text-black">{formatCurrency(sale.daily_revenue)}</td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                            isAboveAvg ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {isAboveAvg ? '📈 Above Avg' : '📉 Below Avg'}
                          </span>
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
