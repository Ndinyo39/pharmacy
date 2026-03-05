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
  const [outOfStockItems, setOutOfStockItems] = useState<any[]>([]);
  const [expiredItems, setExpiredItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sales, inventory, lowStock, outOfStock, expired] = await Promise.all([
          reportsAPI.getSalesSummary(),
          reportsAPI.getInventoryValue(),
          inventoryAPI.getLowStock(10),
          inventoryAPI.getOutOfStock(),
          inventoryAPI.getExpired(),
        ]);

        setSalesSummary(sales.data);
        setInventoryValue(inventory.data);
        setLowStockItems(lowStock.data);
        setOutOfStockItems(outOfStock.data);
        setExpiredItems(expired.data);
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

        {/* Alerts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Low Stock Alert */}
          <div className="bg-white rounded-classic shadow-card overflow-hidden h-fit">
            <div className="bg-amber-500 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">⚠️</span>
                <h2 className="text-xl font-serif font-bold text-white">Low Stock Alert</h2>
              </div>
              <span className="bg-white text-amber-600 text-xs font-bold px-3 py-1 rounded-full">
                {lowStockItems.length} Items
              </span>
            </div>

            <div className="p-4">
              {lowStockItems.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-2 px-3 text-gray-500">Name</th>
                        <th className="text-left py-2 px-3 text-gray-500">Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowStockItems.slice(0, 5).map((item) => (
                        <tr key={item.id} className="border-b border-gray-50">
                          <td className="py-2 px-3 font-medium text-gray-900">{item.name}</td>
                          <td className="py-2 px-3 text-amber-600 font-bold">{item.quantity} left</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center py-4 text-emerald-600 font-medium font-bold">✓ All stock levels healthy</p>
              )}
            </div>
          </div>

          {/* Out of Stock Alert */}
          <div className="bg-white rounded-classic shadow-card overflow-hidden h-fit">
            <div className="bg-red-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">🚨</span>
                <h2 className="text-xl font-serif font-bold text-white">Out of Stock</h2>
              </div>
              <span className="bg-white text-red-600 text-xs font-bold px-3 py-1 rounded-full">
                {outOfStockItems.length} Items
              </span>
            </div>

            <div className="p-4">
              {outOfStockItems.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-2 px-3 text-gray-500">Name</th>
                        <th className="text-left py-2 px-3 text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {outOfStockItems.slice(0, 5).map((item) => (
                        <tr key={item.id} className="border-b border-gray-50">
                          <td className="py-2 px-3 font-medium text-gray-900">{item.name}</td>
                          <td className="py-2 px-3 text-red-600 font-bold">REORDER NOW</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center py-4 text-emerald-600 font-medium font-bold">✓ No items out of stock</p>
              )}
            </div>
          </div>

          {/* Expired Items Alert */}
          {expiredItems.length > 0 && (
            <div className="bg-white rounded-classic shadow-card overflow-hidden h-fit col-span-1 lg:col-span-2">
              <div className="bg-purple-700 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">📅</span>
                  <h2 className="text-xl font-serif font-bold text-white">Expired Medicines</h2>
                </div>
                <span className="bg-white text-purple-700 text-xs font-bold px-3 py-1 rounded-full">
                  {expiredItems.length} Items
                </span>
              </div>

              <div className="p-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-2 px-3 text-gray-500">Medicine Name</th>
                        <th className="text-left py-2 px-3 text-gray-500">Expiry Date</th>
                        <th className="text-left py-2 px-3 text-gray-500">Batch #</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expiredItems.slice(0, 5).map((item) => (
                        <tr key={item.id} className="border-b border-gray-50">
                          <td className="py-2 px-3 font-medium text-gray-900">{item.name}</td>
                          <td className="py-2 px-3 text-purple-600 font-bold">
                            {new Date(item.expiry_date).toLocaleDateString()}
                          </td>
                          <td className="py-2 px-3 text-gray-500">{item.batch_number}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
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
