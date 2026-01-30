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
  TrendingUp,
  ArrowLeft,
  Sun,
  Moon
} from 'lucide-react';
import { getUser, logout, hasRole } from '../utils/auth';
import { useTheme } from '@/hooks/useTheme';

/**
 * Layout Pro avec Navigation OLED Black
 * Utilisé uniquement pour les routes /pro/*
 */
export const ProLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getUser();
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const navItems = [
    { path: '/pro/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/pro/articles', icon: Package, label: 'Articles' },
    { path: '/pro/articles/new', icon: Plus, label: 'Ajouter' },
    { path: '/pro/portfolio', icon: Wallet, label: 'Portefeuille' },
    { path: '/pro/statistics', icon: BarChart3, label: 'Stats' },
    { path: '/pro/analytics', icon: TrendingUp, label: 'Analytics' },
  ];

  if (hasRole('ADMIN')) {
    navItems.push({ path: '/pro/admin', icon: User, label: 'Admin' });
  }

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen dp-bg font-sans selection:bg-orange-500/30">
      
      {/* Navigation OLED */}
      <div className="bg-[hsl(var(--bg))] border-b border-[hsl(var(--border))] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            
            {/* Logo & Brand */}
            <div className="flex items-center gap-4">
              <div className="bg-orange-500/10 p-2 rounded-xl border border-orange-500/20">
                <Package className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <h1 className="text-sm font-black uppercase tracking-tighter leading-none">
                  Achat-Revente
                </h1>
                {hasRole('ADMIN') && (
                  <span className="text-[10px] text-orange-500 font-bold uppercase tracking-widest">Mode Admin</span>
                )}
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all ${
                      isActive
                        ? 'bg-[hsl(var(--surface-2))] text-orange-500'
                        : 'text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text))] hover:bg-[hsl(var(--surface-2))]'
                    }`}
                  >
                    <item.icon className={`h-3.5 w-3.5 mr-2 ${isActive ? 'text-orange-500' : ''}`} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Actions Utilisateur */}
            <div className="flex items-center gap-3">
              <div className="hidden xl:flex flex-col items-end mr-2">
                <span className="text-[10px] font-bold text-[hsl(var(--text))]">{user?.email}</span>
                <span className="text-[9px] text-[hsl(var(--text-muted))] uppercase tracking-tighter italic">Compte Professionnel</span>
              </div>
              
              <button
                onClick={() => navigate('/')}
                className="hidden sm:flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text))] transition-colors px-3 py-2"
              >
                <ArrowLeft className="h-3 w-3" /> Site
              </button>

              <ThemeToggleButton isDark={isDark} onClick={toggleTheme} />
              
              <button
                onClick={handleLogout}
                className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white p-2.5 rounded-xl transition-all border border-red-500/10 active:scale-95"
                title="Déconnexion"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Navigation Mobile (Défilement horizontal) */}
        <div className="lg:hidden border-t border-[hsl(var(--border))] overflow-x-auto no-scrollbar">
          <div className="flex px-4 py-3 gap-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-orange-500 text-white shadow-lg shadow-orange-900/20'
                      : 'bg-[hsl(var(--surface-2))] text-[hsl(var(--text-muted))]'
                  }`}
                >
                  <item.icon className="h-3 w-3 mr-2" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Contenu Principal */}
      <main className="relative">
        {/* Spot de lumière subtil en fond */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-orange-500/5 blur-[120px] pointer-events-none -z-10" />
        
        <div className="animate-in fade-in duration-500">
          {children}
        </div>
      </main>
    </div>
  );
};

const ThemeToggleButton = ({ isDark, onClick, className = "" }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={isDark ? "Activer le mode clair" : "Activer le mode sombre"}
    title={isDark ? "Mode clair" : "Mode sombre"}
    className={[
      "inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors",
      "border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))]",
      "text-[hsl(var(--text))] hover:bg-[hsl(var(--surface))]",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40",
      "focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--bg))]",
      className,
    ].join(" ")}
  >
    {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
  </button>
);





