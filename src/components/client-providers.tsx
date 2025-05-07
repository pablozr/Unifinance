'use client';

import { ReactNode } from 'react';
import { LanguageProvider } from '@/contexts/language-context';
import { AuthProvider } from '@/contexts/auth-context';
import { CopilotKit } from '@copilotkit/react-core';
import { Toaster } from '@/components/ui/sonner';

interface ClientProvidersProps {
  children: ReactNode;
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <CopilotKit publicApiKey={process.env.NEXT_PUBLIC_COPILOT_API_KEY}>
      <LanguageProvider>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </LanguageProvider>
    </CopilotKit>
  );
}
