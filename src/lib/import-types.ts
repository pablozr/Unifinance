// Tipos para importação de dados
export type ImportedTransaction = {
  date: string;
  description: string;
  amount: string;
  type?: 'income' | 'expense';
  category?: string;
};

export type ImportFormat = {
  dateFormat: string;
  dateColumn: string;
  descriptionColumn: string;
  amountColumn: string;
  typeColumn?: string;
  categoryColumn?: string;
  negativeIsExpense?: boolean;
  hasHeader?: boolean;
};

export type BankTemplate = {
  id: string;
  name: string;
  format: ImportFormat;
};

// Templates pré-definidos para bancos comuns
export const BANK_TEMPLATES: BankTemplate[] = [
  {
    id: 'nubank',
    name: 'Nubank',
    format: {
      dateFormat: 'DD/MM/YYYY',
      dateColumn: 'Data',
      descriptionColumn: 'Descrição',
      amountColumn: 'Valor',
      negativeIsExpense: true,
      hasHeader: true
    }
  },
  {
    id: 'itau',
    name: 'Itaú',
    format: {
      dateFormat: 'DD/MM/YYYY',
      dateColumn: 'Data',
      descriptionColumn: 'Histórico',
      amountColumn: 'Valor',
      negativeIsExpense: true,
      hasHeader: true
    }
  },
  {
    id: 'bradesco',
    name: 'Bradesco',
    format: {
      dateFormat: 'DD/MM/YYYY',
      dateColumn: 'Data',
      descriptionColumn: 'Histórico',
      amountColumn: 'Valor',
      negativeIsExpense: true,
      hasHeader: true
    }
  },
  {
    id: 'santander',
    name: 'Santander',
    format: {
      dateFormat: 'DD/MM/YYYY',
      dateColumn: 'Data',
      descriptionColumn: 'Descrição',
      amountColumn: 'Valor',
      negativeIsExpense: true,
      hasHeader: true
    }
  },
  {
    id: 'bb',
    name: 'Banco do Brasil',
    format: {
      dateFormat: 'DD/MM/YYYY',
      dateColumn: 'Data',
      descriptionColumn: 'Histórico',
      amountColumn: 'Valor',
      negativeIsExpense: true,
      hasHeader: true
    }
  },
  {
    id: 'custom',
    name: 'Personalizado',
    format: {
      dateFormat: 'DD/MM/YYYY',
      dateColumn: '',
      descriptionColumn: '',
      amountColumn: '',
      negativeIsExpense: true,
      hasHeader: true
    }
  }
];
