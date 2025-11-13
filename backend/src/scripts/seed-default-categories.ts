import 'dotenv/config';
import AppDataSource from '../database/data-source';
import { User } from '../modules/users/entities/user.entity';
import { Category } from '../modules/categories/entities/category.entity';
import { DEFAULT_CATEGORY_SEEDS } from '../modules/categories/category-defaults';

async function seedDefaultCategories() {
  await AppDataSource.initialize();

  try {
    const userRepository = AppDataSource.getRepository(User);
    const categoryRepository = AppDataSource.getRepository(Category);

    const users = await userRepository.find();
    if (users.length === 0) {
      console.log('Nenhum usuário encontrado para associar categorias padrão.');
      return;
    }

    for (const user of users) {
      const existingCount = await categoryRepository.count({ where: { user: { id: user.id } } });
      if (existingCount > 0) {
        continue;
      }

      const categories = DEFAULT_CATEGORY_SEEDS.map((seed) =>
        categoryRepository.create({
          name: seed.name,
          type: seed.type,
          spendingLimit: seed.spendingLimit ?? null,
          user,
        }),
      );

      await categoryRepository.save(categories);
      console.log(`Categorias padrão criadas para o usuário ${user.email}.`);
    }
  } finally {
    await AppDataSource.destroy();
  }
}

seedDefaultCategories().catch(async (error) => {
  console.error('Erro ao semear categorias padrão:', error);
  await AppDataSource.destroy();
  process.exit(1);
});
