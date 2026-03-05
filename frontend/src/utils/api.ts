import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Type definitions
export interface Medicine {
  id?: number;
  name: string;
  generic_name?: string;
  batch_number?: string;
  barcode?: string;
  purchase_price?: number;
  selling_price: number;
  quantity: number;
  expiry_date?: string;
}

export interface Customer {
  id?: number;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  city?: string;
  loyalty_points?: number;
}

export interface Supplier {
  id?: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  company_name: string;
}

export interface Sale {
  customer_id?: number;
  medicine_id: number;
  quantity: number;
  unit_price: number;
  payment_method?: string;
}

export interface Prescription {
  id?: number;
  customer_id: number;
  medicine_id: number;
  quantity: number;
  prescribed_by?: string;
  prescription_date?: string;
  expiry_date?: string;
  notes?: string;
  status?: string;
  customer_name?: string;
  medicine_name?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: string;
}

// Auth APIs
export const authAPI = {
  register: (data: RegisterData) => api.post('/register', data),
  login: (data: LoginCredentials) => api.post('/login', data),
};

// Medicine APIs
export const medicineAPI = {
  getAll: () => api.get<Medicine[]>('/medicines'),
  getById: (id: number) => api.get<Medicine>(`/medicines/${id}`),
  create: (data: Omit<Medicine, 'id'>) => api.post('/medicines', data),
  update: (id: number, data: Partial<Medicine>) => api.put(`/medicines/${id}`, data),
  delete: (id: number) => api.delete(`/medicines/${id}`),
};

// Customer APIs
export const customerAPI = {
  getAll: () => api.get<Customer[]>('/customers'),
  getById: (id: number) => api.get<Customer>(`/customers/${id}`),
  create: (data: Omit<Customer, 'id'>) => api.post('/customers', data),
  update: (id: number, data: Partial<Customer>) => api.put(`/customers/${id}`, data),
  delete: (id: number) => api.delete(`/customers/${id}`),
};

// Supplier APIs
export const supplierAPI = {
  getAll: () => api.get<Supplier[]>('/suppliers'),
  getById: (id: number) => api.get<Supplier>(`/suppliers/${id}`),
  create: (data: Omit<Supplier, 'id'>) => api.post('/suppliers', data),
  update: (id: number, data: Partial<Supplier>) => api.put(`/suppliers/${id}`, data),
  delete: (id: number) => api.delete(`/suppliers/${id}`),
};

// Sales APIs
export const salesAPI = {
  getAll: () => api.get('/sales'),
  getByCustomer: (customerId: number) => api.get(`/sales/customer/${customerId}`),
  create: (data: Sale) => api.post('/sales', data),
  delete: (id: number) => api.delete(`/sales/${id}`),
};


// Prescription APIs
export const prescriptionAPI = {
  getAll: () => api.get<Prescription[]>('/prescriptions'),
  getByCustomer: (customerId: number) => api.get<Prescription[]>(`/prescriptions/customer/${customerId}`),
  create: (data: Omit<Prescription, 'id'>) => api.post('/prescriptions', data),
  update: (id: number, data: Partial<Prescription>) => api.put(`/prescriptions/${id}`, data),
  delete: (id: number) => api.delete(`/prescriptions/${id}`),
};

// Inventory APIs
export const inventoryAPI = {
  getLowStock: (threshold?: number) =>
    api.get('/inventory/low-stock', { params: { threshold } }),
  getOutOfStock: () => api.get('/inventory/out-of-stock'),
  getExpired: () => api.get('/inventory/expired'),
};

// Reports APIs
export const reportsAPI = {
  getSalesSummary: () => api.get('/reports/sales-summary'),
  getTopMedicines: () => api.get('/reports/top-medicines'),
  getDailySales: () => api.get('/reports/daily-sales'),
  getInventoryValue: () => api.get('/reports/inventory-value'),
};

// Dashboard API
export const dashboardAPI = {
  getDashboard: () => api.get('/dashboard'),
};

export default api;
