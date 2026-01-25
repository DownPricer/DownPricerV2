import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Search, Menu, X, User, ChevronRight, LogOut, 
  LayoutDashboard, ShieldCheck, Zap, Star, ShoppingBag, 
  Settings, PlusCircle 
} from 'lucide-react';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { getUser, logout, hasRole, hasSTier, refreshUser } from '../utils/auth';

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = getUser();
      if (currentUser) {
        const freshUser = await refreshUser();
        setUser(freshUser || currentUser);
      } else {
        setUser(null);
      }
    };
    loadUser();
  }, [location.pathname]);

  // Bloquer le scroll du site quand le menu mobile est ouvert
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [mobileMenuOpen]);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/?search=${searchQuery}`);
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setMobileMenuOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-[100] w-full border-b border-white/[0.06] bg-gradient-to-t from-black to-zinc-900/95 backdrop-blur-xl">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex h-16 items-center justify-between gap-8">
          
          {/* LOGO */}
          <Link to="/" className="flex items-center space-x-2 shrink-0 active:scale-95 transition-transform">
            <div className="text-xl font-black tracking-tighter text-white uppercase italic">
              Down<span className="text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]">Pricer</span>
            </div>
          </Link>

          {/* DESKTOP SEARCH */}
          <div className="hidden md:flex flex-1 max-w-md">
            <form onSubmit={handleSearch} className="w-full relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-orange-500 transition-colors" />
              <input
                type="text"
                placeholder="Rechercher un article..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full bg-white/[0.03] border-white/10 text-white placeholder:text-white/20 focus:ring-orange-500/20 focus:border-orange-500/50 rounded-full transition-all h-10 border text-sm outline-none"
              />
            </form>
          </div>

          {/* DESKTOP NAV - TOUS TES BOUTONS DESKTOP COMPLETS */}
          <nav className="hidden md:flex items-center gap-1">
            {!user ? (
              <>
                <NavLink onClick={() => navigate('/faire-demande')}>Demande</NavLink>
                <NavLink onClick={() => navigate('/minisite')}>Mon Site</NavLink>
                <NavLink onClick={() => navigate('/devenir-vendeur')}>Vendre</NavLink>
                <div className="h-4 w-[1px] bg-white/10 mx-2" />
                <Button
                  onClick={() => navigate('/login')}
                  className="bg-white hover:bg-white/90 text-black font-extrabold rounded-full px-5 h-8 text-[11px] uppercase tracking-wider transition-all active:scale-95"
                >
                  Connexion
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-1">
                {hasRole('CLIENT') && <NavLink onClick={() => navigate('/mes-demandes')}>Mes demandes</NavLink>}
                <NavLink onClick={() => navigate('/minisite')}>Mon Site</NavLink>
                
                {hasRole('SELLER') ? (
                  <NavLink onClick={() => navigate('/seller/dashboard')}>Vendeur</NavLink>
                ) : (
                  <NavLink onClick={() => navigate('/devenir-vendeur')}>Vendre</NavLink>
                )}

                {hasSTier() && (
                  <button 
                    onClick={() => navigate('/pro/dashboard')}
                    className="px-4 py-2 text-[11px] font-black uppercase tracking-widest text-emerald-400 hover:bg-emerald-500/5 rounded-full transition-colors flex items-center gap-2"
                  >
                    <Star size={12} className="fill-emerald-400" /> Pro
                  </button>
                )}

                {hasRole('ADMIN') && (
                  <button 
                    onClick={() => navigate('/admin/dashboard')}
                    className="px-4 py-2 text-[11px] font-black uppercase tracking-widest text-orange-500 hover:bg-orange-500/5 rounded-full transition-colors"
                  >
                    Admin
                  </button>
                )}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="ml-2 text-white/40 hover:text-white hover:bg-white/5 rounded-full transition-colors h-9 w-9">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-[#0A0A0A] border-white/10 text-white min-w-[180px] p-2 shadow-2xl">
                    <DropdownMenuItem onClick={() => navigate('/mon-compte')} className="rounded-md focus:bg-white/10 cursor-pointer text-xs uppercase font-black tracking-widest p-3">
                      Mon compte
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/5" />
                    <DropdownMenuItem onClick={handleLogout} className="rounded-md text-red-500 focus:bg-red-500/10 cursor-pointer text-xs uppercase font-black tracking-widest p-3">
                      <LogOut size={14} className="mr-2" /> Déconnexion
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </nav>

          {/* MOBILE TOGGLE */}
          <button
            className="md:hidden p-2 text-white bg-white/5 rounded-xl border border-white/10 active:scale-95 transition-transform"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* --- MOBILE MENU (FULL SCREEN & SCROLLABLE) --- */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 top-16 z-[99] bg-black flex flex-col">
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-6 space-y-8 pb-32">
              
              {/* Search Mobile */}
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Rechercher un produit..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.08] text-white rounded-2xl h-14 pl-12 pr-4 outline-none focus:border-orange-500/50 transition-all"
                />
              </form>

              {/* Liens Principaux */}
              <div className="grid gap-2">
                <p className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Navigation</p>
                <MobileNavLink icon={<ShoppingBag size={20}/>} onClick={() => { navigate('/minisite'); setMobileMenuOpen(false); }}>Mon Site</MobileNavLink>
                
                {!user ? (
                  <>
                    <MobileNavLink icon={<PlusCircle size={20}/>} onClick={() => { navigate('/faire-demande'); setMobileMenuOpen(false); }}>Faire une demande</MobileNavLink>
                    <MobileNavLink icon={<ShieldCheck size={20}/>} onClick={() => { navigate('/devenir-vendeur'); setMobileMenuOpen(false); }}>Devenir Vendeur</MobileNavLink>
                  </>
                ) : (
                  <>
                    {hasRole('CLIENT') && (
                      <MobileNavLink icon={<Zap size={20}/>} onClick={() => { navigate('/mes-demandes'); setMobileMenuOpen(false); }}>Mes demandes sourcing</MobileNavLink>
                    )}
                    {hasRole('SELLER') ? (
                      <MobileNavLink icon={<LayoutDashboard size={20}/>} onClick={() => { navigate('/seller/dashboard'); setMobileMenuOpen(false); }}>Dashboard Vendeur</MobileNavLink>
                    ) : (
                      <MobileNavLink icon={<ShieldCheck size={20}/>} onClick={() => { navigate('/devenir-vendeur'); setMobileMenuOpen(false); }}>Devenir Vendeur</MobileNavLink>
                    )}
                    {hasSTier() && (
                      <MobileNavLink icon={<Star size={20} className="fill-emerald-400 text-emerald-400"/>} onClick={() => { navigate('/pro/dashboard'); setMobileMenuOpen(false); }} className="text-emerald-400 bg-emerald-500/5 border-emerald-500/10">Accès Pro S-Tier</MobileNavLink>
                    )}
                    {hasRole('ADMIN') && (
                      <MobileNavLink icon={<ShieldCheck size={20} className="text-orange-500"/>} onClick={() => { navigate('/admin/dashboard'); setMobileMenuOpen(false); }} className="text-orange-500 bg-orange-500/5 border-orange-500/10">Administration</MobileNavLink>
                    )}
                  </>
                )}
              </div>

              {/* Section Compte */}
              <div className="grid gap-2 pt-6 border-t border-white/[0.05]">
                <p className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Compte</p>
                {user ? (
                  <>
                    <MobileNavLink icon={<User size={20}/>} onClick={() => { navigate('/mon-compte'); setMobileMenuOpen(false); }}>Mon profil</MobileNavLink>
                    <button
                      className="w-full mt-4 bg-red-500/5 text-red-500 rounded-2xl h-14 font-bold uppercase text-[11px] tracking-widest flex items-center justify-center gap-3 border border-red-500/10 active:scale-[0.98] transition-all"
                      onClick={handleLogout}
                    >
                      <LogOut size={18} /> Déconnexion
                    </button>
                  </>
                ) : (
                  <button
                    className="w-full mt-4 bg-orange-500 text-white rounded-2xl h-14 font-black uppercase text-xs tracking-widest shadow-lg shadow-orange-950/40 active:scale-95 transition-transform"
                    onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}
                  >
                    Connexion / S'inscrire
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

// --- COMPOSANTS INTERNES ---

const NavLink = ({ children, onClick, active, className }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-[11px] font-black uppercase tracking-[0.1em] transition-all rounded-full ${
      active ? 'text-orange-500 bg-white/5' : 'text-white/40 hover:text-white hover:bg-white/5'
    } ${className}`}
  >
    {children}
  </button>
);

const MobileNavLink = ({ children, onClick, icon, className }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-4 w-full p-4 text-[12px] font-bold uppercase tracking-wider text-zinc-200 bg-white/[0.02] border border-white/[0.05] rounded-2xl active:bg-white/10 active:scale-[0.98] transition-all ${className}`}
  >
    <span className="text-zinc-500">{icon}</span>
    <span className="flex-1 text-left">{children}</span>
    <ChevronRight className="h-4 w-4 text-zinc-700" />
  </button>
);
