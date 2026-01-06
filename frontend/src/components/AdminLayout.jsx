import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { LayoutDashboard, Package, FolderTree, FileText, DollarSign, Truck, CreditCard, Users, Globe, Settings, Download, LogOut, Home, Menu, X } from 'lucide-react';
import { logout } from '../utils/auth';

export const AdminLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/articles', icon: Package, label: 'Articles' },
    { path: '/admin/categories', icon: FolderTree, label: 'Catégories' },
    { path: '/admin/demandes', icon: FileText, label: 'Demandes clients' },
    { path: '/admin/ventes', icon: DollarSign, label: 'Ventes vendeurs' },
    { path: '/admin/paiements', icon: CreditCard, label: 'Paiements' },
    { path: '/admin/expeditions', icon: Truck, label: 'Expéditions' },
    { path: '/admin/abonnements', icon: Users, label: 'Abonnements' },
    { path: '/admin/mini-sites', icon: Globe, label: 'Mini-sites' },
    { path: '/admin/users', icon: Users, label: 'Utilisateurs' },
    { path: '/admin/parametres', icon: Settings, label: 'Paramètres' },
    { path: '/admin/exports', icon: Download, label: 'Exports' },
  ];

  const SidebarContent = () => (
    <>
      <div className="p-4 border-b border-slate-200 flex justify-between items-center">
        <h1 className="text-xl font-bold text-slate-900">DownPricer Admin</h1>
        <button 
          className="md:hidden p-1 hover:bg-slate-100 rounded"
          onClick={() => setMobileMenuOpen(false)}
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
              data-testid={`admin-menu-${item.label.toLowerCase().replace(/ /g, '-')}`}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200 space-y-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
          onClick={() => { navigate('/'); setMobileMenuOpen(false); }}
        >
          <Home className="h-4 w-4 mr-2" />
          Voir le site
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start text-red-600 hover:text-red-700"
          onClick={logout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Déconnexion
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex" data-testid="admin-layout">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 hover:bg-slate-100 rounded-lg"
        >
          <Menu className="h-6 w-6 text-slate-600" />
        </button>
        <h1 className="text-lg font-bold text-slate-900">DownPricer Admin</h1>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 z-50 bg-black/50"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside className={`
        md:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white transform transition-transform duration-300 ease-in-out flex flex-col
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <SidebarContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto pt-16 md:pt-0">
        {children}
      </main>
    </div>
  );
};