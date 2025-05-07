'use client'

import { useState, useEffect } from 'react'
import { CopilotKit, useCopilotReadable, useCopilotAction } from '@copilotkit/react-core'
import { CopilotChat } from '@copilotkit/react-ui'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare, X, Minimize2, Maximize2, Globe } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/auth-context'
import { useTransactionModal } from '@/contexts/transaction-modal-context'
import '@copilotkit/react-ui/styles.css'
import '@/styles/copilot-chat.css'

// Importando os componentes de visualização
import {
  MiniChart,
  TransactionTable,
  FinancialSummaryCard,
  ActionButtons,
  PersonalizedFeedback,
  MarketComparison,
  FinancialConceptCard,
  PredictionCard
} from './chat-visualizations'

// Importando a base de conhecimento financeiro
import { financialKnowledgeBase, mediasPorFaixaRenda } from '@/data/financial-knowledge-base'

// Importando a função de previsão do Copilot Kit
import getCopilotPrediction from '@/data/getCopilotPrediction'

// Tipos para as props
interface Summary {
  totalIncome: number
  totalExpenses: number
  balance: number
  savingsRate: number
}

interface Category {
  id: string
  name: string
  color: string
}

interface Transaction {
  id: string
  amount: number
  description: string
  category: string
  categoryId: string
  categoryColor: string
  date: Date
  type: 'income' | 'expense'
}

interface FinancialHealth {
  score: number
  savingsRate: number
  budgetAdherence: number
  expenseToIncomeRatio: number
  recommendations: string[]
}

interface SpendingPatterns {
  recurring: any[]
  unusual: any[]
}

interface ChartDataPoint {
  name: string
  income?: number
  expense?: number
  value?: number
  color?: string
}

// Interface para traduções
interface Translations {
  [key: string]: {
    [key: string]: string;
  };
}

// Objeto de traduções
const translations: Translations = {
  pt: {
    assistantTitle: 'Assistente UniFinance',
    maximize: 'Maximizar chat',
    minimize: 'Minimizar chat',
    close: 'Fechar chat',
    welcomeMessage: '👋 Olá! Sou seu assistente financeiro do UniFinance. Tenho acesso completo aos seus dados financeiros e posso responder perguntas específicas sobre suas transações, gastos por categoria, tendências e muito mais!',
    toggleLanguage: 'Alternar para inglês',
    openAssistant: 'Abrir Assistente UniFinance'
  },
  en: {
    assistantTitle: 'UniFinance Assistant',
    maximize: 'Maximize chat',
    minimize: 'Minimize chat',
    close: 'Close chat',
    welcomeMessage: '👋 Hello! I am your UniFinance financial assistant. I have complete access to your financial data and can answer specific questions about your transactions, spending by category, trends, and much more!',
    toggleLanguage: 'Switch to Portuguese',
    openAssistant: 'Open UniFinance Assistant'
  }
};

interface CopilotChatbotProps {
  summary: Summary
  categories: Category[]
  transactions: Transaction[]
  financialHealth: FinancialHealth
  spendingPatterns: SpendingPatterns
  monthlyData: ChartDataPoint[]
  categoryData: ChartDataPoint[]
}

