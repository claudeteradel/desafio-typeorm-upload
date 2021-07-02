import AppError from '../errors/AppError';

import { getRepository } from "typeorm";
import Transaction from '../models/Transaction';

class DeleteTransactionService {
  public async execute(id: string): Promise<void> {
    const transactionsRepository = getRepository(Transaction);

    const chechTransactionExists = await transactionsRepository.findOne(id);

    if(!chechTransactionExists){
      throw new AppError('This transaction does not exists.');
    };

    await transactionsRepository.remove(chechTransactionExists);

  }
}

export default DeleteTransactionService;
