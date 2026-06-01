// Bu dosya, uygulamanın giriş noktasıdır ve TanStack Query'in QueryClientProvider'ını ve Sonner Toaster komponentini sarmalar.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import '@/api/axios';
import App from './App.tsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster />
    </QueryClientProvider>
  </StrictMode>
);


