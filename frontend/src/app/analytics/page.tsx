'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Grid,
  Skeleton,
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import AppLayout from '@/components/AppLayout';
import AuthGuard from '@/components/AuthGuard';
import { analyticsApi } from '@/lib/api';
import { ExpenseByCategory, IncomeExpenseTrend } from '@/lib/types';

const COLORS = [
  '#1976d2',
  '#9c27b0',
  '#2e7d32',
  '#ed6c02',
  '#d32f2f',
  '#0288d1',
  '#7b1fa2',
  '#388e3c',
  '#f57c00',
  '#c62828',
  '#00838f',
  '#6a1b9a',
];

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
  }).format(amount);
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
}

function CustomPieTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <Box
        sx={{
          backgroundColor: '#18181b',
          p: 1.5,
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 1.5,
          boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
        }}
      >
        <Typography variant="body2" fontWeight={600} sx={{ color: '#fafafa' }}>
          {payload[0].name}
        </Typography>
        <Typography variant="body2" sx={{ color: '#d4d4d8' }}>
          {formatMoney(payload[0].value)}
        </Typography>
      </Box>
    );
  }
  return null;
}

function AnalyticsContent() {
  const [period, setPeriod] = useState('month');
  const [months, setMonths] = useState(6);
  const [expensesByCategory, setExpensesByCategory] = useState<ExpenseByCategory[]>([]);
  const [trend, setTrend] = useState<IncomeExpenseTrend[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [expData, trendData] = await Promise.all([
        analyticsApi.expensesByCategory(period),
        analyticsApi.incomeExpenseTrend(months),
      ]);
      setExpensesByCategory(expData);
      setTrend(trendData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [period, months]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const pieData = expensesByCategory.map((item) => ({
    name: item.categoryName,
    value: item.amount,
  }));

  const totalExpenses = expensesByCategory.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Box>
      <Typography variant="h5" mb={3}>
        Аналитика
      </Typography>

      <Grid container spacing={3}>
        {/* Pie Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Расходы по категориям</Typography>
                <ToggleButtonGroup
                  value={period}
                  exclusive
                  onChange={(_, val) => val && setPeriod(val)}
                  size="small"
                >
                  <ToggleButton value="day">День</ToggleButton>
                  <ToggleButton value="week">Неделя</ToggleButton>
                  <ToggleButton value="month">Месяц</ToggleButton>
                </ToggleButtonGroup>
              </Box>

              {loading ? (
                <Skeleton variant="circular" width={300} height={300} sx={{ mx: 'auto' }} />
              ) : pieData.length === 0 ? (
                <Box textAlign="center" py={8}>
                  <Typography color="text.secondary">
                    Нет данных за выбранный период
                  </Typography>
                </Box>
              ) : (
                <>
                  <Typography variant="body2" color="text.secondary" textAlign="center" mb={1}>
                    Всего расходов: {formatMoney(totalExpenses)}
                  </Typography>
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} (${(percent * 100).toFixed(0)}%)`
                        }
                        labelLine={true}
                      >
                        {pieData.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Line Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Динамика доходов и расходов</Typography>
                <ToggleButtonGroup
                  value={String(months)}
                  exclusive
                  onChange={(_, val) => val && setMonths(parseInt(val))}
                  size="small"
                >
                  <ToggleButton value="3">3 мес</ToggleButton>
                  <ToggleButton value="6">6 мес</ToggleButton>
                  <ToggleButton value="12">12 мес</ToggleButton>
                </ToggleButtonGroup>
              </Box>

              {loading ? (
                <Skeleton variant="rounded" height={350} />
              ) : trend.length === 0 ? (
                <Box textAlign="center" py={8}>
                  <Typography color="text.secondary">
                    Нет данных
                  </Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" fontSize={12} />
                    <YAxis
                      fontSize={12}
                      tickFormatter={(value) =>
                        value >= 1000 ? `${(value / 1000).toFixed(0)}к` : String(value)
                      }
                    />
                    <Tooltip
                      formatter={(value: number) => formatMoney(value)}
                      contentStyle={{
                        backgroundColor: '#18181b',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 12,
                        boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
                      }}
                      itemStyle={{ color: '#e4e4e7' }}
                      labelStyle={{ fontWeight: 600, color: '#fafafa' }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="income"
                      name="Доходы"
                      stroke="#2e7d32"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="expense"
                      name="Расходы"
                      stroke="#d32f2f"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default function AnalyticsPage() {
  return (
    <AuthGuard>
      <AppLayout>
        <AnalyticsContent />
      </AppLayout>
    </AuthGuard>
  );
}
