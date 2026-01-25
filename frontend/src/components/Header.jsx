import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Search, Menu, X, User, ChevronRight, LogOut, 
  LayoutDashboard, ShieldCheck, Zap, Star, ShoppingBag, 
  Settings, HelpCircle, PlusCircle 
} from 'lucide-react';
import { Button } from './ui/button';
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
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#0A0A0B]/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          
          {/* LOGO */}
          <Link to="/" className="flex items-center space-x-2 shrink-0 transition-transform active:scale-95">
            <div className="text-xl font-black tracking-tighter text-white uppercase italic">
              Down<span className="text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]">Pricer</span>
            </div>
          </Link>

          {/* DESKTOP SEARCH */}
          <div className="hidden md:flex flex-1 max-w-md">
            <form onSubmit={handleSearch} className="w-full relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-orange-500 transition-colors" />
              <input
                type="text"
                placeholder="Rechercher un article..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full bg-white/[0.03] border-white/[0.08] text-white placeholder:text-zinc-600 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50 rounded-full transition-all h-10 border text-sm outline-none"
              />
            </form>
          </div>

          {/* DESKTOP NAV */}
          <nav className="hidden md:flex items-center gap-2">
            {!user ? (
              <>
                <NavLink onClick={() => navigate('/faire-demande')}>Demande</NavLink>
                <NavLink onClick={() => navigate('/minisite')}>Mon Site</NavLink>
                <NavLink onClick={() => navigate('/devenir-vendeur')}>Vendre</NavLink>
                <div className="h-4 w-[1px] bg-white/10 mx-2" />
                <Button
                  onClick={() => navigate('/login')}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full px-6 h-9 text-[11px] uppercase tracking-wider transition-all hover:shadow-[0_0_15px_rgba(249,115,22,0.3)] active:scale-95"
                >
                  Connexion
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                {hasRole('CLIENT') && <NavLink onClick={() => navigate('/mes-demandes')}>Mes demandes</NavLink>}
                <NavLink onClick={() => navigate('/minisite')}>Mon Site</NavLink>
                
                {/* STATUS BADGE DYNAMIC */}
                {hasRole('ADMIN') ? (
                   <button onClick={() => navigate('/admin/dashboard')} className="px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-500 rounded-full text-[10px] font-black uppercase tracking-tight hover:bg-orange-500/20 transition-colors">
                    Admin
                  </button>
                ) : hasSTier() ? (
                  <button onClick={() => navigate('/pro/dashboard')} className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-tight hover:bg-emerald-500/20 transition-colors flex items-center gap-1.5">
                    <Star size={10} className="fill-emerald-400" /> Pro
                  </button>
                ) : null}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full bg-white/5 border border-white/10 p-0 hover:bg-white/10">
                      <User className="h-4 w-4 text-white" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-[#121214] border-white/10 text-white min-w-[200px] p-1.5 shadow-2xl rounded-xl">
                    <DropdownMenuItem onClick={() => navigate('/mon-compte')} className="rounded-lg focus:bg-white/5 cursor-pointer text-[11px] uppercase font-bold tracking-wider p-3">
                      <Settings size={14} className="mr-2 text-zinc-400" /> Mon compte
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/5" />
                    <DropdownMenuItem onClick={handleLogout} className="rounded-lg text-red-400 focus:bg-red-500/10 focus:text-red-400 cursor-pointer text-[11px] uppercase font-bold tracking-wider p-3">
                      <LogOut size={14} className="mr-2" /> Déconnexion
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </nav>

          {/* MOBILE TOGGLE */}
          <button
            className="md:hidden p-2.5 text-white bg-white/5 rounded-xl border border-white/10 active:scale-90 transition-transform"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* --- MOBILE MENU --- */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-x-0 top-[65px] bottom-0 bg-[#0A0A0B] z-50 overflow-y-auto animate-in slide-in-from-bottom-2 duration-300">
            <div className="p-4 space-y-6">
              
              {/* Search Mobile */}
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Rechercher sur DownPricer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.08] text-white rounded-2xl h-14 pl-12 pr-4 outline-none focus:border-orange-500/50 transition-all text-sm"
                />
              </form>

              <div className="grid gap-2">
                <p className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Navigation</p>
                
                <MobileNavLink icon={<ShoppingBag size={18}/>} onClick={() => { navigate('/minisite'); setMobileMenuOpen(false); }}>
                  Mon Site Personnel
                </MobileNavLink>

                {!user ? (
                  <MobileNavLink icon={<PlusCircle size={18}/>} onClick={() => { navigate('/faire-demande'); setMobileMenuOpen(false); }}>
                    Faire une demande
                  </MobileNavLink>
                ) : (
                  <>
                    {hasRole('CLIENT') && (
                      <MobileNavLink icon={<Zap size={18}/>} onClick={() => { navigate('/mes-demandes'); setMobileMenuOpen(false); }}>
                        Mes Demandes Sourcing
                      </MobileNavLink>
                    )}

                    {hasRole('SELLER') ? (
                      <MobileNavLink icon={<LayoutDashboard size={18}/>} onClick={() => { navigate('/seller/dashboard'); setMobileMenuOpen(false); }}>
                        Espace Vendeur
                      </MobileNavLink>
                    ) : (
                      <MobileNavLink icon={<ShieldCheck size={18}/>} onClick={() => { navigate('/devenir-vendeur'); setMobileMenuOpen(false); }} className="text-orange-400 bg-orange-500/5 border-orange-500/10">
                        Devenir Vendeur
                      </MobileNavLink>
                    )}

                    {hasSTier() && (
                      <MobileNavLink 
                        icon={<Star size={18} className="fill-emerald-400"/>}
                        onClick={() => { navigate('/pro/dashboard'); setMobileMenuOpen(false); }}
                        className="text-emerald-400 bg-emerald-500/5 border-emerald-500/10"
                      >
                        Accès Pro S-Tier
                      </MobileNavLink>
                    )}
                  </>
                )}
              </div>

              {/* Account Section */}
              <div className="grid gap-2 pt-4 border-t border-white/5">
                {user ? (
                  <>
                    <MobileNavLink icon={<User size={18}/>} onClick={() => { navigate('/mon-compte'); setMobileMenuOpen(false); }}>
                      Paramètres Compte
                    </MobileNavLink>
                    <button
                      className="w-full mt-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-2xl h-14 font-bold uppercase text-[11px] tracking-widest flex items-center justify-center gap-2 transition-colors border border-red-500/10"
                      onClick={handleLogout}
                    >
                      <LogOut size={18} /> Déconnexion
                    </button>
                  </>
                ) : (
                  <button
                    className="w-full mt-4 bg-orange-500 text-white rounded-2xl h-14 font-black uppercase text-[11px] tracking-widest shadow-[0_10px_20px_-5px_rgba(249,115,22,0.3)]"
                    onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}
                  >
                    Connexion / Inscription
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

// --- SOUS-COMPOSANTS ---

const NavLink = ({ children, onClick, active, className }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-all rounded-full ${
      active ? 'text-orange-500 bg-white/5' : 'text-zinc-400 hover:text-white hover:bg-white/5'
    } ${className}`}
  >
    {children}
  </button>
);

const MobileNavLink = ({ children, onClick, icon, className }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-4 w-full p-4 text-[12px] font-bold uppercase tracking-wider text-zinc-300 bg-white/[0.02] border border-white/[0.05] rounded-2xl active:bg-white/10 active:scale-[0.98] transition-all ${className}`}
  >
    <span className="text-zinc-500">{icon}</span>
    <span className="flex-1 text-left">{children}</span>
    <ChevronRight className="h-4 w-4 text-zinc-600" />
  </button>
);