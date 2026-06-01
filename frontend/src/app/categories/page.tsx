'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Alert,
  Chip,
  LinearProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  SelectChangeEvent,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import TuneIcon from '@mui/icons-material/Tune';
import Icon from '@mui/material/Icon';
import AppLayout from '@/components/AppLayout';
import AuthGuard from '@/components/AuthGuard';
import { categoriesApi } from '@/lib/api';
import { Category } from '@/lib/types';

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
  }).format(amount);
}

const ICON_OPTIONS = [
  { value: 'work', label: 'Работа' },
  { value: 'shopping_cart', label: 'Покупки' },
  { value: 'directions_car', label: 'Транспорт' },
  { value: 'movie', label: 'Развлечения' },
  { value: 'local_hospital', label: 'Здоровье' },
  { value: 'school', label: 'Образование' },
  { value: 'home', label: 'Дом' },
  { value: 'checkroom', label: 'Одежда' },
  { value: 'card_giftcard', label: 'Подарки' },
  { value: 'restaurant', label: 'Рестораны' },
  { value: 'fitness_center', label: 'Спорт' },
  { value: 'flight', label: 'Путешествия' },
  { value: 'pets', label: 'Питомцы' },
  { value: 'savings', label: 'Сбережения' },
  { value: 'more_horiz', label: 'Другое' },
  { value: 'category', label: 'Категория' },
];

function CategoriesContent() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Category dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryIcon, setCategoryIcon] = useState('category');

  // Limit dialog
  const [limitDialogOpen, setLimitDialogOpen] = useState(false);
  const [limitCategory, setLimitCategory] = useState<Category | null>(null);
  const [limitValue, setLimitValue] = useState('');

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  const loadCategories = useCallback(async () => {
    try {
      const data = await categoriesApi.getAll();
      setCategories(data);
    } catch (err) {
      console.error('Error loading categories:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryIcon('category');
    setDialogOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setCategoryName(cat.name);
    setCategoryIcon(cat.icon);
    setDialogOpen(true);
  };

  const handleSaveCategory = async () => {
    setError('');
    try {
      if (editingCategory) {
        await categoriesApi.update(editingCategory.id, {
          name: categoryName,
          icon: categoryIcon,
        });
      } else {
        await categoriesApi.create({
          name: categoryName,
          icon: categoryIcon,
        });
      }
      setDialogOpen(false);
      loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    }
  };

  const handleOpenLimit = (cat: Category) => {
    setLimitCategory(cat);
    setLimitValue(cat.monthlyLimit ? String(cat.monthlyLimit) : '');
    setLimitDialogOpen(true);
  };

  const handleSaveLimit = async () => {
    if (!limitCategory) return;
    setError('');
    try {
      const value = limitValue ? parseFloat(limitValue) : null;
      await categoriesApi.setLimit(limitCategory.id, value);
      setLimitDialogOpen(false);
      loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения лимита');
    }
  };

  const handleConfirmDelete = (cat: Category) => {
    setDeletingCategory(cat);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;
    try {
      await categoriesApi.delete(deletingCategory.id);
      setDeleteDialogOpen(false);
      setDeletingCategory(null);
      loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления');
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Категории</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
        >
          Добавить категорию
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Typography>Загрузка...</Typography>
      ) : (
        <Grid container spacing={2}>
          {categories.map((cat) => (
            <Grid item xs={12} sm={6} md={4} key={cat.id}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                    <Box display="flex" alignItems="center">
                      <Icon sx={{ mr: 1, color: 'primary.main' }}>{cat.icon}</Icon>
                      <Typography variant="h6">{cat.name}</Typography>
                    </Box>
                    <Box>
                      <IconButton size="small" onClick={() => handleOpenEdit(cat)} color="primary">
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleConfirmDelete(cat)} color="error">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>

                  {cat.monthlyLimit ? (
                    <Box mt={1}>
                      <Box display="flex" justifyContent="space-between" mb={0.5}>
                        <Typography variant="body2" color="text.secondary">
                          Лимит: {formatMoney(cat.monthlyLimit)}
                        </Typography>
                        {cat.isOverLimit && (
                          <Chip label="Превышен" color="error" size="small" />
                        )}
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(
                          ((cat.currentMonthSpending || 0) / cat.monthlyLimit) * 100,
                          100
                        )}
                        color={
                          (cat.currentMonthSpending || 0) > cat.monthlyLimit
                            ? 'error'
                            : (cat.currentMonthSpending || 0) > cat.monthlyLimit * 0.8
                            ? 'warning'
                            : 'primary'
                        }
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                      <Typography variant="body2" color="text.secondary" mt={0.5}>
                        Потрачено: {formatMoney(cat.currentMonthSpending || 0)}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary" mt={1}>
                      Лимит не установлен
                    </Typography>
                  )}

                  <Button
                    size="small"
                    startIcon={<TuneIcon />}
                    onClick={() => handleOpenLimit(cat)}
                    sx={{ mt: 1 }}
                  >
                    Настроить лимит
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create/Edit Category Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCategory ? 'Редактировать категорию' : 'Новая категория'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Название"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            margin="normal"
            required
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Иконка</InputLabel>
            <Select
              value={categoryIcon}
              label="Иконка"
              onChange={(e: SelectChangeEvent) => setCategoryIcon(e.target.value)}
            >
              {ICON_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  <Box display="flex" alignItems="center">
                    <Icon sx={{ mr: 1 }}>{opt.value}</Icon>
                    {opt.label}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={handleSaveCategory}>
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Limit Dialog */}
      <Dialog open={limitDialogOpen} onClose={() => setLimitDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Настроить лимит — {limitCategory?.name}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Установите максимальную сумму расходов на месяц. Оставьте пустым, чтобы убрать лимит.
          </Typography>
          <TextField
            fullWidth
            label="Месячный лимит (₽)"
            type="number"
            value={limitValue}
            onChange={(e) => setLimitValue(e.target.value)}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLimitDialogOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={handleSaveLimit}>
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Подтверждение удаления</DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены, что хотите удалить категорию «{deletingCategory?.name}»?
            Все связанные операции также будут удалены.
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

export default function CategoriesPage() {
  return (
    <AuthGuard>
      <AppLayout>
        <CategoriesContent />
      </AppLayout>
    </AuthGuard>
  );
}