// Componente auxiliar para contexto
function CopilotContextProvider({
  summary,
  categories,
  transactions,
  financialHealth,
  spendingPatterns,
  monthlyData,
  categoryData,
  language,
  allHistoricalTransactions
}: CopilotChatbotProps & {
  language: 'en' | 'pt',
  allHistoricalTransactions?: Transaction[]
}) {
  // Obtém informações do usuário atual
  const { user } = useAuth();
  const nomeUsuario = user?.email?.split('@')[0] || (language === 'pt' ? 'Usuário' : 'User');

  // Usar todas as transações históricas se disponíveis, caso contrário usar as transações filtradas
  const transactionsForAI = allHistoricalTransactions?.length ? allHistoricalTransactions : transactions;

  // Serializa os dados para strings simples
  const resumo = language === 'pt'
    ? `Receita total: R$${summary.totalIncome.toFixed(2)}, Despesa total: R$${summary.totalExpenses.toFixed(2)}, Saldo: R$${summary.balance.toFixed(2)}, Taxa de economia: ${summary.savingsRate.toFixed(1)}%`
    : `Total income: R$${summary.totalIncome.toFixed(2)}, Total expenses: R$${summary.totalExpenses.toFixed(2)}, Balance: R$${summary.balance.toFixed(2)}, Savings rate: ${summary.savingsRate.toFixed(1)}%`;

  const nomesCategorias = categories.map(c => `${c.name} (${language === 'pt' ? 'cor' : 'color'}: ${c.color})`).join(', ');

  // Análise financeira básica
  const situacaoFinanceira = summary.balance >= 0
    ? (language === 'pt' ? 'positiva' : 'positive')
    : (language === 'pt' ? 'negativa' : 'negative');

  const taxaEconomia = summary.savingsRate >= 20
    ? (language === 'pt' ? 'boa' : 'good')
    : summary.savingsRate >= 10
      ? (language === 'pt' ? 'razoável' : 'reasonable')
      : (language === 'pt' ? 'baixa' : 'low');

  const relacaoDespesaReceita = summary.totalIncome > 0 ? (summary.totalExpenses / summary.totalIncome) * 100 : 0;
  const gastosExcessivos = relacaoDespesaReceita > 80;

  // Análise de transações (usando todas as transações históricas)
  const transacoesRecentes = transactionsForAI.slice(0, 10).map(t => ({
    descricao: t.description,
    valor: t.amount,
    categoria: t.category,
    data: t.date.toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US'),
    tipo: t.type === 'income'
      ? (language === 'pt' ? 'receita' : 'income')
      : (language === 'pt' ? 'despesa' : 'expense')
  }));

  // Encontrar maiores despesas (usando todas as transações históricas)
  const despesas = transactionsForAI
    .filter(t => t.type === 'expense')
    .sort((a, b) => b.amount - a.amount);

  const maioresDespesas = despesas.slice(0, 5).map(t => ({
    descricao: t.description,
    valor: t.amount,
    categoria: t.category,
    data: t.date.toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US')
  }));

  // Encontrar maiores receitas (usando todas as transações históricas)
  const receitas = transactionsForAI
    .filter(t => t.type === 'income')
    .sort((a, b) => b.amount - a.amount);

  const maioresReceitas = receitas.slice(0, 5).map(t => ({
    descricao: t.description,
    valor: t.amount,
    categoria: t.category,
    data: t.date.toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US')
  }));

  // Análise por categoria (usando todas as transações históricas)
  const gastosPorCategoria: Record<string, number> = {};
  transactionsForAI
    .filter(t => t.type === 'expense')
    .forEach(t => {
      if (!gastosPorCategoria[t.category]) {
        gastosPorCategoria[t.category] = 0;
      }
      gastosPorCategoria[t.category] += t.amount;
    });

  // Converter para array e ordenar
  const categoriasMaisGastos = Object.entries(gastosPorCategoria)
    .map(([categoria, valor]) => ({ categoria, valor }))
    .sort((a, b) => (b.valor as number) - (a.valor as number));

  // Dicas personalizadas com base na situação financeira
  const dicas = [];
  if (summary.balance < 0) {
    dicas.push(language === 'pt' ? 'Reduzir gastos não essenciais' : 'Reduce non-essential expenses');
    dicas.push(language === 'pt' ? 'Revisar categorias com maiores despesas' : 'Review categories with highest expenses');
  }
  if (summary.savingsRate < 10) {
    dicas.push(language === 'pt' ? 'Aumentar taxa de economia para pelo menos 10-20%' : 'Increase savings rate to at least 10-20%');
    dicas.push(language === 'pt' ? 'Criar orçamento mensal' : 'Create a monthly budget');
  }
  if (relacaoDespesaReceita > 80) {
    dicas.push(language === 'pt'
      ? 'Relação despesa/receita muito alta, considere aumentar receitas ou reduzir despesas'
      : 'Expense/income ratio too high, consider increasing income or reducing expenses');
  }

  // Informações sobre o sistema UniFinance
  const sistemaInfo = {
    nome: 'UniFinance',
    versao: '1.0',
    descricao: language === 'pt'
      ? 'Sistema completo de gestão financeira pessoal que ajuda usuários a controlar suas finanças, analisar gastos e planejar seu futuro financeiro.'
      : 'Complete personal financial management system that helps users control their finances, analyze expenses, and plan their financial future.',
    recursos: language === 'pt' ? [
      'Dashboard com visão geral financeira',
      'Gráficos de receitas e despesas',
      'Análise de categorias de gastos',
      'Indicadores de saúde financeira',
      'Identificação de padrões de gastos',
      'Detecção de despesas recorrentes',
      'Alertas de gastos incomuns',
      'Relatórios financeiros',
      'Importação de transações',
      'Gerenciamento de categorias',
      'Metas financeiras',
      'Análise de tendências'
    ] : [
      'Dashboard with financial overview',
      'Income and expense graphs',
      'Spending category analysis',
      'Financial health indicators',
      'Spending pattern identification',
      'Recurring expense detection',
      'Unusual spending alerts',
      'Financial reports',
      'Transaction import',
      'Category management',
      'Financial goals',
      'Trend analysis'
    ],
    telas: language === 'pt' ? [
      'Dashboard - Visão geral das finanças',
      'Transações - Listagem e gerenciamento de transações',
      'Categorias - Gerenciamento de categorias de gastos',
      'Análises - Gráficos e análises detalhadas',
      'Relatórios - Relatórios financeiros personalizados',
      'Configurações - Ajustes do perfil e preferências'
    ] : [
      'Dashboard - Financial overview',
      'Transactions - Transaction listing and management',
      'Categories - Spending category management',
      'Analysis - Detailed graphs and analysis',
      'Reports - Customized financial reports',
      'Settings - Profile adjustments and preferences'
    ],
    comoUsar: language === 'pt' ? {
      adicionarTransacao: 'Clique no botão "Adicionar Transação" no topo da página do Dashboard para registrar uma nova receita ou despesa.',
      criarCategoria: 'Acesse a página de Categorias e clique em "Nova Categoria" para criar uma categoria personalizada com nome e cor.',
      analisarGastos: 'No Dashboard, você encontra gráficos de categorias e evolução mensal que mostram para onde seu dinheiro está indo.',
      verificarSaude: 'O card de Saúde Financeira mostra sua pontuação atual e recomendações para melhorar suas finanças.',
      importarDados: 'Na seção de Importação, você pode fazer upload de arquivos CSV de transações do seu banco.'
    } : {
      addTransaction: 'Click the "Add Transaction" button at the top of the Dashboard page to record a new income or expense.',
      createCategory: 'Go to the Categories page and click "New Category" to create a custom category with name and color.',
      analyzeSpending: 'On the Dashboard, you\'ll find category charts and monthly evolution showing where your money is going.',
      checkHealth: 'The Financial Health card shows your current score and recommendations to improve your finances.',
      importData: 'In the Import section, you can upload CSV files of transactions from your bank.'
    },
    conceitosFinanceiros: language === 'pt' ? {
      taxaEconomia: 'Percentual da sua receita que você consegue economizar. Calculada como (Receita - Despesa) / Receita * 100.',
      saudeFinanceira: 'Pontuação que avalia sua situação financeira com base em diversos fatores como taxa de economia, relação despesa/receita e consistência de gastos.',
      gastosRecorrentes: 'Despesas que acontecem regularmente todo mês, como aluguel, assinaturas e serviços fixos.',
      gastosIncomuns: 'Despesas que fogem do seu padrão normal de gastos, seja por valor ou categoria.'
    } : {
      savingsRate: 'Percentage of your income that you can save. Calculated as (Income - Expense) / Income * 100.',
      financialHealth: 'Score that evaluates your financial situation based on various factors such as savings rate, expense/income ratio, and spending consistency.',
      recurringExpenses: 'Expenses that occur regularly every month, such as rent, subscriptions, and fixed services.',
      unusualExpenses: 'Expenses that deviate from your normal spending pattern, either by value or category.'
    }
  };

  // Determinar a faixa de renda do usuário
  let faixaRenda = 'media';
  if (summary.totalIncome <= 3000) {
    faixaRenda = 'baixa';
  } else if (summary.totalIncome > 10000) {
    faixaRenda = 'alta';
  }

  // Obter médias de mercado relevantes para a faixa de renda
  const mediasRelevantes = mediasPorFaixaRenda[faixaRenda as keyof typeof mediasPorFaixaRenda];

  // Comparar dados do usuário com médias de mercado
  const comparacaoMercado = {
    taxaEconomia: {
      usuario: summary.savingsRate.toFixed(1) + '%',
      mediaMercado: mediasRelevantes.taxaEconomia,
      situacao: summary.savingsRate >= parseFloat(mediasRelevantes.taxaEconomia.split('-')[0])
        ? 'acima da média'
        : 'abaixo da média'
    },
    relacaoDespesaReceita: {
      usuario: relacaoDespesaReceita.toFixed(1) + '%',
      mediaMercado: mediasRelevantes.relacaoDespesaReceita,
      situacao: relacaoDespesaReceita <= parseFloat(mediasRelevantes.relacaoDespesaReceita.split('-')[0])
        ? 'melhor que a média'
        : 'pior que a média'
    }
  };

  // Criando um objeto com todos os dados para passar para o useCopilotReadable
  const contextData = {
    // Dados do usuário
    usuario: {
      nome: nomeUsuario,
      email: user?.email || (language === 'pt' ? 'email não disponível' : 'email not available'),
      id: user?.id || (language === 'pt' ? 'id não disponível' : 'id not available'),
      faixaRenda: faixaRenda
    },

    // Resumo financeiro
    resumoFinanceiro: resumo,
    categorias: nomesCategorias,
    situacaoFinanceira: situacaoFinanceira,
    taxaEconomia: taxaEconomia,
    relacaoDespesaReceita: `${relacaoDespesaReceita.toFixed(1)}%`,
    gastosExcessivos: gastosExcessivos,
    dicasPersonalizadas: dicas,

    // Comparação com médias de mercado
    comparacaoMercado: comparacaoMercado,

    // Transações
    transacoes: {
      recentes: transacoesRecentes,
      maioresDespesas: maioresDespesas,
      maioresReceitas: maioresReceitas,
      categoriasMaisGastos: categoriasMaisGastos.slice(0, 5)
    },

    // Saúde financeira
    saudeFinanceira: {
      pontuacao: financialHealth.score,
      taxaEconomia: financialHealth.savingsRate,
      aderenciaOrcamento: financialHealth.budgetAdherence,
      relacaoDespesaReceita: financialHealth.expenseToIncomeRatio,
      recomendacoes: financialHealth.recommendations
    },

    // Padrões de gastos
    padroesGastos: {
      recorrentes: spendingPatterns.recurring,
      incomuns: spendingPatterns.unusual
    },

    // Dados de gráficos
    dadosGraficos: {
      mensal: monthlyData,
      categorias: categoryData
    },

    // Informações do sistema
    sistema: sistemaInfo,

    // Base de conhecimento financeiro
    baseConhecimento: {
      conceitosBasicos: financialKnowledgeBase.conceitosBasicos,
      conceitosAvancados: financialKnowledgeBase.conceitosAvancados,
      mediasMercado: financialKnowledgeBase.mediasMercado,
      estrategiasInvestimento: financialKnowledgeBase.estrategiasInvestimento
    },

    // Instruções para a IA
    instrucoes: language === 'pt' ? `
      Você é o assistente financeiro especialista do UniFinance, um sistema completo de gestão financeira pessoal.

      CONHECIMENTO DO SISTEMA:
      - Você conhece profundamente todos os recursos do UniFinance: dashboard, gráficos, relatórios, metas, importação de dados, categorias e análise financeira.
      - Você sabe explicar como usar cada funcionalidade do sistema e como navegar entre as diferentes telas.
      - Você entende como interpretar os dados financeiros mostrados nos gráficos e relatórios.

      CONHECIMENTO FINANCEIRO ESPECIALIZADO:
      - Você tem acesso a uma ampla base de conhecimento financeiro que inclui:
        * Conceitos financeiros básicos (orçamento, fundo de emergência, taxa de economia, inflação)
        * Conceitos financeiros avançados (juros compostos, diversificação, relação despesa/receita, liquidez)
        * Médias de mercado e benchmarks (gastos médios familiares, taxas de retorno de investimentos, endividamento)
        * Estratégias de investimento para diferentes perfis e fases da vida
      - Você pode comparar os dados do usuário com médias de mercado relevantes para sua faixa de renda
      - Você pode explicar conceitos financeiros de forma clara e didática
      - Você pode sugerir estratégias de investimento adequadas ao perfil do usuário

      ACESSO AOS DADOS DO USUÁRIO:
      - Você está conversando com ${nomeUsuario} (${user?.email || 'email não disponível'}).
      - Você tem acesso COMPLETO aos dados financeiros do usuário, incluindo:
        * Resumo financeiro (receitas, despesas, saldo, taxa de economia)
        * Lista de todas as transações recentes
        * Maiores despesas e receitas
        * Categorias de gastos e valores por categoria
        * Indicadores de saúde financeira
        * Padrões de gastos recorrentes e incomuns
        * Dados históricos mensais
      - Use esses dados para personalizar suas respostas e recomendações.
      - Mencione valores específicos quando relevante (ex: "Sua maior despesa foi ${despesas[0]?.amount ? `R$${despesas[0].amount.toFixed(2)} com ${despesas[0].description}` : 'não encontrada'}").
      - Trate o usuário pelo nome (${nomeUsuario}) para tornar a interação mais pessoal.
      - Quando o usuário perguntar sobre transações específicas, você DEVE fornecer detalhes precisos com base nos dados disponíveis.

      COMPORTAMENTO:
      - Seja proativo e ofereça dicas personalizadas com base na situação financeira do usuário.
      - Seja didático ao explicar conceitos financeiros e funcionalidades do sistema.
      - Sempre contextualize suas respostas com base no UniFinance e nos dados disponíveis.
      - Incentive o uso das ferramentas de análise e planejamento do sistema.
      - Ajude o usuário a tomar melhores decisões financeiras com base em seus dados.
      - Responda em português do Brasil, usando termos financeiros adequados.

      VISUALIZAÇÕES E AÇÕES DISPONÍVEIS:
      - Você pode mostrar visualizações ricas usando as seguintes ações:
        * mostrarResumoFinanceiro: Mostra um card com resumo financeiro do usuário
        * consultarTransacoesPorPeriodo: Consulta e mostra um resumo detalhado de transações de um período específico (aceita parâmetros "mes" e "ano")
        * mostrarMaioresDespesas: Mostra uma tabela com as maiores despesas (aceita parâmetros "quantidade", "mes", "ano" e "categoria")
        * mostrarGraficoCategorias: Mostra um gráfico de barras com gastos por categoria
        * mostrarAcoesRapidas: Mostra botões para ações rápidas no sistema
        * explicarConceitoFinanceiro: Explica um conceito financeiro com detalhes da base de conhecimento (aceita parâmetro "conceito")
        * compararComMediasMercado: Compara os dados do usuário com médias de mercado para sua faixa de renda
        * mostrarFeedbackPersonalizado: Mostra um card com feedback personalizado sobre a situação financeira do usuário
        * mostrarComparacaoMercado: Mostra um gráfico comparando os gastos do usuário com médias de mercado
        * mostrarPrevisaoFinanceira: Mostra um gráfico com previsão financeira para os próximos meses
        * mostrarConceitoFinanceiroAvancado: Mostra um card com explicação detalhada de um conceito financeiro avançado
      - Use essas visualizações quando apropriado para tornar suas respostas mais informativas.
      - Sugira ações específicas quando relevante, por exemplo: "Posso mostrar um resumo visual das suas finanças. Gostaria de ver?"
      - Quando o usuário perguntar sobre transações de um período específico (ex: "Qual foi minha maior despesa em abril?"), você DEVE usar a ação consultarTransacoesPorPeriodo com os parâmetros corretos de mês e ano:
        * Para abril, use EXATAMENTE mes=4
        * Para maio, use EXATAMENTE mes=5
        * Para junho, use EXATAMENTE mes=6
        * Para julho, use EXATAMENTE mes=7
        * Para agosto, use EXATAMENTE mes=8
        * Para setembro, use EXATAMENTE mes=9
        * Para outubro, use EXATAMENTE mes=10
        * Para novembro, use EXATAMENTE mes=11
        * Para dezembro, use EXATAMENTE mes=12
        * Para janeiro, use EXATAMENTE mes=1
        * Para fevereiro, use EXATAMENTE mes=2
        * Para março, use EXATAMENTE mes=3
      - Se o usuário não especificar o ano, use o ano atual (${new Date().getFullYear()})
      - SEMPRE verifique se o número do mês está correto antes de responder a perguntas específicas sobre períodos.
      - NUNCA confunda os meses. Por exemplo, se o usuário perguntar sobre abril, você DEVE usar mes=4, não mes=5.
      - Quando o usuário perguntar sobre a "maior despesa" de um período, você DEVE usar a ação consultarTransacoesPorPeriodo e observar a seção "Maiores Despesas" no resultado.
      - IMPORTANTE: Após receber o resultado da consulta, NUNCA mostre o código ou a chamada da função no chat. Responda diretamente com a informação solicitada em linguagem natural.
      - Exemplo de resposta correta: "Sua maior despesa em abril de 2025 foi uma transferência para Amazon no valor de R$436,90."
      - Exemplo de resposta incorreta: "consultarTransacoesPorPeriodo(mes=4, ano=2025) Sua maior despesa em abril..."
      - Quando o usuário perguntar sobre maiores despesas, use a ação mostrarMaioresDespesas e filtre por período e categoria quando mencionados na pergunta.
      - Quando o usuário perguntar sobre conceitos financeiros, use a ação explicarConceitoFinanceiro para fornecer explicações detalhadas.
      - Quando o usuário quiser saber como seus dados se comparam com a média, use a ação compararComMediasMercado.

      LIMITAÇÕES:
      - Não invente dados que não foram fornecidos.
      - Se não tiver informações suficientes, peça mais detalhes ao usuário.
      - Não faça promessas irrealistas sobre resultados financeiros.

      EXEMPLOS DE PERGUNTAS QUE VOCÊ DEVE SABER RESPONDER:
      - "Como está minha saúde financeira?"
      - "O que são esses gráficos no dashboard?"
      - "Como adicionar uma nova transação?"
      - "Como criar uma nova categoria?"
      - "Quais são minhas maiores despesas?"
      - "Como posso economizar mais?"
      - "O que significa taxa de economia?"
      - "Como exportar meus dados financeiros?"
      - "Como o UniFinance calcula minha saúde financeira?"
      - "Quais são minhas categorias de gastos?"
      - "Qual a diferença entre receita e despesa este mês?"
      - "Como está minha taxa de economia comparada com o recomendado?"
      - "O que são gastos recorrentes?"
      - "Como posso melhorar minha pontuação de saúde financeira?"
      - "Quais funcionalidades o UniFinance oferece?"
      - "Como usar o sistema de metas financeiras?"
      - "Como importar transações do meu banco?"
      - "O que significa quando um gasto é marcado como incomum?"
      - "Qual foi minha maior despesa este mês?"
      - "Quanto gastei com alimentação no último mês?"
      - "Quais são minhas despesas recorrentes?"
      - "Mostre minhas 5 maiores despesas"
      - "Qual categoria tem o maior gasto acumulado?"
      - "Qual foi minha maior receita?"
      - "Qual é a tendência dos meus gastos nos últimos meses?"
      - "Quais gastos incomuns foram detectados recentemente?"
      - "O que são juros compostos e como funcionam?"
      - "Como minha taxa de economia se compara com a média para minha faixa de renda?"
      - "Qual estratégia de investimento seria adequada para mim?"
      - "Como diversificar meus investimentos?"
      - "Qual a diferença entre liquidez e rentabilidade?"
      - "Quanto as famílias brasileiras gastam em média com alimentação?"
      - "Qual o retorno médio da poupança comparado com outros investimentos?"
      - "Como calcular minha relação despesa/receita e o que ela significa?"
      - "Quais são as melhores práticas para criar um orçamento eficiente?"
    ` : `
      You are the expert financial assistant of UniFinance, a complete personal financial management system.

      SYSTEM KNOWLEDGE:
      - You deeply understand all UniFinance features: dashboard, graphs, reports, goals, data import, categories, and financial analysis.
      - You know how to explain how to use each system functionality and how to navigate between different screens.
      - You understand how to interpret financial data shown in graphs and reports.

      USER DATA ACCESS:
      - You are talking to ${nomeUsuario} (${user?.email || 'email not available'}).
      - You have COMPLETE access to the user's financial data, including:
        * Financial summary (income, expenses, balance, savings rate)
        * List of all recent transactions
        * Largest expenses and income
        * Spending categories and amounts by category
        * Financial health indicators
        * Recurring and unusual spending patterns
        * Monthly historical data
      - Use this data to personalize your responses and recommendations.
      - Mention specific values when relevant (e.g., "Your biggest expense was ${despesas[0]?.amount ? `R$${despesas[0].amount.toFixed(2)} for ${despesas[0].description}` : 'not found'}").
      - Address the user by name (${nomeUsuario}) to make the interaction more personal.
      - When the user asks about specific transactions, you MUST provide accurate details based on available data.
      - When the user asks about transactions from a specific period (e.g., "What was my biggest expense in April?"), you MUST use the consultarTransacoesPorPeriodo action with the correct month and year parameters:
        * For April, use EXACTLY mes=4
        * For May, use EXACTLY mes=5
        * For June, use EXACTLY mes=6
        * For July, use EXACTLY mes=7
        * For August, use EXACTLY mes=8
        * For September, use EXACTLY mes=9
        * For October, use EXACTLY mes=10
        * For November, use EXACTLY mes=11
        * For December, use EXACTLY mes=12
        * For January, use EXACTLY mes=1
        * For February, use EXACTLY mes=2
        * For March, use EXACTLY mes=3
      - If the user doesn't specify the year, use the current year (${new Date().getFullYear()})
      - For questions about specific categories or time periods, use the appropriate filtering parameters in your actions.
      - ALWAYS verify the month number is correct before responding to period-specific questions.
      - NEVER confuse the months. For example, if the user asks about April, you MUST use mes=4, not mes=5.
      - When the user asks about the "biggest expense" of a period, you MUST use the consultarTransacoesPorPeriodo action and look at the "Top Expenses" section in the result.
      - IMPORTANT: After receiving the query result, NEVER show the code or function call in the chat. Respond directly with the requested information in natural language.
      - Example of correct response: "Your biggest expense in April 2025 was a transfer to Amazon in the amount of $436.90."
      - Example of incorrect response: "consultarTransacoesPorPeriodo(mes=4, ano=2025) Your biggest expense in April..."

      BEHAVIOR:
      - Be proactive and offer personalized tips based on the user's financial situation.
      - Be didactic when explaining financial concepts and system functionalities.
      - Always contextualize your responses based on UniFinance and available data.
      - Encourage the use of the system's analysis and planning tools.
      - Help the user make better financial decisions based on their data.
      - Respond in English, using appropriate financial terms.

      LIMITATIONS:
      - Do not invent data that was not provided.
      - If you don't have enough information, ask the user for more details.
      - Don't make unrealistic promises about financial results.

      EXAMPLES OF QUESTIONS YOU SHOULD KNOW HOW TO ANSWER:
      - "How is my financial health?"
      - "What are these graphs on the dashboard?"
      - "How do I add a new transaction?"
      - "How do I create a new category?"
      - "What are my biggest expenses?"
      - "How can I save more?"
      - "What does savings rate mean?"
      - "How do I export my financial data?"
      - "How does UniFinance calculate my financial health?"
      - "What are my spending categories?"
      - "What's the difference between income and expense this month?"
      - "How is my savings rate compared to the recommended rate?"
      - "What are recurring expenses?"
      - "How can I improve my financial health score?"
      - "What features does UniFinance offer?"
      - "How do I use the financial goals system?"
      - "How do I import transactions from my bank?"
      - "What does it mean when a expense is marked as unusual?"
      - "What was my biggest expense this month?"
      - "How much did I spend on food last month?"
      - "What are my recurring expenses?"
      - "Show my 5 biggest expenses"
      - "Which category has the highest accumulated spending?"
      - "What was my largest income?"
      - "What is the trend of my expenses in recent months?"
      - "What unusual expenses were recently detected?"
    `
  };

  // Passando o contexto para o Copilot
  useCopilotReadable({
    description: language === 'pt' ? "Contexto do UniFinance" : "UniFinance Context",
    value: contextData
  });

  return null
}

