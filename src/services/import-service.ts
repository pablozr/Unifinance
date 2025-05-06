import Papa from 'papaparse';
import { ImportedTransaction, ImportFormat } from '@/lib/import-types';

export const importService = {
  /**
   * Parse CSV data from a file
   */
  parseCSV(file: File, format: ImportFormat): Promise<ImportedTransaction[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: format.hasHeader,
        complete: (results) => {
          try {
            const transactions: ImportedTransaction[] = [];
            const rows = results.data as Record<string, string>[];

            rows.forEach((row) => {
              // Skip empty rows
              if (Object.values(row).every(val => !val)) return;

              // Extract data based on format
              const date = row[format.dateColumn];
              const description = row[format.descriptionColumn];
              const amount = row[format.amountColumn];

              // Skip if essential data is missing
              if (!date || !description || !amount) return;

              // Determine transaction type
              let type: 'income' | 'expense' | undefined;
              if (format.typeColumn && row[format.typeColumn]) {
                type = row[format.typeColumn].toLowerCase().includes('income') ? 'income' : 'expense';
              } else if (format.negativeIsExpense) {
                // If amount starts with - or (, it's an expense
                const amountStr = amount.trim();
                type = amountStr.startsWith('-') || amountStr.startsWith('(') ? 'expense' : 'income';
              }

              // Get category if available
              const category = format.categoryColumn ? row[format.categoryColumn] : undefined;

              transactions.push({
                date,
                description,
                amount,
                type,
                category
              });
            });

            resolve(transactions);
          } catch (error) {
            reject(error);
          }
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  },

  /**
   * Clean and normalize imported transactions
   */
  normalizeTransactions(transactions: ImportedTransaction[], format: ImportFormat): ImportedTransaction[] {
    return transactions.map(transaction => {
      // Clean amount (remove currency symbols, parentheses, etc.)
      let amount = transaction.amount.replace(/[^\d.,\-]/g, '');

      // Convert comma to dot for decimal
      amount = amount.replace(',', '.');

      // Handle negative amounts in parentheses: (123.45) -> -123.45
      if (amount.includes('(') && amount.includes(')')) {
        amount = amount.replace(/[()]/g, '');
        amount = '-' + amount;
      }

      // Determine transaction type if not already set
      let type = transaction.type;
      if (!type && format.negativeIsExpense) {
        type = amount.startsWith('-') ? 'expense' : 'income';
      }

      // Make amount positive for expenses (since type is already set)
      if (type === 'expense' && amount.startsWith('-')) {
        amount = amount.substring(1);
      }

      // Normalize date format
      let date = transaction.date;

      // Try to detect and normalize common date formats
      if (date) {
        // Check if it's in DD/MM/YYYY or MM/DD/YYYY format
        const dateParts = date.split(/[\/\.-]/);
        if (dateParts.length === 3) {
          // If year is 2 digits, convert to 4 digits
          if (dateParts[2].length === 2) {
            const year = parseInt(dateParts[2]);
            dateParts[2] = (year > 50 ? '19' : '20') + dateParts[2];
          }

          // Assume MM/DD/YYYY for US format banks
          const formatId = format?.id || '';
          if (formatId.includes('us') || formatId.includes('american')) {
            date = `${dateParts[2]}-${dateParts[0].padStart(2, '0')}-${dateParts[1].padStart(2, '0')}`;
          } else {
            // Otherwise assume DD/MM/YYYY
            date = `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`;
          }
        }
      }

      return {
        ...transaction,
        amount,
        type,
        date
      };
    });
  },

  /**
   * Map imported transactions to system format
   */
  mapToSystemFormat(transactions: ImportedTransaction[], categoryMap: Record<string, string>): any[] {
    return transactions.map(transaction => {
      // Try to determine category based on description
      let categoryId = '';

      if (transaction.category && categoryMap[transaction.category]) {
        categoryId = categoryMap[transaction.category];
      } else {
        // Try to match description with known categories
        const description = transaction.description.toLowerCase();

        // This is a simplified approach - in a real app, you would use
        // more sophisticated matching or machine learning
        for (const [keyword, id] of Object.entries(categoryMap)) {
          if (description.includes(keyword.toLowerCase())) {
            categoryId = id;
            break;
          }
        }
      }

      // Format the date safely
      let formattedDate;
      try {
        // Try to create a Date object
        const dateObj = new Date(transaction.date);

        // Check if the date is valid
        if (isNaN(dateObj.getTime())) {
          console.warn(`Invalid date: ${transaction.date}, using current date`);
          formattedDate = new Date().toISOString().split('T')[0];
        } else {
          formattedDate = dateObj.toISOString().split('T')[0];
        }
      } catch (error) {
        console.error(`Error parsing date: ${transaction.date}`, error);
        formattedDate = new Date().toISOString().split('T')[0];
      }

      return {
        amount: parseFloat(transaction.amount),
        description: transaction.description,
        category_id: categoryId,
        date: formattedDate,
        type: transaction.type || 'expense'
      };
    });
  }
};
