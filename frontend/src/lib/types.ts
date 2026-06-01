export interface User {
  id: number;
  email: string;
  name: string;
}

export interface Category {
  id: number;
  name: string;
  icon: string;
  monthlyLimit: number | null;
  userId: number;
  createdAt: string;
  updatedAt: string;
  _count?: { transactions: number };
  currentMonthSpending?: number;
  isOverLimit?: boolean;
}

export interface Transaction {
  id: number;
  type: 'income' | 'expense';
  amount: number;
  comment: string | null;
  date: string;
  categoryId: number;
  userId: number;
  category: { id: number; name: string; icon: string };
  createdAt: string;
  updatedAt: string;
}

export interface TransactionFormData {
  type: 'income' | 'expense';
  amount: number;
  categoryId: number;
  date: string;
  comment: string | null;
}

export interface CategoryFormData {
  name: string;
  icon: string;
}

export interface BalanceData {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export interface ExpenseByCategory {
  categoryId: number;
  categoryName: string;
  categoryIcon: string;
  amount: number;
}

export interface IncomeExpenseTrend {
  month: string;
  income: number;
  expense: number;
}

export interface LimitStatus {
  categoryId: number;
  categoryName: string;
  categoryIcon: string;
  monthlyLimit: number | null;
  spent: number;
  remaining: number;
  isOverLimit: boolean;
  percentage: number;
}

export interface PaginatedResponse<T> {
  transactions: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface AuthResponse {
  token: string;
  user: User;
}
