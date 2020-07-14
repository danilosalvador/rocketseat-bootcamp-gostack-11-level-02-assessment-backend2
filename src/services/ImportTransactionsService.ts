import { getRepository, getCustomRepository, In } from 'typeorm';
import csvParse from 'csv-parse';
import path from 'path';
import fs from 'fs';

import uploadConfig from '../config/upload';

import TransactionRepository from '../repositories/TransactionsRepository';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface CSVTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(fileName: string): Promise<Transaction[]> {
    const filePath = path.join(uploadConfig.directory, fileName);

    const readCSVStream = fs.createReadStream(filePath);

    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const transactionsCSV: CSVTransaction[] = [];
    const categoriesCSV: string[] = [];

    parseCSV.on('data', line => {
      const [title, type, value, category] = line.map((cell: string) => cell);

      if (!title || !type || !value || !category) return;

      transactionsCSV.push({ title, type, value, category });
      categoriesCSV.push(category);
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    const transactionRepository = getCustomRepository(TransactionRepository);
    const categoryRepository = getRepository(Category);

    // Retorna uma lista com as categories do CSV que já existem no BD
    const findedCategories = await categoryRepository.find({
      where: {
        title: In(categoriesCSV),
      },
    });

    const findedCategoriesTitles = findedCategories.map(
      category => category.title,
    );

    // Pega a lista acima e retorna apenas as Categorias do CSV que não estejam na lista
    const notFoundCategories = categoriesCSV
      .filter(category => !findedCategoriesTitles.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index); // distinct

    const createdCategories = categoryRepository.create(
      notFoundCategories.map(title => ({ title })),
    );

    await categoryRepository.save(createdCategories);

    const mergedCategories = [...findedCategories, ...createdCategories];

    const createdTransactions = transactionRepository.create(
      transactionsCSV.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: mergedCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    await transactionRepository.save(createdTransactions);

    await fs.promises.unlink(filePath);

    return createdTransactions;
  }
}

export default ImportTransactionsService;
