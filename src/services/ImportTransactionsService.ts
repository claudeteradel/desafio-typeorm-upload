import { getRepository, In } from 'typeorm';
import Transaction from '../models/Transaction';
import Category from '../models/Category';
import uploadConfig from '../config/upload';

import csvParse from 'csv-parse';
import fs from 'fs';
import path from 'path';

interface csvTransaction{
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class ImportTransactionsService {
  public async execute(fileName: string): Promise<Transaction[]> {
    const filePath = path.join(uploadConfig.directory, fileName);
    
    const readCSV = fs.createReadStream(filePath);
    
    const parseLines = csvParse({
      from_line: 2,
    });
    
    const parseCSV = readCSV.pipe(parseLines);
    
    const transactions: csvTransaction[] = [];
    const categories: string[] = [];
    
    parseCSV.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) =>
      cell.trim(),
      );
      
      if (!title || !type || !value) return;
      
      categories.push(category);
      transactions.push({title, type, value, category});
    });
    
    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    const categoryRepository = getRepository(Category);

    const checkCategoryExists = await categoryRepository.find({
      where: {
        title: In(categories),
      },
    });

    const checkExistentCategoriesTitles = checkCategoryExists.map(
      (category: Category) => category.title
    );

    const addCategoryTitle = categories.filter(
      category => !checkExistentCategoriesTitles.includes(category) //pegando só as categorias que não existem no banco
    ).filter(
      (value, index, self) => self.indexOf(value) == index //retirando as categorias duplicadas
    );

    const newCategory = categoryRepository.create(
      addCategoryTitle.map(title => ({
        title
      })),
    );

    await categoryRepository.save(newCategory);

    const allCategories = [...newCategory, ...checkCategoryExists];

    const transactionRepository = getRepository(Transaction);

    const createdTransactions = transactionRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: allCategories.find(
          category => category.title == transaction.category
        ),
      })),
    );

    await transactionRepository.save(createdTransactions);

    await fs.promises.unlink(filePath);

    return createdTransactions;
    
  }
}

export default ImportTransactionsService;
