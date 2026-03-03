import React, { useEffect, useState } from 'react';
import { reportsAPI, inventoryAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';

interface SalesSummary {
  total_transactions: number;
  total_revenue: number;
  average_transaction: number;
  highest_transaction: number;
}

interface InventoryValue {
  total_items: number;
  total_quantity: number;
  total_purchase_value: number;
  total_selling_value: number;
}

interface LowStockItem {
  id: number;
  name: string;
  quantity: number;
}

// Metric Card Component - declared outside to avoid re-creation
interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtitle, trend }) => {
  const trendColors = {
    up: 'text-emerald-600',
    down: 'text-crimson-600',
    neutral: 'text-navy-600',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 border-t-4 border-t-yellow-500">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-navy-500 text-sm font-medium uppercase tracking-wide">{title}</p>
          <p className="text-3xl font-bold text-navy-900 mt-2 font-serif">{value}</p>
          {subtitle && (
            <p className={`text-sm mt-1 ${trend ? trendColors[trend] : 'text-navy-400'}`}>
              {subtitle}
            </p>
          )}
        </div>
        <div className="w-12 h-12 bg-navy-50 rounded-full flex items-center justify-center">
          <div className="w-3 h-3 bg-gold-500 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null);
  const [inventoryValue, setInventoryValue] = useState<InventoryValue | null>(null);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sales, inventory, lowStock] = await Promise.all([
          reportsAPI.getSalesSummary(),
          reportsAPI.getInventoryValue(),
          inventoryAPI.getLowStock(10),
        ]);

        setSalesSummary(sales.data);
        setInventoryValue(inventory.data);
        setLowStockItems(lowStock.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-navy-200 border-t-gold-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-navy-600 font-medium">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 bg-white rounded-classic shadow-card p-6 border-l-4 border-l-gold-500">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-serif font-bold text-black">Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome back, {user?.name}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-navy-400">{new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Transactions"
            value={salesSummary?.total_transactions || 0}
            subtitle="Sales processed"
          />
          <MetricCard
            title="Total Revenue"
            value={`Ksh ${(salesSummary?.total_revenue || 0).toLocaleString()}`}
            subtitle="All time earnings"
          />
          <MetricCard
            title="Total Items"
            value={inventoryValue?.total_items || 0}
            subtitle={`${inventoryValue?.total_quantity || 0} units in stock`}
          />
          <MetricCard
            title="Inventory Value"
            value={`Ksh ${(inventoryValue?.total_selling_value || 0).toLocaleString()}`}
            subtitle="Current stock value"
          />
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white rounded-classic shadow-card overflow-hidden">
          <div className="bg-navy-900 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gold-500 rounded-full flex items-center justify-center">
                <span className="text-navy-900 font-bold">!</span>
              </div>
              <h2 className="text-xl font-serif font-bold text-white">Low Stock Alert</h2>
            </div>
            <span className="bg-crimson-500 text-white text-xs font-medium px-3 py-1 rounded-full">
              {lowStockItems.length} Items
            </span>
          </div>
          
          <div className="p-6">
            {lowStockItems.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-navy-100">
                      <th className="text-left py-3 px-4 font-semibold text-navy-700 text-sm uppercase tracking-wide">
                        Medicine Name
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-navy-700 text-sm uppercase tracking-wide">
                        Current Stock
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-navy-700 text-sm uppercase tracking-wide">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockItems.map((item) => (
                      <tr key={item.id} className="border-b border-navy-100 hover:bg-navy-50 transition-colors duration-150">
                        <td className="py-4 px-4 font-medium text-navy-900">{item.name}</td>
                        <td className="py-4 px-4">
                          <span className="font-semibold text-crimson-600">
                            {item.quantity} units
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide">
                            Low Stock
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-emerald-600 text-2xl">✓</span>
                </div>
                <p className="text-navy-700 font-medium text-lg">All medicines are well stocked!</p>
                <p className="text-navy-400 text-sm mt-1">No items require immediate attention</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats Footer */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-classic shadow-card p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <span className="text-emerald-600">↑</span>
            </div>
            <div>
              <p className="text-sm text-navy-500">Average Transaction</p>
              <p className="text-lg font-bold text-navy-900">Ksh {(salesSummary?.average_transaction || 0).toFixed(2)}</p>
            </div>
          </div>
          <div className="bg-white rounded-classic shadow-card p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-gold-100 rounded-full flex items-center justify-center">
              <span className="text-gold-600">★</span>
            </div>
            <div>
              <p className="text-sm text-navy-500">Highest Sale</p>
              <p className="text-lg font-bold text-navy-900">Ksh {(salesSummary?.highest_transaction || 0).toFixed(2)}</p>
            </div>
          </div>
          <div className="bg-white rounded-classic shadow-card p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-navy-100 rounded-full flex items-center justify-center">
              <span className="text-navy-600">Ksh</span>
            </div>
            <div>
              <p className="text-sm text-navy-500">Purchase Value</p>
              <p className="text-lg font-bold text-navy-900">Ksh {(inventoryValue?.total_purchase_value || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
