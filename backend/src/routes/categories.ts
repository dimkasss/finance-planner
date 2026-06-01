import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

const categorySchema = z.object({
  name: z.string().min(1, 'Название категории обязательно'),
  icon: z.string().optional().default('category'),
});

const limitSchema = z.object({
  monthlyLimit: z.number().positive('Лимит должен быть положительным числом').nullable(),
});

// GET /api/categories
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const categories = await prisma.category.findMany({
      where: { userId: req.userId },
      include: {
        _count: { select: { transactions: true } },
      },
      orderBy: { name: 'asc' },
    });

    // Calculate current month spending for each category
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const categoriesWithSpending = await Promise.all(
      categories.map(async (cat) => {
        const spending = await prisma.transaction.aggregate({
          where: {
            categoryId: cat.id,
            userId: req.userId,
            type: 'expense',
            date: { gte: startOfMonth, lte: endOfMonth },
          },
          _sum: { amount: true },
        });

        return {
          ...cat,
          currentMonthSpending: spending._sum.amount || 0,
          isOverLimit: cat.monthlyLimit
            ? (spending._sum.amount || 0) > cat.monthlyLimit
            : false,
        };
      })
    );

    res.json(categoriesWithSpending);
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST /api/categories
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = categorySchema.parse(req.body);

    const existing = await prisma.category.findUnique({
      where: { name_userId: { name: data.name, userId: req.userId! } },
    });

    if (existing) {
      res.status(400).json({ error: 'Категория с таким названием уже существует' });
      return;
    }

    const category = await prisma.category.create({
      data: { ...data, userId: req.userId! },
    });

    res.status(201).json(category);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// PUT /api/categories/:id
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const data = categorySchema.parse(req.body);

    const existing = await prisma.category.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Категория не найдена' });
      return;
    }

    const category = await prisma.category.update({
      where: { id },
      data,
    });

    res.json(category);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// PUT /api/categories/:id/limit
router.put('/:id/limit', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const data = limitSchema.parse(req.body);

    const existing = await prisma.category.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Категория не найдена' });
      return;
    }

    const category = await prisma.category.update({
      where: { id },
      data: { monthlyLimit: data.monthlyLimit },
    });

    res.json(category);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// DELETE /api/categories/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);

    const existing = await prisma.category.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Категория не найдена' });
      return;
    }

    await prisma.category.delete({ where: { id } });
    res.json({ message: 'Категория удалена' });
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export { router as categoriesRouter };
