import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

const transactionSchema = z.object({
  type: z.enum(['income', 'expense'], { message: 'Тип должен быть "income" или "expense"' }),
  amount: z.number().positive('Сумма должна быть положительной'),
  categoryId: z.number().int('ID категории должен быть целым числом'),
  date: z.string().optional(),
  comment: z.string().optional().nullable(),
});

// GET /api/transactions
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type, categoryId, dateFrom, dateTo, page = '1', limit = '20' } = req.query as Record<string, string>;

    const where: any = { userId: req.userId };

    if (type && (type === 'income' || type === 'expense')) {
      where.type = type;
    }

    if (categoryId) {
      where.categoryId = parseInt(categoryId);
    }

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo + 'T23:59:59');
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: { category: { select: { id: true, name: true, icon: true } } },
        orderBy: { date: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.transaction.count({ where }),
    ]);

    res.json({
      transactions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST /api/transactions
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = transactionSchema.parse(req.body);

    // Verify category belongs to user
    const category = await prisma.category.findFirst({
      where: { id: data.categoryId, userId: req.userId },
    });

    if (!category) {
      res.status(400).json({ error: 'Категория не найдена' });
      return;
    }

    const transaction = await prisma.transaction.create({
      data: {
        type: data.type,
        amount: data.amount,
        comment: data.comment || null,
        date: data.date ? new Date(data.date) : new Date(),
        categoryId: data.categoryId,
        userId: req.userId!,
      },
      include: { category: { select: { id: true, name: true, icon: true } } },
    });

    res.status(201).json(transaction);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// PUT /api/transactions/:id
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const data = transactionSchema.parse(req.body);

    const existing = await prisma.transaction.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Операция не найдена' });
      return;
    }

    // Verify category belongs to user
    const category = await prisma.category.findFirst({
      where: { id: data.categoryId, userId: req.userId },
    });

    if (!category) {
      res.status(400).json({ error: 'Категория не найдена' });
      return;
    }

    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        type: data.type,
        amount: data.amount,
        comment: data.comment || null,
        date: data.date ? new Date(data.date) : existing.date,
        categoryId: data.categoryId,
      },
      include: { category: { select: { id: true, name: true, icon: true } } },
    });

    res.json(transaction);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// DELETE /api/transactions/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);

    const existing = await prisma.transaction.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Операция не найдена' });
      return;
    }

    await prisma.transaction.delete({ where: { id } });
    res.json({ message: 'Операция удалена' });
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// GET /api/transactions/balance
router.get('/balance', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [incomeResult, expenseResult] = await Promise.all([
      prisma.transaction.aggregate({
        where: { userId: req.userId, type: 'income' },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { userId: req.userId, type: 'expense' },
        _sum: { amount: true },
      }),
    ]);

    const totalIncome = incomeResult._sum.amount || 0;
    const totalExpense = expenseResult._sum.amount || 0;

    res.json({
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
    });
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export { router as transactionsRouter };
