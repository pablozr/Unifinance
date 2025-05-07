/**
 * Base de conhecimento financeiro para o chatbot do UniFinance
 * Contém conceitos financeiros, dicas, médias de mercado e estratégias de investimento
 */

export const financialKnowledgeBase = {
  // Conceitos financeiros básicos
  conceitosBasicos: {
    orcamento: {
      titulo: "Orçamento",
      descricao: "Um plano financeiro que aloca receitas para despesas, economias e investimentos em um período específico.",
      importancia: "Fundamental para controle financeiro e planejamento de curto e longo prazo.",
      dicas: [
        "Registre todas as receitas e despesas",
        "Categorize seus gastos",
        "Revise seu orçamento mensalmente",
        "Use a regra 50-30-20: 50% para necessidades, 30% para desejos e 20% para economias"
      ]
    },
    fundoEmergencia: {
      titulo: "Fundo de Emergência",
      descricao: "Reserva financeira para cobrir despesas inesperadas ou períodos sem renda.",
      importancia: "Proporciona segurança financeira e evita endividamento em situações imprevistas.",
      recomendacao: "3 a 6 meses de despesas essenciais",
      dicas: [
        "Mantenha em conta de alta liquidez",
        "Não use para gastos não emergenciais",
        "Reponha sempre que utilizar"
      ]
    },
    taxaEconomia: {
      titulo: "Taxa de Economia",
      descricao: "Percentual da renda que é poupada ou investida.",
      calculo: "Taxa de Economia = (Renda - Despesas) / Renda × 100",
      recomendacao: "Mínimo de 10-20% da renda",
      benchmarks: {
        baixa: "Menos de 10%",
        media: "10-20%",
        alta: "Mais de 20%"
      }
    },
    inflacao: {
      titulo: "Inflação",
      descricao: "Aumento generalizado e contínuo dos preços de bens e serviços.",
      impacto: "Reduz o poder de compra do dinheiro ao longo do tempo.",
      mediaBrasil: {
        "2020": "4.52%",
        "2021": "10.06%",
        "2022": "5.79%",
        "2023": "4.62%"
      }
    }
  },
  
  // Conceitos financeiros avançados
  conceitosAvancados: {
    jurosCompostos: {
      titulo: "Juros Compostos",
      descricao: "Juros que incidem sobre o capital inicial mais os juros acumulados anteriormente.",
      formula: "M = P(1 + i)^t, onde M é o montante final, P é o principal, i é a taxa de juros e t é o tempo.",
      exemplo: "R$1.000 investidos a 10% ao ano por 10 anos resultam em R$2.593,74.",
      importancia: "Considerado a 'oitava maravilha do mundo' por Albert Einstein, é o principal mecanismo de crescimento de investimentos a longo prazo."
    },
    diversificacao: {
      titulo: "Diversificação de Investimentos",
      descricao: "Estratégia de distribuir investimentos em diferentes classes de ativos para reduzir riscos.",
      beneficios: [
        "Redução de risco sem necessariamente reduzir retorno",
        "Proteção contra volatilidade de mercados específicos",
        "Exposição a diferentes oportunidades de crescimento"
      ],
      tipos: [
        "Entre classes de ativos (ações, renda fixa, imóveis)",
        "Geográfica (mercados nacionais e internacionais)",
        "Setorial (diferentes indústrias)",
        "Temporal (aportes regulares ao longo do tempo)"
      ]
    },
    relacaoDespesaReceita: {
      titulo: "Relação Despesa/Receita",
      descricao: "Proporção entre despesas totais e receita total.",
      calculo: "Relação D/R = (Despesas Totais / Receita Total) × 100",
      benchmarks: {
        otima: "Menos de 60%",
        boa: "60-75%",
        preocupante: "75-90%",
        critica: "Mais de 90%"
      },
      importancia: "Indicador crucial de saúde financeira que mostra quanto da sua renda está sendo consumida por despesas."
    },
    liquidez: {
      titulo: "Liquidez",
      descricao: "Facilidade com que um ativo pode ser convertido em dinheiro sem perda significativa de valor.",
      tipos: [
        "Alta liquidez: dinheiro em conta corrente, Tesouro Selic",
        "Média liquidez: alguns fundos de investimento, LCIs, LCAs",
        "Baixa liquidez: imóveis, alguns títulos de longo prazo"
      ],
      importancia: "Balancear ativos de diferentes níveis de liquidez é essencial para um planejamento financeiro eficaz."
    }
  },
  
  // Médias de mercado e benchmarks
  mediasMercado: {
    gastosMediasFamiliares: {
      habitacao: "36.6% da renda",
      alimentacao: "17.5% da renda",
      transporte: "15.7% da renda",
      saude: "8.1% da renda",
      educacao: "4.7% da renda",
      lazer: "2.9% da renda",
      fonte: "IBGE - Pesquisa de Orçamentos Familiares 2017-2018"
    },
    taxasRetornoInvestimentos: {
      poupanca: {
        mediaAnual5Anos: "4.5%",
        observacao: "Geralmente abaixo da inflação"
      },
      tesouroDireto: {
        selic: "média de 7.5% ao ano (5 anos)",
        ipca: "média de IPCA + 5% ao ano (5 anos)"
      },
      fundosRendaFixa: "média de 8.2% ao ano (5 anos)",
      fundosMultimercado: "média de 9.7% ao ano (5 anos)",
      ibovespa: {
        mediaAnual5Anos: "13.2%",
        observacao: "Alta volatilidade"
      },
      imoveis: {
        valorizacao: "média de 3.5% ao ano (5 anos)",
        aluguel: "rendimento médio de 0.4% ao mês"
      },
      fonte: "Dados compilados de B3, ANBIMA e FGV (2023)"
    },
    endividamento: {
      mediaBrasileira: "30.2% das famílias com dívidas em atraso",
      comprometimentoRenda: "média de 30.1% da renda comprometida com dívidas",
      fonte: "CNC - Pesquisa de Endividamento e Inadimplência do Consumidor (2023)"
    }
  },
  
  // Estratégias de investimento
  estrategiasInvestimento: {
    iniciantes: {
      titulo: "Estratégia para Iniciantes",
      perfil: "Conservador a moderado, foco em segurança e aprendizado",
      alocacao: [
        "70% em renda fixa (Tesouro Direto, CDBs)",
        "20% em fundos de investimento diversificados",
        "10% em ações de empresas sólidas ou ETFs"
      ],
      dicas: [
        "Comece com investimentos simples e seguros",
        "Estude antes de investir",
        "Faça aportes regulares, mesmo que pequenos",
        "Diversifique gradualmente"
      ]
    },
    construcaoPatrimonio: {
      titulo: "Construção de Patrimônio",
      perfil: "Moderado, horizonte de médio a longo prazo",
      alocacao: [
        "50% em renda fixa (diversificada entre pré e pós-fixados)",
        "30% em renda variável (ações, ETFs, fundos imobiliários)",
        "15% em fundos multimercado",
        "5% em reserva de oportunidade"
      ],
      dicas: [
        "Aumente gradualmente exposição a ativos de maior risco",
        "Reinvista os rendimentos",
        "Revise a carteira trimestralmente",
        "Mantenha disciplina nos aportes mensais"
      ]
    },
    preRetirada: {
      titulo: "Pré-Aposentadoria/Independência Financeira",
      perfil: "Moderado a conservador, foco em preservação e renda",
      alocacao: [
        "60% em ativos geradores de renda (títulos, FIIs, ações dividendeiras)",
        "30% em renda fixa de alta qualidade",
        "10% em ativos de crescimento para combater inflação"
      ],
      dicas: [
        "Priorize investimentos que geram renda passiva",
        "Reduza gradualmente exposição a ativos voláteis",
        "Planeje a sequência de retiradas para otimizar impostos",
        "Mantenha reserva de emergência reforçada"
      ]
    }
  }
};

// Médias de mercado específicas por faixa de renda
export const mediasPorFaixaRenda = {
  baixa: { // Até 3 salários mínimos
    taxaEconomia: "5-10%",
    relacaoDespesaReceita: "85-95%",
    distribuicaoGastos: {
      habitacao: "40%",
      alimentacao: "25%",
      transporte: "15%",
      outros: "20%"
    }
  },
  media: { // 3 a 10 salários mínimos
    taxaEconomia: "10-20%",
    relacaoDespesaReceita: "75-85%",
    distribuicaoGastos: {
      habitacao: "35%",
      alimentacao: "20%",
      transporte: "15%",
      saude: "8%",
      educacao: "7%",
      outros: "15%"
    }
  },
  alta: { // Acima de 10 salários mínimos
    taxaEconomia: "20-30%",
    relacaoDespesaReceita: "65-75%",
    distribuicaoGastos: {
      habitacao: "30%",
      alimentacao: "15%",
      transporte: "12%",
      saude: "10%",
      educacao: "10%",
      investimentos: "15%",
      outros: "8%"
    }
  }
};
