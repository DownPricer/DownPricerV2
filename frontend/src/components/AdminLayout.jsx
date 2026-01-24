import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { 
  LayoutDashboard, Package, FolderTree, FileText, DollarSign, 
  Truck, CreditCard, Users, Globe, Settings, Download, 
  LogOut, Home, Menu, X, Zap, ShieldCheck 
} from 'lucide-react';
import { logout } from '../utils/auth';

export const AdminLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/articles', icon: Package, label: 'Articles' },
    { path: '/admin/categories', icon: FolderTree, label: 'Catégories' },
    { path: '/admin/demandes', icon: FileText, label: 'Demandes' },
    { path: '/admin/ventes', icon: DollarSign, label: 'Ventes' },
    { path: '/admin/paiements', icon: CreditCard, label: 'Paiements' },
    { path: '/admin/expeditions', icon: Truck, label: 'Expéditions' },
    { path: '/admin/users', icon: Users, label: 'Utilisateurs' },
    { path: '/admin/mini-sites', icon: Globe, label: 'Mini-sites' },
    { path: '/admin/parametres', icon: Settings, label: 'Paramètres' },
    { path: '/admin/exports', icon: Download, label: 'Exports' },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#080808] border-r border-white/5">
      {/* Logo Section */}
      <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black">
        <div className="flex items-center gap-2">
          <div className="bg-orange-500 p-1.5 rounded-lg">
            <Zap className="h-5 w-5 text-black fill-black" />
          </div>
          <h1 className="text-lg font-black tracking-tighter uppercase italic text-white">
            DP <span className="text-orange-500">Admin</span>
          </h1>
        </div>
        <button 
          className="md:hidden p-1 text-zinc-500 hover:text-white transition-colors"
          onClick={() => setMobileMenuOpen(false)}
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto no-scrollbar">
        <p className="px-3 mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Main Menu</p>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-200 group ${
                isActive
                  ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20'
                  : 'text-zinc-500 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon className={`h-4 w-4 flex-shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-orange-500' : 'text-zinc-600'}`} />
              <span className="truncate">{item.label}</span>
              {isActive && <div className="ml-auto w-1 h-1 rounded-full bg-orange-500 shadow-[0_0_8px_#f97316]" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-white/5 space-y-2 bg-black/40">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl h-10"
          onClick={() => { navigate('/'); setMobileMenuOpen(false); }}
        >
          <Home className="h-4 w-4 mr-3 text-orange-500" />
          Live Site
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-[10px] font-black uppercase tracking-widest text-red-500/70 hover:text-red-500 hover:bg-red-500/5 rounded-xl h-10"
          onClick={logout}
        >
          <LogOut className="h-4 w-4 mr-3" />
          Terminate Session
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black flex" data-testid="admin-layout">
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-md border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 bg-white/5 rounded-xl border border-white/10"
        >
          <Menu className="h-5 w-5 text-orange-500" />
        </button>
        <h1 className="text-sm font-black tracking-tighter uppercase italic text-white">
          DP <span className="text-orange-500">Admin</span>
        </h1>
        <div className="w-9" /> {/* Spacer */}
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside className={`
        md:hidden fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <SidebarContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col flex-shrink-0 sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {/* Main content Area */}
      <main className="flex-1 overflow-auto bg-black pt-16 md:pt-0">
        <div className="min-h-full border-l border-white/5">
          {children}
        </div>
      </main>
    </div>
  );
};