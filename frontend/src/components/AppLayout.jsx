import React from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from './Header';

/**
 * Layout principal pour toutes les pages (sauf admin qui utilise AdminLayout)
 * Inclut le Header global
 */
export const AppLayout = ({ children }) => {
  const location = useLocation();
  
  // Ne pas afficher le Header pour les routes admin (elles utilisent AdminLayout)
  const isAdminRoute = location.pathname.startsWith('/admin');
  
  // Ne pas afficher le Header pour les routes Pro (elles utilisent ProLayout)
  const isProRoute = location.pathname.startsWith('/pro');
  
  // Ne pas afficher le Header pour les routes de login/signup (elles ont leur propre style)
  const isAuthRoute = location.pathname === '/login' || location.pathname === '/signup';
  
  // Ne pas afficher le Header pour les routes minisite publiques (elles gèrent leur propre header selon le plan)
  const isMinisiteRoute = location.pathname.startsWith('/s/');
  
  const showHeader = !isAdminRoute && !isProRoute && !isAuthRoute && !isMinisiteRoute;
  
  return (
    <div className="min-h-screen bg-gray-50">
      {showHeader && <Header />}
      <main>
        {children}
      </main>
    </div>
  );
};

