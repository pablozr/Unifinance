'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Importar arquivos de tradução
import enTranslations from '@/locales/en.json';
import ptTranslations from '@/locales/pt.json';

// Tipos de idiomas suportados
export type Language = 'en' | 'pt';

// Interface para o contexto
interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

// Criar o contexto
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Traduções disponíveis
const translations = {
  en: enTranslations,
  pt: ptTranslations
};

// Função para obter o valor de uma chave aninhada
const getNestedValue = (obj: any, path: string): string => {
  const keys = path.split('.');
  let result = obj;

  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key];
    } else {
      return path; // Retorna a chave se não encontrar a tradução
    }
  }

  return typeof result === 'string' ? result : path;
};

// Provider do contexto
export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  // Efeito para carregar o idioma salvo
  useEffect(() => {
    // Verificar se há um idioma salvo no localStorage
    const getSavedLanguage = (): Language => {
      try {
        const savedLanguage = localStorage.getItem('language');
        return (savedLanguage as Language) || 'en';
      } catch (error) {
        console.error('Error accessing localStorage:', error);
        return 'en';
      }
    };

    setLanguageState(getSavedLanguage());
  }, []);

  // Função para alterar o idioma
  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    try {
      localStorage.setItem('language', newLanguage);
    } catch (error) {
      console.error('Error setting language in localStorage:', error);
    }
  };

  // Função para traduzir uma chave
  const t = (key: string): string => {
    const currentTranslations = translations[language];
    return getNestedValue(currentTranslations, key);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Hook para usar o contexto
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);

  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }

  return context;
};
