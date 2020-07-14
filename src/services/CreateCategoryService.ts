import { getRepository } from 'typeorm';

import Category from '../models/Category';

interface RequestDTO {
  title: string;
}

class CreateCategoryService {
  public async execute({ title }: RequestDTO): Promise<Category> {
    const categoryRepository = getRepository(Category);

    const categorySearch = await categoryRepository.findOne({
      where: {
        title,
      },
    });

    if (categorySearch) {
      return categorySearch;
    }

    const categoryItem = categoryRepository.create({
      title,
    });

    await categoryRepository.save(categoryItem);

    return categoryItem;
  }
}

export default CreateCategoryService;
