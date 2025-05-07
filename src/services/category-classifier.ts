import { Category } from '@/lib/supabase';
import { ImportedTransaction } from '@/lib/import-types';

/**
 * Serviço para classificação inteligente de categorias baseado na descrição das transações
 */
export class CategoryClassifier {
  // Mapeamento de palavras-chave para categorias de receita
  private static incomeKeywords: Record<string, string[]> = {
    'Salary': [
      'salario', 'salary', 'pagamento', 'payment', 'contracheque', 'paycheck', 'payroll', 
      'folha de pagamento', 'remuneracao', 'remuneration', 'ordenado', 'wage', 'wages',
      'proventos', 'earnings', 'vencimento', 'holerite', 'salário'
    ],
    'Freelance': [
      'freelance', 'freelancer', 'autonomo', 'autonomous', 'autônomo', 'projeto', 'project',
      'consultoria', 'consulting', 'pj', 'pessoa juridica', 'pessoa jurídica', 'servico', 'serviço',
      'service', 'job', 'trabalho', 'gig', 'bico', 'comissao', 'comissão', 'commission'
    ],
    'Investments': [
      'investimento', 'investment', 'dividendo', 'dividend', 'juro', 'juros', 'interest',
      'rendimento', 'yield', 'retorno', 'return', 'aplicacao', 'aplicação', 'application',
      'resgate', 'redemption', 'acao', 'ação', 'stock', 'fundo', 'fund', 'renda fixa',
      'renda variavel', 'renda variável', 'tesouro', 'treasury', 'cdb', 'lci', 'lca',
      'debenture', 'debênture', 'aluguel', 'rent', 'rental'
    ],
    'Gifts': [
      'presente', 'gift', 'doacao', 'doação', 'donation', 'premio', 'prêmio', 'prize',
      'bonus', 'bônus', 'gratificacao', 'gratificação', 'gratification', 'pix', 'transferencia',
      'transferência', 'transfer', 'ted', 'doc', 'deposito', 'depósito', 'deposit'
    ],
    'Other Income': [
      'reembolso', 'reimbursement', 'restituicao', 'restituição', 'restitution', 'devolucao',
      'devolução', 'refund', 'cashback', 'estorno', 'reversal', 'credito', 'crédito', 'credit',
      'recebimento', 'receipt', 'receita', 'revenue', 'entrada', 'income', 'inflow'
    ]
  };

