'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Alert,
  AlertTitle,
  Chip,
  LinearProgress,
  Skeleton,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import WarningIcon from '@mui/icons-material/Warning';
import AppLayout from '@/components/AppLayout';
import AuthGuard from '@/components/AuthGuard';
import { transactionsApi, analyticsApi } from '@/lib/api';
import { BalanceData, LimitStatus, Transaction } from '@/lib/types';

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
  }).format(amount);
}

function DashboardContent() {
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [limits, setLimits] = useState<LimitStatus[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [balanceData, limitsData, transData] = await Promise.all([
        transactionsApi.getBalance(),
        analyticsApi.limitsStatus(),
        transactionsApi.getAll({ limit: 5 }),
      ]);
      setBalance(balanceData);
      setLimits(limitsData);
      setRecentTransactions(transData.transactions);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const overLimitCategories = limits.filter((l) => l.isOverLimit);

  if (loading) {
    return (
      <Box>
        <Grid container spacing={3}>
          {[1, 2, 3].map((i) => (
            <Grid item xs={12} md={4} key={i}>
              <Skeleton variant="rounded" height={140} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      {/* Limit warnings */}
      {overLimitCategories.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }} icon={<WarningIcon />}>
          <AlertTitle>Превышение лимитов</AlertTitle>
          {overLimitCategories.map((l) => (
            <Typography key={l.categoryId} variant="body2">
              <strong>{l.categoryName}</strong>: потрачено{' '}
              {formatMoney(l.spent)} из {formatMoney(l.monthlyLimit || 0)} (
              {l.percentage}%)
            </Typography>
          ))}
        </Alert>
      )}

      {/* Balance cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <AccountBalanceIcon sx={{ color: 'primary.main', mr: 1 }} />
                <Typography color="text.secondary" variant="body2">
                  Баланс
                </Typography>
              </Box>
              <Typography
                variant="h4"
                color={
                  (balance?.balance || 0) >= 0 ? 'success.main' : 'error.main'
                }
              >
                {formatMoney(balance?.balance || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <TrendingUpIcon sx={{ color: 'success.main', mr: 1 }} />
                <Typography color="text.secondary" variant="body2">
                  Доходы
                </Typography>
              </Box>
              <Typography variant="h4" color="success.main">
                {formatMoney(balance?.totalIncome || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <TrendingDownIcon sx={{ color: 'error.main', mr: 1 }} />
                <Typography color="text.secondary" variant="body2">
                  Расходы
                </Typography>
              </Box>
              <Typography variant="h4" color="error.main">
                {formatMoney(balance?.totalExpense || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Limits progress */}
      {limits.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" mb={2}>
              Лимиты по категориям
            </Typography>
            {limits.map((limit) => (
              <Box key={limit.categoryId} mb={2}>
                <Box display="flex" justifyContent="space-between" mb={0.5}>
                  <Typography variant="body2">
                    {limit.categoryName}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body2" color="text.secondary">
                      {formatMoney(limit.spent)} / {formatMoney(limit.monthlyLimit || 0)}
                    </Typography>
                    {limit.isOverLimit && (
                      <Chip
                        label="Превышен"
                        color="error"
                        size="small"
                      />
                    )}
                  </Box>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(limit.percentage, 100)}
                  color={
                    limit.percentage > 100
                      ? 'error'
                      : limit.percentage > 80
                      ? 'warning'
                      : 'primary'
                  }
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent transactions */}
      <Card>
        <CardContent>
          <Typography variant="h6" mb={2}>
            Последние операции
          </Typography>
          {recentTransactions.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" py={3}>
              Нет операций. Добавьте первую операцию в разделе «История».
            </Typography>
          ) : (
            recentTransactions.map((t) => (
              <Box
                key={t.id}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                py={1.5}
                borderBottom="1px solid"
                borderColor="divider"
              >
                <Box>
                  <Typography variant="body1">
                    {t.category.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(t.date).toLocaleDateString('ru-RU')}
                    {t.comment && ` — ${t.comment}`}
                  </Typography>
                </Box>
                <Typography
                  variant="h6"
                  color={t.type === 'income' ? 'success.main' : 'error.main'}
                >
                  {t.type === 'income' ? '+' : '-'}
                  {formatMoney(t.amount)}
                </Typography>
              </Box>
            ))
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <AppLayout>
        <DashboardContent />
      </AppLayout>
    </AuthGuard>
  );
}
