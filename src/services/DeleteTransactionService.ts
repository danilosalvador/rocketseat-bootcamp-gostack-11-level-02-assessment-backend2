import { getRepository } from 'typeorm';
import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';

class DeleteTransactionService {
  public async execute(id: string): Promise<void> {
    const transactionsRepository = getRepository(Transaction);

    const repository = transactionsRepository.findOne(id);

    if (!repository) {
      throw new AppError('Transação não encontrada.');
    }

    await transactionsRepository.delete(id);
  }
}

export default DeleteTransactionService;