  // Mapeamento de palavras-chave para categorias de despesa
  private static expenseKeywords: Record<string, string[]> = {
    'Housing': [
      'aluguel', 'rent', 'rental', 'condominio', 'condomínio', 'condo', 'iptu', 'property tax',
      'mortgage', 'hipoteca', 'financiamento', 'financing', 'prestacao', 'prestação', 'installment',
      'casa', 'house', 'apartamento', 'apartment', 'moradia', 'housing', 'residence', 'residencia',
      'residência', 'imovel', 'imóvel', 'property'
    ],
    'Food': [
      'mercado', 'market', 'supermercado', 'supermarket', 'grocery', 'groceries', 'alimentacao',
      'alimentação', 'food', 'restaurante', 'restaurant', 'lanche', 'snack', 'cafe', 'café',
      'coffee', 'padaria', 'bakery', 'delivery', 'ifood', 'uber eats', 'rappi', 'james',
      'pizza', 'hamburger', 'hambúrguer', 'fast food', 'refeicao', 'refeição', 'meal'
    ],
    'Transportation': [
      'transporte', 'transportation', 'uber', '99', 'taxi', 'táxi', 'cabify', 'onibus', 'ônibus',
      'bus', 'metro', 'metrô', 'subway', 'trem', 'train', 'passagem', 'ticket', 'fare',
      'combustivel', 'combustível', 'fuel', 'gasolina', 'gasoline', 'diesel', 'etanol',
      'ethanol', 'alcool', 'álcool', 'alcohol', 'estacionamento', 'parking', 'pedagio',
      'pedágio', 'toll', 'carro', 'car', 'moto', 'motorcycle', 'bike', 'bicicleta', 'bicycle'
    ],
    'Utilities': [
      'conta', 'bill', 'utility', 'utilidade', 'luz', 'electricity', 'energia', 'energy',
      'agua', 'água', 'water', 'gas', 'gás', 'internet', 'wifi', 'telefone', 'telephone',
      'phone', 'celular', 'mobile', 'tv', 'cabo', 'cable', 'streaming', 'netflix', 'amazon',
      'disney', 'spotify', 'deezer', 'youtube'
    ],
    'Healthcare': [
      'saude', 'saúde', 'health', 'medico', 'médico', 'doctor', 'consulta', 'appointment',
      'exame', 'exam', 'test', 'teste', 'hospital', 'clinica', 'clínica', 'clinic',
      'farmacia', 'farmácia', 'pharmacy', 'remedio', 'remédio', 'medicine', 'medicamento',
      'medication', 'plano de saude', 'plano de saúde', 'health insurance', 'seguro saude',
      'seguro saúde', 'dentista', 'dentist', 'psicólogo', 'psicologo', 'psychologist',
      'terapia', 'therapy', 'fisioterapia', 'physiotherapy'
    ],
    'Entertainment': [
      'entretenimento', 'entertainment', 'cinema', 'movie', 'filme', 'teatro', 'theater',
      'show', 'concerto', 'concert', 'evento', 'event', 'ingresso', 'ticket', 'jogo', 'game',
      'parque', 'park', 'diversao', 'diversão', 'fun', 'lazer', 'leisure', 'hobby', 'passeio',
      'tour', 'viagem', 'travel', 'trip', 'ferias', 'férias', 'vacation', 'hotel', 'resort',
      'pousada', 'inn', 'airbnb', 'hospedagem', 'accommodation'
    ],
    'Shopping': [
      'compra', 'purchase', 'shopping', 'loja', 'store', 'shop', 'roupa', 'clothes', 'clothing',
      'vestuario', 'vestuário', 'apparel', 'calcado', 'calçado', 'shoe', 'sapato', 'acessorio',
      'acessório', 'accessory', 'bolsa', 'bag', 'mala', 'luggage', 'movel', 'móvel', 'furniture',
      'eletronico', 'eletrônico', 'electronic', 'eletrodomestico', 'eletrodoméstico', 'appliance',
      'decoracao', 'decoração', 'decoration', 'presente', 'gift', 'amazon', 'aliexpress',
      'shopee', 'mercado livre', 'americanas', 'magazine luiza', 'magalu', 'casas bahia'
    ],
    'Education': [
      'educacao', 'educação', 'education', 'escola', 'school', 'colegio', 'colégio', 'college',
      'universidade', 'university', 'faculdade', 'college', 'curso', 'course', 'livro', 'book',
      'material', 'supply', 'mensalidade', 'tuition', 'matricula', 'matrícula', 'enrollment',
      'inscricao', 'inscrição', 'registration', 'taxa', 'fee', 'treinamento', 'training',
      'workshop', 'palestra', 'lecture', 'seminario', 'seminário', 'seminar', 'congresso',
      'congress', 'conferencia', 'conferência', 'conference'
    ],
    'Personal Care': [
      'cuidado pessoal', 'personal care', 'higiene', 'hygiene', 'beleza', 'beauty', 'estetica',
      'estética', 'aesthetics', 'cabelo', 'hair', 'salao', 'salão', 'salon', 'spa', 'massagem',
      'massage', 'manicure', 'pedicure', 'barbeiro', 'barber', 'maquiagem', 'makeup', 'cosmetico',
      'cosmético', 'cosmetic', 'perfume', 'fragrance', 'academia', 'gym', 'fitness', 'personal',
      'trainer', 'pilates', 'yoga', 'crossfit', 'natacao', 'natação', 'swimming'
    ],
    'Debt': [
      'divida', 'dívida', 'debt', 'emprestimo', 'empréstimo', 'loan', 'financiamento', 'financing',
      'parcela', 'installment', 'prestacao', 'prestação', 'payment', 'cartao', 'cartão', 'card',
      'credito', 'crédito', 'credit', 'juros', 'interest', 'multa', 'fine', 'penalty', 'mora',
      'late fee', 'atraso', 'delay', 'banco', 'bank', 'instituicao', 'instituição', 'institution',
      'financeira', 'financial'
    ],
    'Other Expenses': [
      'outros', 'other', 'diversos', 'miscellaneous', 'variados', 'varied', 'geral', 'general',
      'despesa', 'expense', 'gasto', 'spending', 'pagamento', 'payment', 'servico', 'serviço',
      'service', 'taxa', 'fee', 'tarifa', 'rate', 'imposto', 'tax', 'tributo', 'tribute',
      'contribuicao', 'contribuição', 'contribution', 'doacao', 'doação', 'donation', 'presente',
      'gift', 'assinatura', 'subscription', 'mensalidade', 'monthly fee'
    ]
  };

