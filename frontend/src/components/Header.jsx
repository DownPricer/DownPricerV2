import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Search, Menu, X, User, ChevronRight, LogOut, 
  LayoutDashboard, ShieldCheck, Zap, Star, ShoppingBag, 
  Settings, PlusCircle 
} from 'lucide-react';
import { Button } from './ui/button';
import { getUser, logout, hasRole, hasSTier, refreshUser } from '../utils/auth';

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 1. Charger l'utilisateur
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

  // 2. EMPECHER LE SCROLL DU SITE QUAND LE MENU EST OUVERT
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
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
    /* --- MODIFICATION ICI : DEGRADÉ NOIR VERS GRIS (BAS VERS HAUT) --- */
    <header className="sticky top-0 z-[100] w-full border-b border-white/[0.06] bg-gradient-to-t from-black to-zinc-950/90 backdrop-blur-xl">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        
        {/* LOGO */}
        <Link to="/" className="flex items-center shrink-0 active:scale-95 transition-transform">
          <div className="text-xl font-extrabold tracking-tighter text-white uppercase italic">
            Down<span className="text-orange-500 drop-shadow-[0_0_10px_rgba(249,115,22,0.3)]">Pricer</span>
          </div>
        </Link>

        {/* DESKTOP NAV (Hidden on Mobile) */}
        <nav className="hidden md:flex items-center gap-4">
           {/* ... tes liens desktop ici ... */}
           {!user && <Button onClick={() => navigate('/login')} className="bg-white text-black rounded-full text-xs font-bold px-6">Connexion</Button>}
        </nav>

        {/* MOBILE MENU TOGGLE */}
        <button
          className="md:hidden p-2 text-white bg-white/5 rounded-xl border border-white/10 active:bg-white/10"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* --- MENU MOBILE --- */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 z-[99] bg-[#0A0A0B] flex flex-col">
          {/* Conteneur Scrollable */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-6 space-y-8 pb-32 custom-scrollbar">
            
            {/* Barre de recherche Mobile */}
            <form onSubmit={handleSearch} className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-orange-500 transition-colors" />
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.08] text-white rounded-2xl h-14 pl-12 pr-4 outline-none focus:border-orange-500/50 transition-all text-base"
              />
            </form>

            {/* Liens de Navigation */}
            <div className="grid gap-2">
              <p className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2">Navigation</p>
              
              <MobileNavLink icon={<ShoppingBag size={20}/>} onClick={() => { navigate('/minisite'); setMobileMenuOpen(false); }}>
                Mon Site Boutique
              </MobileNavLink>

              {!user ? (
                <MobileNavLink icon={<PlusCircle size={20}/>} onClick={() => { navigate('/faire-demande'); setMobileMenuOpen(false); }}>
                  Faire une demande
                </MobileNavLink>
              ) : (
                <>
                  {hasRole('CLIENT') && (
                    <MobileNavLink icon={<Zap size={20}/>} onClick={() => { navigate('/mes-demandes'); setMobileMenuOpen(false); }}>
                      Mes demandes sourcing
                    </MobileNavLink>
                  )}

                  {hasRole('SELLER') ? (
                    <MobileNavLink icon={<LayoutDashboard size={20}/>} onClick={() => { navigate('/seller/dashboard'); setMobileMenuOpen(false); }}>
                      Espace Vendeur
                    </MobileNavLink>
                  ) : (
                    <MobileNavLink icon={<ShieldCheck size={20}/>} onClick={() => { navigate('/devenir-vendeur'); setMobileMenuOpen(false); }} className="text-orange-400 bg-orange-500/5 border-orange-500/10">
                      Devenir Vendeur
                    </MobileNavLink>
                  )}

                  {hasSTier() && (
                    <MobileNavLink 
                      icon={<Star size={20} className="fill-emerald-400 text-emerald-400"/>}
                      onClick={() => { navigate('/pro/dashboard'); setMobileMenuOpen(false); }}
                      className="text-emerald-400 bg-emerald-500/5 border-emerald-500/10"
                    >
                      Tableau de bord Pro
                    </MobileNavLink>
                  )}
                </>
              )}
            </div>

            {/* Section Compte / Actions */}
            <div className="grid gap-2 pt-6 border-t border-white/[0.05]">
              <p className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2">Mon Compte</p>
              
              {user ? (
                <>
                  <MobileNavLink icon={<User size={20}/>} onClick={() => { navigate('/mon-compte'); setMobileMenuOpen(false); }}>
                    Paramètres du profil
                  </MobileNavLink>
                  <button
                    className="w-full mt-4 bg-red-500/5 hover:bg-red-500/10 text-red-500 rounded-2xl h-14 font-bold uppercase text-[11px] tracking-widest flex items-center justify-center gap-3 transition-all border border-red-500/10 active:scale-[0.98]"
                    onClick={handleLogout}
                  >
                    <LogOut size={18} /> Déconnexion
                  </button>
                </>
              ) : (
                <div className="pt-2">
                  <button
                    className="w-full bg-orange-500 text-white rounded-2xl h-14 font-black uppercase text-xs tracking-widest shadow-lg shadow-orange-950/40 active:scale-[0.98] transition-transform"
                    onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}
                  >
                    Connexion / Inscription
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

// --- COMPOSANT BOUTON MOBILE ---
const MobileNavLink = ({ children, onClick, icon, className }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-4 w-full p-4 text-[13px] font-bold uppercase tracking-wider text-zinc-200 bg-white/[0.02] border border-white/[0.05] rounded-2xl active:bg-white/10 active:scale-[0.98] transition-all ${className}`}
  >
    <span className="text-zinc-500">{icon}</span>
    <span className="flex-1 text-left">{children}</span>
    <ChevronRight className="h-4 w-4 text-zinc-700" />
  </button>
);