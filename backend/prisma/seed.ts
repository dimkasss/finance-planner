import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create demo user
  const passwordHash = await bcrypt.hash('demo1234', 10);
  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      name: 'Демо Пользователь',
      passwordHash,
    },
  });

  // Create default categories
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

  for (const cat of defaultCategories) {
    await prisma.category.upsert({
      where: { name_userId: { name: cat.name, userId: user.id } },
      update: {},
      create: {
        name: cat.name,
        icon: cat.icon,
        userId: user.id,
      },
    });
  }

  console.log('Seed completed: demo user and default categories created.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
