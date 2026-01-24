import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Package, 
  Plus, 
  Wallet, 
  BarChart3, 
  LogOut, 
  User, 
  TrendingUp
} from 'lucide-react';
import { getUser, logout, hasRole } from '../utils/auth';

/**
 * Layout Pro avec Navigation Emergent
 * Utilisé uniquement pour les routes /pro/*
 */
export const ProLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getUser();

  const navItems = [
    { path: '/pro/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/pro/articles', icon: Package, label: 'Articles' },
    { path: '/pro/articles/new', icon: Plus, label: 'Ajouter' },
    { path: '/pro/portfolio', icon: Wallet, label: 'Portefeuille' },
    { path: '/pro/statistics', icon: BarChart3, label: 'Stats' },
    { path: '/pro/analytics', icon: TrendingUp, label: 'Analytics' },
  ];

  // Ajouter l'admin si l'utilisateur est admin Downpricer
  if (hasRole('ADMIN')) {
    navItems.push({ path: '/pro/admin', icon: User, label: 'Admin' });
  }

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Emergent */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-indigo-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">
                Achat-Revente {hasRole('ADMIN') && <span className="text-red-600">(Admin)</span>}
              </h1>
            </div>
            
            <nav className="hidden md:flex space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === item.path
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 hidden sm:inline">{user?.email}</span>
              <button
                onClick={() => navigate('/')}
                className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1"
              >
                Retour au site
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
        
        {/* Navigation mobile */}
        <div className="md:hidden border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                  location.pathname === item.path
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Contenu */}
      <main>
        {children}
      </main>
    </div>
  );
};