  /**
   * Classifica uma transação com base na sua descrição
   * @param transaction Transação a ser classificada
   * @param categories Lista de categorias disponíveis
   * @returns ID da categoria mais provável e pontuação de confiança
   */
  static classifyTransaction(
    transaction: ImportedTransaction,
    categories: Category[]
  ): { categoryId: string; confidence: number; categoryName: string } {
    const description = transaction.description.toLowerCase();
    const type = transaction.type || this.guessTransactionType(transaction);
    
    // Dividir a descrição em palavras
    const words = description
      .replace(/[^\w\sáàãâéèêíìîóòõôúùûçñ]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);
    
    // Pontuação para cada categoria
    const scores: Record<string, number> = {};
    
    // Inicializar pontuações
    categories.forEach(category => {
      scores[category.id] = 0;
    });
    
    // Determinar quais categorias são de receita
    const incomeCategories = categories.filter(category => 
      Object.keys(this.incomeKeywords).includes(category.name)
    );
    
    // Determinar quais categorias são de despesa
    const expenseCategories = categories.filter(category => 
      Object.keys(this.expenseKeywords).includes(category.name)
    );
    
    // Filtrar categorias pelo tipo da transação
    const relevantCategories = type === 'income' ? incomeCategories : expenseCategories;
    
    // Se não houver categorias relevantes, usar todas as categorias
    const categoriesToCheck = relevantCategories.length > 0 ? relevantCategories : categories;
    
    // Calcular pontuação para cada categoria
    for (const category of categoriesToCheck) {
      // Obter palavras-chave para a categoria
      const keywords = type === 'income' 
        ? this.incomeKeywords[category.name] || []
        : this.expenseKeywords[category.name] || [];
      
      // Verificar correspondência de palavras-chave
      for (const word of words) {
        for (const keyword of keywords) {
          if (keyword.includes(word) || word.includes(keyword)) {
            // Pontuação maior para correspondências exatas
            scores[category.id] += word === keyword ? 2 : 1;
          }
        }
      }
      
      // Verificar correspondência da descrição completa
      for (const keyword of keywords) {
        if (description.includes(keyword)) {
          // Pontuação maior para palavras-chave mais específicas
          scores[category.id] += keyword.length > 5 ? 3 : 2;
        }
      }
    }
    
    // Encontrar categoria com maior pontuação
    let bestCategoryId = '';
    let highestScore = 0;
    
    for (const [categoryId, score] of Object.entries(scores)) {
      if (score > highestScore) {
        highestScore = score;
        bestCategoryId = categoryId;
      }
    }
    
    // Se nenhuma categoria tiver pontuação, usar categoria padrão
    if (highestScore === 0) {
      const defaultCategory = type === 'income'
        ? categories.find(c => c.name === 'Other Income')
        : categories.find(c => c.name === 'Other Expenses');
      
      bestCategoryId = defaultCategory?.id || categories[0]?.id || '';
      highestScore = 0;
    }
    
    // Calcular confiança (0-1)
    const confidence = Math.min(1, highestScore / 10);
    const categoryName = categories.find(c => c.id === bestCategoryId)?.name || '';
    
    return { categoryId: bestCategoryId, confidence, categoryName };
  }

  /**
   * Tenta adivinhar o tipo da transação (receita ou despesa) com base na descrição e valor
   */
  private static guessTransactionType(transaction: ImportedTransaction): 'income' | 'expense' {
    const description = transaction.description.toLowerCase();
    const amount = transaction.amount;
    
    // Verificar se o valor é negativo
    if (amount.startsWith('-') || amount.includes('(') && amount.includes(')')) {
      return 'expense';
    }
    
    // Palavras-chave que indicam receita
    const incomeWords = [
      'salario', 'salário', 'salary', 'pagamento', 'payment', 'deposito', 'depósito', 'deposit',
      'transferencia', 'transferência', 'transfer', 'pix', 'ted', 'doc', 'credito', 'crédito',
      'credit', 'receita', 'revenue', 'income', 'reembolso', 'reimbursement', 'estorno', 'reversal'
    ];
    
    // Palavras-chave que indicam despesa
    const expenseWords = [
      'compra', 'purchase', 'pagamento', 'payment', 'debito', 'débito', 'debit', 'fatura',
      'invoice', 'bill', 'conta', 'despesa', 'expense', 'gasto', 'spending', 'taxa', 'fee',
      'tarifa', 'rate', 'imposto', 'tax'
    ];
    
    // Verificar palavras-chave de receita
    for (const word of incomeWords) {
      if (description.includes(word)) {
        return 'income';
      }
    }
    
    // Verificar palavras-chave de despesa
    for (const word of expenseWords) {
      if (description.includes(word)) {
        return 'expense';
      }
    }
    
    // Padrão: considerar como despesa
    return 'expense';
  }
}
