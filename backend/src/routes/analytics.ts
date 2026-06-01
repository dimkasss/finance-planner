import { Router, Response } from 'express';
import prisma from '../prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// GET /api/analytics/expenses-by-category
router.get('/expenses-by-category', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { period = 'month' } = req.query as Record<string, string>;

    const now = new Date();
    let dateFrom: Date;

    switch (period) {
      case 'day':
        dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
      default:
        dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    const expenses = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId: req.userId,
        type: 'expense',
        date: { gte: dateFrom },
      },
      _sum: { amount: true },
    });

    // Get category names
    const categoryIds = expenses.map((e) => e.categoryId);
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true, icon: true },
    });

    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    const result = expenses.map((e) => ({
      categoryId: e.categoryId,
      categoryName: categoryMap.get(e.categoryId)?.name || 'Неизвестно',
      categoryIcon: categoryMap.get(e.categoryId)?.icon || 'category',
      amount: e._sum.amount || 0,
    }));

    res.json(result);
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// GET /api/analytics/income-expense-trend
router.get('/income-expense-trend', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { months = '6' } = req.query as Record<string, string>;
    const monthCount = Math.min(24, Math.max(1, parseInt(months)));

    const now = new Date();
    const result: Array<{
      month: string;
      income: number;
      expense: number;
    }> = [];

    for (let i = monthCount - 1; i >= 0; i--) {
      const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      const [incomeResult, expenseResult] = await Promise.all([
        prisma.transaction.aggregate({
          where: {
            userId: req.userId,
            type: 'income',
            date: { gte: startDate, lte: endDate },
          },
          _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: {
            userId: req.userId,
            type: 'expense',
            date: { gte: startDate, lte: endDate },
          },
          _sum: { amount: true },
        }),
      ]);

      const monthNames = [
        'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн',
        'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек',
      ];

      result.push({
        month: `${monthNames[startDate.getMonth()]} ${startDate.getFullYear()}`,
        income: incomeResult._sum.amount || 0,
        expense: expenseResult._sum.amount || 0,
      });
    }

    res.json(result);
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// GET /api/analytics/limits-status
router.get('/limits-status', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const categoriesWithLimits = await prisma.category.findMany({
      where: {
        userId: req.userId,
        monthlyLimit: { not: null },
      },
    });

    const result = await Promise.all(
      categoriesWithLimits.map(async (cat) => {
        const spending = await prisma.transaction.aggregate({
          where: {
            categoryId: cat.id,
            userId: req.userId,
            type: 'expense',
            date: { gte: startOfMonth, lte: endOfMonth },
          },
          _sum: { amount: true },
        });

        const spent = spending._sum.amount || 0;

        return {
          categoryId: cat.id,
          categoryName: cat.name,
          categoryIcon: cat.icon,
          monthlyLimit: cat.monthlyLimit,
          spent,
          remaining: (cat.monthlyLimit || 0) - spent,
          isOverLimit: spent > (cat.monthlyLimit || 0),
          percentage: cat.monthlyLimit ? Math.round((spent / cat.monthlyLimit) * 100) : 0,
        };
      })
    );

    res.json(result);
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export { router as analyticsRouter };
