import { ImportedTransaction } from '@/lib/import-types';
import { CategoryClassifier } from './category-classifier';

// Interface simplificada para categoria
interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
  type?: 'income' | 'expense';
}

/**
 * Serviço para classificação inteligente de categorias usando o Copilot
 */
export class CopilotCategoryService {
  /**
   * Classifica uma transação com base na sua descrição usando o Copilot
   * @param transaction Transação a ser classificada
   * @param categories Lista de categorias disponíveis
   * @returns ID da categoria mais provável, nome da categoria e pontuação de confiança
   */
  static async classifyTransaction(
    transaction: ImportedTransaction,
    categories: Category[]
  ): Promise<{ categoryId: string; categoryName: string; confidence: number }> {
    try {
      // Primeiro, tentamos usar o classificador local para obter uma sugestão inicial
      const localClassification = CategoryClassifier.classifyTransaction(transaction, categories);

      // Se a confiança for alta (> 0.7), usamos a classificação local
      if (localClassification.confidence > 0.7) {
        return localClassification;
      }

      // Caso contrário, tentamos melhorar a classificação usando o Copilot
      // Neste caso, vamos usar uma abordagem híbrida: o classificador local + regras de negócio

      // Extrair informações relevantes da transação
      const { description, amount, type } = transaction;

      // Determinar se é uma transação recorrente
      const isRecurring = this.checkIfRecurring(description);

      // Verificar se é uma transação de valor alto
      const isHighValue = Math.abs(parseFloat(amount)) > 1000;

      // Aplicar regras de negócio para melhorar a classificação
      let enhancedConfidence = localClassification.confidence;

      // Se for uma transação recorrente, aumentamos a confiança
      if (isRecurring) {
        enhancedConfidence = Math.min(enhancedConfidence + 0.2, 1.0);
      }

      // Se for uma transação de valor alto, podemos dar mais peso para certas categorias
      if (isHighValue && type === 'expense') {
        // Verificar se a categoria sugerida é uma que normalmente tem valores altos
        const highValueCategories = ['Housing', 'Debt', 'Investments', 'Education'];
        if (highValueCategories.includes(categories.find(c => c.id === localClassification.categoryId)?.name || '')) {
          enhancedConfidence = Math.min(enhancedConfidence + 0.15, 1.0);
        }
      }

      return {
        ...localClassification,
        confidence: enhancedConfidence
      };
    } catch (error) {
      console.error('Error in Copilot classification:', error);
      // Fallback para o classificador local em caso de erro
      return CategoryClassifier.classifyTransaction(transaction, categories);
    }
  }

  /**
   * Classifica um lote de transações usando o Copilot
   * @param transactions Lista de transações a serem classificadas
   * @param categories Lista de categorias disponíveis
   * @returns Lista de transações com categorias sugeridas
   */
  static async classifyTransactions(
    transactions: ImportedTransaction[],
    categories: Category[]
  ): Promise<Array<ImportedTransaction & {
    suggestedCategoryId: string;
    suggestedCategoryName: string;
    confidence: number;
  }>> {
    // Processar transações em lotes para evitar sobrecarga
    const batchSize = 10;
    const results: Array<ImportedTransaction & {
      suggestedCategoryId: string;
      suggestedCategoryName: string;
      confidence: number;
    }> = [];

    // Processar em lotes
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);

      // Processar cada transação no lote
      const batchPromises = batch.map(async (transaction) => {
        const classification = await this.classifyTransaction(transaction, categories);

        return {
          ...transaction,
          suggestedCategoryId: classification.categoryId,
          suggestedCategoryName: classification.categoryName,
          confidence: classification.confidence
        };
      });

      // Aguardar todas as classificações do lote
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Verifica se uma transação parece ser recorrente com base na descrição
   * @param description Descrição da transação
   * @returns true se a transação parece ser recorrente
   */
  private static checkIfRecurring(description: string): boolean {
    const recurringKeywords = [
      'assinatura', 'subscription', 'mensal', 'monthly', 'recorrente', 'recurring',
      'netflix', 'spotify', 'amazon prime', 'disney+', 'hbo', 'apple', 'google',
      'aluguel', 'rent', 'mortgage', 'hipoteca', 'prestação', 'parcela', 'installment'
    ];

    const lowerDesc = description.toLowerCase();
    return recurringKeywords.some(keyword => lowerDesc.includes(keyword));
  }
}
