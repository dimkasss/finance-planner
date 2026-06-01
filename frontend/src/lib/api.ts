import {
  AuthResponse,
  BalanceData,
  Category,
  ExpenseByCategory,
  IncomeExpenseTrend,
  LimitStatus,
  PaginatedResponse,
  Transaction,
  TransactionFormData,
  CategoryFormData,
} from './types';

const API_BASE = '/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Ошибка сервера' }));
    throw new Error(data.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// Auth
export const authApi = {
  register: (data: { email: string; name: string; password: string }) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  me: () => request<{ user: { id: number; email: string; name: string } }>('/auth/me'),
};

// Categories
export const categoriesApi = {
  getAll: () => request<Category[]>('/categories'),

  create: (data: CategoryFormData) =>
    request<Category>('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: CategoryFormData) =>
    request<Category>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  setLimit: (id: number, monthlyLimit: number | null) =>
    request<Category>(`/categories/${id}/limit`, {
      method: 'PUT',
      body: JSON.stringify({ monthlyLimit }),
    }),

  delete: (id: number) =>
    request<{ message: string }>(`/categories/${id}`, {
      method: 'DELETE',
    }),
};

// Transactions
export const transactionsApi = {
  getAll: (params?: {
    type?: string;
    categoryId?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.set('type', params.type);
    if (params?.categoryId) searchParams.set('categoryId', params.categoryId);
    if (params?.dateFrom) searchParams.set('dateFrom', params.dateFrom);
    if (params?.dateTo) searchParams.set('dateTo', params.dateTo);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));

    const qs = searchParams.toString();
    return request<PaginatedResponse<Transaction>>(
      `/transactions${qs ? `?${qs}` : ''}`
    );
  },

  getBalance: () => request<BalanceData>('/transactions/balance'),

  create: (data: TransactionFormData) =>
    request<Transaction>('/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: TransactionFormData) =>
    request<Transaction>(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    request<{ message: string }>(`/transactions/${id}`, {
      method: 'DELETE',
    }),
};

// Analytics
export const analyticsApi = {
  expensesByCategory: (period: string = 'month') =>
    request<ExpenseByCategory[]>(`/analytics/expenses-by-category?period=${period}`),

  incomeExpenseTrend: (months: number = 6) =>
    request<IncomeExpenseTrend[]>(`/analytics/income-expense-trend?months=${months}`),

  limitsStatus: () => request<LimitStatus[]>('/analytics/limits-status'),
};
