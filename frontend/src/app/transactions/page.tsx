'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  Pagination,
  Alert,
  Grid,
  SelectChangeEvent,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AppLayout from '@/components/AppLayout';
import AuthGuard from '@/components/AuthGuard';
import { transactionsApi, categoriesApi } from '@/lib/api';
import { Transaction, Category, TransactionFormData } from '@/lib/types';

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
  }).format(amount);
}

function TransactionsContent() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [filterType, setFilterType] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Form
  const [formData, setFormData] = useState<TransactionFormData>({
    type: 'expense',
    amount: 0,
    categoryId: 0,
    date: new Date().toISOString().split('T')[0],
    comment: '',
  });

  const loadCategories = useCallback(async () => {
    try {
      const data = await categoriesApi.getAll();
      setCategories(data);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  }, []);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 15 };
      if (filterType) params.type = filterType;
      if (filterCategory) params.categoryId = filterCategory;
      if (filterDateFrom) params.dateFrom = filterDateFrom;
      if (filterDateTo) params.dateTo = filterDateTo;

      const data = await transactionsApi.getAll(params as any);
      setTransactions(data.transactions);
      setTotalPages(data.pagination.pages);
    } catch (err) {
      console.error('Error loading transactions:', err);
    } finally {
      setLoading(false);
    }
  }, [page, filterType, filterCategory, filterDateFrom, filterDateTo]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handleOpenCreate = () => {
    setEditingTransaction(null);
    setFormData({
      type: 'expense',
      amount: 0,
      categoryId: categories[0]?.id || 0,
      date: new Date().toISOString().split('T')[0],
      comment: '',
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (t: Transaction) => {
    setEditingTransaction(t);
    setFormData({
      type: t.type,
      amount: t.amount,
      categoryId: t.categoryId,
      date: new Date(t.date).toISOString().split('T')[0],
      comment: t.comment || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setError('');
    try {
      if (editingTransaction) {
        await transactionsApi.update(editingTransaction.id, formData);
      } else {
        await transactionsApi.create(formData);
      }
      setDialogOpen(false);
      loadTransactions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await transactionsApi.delete(deletingId);
      setDeleteDialogOpen(false);
      setDeletingId(null);
      loadTransactions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления');
    }
  };

  const handleConfirmDelete = (id: number) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">История операций</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
        >
          Добавить операцию
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" mb={2}>
            Фильтры
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Тип</InputLabel>
                <Select
                  value={filterType}
                  label="Тип"
                  onChange={(e: SelectChangeEvent) => {
                    setFilterType(e.target.value);
                    setPage(1);
                  }}
                >
                  <MenuItem value="">Все</MenuItem>
                  <MenuItem value="income">Доходы</MenuItem>
                  <MenuItem value="expense">Расходы</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Категория</InputLabel>
                <Select
                  value={filterCategory}
                  label="Категория"
                  onChange={(e: SelectChangeEvent) => {
                    setFilterCategory(e.target.value);
                    setPage(1);
                  }}
                >
                  <MenuItem value="">Все</MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                size="small"
                label="Дата от"
                type="date"
                value={filterDateFrom}
                onChange={(e) => {
                  setFilterDateFrom(e.target.value);
                  setPage(1);
                }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                size="small"
                label="Дата до"
                type="date"
                value={filterDateTo}
                onChange={(e) => {
                  setFilterDateTo(e.target.value);
                  setPage(1);
                }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Transactions table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Дата</TableCell>
                <TableCell>Тип</TableCell>
                <TableCell>Категория</TableCell>
                <TableCell>Сумма</TableCell>
                <TableCell>Комментарий</TableCell>
                <TableCell align="right">Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    Загрузка...
                  </TableCell>
                </TableRow>
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      Нет операций
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((t) => (
                  <TableRow key={t.id} hover>
                    <TableCell>
                      {new Date(t.date).toLocaleDateString('ru-RU')}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={t.type === 'income' ? 'Доход' : 'Расход'}
                        color={t.type === 'income' ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{t.category.name}</TableCell>
                    <TableCell>
                      <Typography
                        color={t.type === 'income' ? 'success.main' : 'error.main'}
                        fontWeight={500}
                      >
                        {t.type === 'income' ? '+' : '-'}
                        {formatMoney(t.amount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          maxWidth: 200,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {t.comment || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenEdit(t)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleConfirmDelete(t.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {totalPages > 1 && (
          <Box display="flex" justifyContent="center" py={2}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, value) => setPage(value)}
              color="primary"
            />
          </Box>
        )}
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingTransaction ? 'Редактировать операцию' : 'Новая операция'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Тип</InputLabel>
              <Select
                value={formData.type}
                label="Тип"
                onChange={(e: SelectChangeEvent) =>
                  setFormData({ ...formData, type: e.target.value as 'income' | 'expense' })
                }
              >
                <MenuItem value="income">Доход</MenuItem>
                <MenuItem value="expense">Расход</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Сумма (₽)"
              type="number"
              value={formData.amount || ''}
              onChange={(e) =>
                setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
              }
              margin="normal"
              required
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Категория</InputLabel>
              <Select
                value={String(formData.categoryId)}
                label="Категория"
                onChange={(e: SelectChangeEvent) =>
                  setFormData({ ...formData, categoryId: parseInt(e.target.value) })
                }
              >
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={String(cat.id)}>
                    {cat.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Дата"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="Комментарий"
              value={formData.comment || ''}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              margin="normal"
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={handleSave}>
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Подтверждение удаления</DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены, что хотите удалить эту операцию? Это действие нельзя отменить.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Отмена</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default function TransactionsPage() {
  return (
    <AuthGuard>
      <AppLayout>
        <TransactionsContent />
      </AppLayout>
    </AuthGuard>
  );
}
