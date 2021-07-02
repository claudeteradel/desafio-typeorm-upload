import { getRepository, getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';


interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({ title, value, type, category }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    if(type == 'outcome'){
      if((await transactionsRepository.getBalance()).income < value){
        throw new AppError('This transaction exceed maximum balance.');
      }
    }

    const categoryRepository = getRepository(Category);

    const checkCategoryExists = await categoryRepository.findOne({
      where: { title: category }
    });

    let categoryId;

    if(checkCategoryExists){
      categoryId = checkCategoryExists.id;
      
    } else {
      const categoryData = categoryRepository.create({
        title: category,
      });
  
      await categoryRepository.save(categoryData);

      categoryId = categoryData.id;
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category_id: categoryId
    });

    await transactionsRepository.save(transaction);

    return transaction;

  }
}

export default CreateTransactionService;
