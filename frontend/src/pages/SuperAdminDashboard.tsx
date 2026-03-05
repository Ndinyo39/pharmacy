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
    return `Ksh ${(amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const statCards: StatCard[] = [
    { label: 'Network Pharmacies', value: stats?.total_pharmacies || 0, icon: '🏢', color: 'bg-navy-900' },
    { label: 'Total Branches', value: stats?.total_branches || 0, icon: '📍', color: 'bg-navy-700' },
    { label: 'Authorized Users', value: stats?.total_users || 0, icon: '👥', color: 'bg-gold-600' },
    { label: 'Pharmaceutical Base', value: stats?.total_products || 0, icon: '💊', color: 'bg-emerald-600' },
    { label: 'Total Suppliers', value: stats?.total_suppliers || 0, icon: '🚚', color: 'bg-amber-600' },
    { label: 'Patient Registry', value: stats?.total_customers || 0, icon: '👤', color: 'bg-indigo-600' },
    { label: "Today's Revenue", value: formatCurrency(stats?.today_sales), icon: '💰', color: 'bg-emerald-700' },
    { label: 'Monthly Growth', value: formatCurrency(stats?.monthly_sales), icon: '📈', color: 'bg-blue-700' },
    { label: 'Critical Stock', value: stats?.low_stock_items || 0, icon: '⚠️', color: 'bg-amber-700' },
    { label: 'Expiring 7D', value: stats?.expiring_soon || 0, icon: '⏳', color: 'bg-red-600' },
    { label: 'Deficit Inventory', value: stats?.out_of_stock || 0, icon: '🚫', color: 'bg-red-900' },
    { label: 'Total Prescriptions', value: stats?.total_prescriptions || 0, icon: '📄', color: 'bg-cyan-700' },
  ];

  const filteredStats = statCards.filter(card =>
    card.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-navy-100 border-t-gold-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-navy-900 font-serif font-bold tracking-widest uppercase text-xs">Aggregating Global Intel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Supreme Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8 border-l-4 border-l-navy-900 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-navy-900 rounded-xl flex items-center justify-center shadow-lg border-2 border-gold-500">
              <img src="/logo.jpeg" alt="Eagles" className="w-12 h-12 rounded-lg" />
            </div>
            <div>
              <h1 className="text-3xl font-serif font-black text-black uppercase tracking-tighter">Enterprise Command Center</h1>
              <p className="text-gray-400 font-medium">Global Administrative Surveillance & Neural Analytics</p>
            </div>
          </div>
          <div className="w-full md:w-72">
            <div className="flex items-center bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-1 focus-within:border-black transition">
              <span className="text-gray-400">🔍</span>
              <input
                type="text"
                placeholder="Filter Intel..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-3 bg-transparent text-black font-bold outline-none placeholder:text-gray-300 placeholder:font-normal text-sm"
              />
            </div>
          </div>
        </div>

        {/* Global Matrix Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {filteredStats.map((card, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm hover:shadow-md transition border border-gray-100 p-6 group">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition duration-300 ${card.color}`}>
                  <span className="text-lg">{card.icon}</span>
                </div>
                <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">Global Stat</span>
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{card.label}</p>
              <h3 className="text-2xl font-serif font-black text-navy-900 group-hover:text-gold-600 transition">{card.value}</h3>
            </div>
          ))}
        </div>

        {/* Neural Visualizations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-serif font-black text-black uppercase tracking-widest">Revenue Trajectory</h2>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm border border-emerald-100">Live Stream Data</span>
            </div>
            <div className="h-[350px]">
              <Line
                data={{
                  labels: dailySales.map((d) => d.date ? new Date(d.date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }) : ''),
                  datasets: [
                    {
                      label: 'Enterprise Revenue',
                      data: dailySales.map((d) => d.daily_revenue || 0),
                      fill: true,
                      backgroundColor: 'rgba(184, 134, 11, 0.05)',
                      borderColor: '#B8860B',
                      borderWidth: 3,
                      pointBackgroundColor: '#000080',
                      pointBorderColor: '#FFF',
                      pointRadius: 4,
                      tension: 0.4,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { grid: { display: false }, ticks: { font: { weight: 'bold', size: 10 } } },
                    y: { grid: { color: '#F8F9FA' }, ticks: { font: { weight: 'bold', size: 10 } } },
                  },
                }}
              />
            </div>
          </div>

          <div className="bg-navy-900 rounded-2xl shadow-2xl p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gold-500 rounded-full -mr-20 -mt-20 opacity-10"></div>
            <h2 className="text-xl font-serif font-black text-gold-500 uppercase tracking-widest mb-8">Financial Protocol</h2>
            <div className="space-y-6 relative z-10">
              <div className="p-6 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition">
                <p className="text-[10px] font-black text-gold-500 uppercase tracking-[0.2em] mb-2">Today's Settlement</p>
                <p className="text-3xl font-serif font-black">{formatCurrency(stats?.today_sales)}</p>
              </div>
              <div className="p-6 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition">
                <p className="text-[10px] font-black text-gold-500 uppercase tracking-[0.2em] mb-2">Monthly Aggregate</p>
                <p className="text-3xl font-serif font-black">{formatCurrency(stats?.monthly_sales)}</p>
              </div>
              <div className="p-6 bg-gold-500 rounded-xl shadow-lg border-2 border-white/20 hover:scale-105 transition">
                <p className="text-[10px] font-black text-navy-900 uppercase tracking-[0.2em] mb-2">Global Gross Volume</p>
                <p className="text-3xl font-serif font-black text-navy-900">{formatCurrency(stats?.total_revenue)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Priority Intelligence Alerts */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-serif font-black text-black uppercase tracking-widest flex items-center gap-3">
              <span className="w-1.5 h-6 bg-red-600 rounded-full block"></span>
              System Vulnerabilities
            </h2>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest underline decoration-gold-500 underline-offset-4 cursor-pointer">View All Logs</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group p-6 bg-gray-50 rounded-2xl border-2 border-transparent hover:border-red-600 transition duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center text-2xl shadow-inner">🚫</div>
                <span className="text-4xl font-serif font-black text-red-600/20 group-hover:text-red-600/40 transition">01</span>
              </div>
              <p className="text-sm font-black text-black uppercase tracking-widest mb-1">Stock Deficit</p>
              <div className="text-3xl font-serif font-black text-red-600">{stats?.out_of_stock || 0}</div>
              <p className="text-[10px] text-gray-400 mt-2 font-medium uppercase truncate">Products currently unavailable across network</p>
            </div>

            <div className="group p-6 bg-gray-50 rounded-2xl border-2 border-transparent hover:border-amber-500 transition duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center text-2xl shadow-inner">⌛</div>
                <span className="text-4xl font-serif font-black text-amber-600/20 group-hover:text-amber-600/40 transition">02</span>
              </div>
              <p className="text-sm font-black text-black uppercase tracking-widest mb-1">Near Expiry</p>
              <div className="text-3xl font-serif font-black text-amber-600">{stats?.expiring_soon || 0}</div>
              <p className="text-[10px] text-gray-400 mt-2 font-medium uppercase">Batch integrity critical within 7 days</p>
            </div>

            <div className="group p-6 bg-gray-50 rounded-2xl border-2 border-transparent hover:border-navy-900 transition duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-navy-100 text-navy-900 rounded-xl flex items-center justify-center text-2xl shadow-inner">📉</div>
                <span className="text-4xl font-serif font-black text-navy-900/20 group-hover:text-navy-900/40 transition">03</span>
              </div>
              <p className="text-sm font-black text-black uppercase tracking-widest mb-1">Low Reserves</p>
              <div className="text-3xl font-serif font-black text-navy-900">{stats?.low_stock_items || 0}</div>
              <p className="text-[10px] text-gray-400 mt-2 font-medium uppercase">Inventory below the critical 15-unit threshold</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
