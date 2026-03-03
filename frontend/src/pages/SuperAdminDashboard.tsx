import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

interface StatCard {
  label: string;
  value: number | string;
  icon: string;
  color: string;
}

export const SuperAdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dailySales, setDailySales] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const response = await api.get('/superadmin/dashboard-stats');
        setStats(response.data || {});
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchDaily = async () => {
      try {
        const resp = await api.get('/reports/daily-sales');
        setDailySales((resp.data || []).reverse());
      } catch (err) {
        console.error('Error fetching daily sales', err);
      }
    };

    fetchStats();
    fetchDaily();
  }, []);

  const formatCurrency = (amount: number | undefined) => {
    return `Ksh ${(amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const statCards: StatCard[] = [
    {
      label: 'Total Pharmacies',
      value: stats?.total_pharmacies || 0,
      icon: '🏥',
      color: 'bg-gray-900',
    },
    {
      label: 'Total Branches',
      value: stats?.total_branches || 0,
      icon: '🏪',
      color: 'bg-gray-700',
    },
    {
      label: 'Total Users',
      value: stats?.total_users || 0,
      icon: '👥',
      color: 'bg-blue-600',
    },
    {
      label: 'Total Products',
      value: stats?.total_products || 0,
      icon: '💊',
      color: 'bg-green-600',
    },
    {
      label: 'Total Suppliers',
      value: stats?.total_suppliers || 0,
      icon: '🚚',
      color: 'bg-orange-500',
    },
    {
      label: 'Total Customers',
      value: stats?.total_customers || 0,
      icon: '🛒',
      color: 'bg-purple-600',
    },
    {
      label: "Today's Sales",
      value: formatCurrency(stats?.today_sales),
      icon: '💰',
      color: 'bg-yellow-500',
    },
    {
      label: 'Monthly Sales',
      value: formatCurrency(stats?.monthly_sales),
      icon: '📈',
      color: 'bg-indigo-600',
    },
    {
      label: 'Low Stock Items',
      value: stats?.low_stock_items || 0,
      icon: '⚠️',
      color: 'bg-yellow-600',
    },
    {
      label: 'Expiring Soon',
      value: stats?.expiring_soon || 0,
      icon: '⏰',
      color: 'bg-red-500',
    },
    {
      label: 'Out of Stock',
      value: stats?.out_of_stock || 0,
      icon: '❌',
      color: 'bg-red-700',
    },
    {
      label: 'Total Prescriptions',
      value: stats?.total_prescriptions || 0,
      icon: '📋',
      color: 'bg-teal-600',
    },
  ];

  const filteredStats = statCards.filter(card =>
    card.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-8 bg-gray-100 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-black font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <img src="/logo.svg" alt="Logo" className="h-16 w-16" />
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-black">Super Admin Dashboard</h1>
              <p className="text-gray-600">Complete system overview and analytics</p>
            </div>
          </div>
          
          {/* Search */}
          <div className="mt-4">
            <input
              type="text"
              placeholder="🔍 Search statistics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-black bg-gray-50"
            />
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
          {filteredStats.map((card, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${card.color}`}>
                  <span className="text-lg">{card.icon}</span>
                </div>
                <h3 className="text-gray-600 font-medium text-sm">{card.label}</h3>
              </div>
              <p className="text-2xl font-bold text-black">{card.value}</p>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Revenue Chart */}
          {dailySales.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-black mb-4">📈 Revenue Trend (Last 30 Days)</h2>
              <Line
                data={{
                  labels: dailySales.map((d) => d.date ? new Date(d.date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }) : ''),
                  datasets: [
                    {
                      label: 'Daily Revenue',
                      data: dailySales.map((d) => d.daily_revenue || 0),
                      fill: true,
                      backgroundColor: 'rgba(234, 179, 8, 0.2)',
                      borderColor: '#000000',
                      tension: 0.3,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { display: true, title: { display: true, text: 'Date' } },
                    y: { display: true, title: { display: true, text: 'Revenue (Ksh)' } },
                  },
                }}
              />
            </div>
          )}

          {/* Financial Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-black mb-4">💰 Financial Summary</h2>
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 rounded-lg flex justify-between items-center">
                <div>
                  <p className="text-yellow-700 font-medium">Today's Sales</p>
                  <p className="text-2xl font-bold text-black">{formatCurrency(stats?.today_sales)}</p>
                </div>
                <span className="text-3xl">💵</span>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg flex justify-between items-center">
                <div>
                  <p className="text-gray-700 font-medium">Monthly Sales</p>
                  <p className="text-2xl font-bold text-black">{formatCurrency(stats?.monthly_sales)}</p>
                </div>
                <span className="text-3xl">📈</span>
              </div>
              <div className="p-4 bg-green-50 rounded-lg flex justify-between items-center">
                <div>
                  <p className="text-green-700 font-medium">Total Revenue</p>
                  <p className="text-2xl font-bold text-black">{formatCurrency(stats?.total_revenue)}</p>
                </div>
                <span className="text-3xl">💰</span>
              </div>
            </div>
          </div>
        </div>

        {/* System Alerts */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-black mb-4">🚨 System Alerts</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">❌</span>
                <p className="font-bold text-red-800 text-lg">{stats?.out_of_stock || 0}</p>
              </div>
              <p className="text-red-600 font-medium">Out of Stock</p>
              <p className="text-sm text-red-500">Require immediate reorder</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">⏰</span>
                <p className="font-bold text-yellow-800 text-lg">{stats?.expiring_soon || 0}</p>
              </div>
              <p className="text-yellow-700 font-medium">Expiring Soon</p>
              <p className="text-sm text-yellow-600">Within next 7 days</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">⚠️</span>
                <p className="font-bold text-orange-800 text-lg">{stats?.low_stock_items || 0}</p>
              </div>
              <p className="text-orange-700 font-medium">Low Stock Items</p>
              <p className="text-sm text-orange-600">Quantity ≤ 5 units</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
