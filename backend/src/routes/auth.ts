import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../prisma';
import { JWT_SECRET, authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

const registerSchema = z.object({
  email: z.string().email('Некорректный email'),
  name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  password: z.string().min(6, 'Пароль должен содержать минимум 6 символов'),
});

const loginSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(1, 'Пароль обязателен'),
});

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      res.status(400).json({ error: 'Пользователь с таким email уже существует' });
      return;
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        passwordHash,
      },
    });

    // Create default categories for new user
    const defaultCategories = [
      { name: 'Зарплата', icon: 'work' },
      { name: 'Продукты', icon: 'shopping_cart' },
      { name: 'Транспорт', icon: 'directions_car' },
      { name: 'Развлечения', icon: 'movie' },
      { name: 'Здоровье', icon: 'local_hospital' },
      { name: 'Образование', icon: 'school' },
      { name: 'Коммунальные услуги', icon: 'home' },
      { name: 'Одежда', icon: 'checkroom' },
      { name: 'Подарки', icon: 'card_giftcard' },
      { name: 'Другое', icon: 'more_horiz' },
    ];

    await prisma.category.createMany({
      data: defaultCategories.map((cat) => ({ ...cat, userId: user.id })),
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      res.status(401).json({ error: 'Неверный email или пароль' });
      return;
    }

    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Неверный email или пароль' });
      return;
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    res.json({ user });
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export { router as authRouter };
