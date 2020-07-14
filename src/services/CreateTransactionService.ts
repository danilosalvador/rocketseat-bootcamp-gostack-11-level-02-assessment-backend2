import { getCustomRepository } from 'typeorm';

import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';
import CreateCategoryService from './CreateCategoryService';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface RequestDTO {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: RequestDTO): Promise<Transaction> {
    const createCategoryService = new CreateCategoryService();
    const categoryItem = await createCategoryService.execute({
      title: category,
    });

    const transactionsRepository = getCustomRepository(TransactionsRepository);

    if (type === 'outcome') {
      const balance = await transactionsRepository.getBalance();

      const checkTotal = balance.total - value;

      if (checkTotal < 0) {
        throw new AppError('O valor da retirada extrapola o saldo total');
      }
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category_id: categoryItem.id,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