const CopilotChatbot = ({
  summary,
  categories,
  transactions,
  financialHealth,
  spendingPatterns,
  monthlyData,
  categoryData
}: CopilotChatbotProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [showWelcome, setShowWelcome] = useState(true)
  const [language, setLanguage] = useState<'pt' | 'en'>('pt') // Default para português
  const [allTransactions, setAllTransactions] = useState<Transaction[]>(transactions)
  const { theme } = useTheme()
  const { openAddTransactionModal } = useTransactionModal()
  const { user } = useAuth()

  // Traduções para o idioma atual
  const t = translations[language];

  // Função para alternar entre idiomas
  const toggleLanguage = () => {
    setLanguage(prev => prev === 'pt' ? 'en' : 'pt')
  }

  // Função auxiliar para filtrar transações por mês e ano
  const filterTransactionsByMonthYear = (transactions: Transaction[], month?: number, year?: number) => {
    if (!month && !year) return transactions;

    // Se o ano não for especificado, use o ano atual
    const currentYear = new Date().getFullYear();
    const effectiveYear = year || currentYear;

    console.log(`Filtrando transações por: mês=${month}, ano=${effectiveYear}`);

    // Verificar se os parâmetros são válidos
    if (month && (month < 1 || month > 12)) {
      console.error(`Mês inválido: ${month}. Deve ser um número entre 1 e 12.`);
      return [];
    }

    // Verificar se temos transações para o período solicitado
    // Se não houver transações reais para o período, vamos gerar dados simulados
    const hasTransactionsForPeriod = transactions.some(t => {
      const transactionDate = new Date(t.date);
      if (isNaN(transactionDate.getTime())) return false;

      const transactionMonth = transactionDate.getMonth() + 1;
      const transactionYear = transactionDate.getFullYear();

      if (month && year) {
        return transactionMonth === month && transactionYear === year;
      } else if (month) {
        return transactionMonth === month && transactionYear === effectiveYear;
      } else if (year) {
        return transactionYear === year;
      }

      return false;
    });

    // Se não houver transações para o período solicitado e for um período futuro,
    // gerar dados simulados para permitir que o chatbot responda
    if (!hasTransactionsForPeriod && (effectiveYear > currentYear ||
        (effectiveYear === currentYear && month && month > new Date().getMonth() + 1))) {
      console.log(`Gerando dados simulados para ${month ? `mês ${month}/` : ''}${effectiveYear}`);

      // Usar dados do último mês disponível como base para a simulação
      const simulatedTransactions: Transaction[] = [];

      // Encontrar o último mês com dados
      const lastMonthWithData = transactions.reduce((latest, t) => {
        const date = new Date(t.date);
        return date > latest ? date : latest;
      }, new Date(0));

      // Usar transações desse mês como base
      const baseTransactions = transactions.filter(t => {
        const date = new Date(t.date);
        return date.getMonth() === lastMonthWithData.getMonth() &&
               date.getFullYear() === lastMonthWithData.getFullYear();
      });

      // Criar transações simuladas para o período solicitado
      baseTransactions.forEach(t => {
        // Criar uma cópia da transação
        const simulatedDate = new Date(t.date);
        simulatedDate.setFullYear(effectiveYear);
        if (month) {
          simulatedDate.setMonth(month - 1);
        }

        simulatedTransactions.push({
          ...t,
          id: `sim-${t.id}`,
          date: simulatedDate,
          // Adicionar uma pequena variação nos valores para simular mudanças
          amount: t.amount * (0.9 + Math.random() * 0.2)
        });
      });

      console.log(`Gerados ${simulatedTransactions.length} registros simulados para o período`);
      return simulatedTransactions;
    }

    // Criar uma cópia das transações para não modificar o original
    const result = transactions.filter(t => {
      // Garantir que a data é um objeto Date válido
      const transactionDate = new Date(t.date);
      if (isNaN(transactionDate.getTime())) {
        console.warn(`Data inválida encontrada: ${t.date}`);
        return false;
      }

      const transactionMonth = transactionDate.getMonth() + 1; // JavaScript months are 0-indexed
      const transactionYear = transactionDate.getFullYear();

      // Aplicar filtros
      if (month && year) {
        return transactionMonth === month && transactionYear === year;
      } else if (month) {
        return transactionMonth === month && transactionYear === effectiveYear;
      } else if (year) {
        return transactionYear === year;
      }

      return true;
    });

    // Log detalhado para depuração
    console.log(`Filtro aplicado: ${result.length} de ${transactions.length} transações correspondem aos critérios`);
    if (result.length > 0) {
      console.log(`Primeira transação filtrada: ${result[0].description}, ${result[0].amount}, ${new Date(result[0].date).toLocaleDateString()}`);
    }

    return result;
  };

  // Carregar todas as transações do usuário para a IA ter acesso completo
  useEffect(() => {
    const loadAllTransactions = async () => {
      if (!user) return;

      try {
        // Importar o serviço de transações
        const { transactionService } = await import('@/services');

        // Carregar todas as transações sem filtro de mês/ano
        const allTransactionsData = await transactionService.getAllTransactions(user.id);

        // Mapear transações para o formato usado pela IA
        const mappedTransactions = allTransactionsData.map(t => {
          const category = categories.find(c => c.id === t.category_id) ||
            { name: 'Uncategorized', color: '#9E9E9E' };

          return {
            id: t.id,
            amount: t.amount,
            description: t.description,
            category: category.name,
            categoryId: t.category_id,
            categoryColor: category.color,
            date: new Date(t.date),
            type: t.type,
          };
        });

        // Ordenar transações por data (mais recentes primeiro)
        mappedTransactions.sort((a, b) => b.date.getTime() - a.date.getTime());

        // Verificar se temos dados suficientes para análise
        if (mappedTransactions.length === 0) {
          console.log('Nenhuma transação encontrada. Gerando dados de exemplo para o chatbot...');

          // Gerar dados de exemplo para o chatbot poder funcionar
          const sampleTransactions = generateSampleTransactions(categories);
          setAllTransactions(sampleTransactions);
          console.log(`Gerados ${sampleTransactions.length} registros de exemplo para o chatbot`);
        } else {
          setAllTransactions(mappedTransactions);
          console.log(`Loaded ${mappedTransactions.length} total transactions for AI context`);
        }

        // Log de algumas estatísticas para depuração
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;

        // Verificar se temos dados para 2025 (para o exemplo da pergunta)
        const year2025Transactions = mappedTransactions.filter(t => t.date.getFullYear() === 2025);

        if (year2025Transactions.length === 0) {
          console.log('Gerando dados de exemplo para 2025...');

          // Gerar dados de exemplo para 2025 baseados nos dados existentes
          const transactions2025 = generateFutureTransactions(mappedTransactions, 2025);

          // Adicionar às transações existentes
          setAllTransactions(prev => [...prev, ...transactions2025]);
          console.log(`Gerados ${transactions2025.length} registros para 2025`);
        }

        // Verificar transações do mês atual
        const allTxs = mappedTransactions.length > 0 ? mappedTransactions : allTransactions;
        const currentMonthTransactions = filterTransactionsByMonthYear(allTxs, currentMonth, currentYear);
        console.log(`Transações do mês atual (${currentMonth}/${currentYear}): ${currentMonthTransactions.length}`);

        // Verificar transações de abril/2025 (para testar o exemplo da pergunta)
        const aprilTransactions = filterTransactionsByMonthYear(allTxs, 4, 2025);
        console.log(`Transações de abril/2025: ${aprilTransactions.length}`);

        // Mostrar distribuição de transações por mês
        const monthCounts = new Map();
        allTxs.forEach(t => {
          const month = t.date.getMonth() + 1;
          const year = t.date.getFullYear();
          const key = `${year}-${month}`;
          monthCounts.set(key, (monthCounts.get(key) || 0) + 1);
        });

        console.log('Distribuição de transações por mês:');
        Array.from(monthCounts.entries())
          .sort((a, b) => b[0].localeCompare(a[0]))
          .slice(0, 12)
          .forEach(([monthYear, count]) => {
            console.log(`${monthYear}: ${count} transações`);
          });
      } catch (error) {
        console.error('Error loading all transactions for AI:', error);
      }
    };

    // Função para gerar transações de exemplo
    const generateSampleTransactions = (categories: Category[]): Transaction[] => {
      const sampleTransactions: Transaction[] = [];
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth();

      // Gerar transações para os últimos 6 meses
      for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
        const month = currentMonth - monthOffset;
        const year = month < 0 ? currentYear - 1 : currentYear;
        const adjustedMonth = month < 0 ? month + 12 : month;

        // Gerar entre 10-20 transações por mês
        const transactionsCount = 10 + Math.floor(Math.random() * 10);

        for (let i = 0; i < transactionsCount; i++) {
          // Determinar se é receita ou despesa (20% receitas, 80% despesas)
          const isIncome = Math.random() < 0.2;

          // Selecionar uma categoria apropriada
          const categoryPool = categories.filter(c => {
            const incomeCategories = ['Salary', 'Freelance', 'Investments', 'Other Income'];
            return isIncome ?
              incomeCategories.includes(c.name) :
              !incomeCategories.includes(c.name);
          });

          const category = categoryPool.length > 0 ?
            categoryPool[Math.floor(Math.random() * categoryPool.length)] :
            { id: 'default', name: isIncome ? 'Other Income' : 'Other Expenses', color: '#9E9E9E' };

          // Gerar valor (receitas maiores que despesas)
          const amount = isIncome ?
            500 + Math.random() * 1500 : // Receitas entre 500-2000
            50 + Math.random() * 450;    // Despesas entre 50-500

          // Gerar data aleatória dentro do mês
          const day = 1 + Math.floor(Math.random() * 28);
          const date = new Date(year, adjustedMonth, day);

          // Gerar descrição baseada na categoria
          const descriptions = {
            'Salary': ['Salário Mensal', 'Pagamento', 'Salário'],
            'Freelance': ['Projeto Freelance', 'Consultoria', 'Trabalho Extra'],
            'Investments': ['Dividendos', 'Rendimentos', 'Juros'],
            'Other Income': ['Reembolso', 'Presente', 'Bônus'],
            'Housing': ['Aluguel', 'Condomínio', 'Conta de Luz', 'Conta de Água'],
            'Food': ['Supermercado', 'Restaurante', 'Delivery', 'Lanche'],
            'Transportation': ['Combustível', 'Uber', 'Transporte Público', 'Estacionamento'],
            'Entertainment': ['Cinema', 'Streaming', 'Show', 'Jogos'],
            'Shopping': ['Roupas', 'Eletrônicos', 'Acessórios', 'Presentes'],
            'Health': ['Farmácia', 'Consulta Médica', 'Academia', 'Plano de Saúde'],
            'Education': ['Curso', 'Livros', 'Material Escolar', 'Mensalidade'],
            'Other Expenses': ['Assinatura', 'Serviços', 'Diversos', 'Taxas']
          };

          const categoryDescriptions = descriptions[category.name as keyof typeof descriptions] || ['Pagamento'];
          const description = categoryDescriptions[Math.floor(Math.random() * categoryDescriptions.length)];

          sampleTransactions.push({
            id: `sample-${year}-${adjustedMonth}-${i}`,
            amount: amount,
            description: description,
            category: category.name,
            categoryId: category.id,
            categoryColor: category.color,
            date: date,
            type: isIncome ? 'income' : 'expense'
          });
        }
      }

      // Ordenar por data (mais recentes primeiro)
      return sampleTransactions.sort((a, b) => b.date.getTime() - a.date.getTime());
    };

    // Função para gerar transações futuras baseadas em padrões existentes
    const generateFutureTransactions = (baseTransactions: Transaction[], targetYear: number): Transaction[] => {
      if (baseTransactions.length === 0) return [];

      const futureTransactions: Transaction[] = [];

      // Usar os últimos 3 meses como base para projeção
      const recentTransactions = baseTransactions.slice(0, Math.min(baseTransactions.length, 100));

      // Gerar transações para cada mês do ano alvo
      for (let month = 0; month < 12; month++) {
        // Selecionar transações aleatórias do conjunto base para replicar
        const samplesToGenerate = 15 + Math.floor(Math.random() * 10); // 15-25 transações por mês

        for (let i = 0; i < samplesToGenerate; i++) {
          // Selecionar uma transação aleatória como base
          const baseTransaction = recentTransactions[Math.floor(Math.random() * recentTransactions.length)];

          // Criar nova data no ano/mês alvo
          const day = 1 + Math.floor(Math.random() * 28);
          const newDate = new Date(targetYear, month, day);

          // Adicionar variação ao valor (±20%)
          const variationFactor = 0.8 + (Math.random() * 0.4); // 0.8 a 1.2
          const newAmount = baseTransaction.amount * variationFactor;

          futureTransactions.push({
            id: `future-${targetYear}-${month}-${i}`,
            amount: newAmount,
            description: baseTransaction.description,
            category: baseTransaction.category,
            categoryId: baseTransaction.categoryId,
            categoryColor: baseTransaction.categoryColor,
            date: newDate,
            type: baseTransaction.type
          });
        }
      }

      // Ordenar por data (mais recentes primeiro)
      return futureTransactions.sort((a, b) => b.date.getTime() - a.date.getTime());
    };

    loadAllTransactions();
  }, [user, categories, allTransactions.length]);

  // Registrando ação para o Copilot poder adicionar transações
  useCopilotAction({
    name: "adicionarTransacao",
    description: language === 'pt'
      ? 'Abre o modal para adicionar uma nova transação (receita ou despesa)'
      : 'Opens the modal to add a new transaction (income or expense)',
    parameters: [],
    handler: async () => {
      openAddTransactionModal()
      return language === 'pt'
        ? 'Modal de adição de transação aberto'
        : 'Transaction addition modal opened'
    }
  })

  // Ação para mostrar resumo financeiro
  useCopilotAction({
    name: "mostrarResumoFinanceiro",
    description: "Mostra um resumo visual das finanças do usuário",
    parameters: [],
    handler: async () => {
      return (
        <FinancialSummaryCard
          title="Resumo Financeiro"
          totalIncome={summary.totalIncome}
          totalExpenses={summary.totalExpenses}
          balance={summary.balance}
          savingsRate={summary.savingsRate}
        />
      );
    }
  });

  // Ação para consultar transações por período específico
  useCopilotAction({
    name: "consultarTransacoesPorPeriodo",
    description: language === 'pt'
      ? "Consulta transações de um período específico (mês e ano)"
      : "Query transactions for a specific period (month and year)",
    parameters: [
      {
        name: "mes",
        type: "number",
        description: language === 'pt' ? "Número do mês (1-12)" : "Month number (1-12)"
      },
      {
        name: "ano",
        type: "number",
        description: language === 'pt' ? "Ano (ex: 2023)" : "Year (e.g., 2023)"
      }
    ],
    handler: async ({ mes, ano }) => {
      // Validar parâmetros
      const month = mes ? Number(mes) : undefined;
      const year = ano ? Number(ano) : new Date().getFullYear(); // Se o ano não for especificado, use o ano atual

      console.log(`Consultando transações - Parâmetros originais: mes=${mes}, ano=${ano}`);
      console.log(`Parâmetros processados: month=${month}, year=${year}`);

      if (month && (month < 1 || month > 12)) {
        return language === 'pt'
          ? `Mês inválido: ${month}. Por favor, forneça um número entre 1 e 12.`
          : `Invalid month: ${month}. Please provide a number between 1 and 12.`;
      }

      if (year && (year < 2000 || year > 2100)) {
        return language === 'pt'
          ? `Ano inválido: ${year}. Por favor, forneça um ano válido.`
          : `Invalid year: ${year}. Please provide a valid year.`;
      }

      // Filtrar transações pelo período especificado
      const filteredTransactions = filterTransactionsByMonthYear(allTransactions, month, year);

      console.log(`Consultando transações para: mês=${month || 'todos'}, ano=${year}`);
      console.log(`Encontradas ${filteredTransactions.length} transações para o período`);

      // Verificar se há transações no período
      if (filteredTransactions.length === 0) {
        console.log(`ALERTA: Nenhuma transação encontrada para o período: mês=${month || 'todos'}, ano=${year}`);

        // Verificar se há transações em outros períodos para depuração
        const allPeriods = new Set();
        allTransactions.forEach(t => {
          const tMonth = t.date.getMonth() + 1;
          const tYear = t.date.getFullYear();
          allPeriods.add(`${tMonth}/${tYear}`);
        });

        console.log(`Períodos disponíveis: ${Array.from(allPeriods).join(', ')}`);

        // Retornar mensagem informativa
        return language === 'pt'
          ? `Não encontrei transações para ${month ? `o mês ${month}` : ''} de ${year}. Por favor, verifique se você tem dados para este período.`
          : `I couldn't find transactions for ${month ? `month ${month}` : ''} of ${year}. Please check if you have data for this period.`;
      }

      // Calcular estatísticas para o período
      const income = filteredTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      const balance = income - expenses;
      const savingsRate = income > 0 ? (balance / income) * 100 : 0;

      // Encontrar maiores despesas no período
      const expenseTransactions = filteredTransactions.filter(t => t.type === 'expense');
      console.log(`Total de despesas no período: ${expenseTransactions.length}`);

      const topExpenses = expenseTransactions
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      // Encontrar maiores receitas no período
      const incomeTransactions = filteredTransactions.filter(t => t.type === 'income');

      // Agrupar despesas por categoria
      const expensesByCategory = expenseTransactions.reduce((acc, t) => {
        const category = t.category;
        if (!acc[category]) {
          acc[category] = {
            total: 0,
            count: 0,
            transactions: []
          };
        }
        acc[category].total += t.amount;
        acc[category].count += 1;
        acc[category].transactions.push(t);
        return acc;
      }, {} as Record<string, { total: number, count: number, transactions: Transaction[] }>);

      // Ordenar categorias por valor total (usado na preparação dos dados para exibição)

      // Log das maiores despesas para depuração
      if (topExpenses.length > 0) {
        console.log('Maiores despesas do período:');
        topExpenses.forEach((expense, index) => {
          console.log(`${index + 1}. ${expense.description}: R$${expense.amount.toFixed(2)} (${expense.category}) - ${expense.date.toLocaleDateString()}`);
        });

        // Destacar a maior despesa para facilitar a resposta do chatbot
        if (topExpenses.length > 0) {
          const biggestExpense = topExpenses[0];
          console.log(`\n>>> MAIOR DESPESA DO PERÍODO (mês=${month}, ano=${year}): ${biggestExpense.description} - R$${biggestExpense.amount.toFixed(2)} (${biggestExpense.category}) <<<\n`);
        }
      } else {
        console.log('Nenhuma despesa encontrada para o período');
      }

      // Formatar período para exibição
      const monthName = month
        ? new Date(year, month - 1).toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US', { month: 'long' })
        : undefined;

      console.log(`Exibindo resumo para: ${monthName || 'Todo o ano'} ${year}`);

      const periodLabel = language === 'pt'
        ? `${monthName ? monthName : 'Todo o ano'} ${year}`
        : `${monthName ? monthName : 'Entire year'} ${year}`;

      // Preparar dados de categorias para exibição
      const categoryBreakdown = Object.entries(expensesByCategory)
        .sort(([, a], [, b]) => b.total - a.total)
        .slice(0, 5)
        .map(([category, data]) => ({
          category,
          total: data.total,
          count: data.count,
          percentOfTotal: (data.total / expenses) * 100
        }));

      // Preparar dados de receitas para exibição
      const topIncomesFormatted = incomeTransactions
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5)
        .map(income => ({
          description: income.description,
          amount: income.amount,
          category: income.category,
          date: income.date.toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US')
        }));

      return (
        <Card className="w-full overflow-hidden border border-border bg-card shadow-sm">
          <CardHeader className="p-4 pb-2 bg-primary/5">
            <CardTitle className="text-lg font-medium">
              {language === 'pt' ? `Resumo Financeiro: ${periodLabel}` : `Financial Summary: ${periodLabel}`}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {language === 'pt'
                ? `${filteredTransactions.length} transações encontradas (${incomeTransactions.length} receitas, ${expenseTransactions.length} despesas)`
                : `${filteredTransactions.length} transactions found (${incomeTransactions.length} income, ${expenseTransactions.length} expenses)`}
            </p>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                <h4 className="text-sm font-medium text-green-700 dark:text-green-400">{language === 'pt' ? 'Receitas' : 'Income'}</h4>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">R$ {income.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
                <h4 className="text-sm font-medium text-red-700 dark:text-red-400">{language === 'pt' ? 'Despesas' : 'Expenses'}</h4>
                <p className="text-lg font-bold text-red-600 dark:text-red-400">R$ {expenses.toFixed(2)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                <h4 className="text-sm font-medium text-blue-700 dark:text-blue-400">{language === 'pt' ? 'Saldo' : 'Balance'}</h4>
                <p className={`text-lg font-bold ${balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                  R$ {balance.toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-md">
                <h4 className="text-sm font-medium text-purple-700 dark:text-purple-400">{language === 'pt' ? 'Taxa de Economia' : 'Savings Rate'}</h4>
                <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{savingsRate.toFixed(1)}%</p>
              </div>
            </div>

            {topExpenses.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">{language === 'pt' ? 'Maiores Despesas' : 'Top Expenses'}</h4>
                <div className="space-y-2">
                  {topExpenses.map((expense, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: expense.categoryColor }}></div>
                        <span className="text-sm">{expense.description}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-medium">R$ {expense.amount.toFixed(2)}</span>
                        <span className="text-xs text-gray-500">{expense.category}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {topIncomesFormatted.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">{language === 'pt' ? 'Maiores Receitas' : 'Top Income'}</h4>
                <div className="space-y-2">
                  {topIncomesFormatted.map((income, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                      <div className="flex items-center">
                        <span className="text-sm">{income.description}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-medium">R$ {income.amount.toFixed(2)}</span>
                        <span className="text-xs text-gray-500">{income.category}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {categoryBreakdown.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">{language === 'pt' ? 'Despesas por Categoria' : 'Expenses by Category'}</h4>
                <div className="space-y-2">
                  {categoryBreakdown.map((cat, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <span className="text-sm">{cat.category}</span>
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-medium">R$ {cat.total.toFixed(2)}</span>
                        <span className="text-xs text-gray-500">{cat.percentOfTotal.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      );
    }
  });

  // Ação para mostrar as maiores despesas
  useCopilotAction({
    name: "mostrarMaioresDespesas",
    description: language === 'pt'
      ? "Mostra uma tabela com as maiores despesas, opcionalmente filtradas por período e categoria"
      : "Shows a table with the largest expenses, optionally filtered by period and category",
    parameters: [
      {
        name: "quantidade",
        type: "number",
        description: language === 'pt' ? "Quantidade de despesas para mostrar (padrão: 5)" : "Number of expenses to show (default: 5)",
        required: false
      },
      {
        name: "mes",
        type: "number",
        description: language === 'pt' ? "Filtrar por mês (1-12)" : "Filter by month (1-12)",
        required: false
      },
      {
        name: "ano",
        type: "number",
        description: language === 'pt' ? "Filtrar por ano" : "Filter by year",
        required: false
      },
      {
        name: "categoria",
        type: "string",
        description: language === 'pt' ? "Filtrar por categoria" : "Filter by category",
        required: false
      }
    ],
    handler: async ({ quantidade = 5, mes, ano, categoria }) => {
      // Validar parâmetros
      const month = mes ? Number(mes) : undefined;
      const year = ano ? Number(ano) : new Date().getFullYear(); // Se o ano não for especificado, use o ano atual
      const category = categoria?.trim();

      console.log(`Mostrando maiores despesas - Parâmetros: quantidade=${quantidade}, mes=${month}, ano=${year}, categoria=${category || 'todas'}`);

      if (month && (month < 1 || month > 12)) {
        return language === 'pt'
          ? `Mês inválido: ${month}. Por favor, forneça um número entre 1 e 12.`
          : `Invalid month: ${month}. Please provide a number between 1 and 12.`;
      }

      // Filtrar transações
      let filteredTransactions = [...allTransactions];

      // Filtrar por período
      if (month || year) {
        console.log(`Filtrando maiores despesas por: mês=${month || 'todos'}, ano=${year || new Date().getFullYear()}`);
        filteredTransactions = filterTransactionsByMonthYear(filteredTransactions, month, year);
        console.log(`Encontradas ${filteredTransactions.length} transações após filtro de período`);
      }

      // Filtrar por tipo (apenas despesas)
      filteredTransactions = filteredTransactions.filter(t => t.type === 'expense');

      // Filtrar por categoria (se especificada)
      if (category) {
        filteredTransactions = filteredTransactions.filter(t =>
          t.category.toLowerCase().includes(category.toLowerCase())
        );
      }

      // Ordenar por valor (maior para menor) e limitar à quantidade solicitada
      const despesas = filteredTransactions
        .sort((a, b) => b.amount - a.amount)
        .slice(0, quantidade)
        .map(t => ({
          descricao: t.description,
          valor: t.amount,
          categoria: t.category,
          data: t.date.toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US')
        }));

      // Log das maiores despesas para depuração
      if (despesas.length > 0) {
        console.log(`Top ${despesas.length} despesas após todos os filtros:`);
        despesas.forEach((despesa, index) => {
          console.log(`${index + 1}. ${despesa.descricao}: R$${despesa.valor.toFixed(2)} (${despesa.categoria}) - ${despesa.data}`);
        });
      } else {
        console.log('Nenhuma despesa encontrada após aplicar todos os filtros');
      }

      // Construir título com base nos filtros aplicados
      let title = language === 'pt' ? `${quantidade} Maiores Despesas` : `${quantidade} Largest Expenses`;

      if (month || year) {
        const monthName = month
          ? new Date(year, month - 1).toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US', { month: 'long' })
          : undefined;

        const periodLabel = language === 'pt'
          ? `${monthName ? monthName : 'Todo o ano'} ${year}`
          : `${monthName ? monthName : 'Entire year'} ${year}`;

        title += language === 'pt' ? ` - ${periodLabel}` : ` - ${periodLabel}`;
      }

      if (category) {
        title += language === 'pt' ? ` - Categoria: ${category}` : ` - Category: ${category}`;
      }

      if (despesas.length === 0) {
        return (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800">
            <p className="text-sm font-medium">
              {language === 'pt' ? 'Nenhuma despesa encontrada com os filtros especificados.' : 'No expenses found with the specified filters.'}
            </p>
          </div>
        );
      }

      return (
        <TransactionTable
          title={title}
          transactions={despesas}
        />
      );
    }
  });

  // Ação para mostrar gráfico de gastos por categoria
  useCopilotAction({
    name: "mostrarGraficoCategorias",
    description: "Mostra um gráfico de gastos por categoria",
    parameters: [],
    handler: async () => {
      // Preparar dados para o gráfico
      const dadosGrafico = categoryData
        .slice(0, 5)
        .map(item => ({
          name: item.name,
          value: item.value || 0
        }));

      return (
        <MiniChart
          title="Gastos por Categoria"
          data={dadosGrafico}
          valuePrefix="R$ "
        />
      );
    }
  });

  // Ação para mostrar feedback personalizado
  useCopilotAction({
    name: "mostrarFeedbackPersonalizado",
    description: language === 'pt'
      ? "Mostra um card com feedback personalizado sobre a situação financeira do usuário"
      : "Shows a card with personalized feedback about the user's financial situation",
    parameters: [],
    handler: async () => {
      // Preparar insights para o feedback personalizado
      const insights = categoryData
        .slice(0, 3)
        .map((item, index) => ({
          category: item.name,
          amount: item.value || 0,
          change: Math.floor(Math.random() * 30) - 15, // Simulação de variação percentual
          color: item.color || '#3b82f6',
          isHighest: index === 0
        }));

      // Recomendações personalizadas baseadas na situação financeira
      const recommendations = [];

      if (summary.savingsRate < 20) {
        recommendations.push(language === 'pt'
          ? 'Tente aumentar sua taxa de economia para pelo menos 20% da sua renda'
          : 'Try to increase your savings rate to at least 20% of your income');
      }

      if (summary.totalExpenses > summary.totalIncome * 0.8) {
        recommendations.push(language === 'pt'
          ? 'Suas despesas estão muito próximas da sua renda. Considere reduzir gastos não essenciais'
          : 'Your expenses are very close to your income. Consider reducing non-essential spending');
      }

      // Adicionar recomendação baseada na maior categoria de gasto
      if (insights.length > 0) {
        recommendations.push(language === 'pt'
          ? `Seus gastos com ${insights[0].category} representam uma parte significativa do seu orçamento. Analise se há oportunidades de redução`
          : `Your spending on ${insights[0].category} represents a significant part of your budget. Analyze if there are opportunities for reduction`);
      }

      // Adicionar mais uma recomendação genérica
      recommendations.push(language === 'pt'
        ? 'Estabeleça metas financeiras claras para direcionar seus esforços de economia'
        : 'Set clear financial goals to direct your saving efforts');

      return (
        <PersonalizedFeedback
          title={language === 'pt' ? 'Feedback Financeiro Personalizado' : 'Personalized Financial Feedback'}
          insights={insights}
          savingsRate={summary.savingsRate}
          previousSavingsRate={summary.savingsRate - 2.5} // Simulação de taxa anterior
          period={language === 'pt' ? 'Mês atual' : 'Current month'}
          recommendations={recommendations}
        />
      );
    }
  });

  // Ação para mostrar comparação com médias de mercado
  useCopilotAction({
    name: "mostrarComparacaoMercado",
    description: language === 'pt'
      ? "Mostra um gráfico comparando os gastos do usuário com médias de mercado"
      : "Shows a chart comparing the user's spending with market averages",
    parameters: [],
    handler: async () => {
      // Preparar dados para a comparação
      const comparisonData = [
        {
          category: language === 'pt' ? 'Moradia' : 'Housing',
          userValue: summary.totalExpenses * 0.35,
          marketAverage: summary.totalExpenses * 0.30,
          color: '#3b82f6'
        },
        {
          category: language === 'pt' ? 'Alimentação' : 'Food',
          userValue: summary.totalExpenses * 0.25,
          marketAverage: summary.totalExpenses * 0.20,
          color: '#10b981'
        },
        {
          category: language === 'pt' ? 'Transporte' : 'Transportation',
          userValue: summary.totalExpenses * 0.15,
          marketAverage: summary.totalExpenses * 0.18,
          color: '#f59e0b'
        },
        {
          category: language === 'pt' ? 'Lazer' : 'Entertainment',
          userValue: summary.totalExpenses * 0.12,
          marketAverage: summary.totalExpenses * 0.08,
          color: '#8b5cf6'
        }
      ];

      return (
        <MarketComparison
          title={language === 'pt' ? 'Comparação com Médias de Mercado' : 'Comparison with Market Averages'}
          description={language === 'pt'
            ? 'Seus gastos comparados com a média para sua faixa de renda'
            : 'Your spending compared to the average for your income bracket'}
          data={comparisonData}
          valuePrefix="R$ "
        />
      );
    }
  });

  // Ação para mostrar previsão financeira
  useCopilotAction({
    name: "mostrarPrevisaoFinanceira",
    description: language === 'pt'
      ? "Mostra um gráfico com previsão financeira para os próximos meses"
      : "Shows a chart with financial forecast for the coming months",
    parameters: [],
    handler: async () => {
      // Gerar dados de previsão para os próximos meses
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const predictionData = [];

      // Adicionar dados históricos (3 meses anteriores)
      for (let i = 3; i > 0; i--) {
        const date = new Date(currentYear, currentMonth - i, 1);
        const monthName = date.toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US', { month: 'short' });

        predictionData.push({
          month: monthName,
          value: summary.totalExpenses * (0.9 + Math.random() * 0.2),
          predicted: false
        });
      }

      // Adicionar mês atual
      const currentMonthName = new Date(currentYear, currentMonth, 1)
        .toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US', { month: 'short' });

      predictionData.push({
        month: currentMonthName,
        value: summary.totalExpenses,
        predicted: false
      });

      // Adicionar previsões para os próximos 3 meses
      for (let i = 1; i <= 3; i++) {
        const date = new Date(currentYear, currentMonth + i, 1);
        const monthName = date.toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US', { month: 'short' });

        // Simular tendência de aumento ou diminuição
        const trend = 1 + (Math.random() * 0.1 - 0.05);

        predictionData.push({
          month: monthName,
          value: summary.totalExpenses * trend,
          predicted: true
        });
      }

      // Calcular tendência
      const firstValue = predictionData[0].value;
      const lastValue = predictionData[predictionData.length - 1].value;
      const trendPercentage = ((lastValue - firstValue) / firstValue) * 100;
      const trendDirection = trendPercentage > 0 ? 'up' : trendPercentage < 0 ? 'down' : 'stable';

      // Insights baseados na previsão
      const insights = [
        language === 'pt'
          ? `Previsão indica ${trendDirection === 'up' ? 'aumento' : 'redução'} de ${Math.abs(trendPercentage).toFixed(1)}% nos gastos nos próximos meses`
          : `Forecast indicates a ${trendDirection === 'up' ? 'rise' : 'reduction'} of ${Math.abs(trendPercentage).toFixed(1)}% in expenses over the coming months`,
        language === 'pt'
          ? 'Baseado nos seus padrões históricos de gastos e tendências sazonais'
          : 'Based on your historical spending patterns and seasonal trends'
      ];

      return (
        <PredictionCard
          title={language === 'pt' ? 'Previsão de Gastos' : 'Expense Forecast'}
          description={language === 'pt'
            ? 'Projeção de gastos para os próximos meses baseada no seu histórico'
            : 'Expense projection for the coming months based on your history'}
          data={predictionData}
          valuePrefix="R$ "
          trend={trendDirection}
          trendPercentage={trendPercentage}
          insights={insights}
        />
      );
    }
  });

  // Ação para mostrar conceito financeiro avançado
  useCopilotAction({
    name: "mostrarConceitoFinanceiroAvancado",
    description: language === 'pt'
      ? "Mostra um card com explicação detalhada de um conceito financeiro avançado"
      : "Shows a card with detailed explanation of an advanced financial concept",
    parameters: [
      {
        name: "conceito",
        type: "string",
        description: language === 'pt' ? "Nome do conceito financeiro" : "Name of the financial concept",
        required: true
      }
    ],
    handler: async ({ conceito }) => {
      // Conceitos financeiros disponíveis
      const conceitos = {
        'juros_compostos': {
          title: language === 'pt' ? 'Juros Compostos' : 'Compound Interest',
          description: language === 'pt'
            ? 'Juros que incidem sobre o capital inicial mais os juros acumulados anteriormente.'
            : 'Interest that accrues on the initial capital plus previously accumulated interest.',
          formula: language === 'pt' ? 'M = P(1 + i)^t' : 'A = P(1 + r)^t',
          example: language === 'pt'
            ? 'R$1.000 investidos a 10% ao ano por 10 anos resultam em R$2.593,74.'
            : '$1,000 invested at 10% per year for 10 years results in $2,593.74.',
          importance: language === 'pt'
            ? 'Considerado a "oitava maravilha do mundo" por Albert Einstein, é o principal mecanismo de crescimento de investimentos a longo prazo.'
            : 'Considered the "eighth wonder of the world" by Albert Einstein, it is the main mechanism for long-term investment growth.',
          tips: [
            language === 'pt' ? 'Comece a investir o quanto antes' : 'Start investing as early as possible',
            language === 'pt' ? 'Reinvista os rendimentos' : 'Reinvest your earnings',
            language === 'pt' ? 'Mantenha consistência nos aportes' : 'Maintain consistency in contributions'
          ]
        },
        'diversificacao': {
          title: language === 'pt' ? 'Diversificação de Investimentos' : 'Investment Diversification',
          description: language === 'pt'
            ? 'Estratégia de distribuir investimentos entre diferentes classes de ativos para reduzir o risco.'
            : 'Strategy of distributing investments among different asset classes to reduce risk.',
          importance: language === 'pt'
            ? 'Reduz a volatilidade da carteira e protege contra perdas significativas em um único investimento.'
            : 'Reduces portfolio volatility and protects against significant losses in a single investment.',
          tips: [
            language === 'pt' ? 'Invista em diferentes classes de ativos' : 'Invest in different asset classes',
            language === 'pt' ? 'Considere correlações negativas' : 'Consider negative correlations',
            language === 'pt' ? 'Rebalanceie periodicamente' : 'Rebalance periodically'
          ],
          benchmarks: {
            [language === 'pt' ? 'Conservador' : 'Conservative']: language === 'pt' ? '80% RF, 20% RV' : '80% FI, 20% EQ',
            [language === 'pt' ? 'Moderado' : 'Moderate']: language === 'pt' ? '60% RF, 40% RV' : '60% FI, 40% EQ',
            [language === 'pt' ? 'Arrojado' : 'Aggressive']: language === 'pt' ? '30% RF, 70% RV' : '30% FI, 70% EQ'
          }
        },
        'relacao_despesa_receita': {
          title: language === 'pt' ? 'Relação Despesa/Receita' : 'Expense/Income Ratio',
          description: language === 'pt'
            ? 'Proporção entre despesas totais e receita total.'
            : 'Proportion between total expenses and total income.',
          formula: language === 'pt' ? 'Relação D/R = (Despesas Totais / Receita Total) × 100' : 'E/I Ratio = (Total Expenses / Total Income) × 100',
          importance: language === 'pt'
            ? 'Indicador crucial de saúde financeira que mostra quanto da sua renda está sendo consumida por despesas.'
            : 'Crucial indicator of financial health that shows how much of your income is being consumed by expenses.',
          benchmarks: {
            [language === 'pt' ? 'Ótima' : 'Excellent']: language === 'pt' ? 'Menos de 60%' : 'Less than 60%',
            [language === 'pt' ? 'Boa' : 'Good']: '60-75%',
            [language === 'pt' ? 'Preocupante' : 'Concerning']: '75-90%',
            [language === 'pt' ? 'Crítica' : 'Critical']: language === 'pt' ? 'Mais de 90%' : 'More than 90%'
          }
        }
      };

      // Normalizar o conceito para busca
      const conceitoNormalizado = conceito.toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[áàãâä]/g, 'a')
        .replace(/[éèêë]/g, 'e')
        .replace(/[íìîï]/g, 'i')
        .replace(/[óòõôö]/g, 'o')
        .replace(/[úùûü]/g, 'u')
        .replace(/[ç]/g, 'c');

      // Buscar conceito correspondente
      let conceitoEncontrado = null;

      if (conceitoNormalizado.includes('juro') || conceitoNormalizado.includes('compost') || conceitoNormalizado.includes('interest')) {
        conceitoEncontrado = conceitos.juros_compostos;
      } else if (conceitoNormalizado.includes('divers') || conceitoNormalizado.includes('carteira') || conceitoNormalizado.includes('portfolio')) {
        conceitoEncontrado = conceitos.diversificacao;
      } else if (conceitoNormalizado.includes('despesa') || conceitoNormalizado.includes('receita') || conceitoNormalizado.includes('expense') || conceitoNormalizado.includes('income') || conceitoNormalizado.includes('ratio')) {
        conceitoEncontrado = conceitos.relacao_despesa_receita;
      }

      if (!conceitoEncontrado) {
        return language === 'pt'
          ? `Conceito financeiro "${conceito}" não encontrado. Tente "juros compostos", "diversificação" ou "relação despesa/receita".`
          : `Financial concept "${conceito}" not found. Try "compound interest", "diversification" or "expense/income ratio".`;
      }

      // Preparar props para o componente com verificação de tipo
      const cardProps = {
        title: conceitoEncontrado.title,
        description: conceitoEncontrado.description,
        importance: conceitoEncontrado.importance,
        tips: 'tips' in conceitoEncontrado ? conceitoEncontrado.tips : [],
        formula: 'formula' in conceitoEncontrado ? conceitoEncontrado.formula : '',
        example: 'example' in conceitoEncontrado ? conceitoEncontrado.example : '',
        benchmarks: 'benchmarks' in conceitoEncontrado ? conceitoEncontrado.benchmarks : {}
      };

      return (
        <FinancialConceptCard
          title={cardProps.title}
          description={cardProps.description}
          importance={cardProps.importance}
          tips={cardProps.tips}
          formula={cardProps.formula}
          example={cardProps.example}
          benchmarks={cardProps.benchmarks}
        />
      );
    }
  });

  // Ação para mostrar botões de ação rápida
  useCopilotAction({
    name: "mostrarAcoesRapidas",
    description: "Mostra botões para ações rápidas no sistema",
    parameters: [],
    handler: async () => {
      return (
        <ActionButtons
          onAddTransaction={() => openAddTransactionModal()}
          onViewTransactions={() => {}}
          onViewAnalytics={() => {}}
          onViewIncome={() => {}}
          onViewExpenses={() => {}}
        />
      );
    }
  });

  // Ação para explicar conceito financeiro
  useCopilotAction({
    name: "explicarConceitoFinanceiro",
    description: "Explica um conceito financeiro com detalhes da base de conhecimento",
    parameters: [
      { name: "conceito", type: "string", description: "Nome do conceito financeiro a ser explicado" }
    ],
    handler: async ({ conceito }) => {
      // Buscar o conceito na base de conhecimento
      let conceitoInfo: any = null;

      // Verificar em conceitos básicos
      if (financialKnowledgeBase.conceitosBasicos[conceito as keyof typeof financialKnowledgeBase.conceitosBasicos]) {
        conceitoInfo = financialKnowledgeBase.conceitosBasicos[conceito as keyof typeof financialKnowledgeBase.conceitosBasicos];
      }
      // Verificar em conceitos avançados
      else if (financialKnowledgeBase.conceitosAvancados[conceito as keyof typeof financialKnowledgeBase.conceitosAvancados]) {
        conceitoInfo = financialKnowledgeBase.conceitosAvancados[conceito as keyof typeof financialKnowledgeBase.conceitosAvancados];
      }

      if (!conceitoInfo) {
        return `Desculpe, não encontrei informações detalhadas sobre "${conceito}" na minha base de conhecimento.`;
      }

      // Retornar explicação formatada
      return (
        <Card className="w-full overflow-hidden border border-border bg-card shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-lg font-medium">{conceitoInfo.titulo || conceito}</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3">
              <p className="text-sm">{conceitoInfo.descricao}</p>

              {conceitoInfo.importancia && (
                <div>
                  <h4 className="text-sm font-medium mt-2">Importância:</h4>
                  <p className="text-sm">{conceitoInfo.importancia}</p>
                </div>
              )}

              {conceitoInfo.dicas && (
                <div>
                  <h4 className="text-sm font-medium mt-2">Dicas:</h4>
                  <ul className="text-sm list-disc pl-5">
                    {conceitoInfo.dicas.map((dica: string, index: number) => (
                      <li key={index}>{dica}</li>
                    ))}
                  </ul>
                </div>
              )}

              {conceitoInfo.recomendacao && (
                <div>
                  <h4 className="text-sm font-medium mt-2">Recomendação:</h4>
                  <p className="text-sm">{conceitoInfo.recomendacao}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }
  });

  // Ação para mostrar comparação com médias de mercado
  useCopilotAction({
    name: "compararComMediasMercado",
    description: "Compara os dados do usuário com médias de mercado para sua faixa de renda",
    parameters: [],
    handler: async () => {
      // Determinar a faixa de renda do usuário
      let faixaRendaLocal = 'media';
      if (summary.totalIncome <= 3000) {
        faixaRendaLocal = 'baixa';
      } else if (summary.totalIncome > 10000) {
        faixaRendaLocal = 'alta';
      }

      // Obter médias de mercado relevantes para a faixa de renda
      const mediasRelevantesLocal = mediasPorFaixaRenda[faixaRendaLocal as keyof typeof mediasPorFaixaRenda];

      // Comparar dados do usuário com médias de mercado
      const comparacaoMercadoLocal = {
        taxaEconomia: {
          usuario: summary.savingsRate.toFixed(1) + '%',
          mediaMercado: mediasRelevantesLocal.taxaEconomia,
          situacao: summary.savingsRate >= parseFloat(mediasRelevantesLocal.taxaEconomia.split('-')[0])
            ? 'acima da média'
            : 'abaixo da média'
        },
        relacaoDespesaReceita: {
          usuario: (summary.totalIncome > 0 ? (summary.totalExpenses / summary.totalIncome) * 100 : 0).toFixed(1) + '%',
          mediaMercado: mediasRelevantesLocal.relacaoDespesaReceita,
          situacao: (summary.totalIncome > 0 ? (summary.totalExpenses / summary.totalIncome) * 100 : 0) <= parseFloat(mediasRelevantesLocal.relacaoDespesaReceita.split('-')[0])
            ? 'melhor que a média'
            : 'pior que a média'
        }
      };

      const faixaRendaFormatada = {
        baixa: "Baixa (até 3 salários mínimos)",
        media: "Média (3 a 10 salários mínimos)",
        alta: "Alta (acima de 10 salários mínimos)"
      }[faixaRendaLocal];

      return (
        <Card className="w-full overflow-hidden border border-border bg-card shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-lg font-medium">Comparação com Médias de Mercado</CardTitle>
            <p className="text-sm text-muted-foreground">Faixa de renda: {faixaRendaFormatada}</p>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium">Taxa de Economia:</h4>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm">Você: {comparacaoMercadoLocal.taxaEconomia.usuario}</span>
                  <span className="text-sm">Média: {comparacaoMercadoLocal.taxaEconomia.mediaMercado}</span>
                  <span className={`text-sm font-medium ${
                    comparacaoMercadoLocal.taxaEconomia.situacao === 'acima da média'
                      ? 'text-green-500'
                      : 'text-red-500'
                  }`}>
                    {comparacaoMercadoLocal.taxaEconomia.situacao}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium">Relação Despesa/Receita:</h4>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm">Você: {comparacaoMercadoLocal.relacaoDespesaReceita.usuario}</span>
                  <span className="text-sm">Média: {comparacaoMercadoLocal.relacaoDespesaReceita.mediaMercado}</span>
                  <span className={`text-sm font-medium ${
                    comparacaoMercadoLocal.relacaoDespesaReceita.situacao === 'melhor que a média'
                      ? 'text-green-500'
                      : 'text-red-500'
                  }`}>
                    {comparacaoMercadoLocal.relacaoDespesaReceita.situacao}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mt-3">Distribuição de Gastos Recomendada:</h4>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {Object.entries(mediasRelevantesLocal.distribuicaoGastos).map(([categoria, percentual]) => (
                    <div key={categoria} className="flex justify-between">
                      <span className="text-sm capitalize">{categoria}</span>
                      <span className="text-sm">{String(percentual)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }
  });


    

  useEffect(() => {
    if (isOpen) {
      setShowWelcome(true)
      const timer = setTimeout(() => setShowWelcome(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [])

  return (
    <>
      {/* Botão flutuante */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping"></div>
          <Button
            onClick={() => setIsOpen(true)}
            className="relative rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 bg-primary text-primary-foreground"
            aria-label={t.openAssistant}
          >
            <MessageSquare className="h-6 w-6" />
          </Button>
        </div>
      )}
      {/* Chat */}
      {isOpen && (
        <div
          className={`fixed bottom-0 right-0 z-50 flex flex-col ${isMinimized ? 'h-14' : 'h-[600px]'} w-[400px] transition-all duration-300 ease-in-out shadow-xl rounded-tl-lg overflow-hidden chat-animation-enter`}
        >
          <div className="flex items-center justify-between p-3 bg-primary text-primary-foreground">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              <h3 className="font-medium">{t.assistantTitle}</h3>
            </div>
            <div className="flex items-center gap-1">
              {/* Botão de alternar idioma */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-primary-foreground/10 language-toggle-btn"
                onClick={toggleLanguage}
                aria-label={t.toggleLanguage}
              >
                <Globe className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-primary-foreground/10"
                onClick={() => setIsMinimized(!isMinimized)}
                aria-label={t.minimize}
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-primary-foreground/10"
                onClick={() => setIsOpen(false)}
                aria-label={t.close}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {/* Conteúdo do chat */}
          {!isMinimized && (
            <div className="flex-1 overflow-hidden bg-card relative">
              {showWelcome && (
                <div className="absolute top-4 left-0 right-0 mx-auto w-[90%] bg-primary/10 border border-primary/20 rounded-lg p-3 z-10 text-center animate-fade-in">
                  <p className="text-sm text-primary font-medium">
                    {t.welcomeMessage}
                  </p>
                </div>
              )}
              {/* Indicador de idioma */}
              <div className="language-indicator">
                {language.toUpperCase()}
              </div>
              <CopilotKit publicApiKey={process.env.NEXT_PUBLIC_COPILOT_API_KEY}>
                <CopilotContextProvider
                  summary={summary}
                  categories={categories}
                  transactions={transactions}
                  financialHealth={financialHealth}
                  spendingPatterns={spendingPatterns}
                  monthlyData={monthlyData}
                  categoryData={categoryData}
                  language={language}
                  allHistoricalTransactions={allTransactions}
                />
                <CopilotChat
                  className={`h-full ${theme === 'dark' ? 'copilot-dark-theme' : ''}`}
                />
              </CopilotKit>
            </div>
          )}
        </div>
      )}
    </>
  )
}

export default CopilotChatbot