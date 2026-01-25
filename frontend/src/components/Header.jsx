import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Menu, X, User, ChevronRight, LogOut, LayoutDashboard, ShieldCheck, Zap, Star } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
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
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-gradient-to-t from-black to-zinc-900/95 backdrop-blur-sm" data-testid="main-header">
      <div className="container mx-auto px-6">
        <div className="flex h-16 items-center justify-between gap-8">
         
          <Link to="/" className="flex items-center space-x-2 shrink-0" data-testid="header-logo">
            <div className="text-xl font-black tracking-tighter text-white uppercase italic">
              Down<span className="text-orange-500">Pricer</span>
            </div>
          </Link>

          {/* --- DESKTOP SEARCH --- */}
          <div className="hidden md:flex flex-1 max-w-md">
            <form onSubmit={handleSearch} className="w-full relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-orange-500 transition-colors" />
              <input
                type="text"
                placeholder="Rechercher un article..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full bg-[#0A0A0A] border-white/5 text-white placeholder:text-white/20 focus:ring-orange-500/20 focus:border-orange-500/50 rounded-full transition-all h-10 border text-sm outline-none"
              />
            </form>
          </div>

          {/* --- DESKTOP NAV --- */}
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
                {/* PRO DESKTOP */}
                {hasSTier() && (
                  <button
                    onClick={() => navigate('/pro/dashboard')}
                    className="px-4 py-2 text-[11px] font-black uppercase tracking-widest text-emerald-400 hover:bg-emerald-500/5 rounded-full transition-colors flex items-center gap-2"
                  >
                    <Star size={12} className="fill-emerald-400" /> Pro
                  </button>
                )}
                {/* ADMIN DESKTOP */}
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
            className="md:hidden p-2 text-white/60 hover:text-white bg-white/5 rounded-xl border border-white/5"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* --- MOBILE MENU (SANS RECHERCHE) --- */}
        {mobileMenuOpen && (
          <div className="md:hidden py-6 space-y-6 border-t border-white/5 bg-black animate-in fade-in slide-in-from-top-4 duration-300">
            
            <div className="grid gap-1 px-2">
              {/* Liens de base toujours visibles */}
              {!user && <MobileNavLink onClick={() => { navigate('/faire-demande'); setMobileMenuOpen(false); }}>Faire une demande</MobileNavLink>}
              <MobileNavLink onClick={() => { navigate('/minisite'); setMobileMenuOpen(false); }}>Mon Site</MobileNavLink>
             
              {user ? (
                <>
                  {/* Section Utilisateur Connecté */}
                  <div className="h-[1px] bg-white/5 my-2 mx-4" />
                 
                  {hasRole('CLIENT') && (
                    <MobileNavLink onClick={() => { navigate('/mes-demandes'); setMobileMenuOpen(false); }}>
                      Mes demandes sourcing
                    </MobileNavLink>
                  )}

                  {hasRole('SELLER') ? (
                    <MobileNavLink onClick={() => { navigate('/seller/dashboard'); setMobileMenuOpen(false); }}>
                      Dashboard Vendeur
                    </MobileNavLink>
                  ) : (
                    <MobileNavLink onClick={() => { navigate('/devenir-vendeur'); setMobileMenuOpen(false); }}>
                      Devenir Vendeur
                    </MobileNavLink>
                  )}

                  {/* --- LE PRO OUBLIÉ EST ICI --- */}
                  {hasSTier() && (
                    <MobileNavLink
                      onClick={() => { navigate('/pro/dashboard'); setMobileMenuOpen(false); }}
                      className="text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 mb-1"
                    >
                      <span className="flex items-center gap-2 italic font-black">
                        <Star size={14} className="fill-emerald-400" /> Accès Pro S-Tier
                      </span>
                    </MobileNavLink>
                  )}

                  {/* ACCÈS ADMIN MOBILE */}
                  {hasRole('ADMIN') && (
                    <MobileNavLink
                      onClick={() => { navigate('/admin/dashboard'); setMobileMenuOpen(false); }}
                      className="text-orange-500 bg-orange-500/5 border border-orange-500/10"
                    >
                      Console Administration
                    </MobileNavLink>
                  )}

                  <MobileNavLink onClick={() => { navigate('/mon-compte'); setMobileMenuOpen(false); }}>Mon compte</MobileNavLink>
                 
                  <div className="px-4 pt-4">
                    <Button
                      className="w-full bg-white/5 hover:bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl h-12 font-black uppercase text-[10px] tracking-[0.2em]"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4 mr-2" /> Terminer la session
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {/* Section Déconnecté */}
                  <MobileNavLink onClick={() => { navigate('/devenir-vendeur'); setMobileMenuOpen(false); }}>Devenir vendeur</MobileNavLink>
                  <div className="px-4 pt-4">
                    <Button
                      className="w-full bg-orange-600 hover:bg-orange-500 text-white rounded-xl h-12 font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-orange-900/20"
                      onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}
                    >
                      Connexion / S'inscrire
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

// --- COMPOSANTS DE NAVIGATION INTERNES ---

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

const MobileNavLink = ({ children, onClick, className }) => (
  <button
    onClick={onClick}
    className={`flex items-center justify-between w-full p-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/70 hover:bg-white/5 rounded-xl transition-all ${className}`}
  >
    {children}
    <ChevronRight className="h-4 w-4 text-white/20" />
  </button>
);
