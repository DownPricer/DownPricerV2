import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Menu, X, User, ChevronRight } from 'lucide-react';
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
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-black/80 backdrop-blur-xl" data-testid="main-header">
      <div className="container mx-auto px-6">
        <div className="flex h-16 items-center justify-between gap-8">
          
          <Link to="/" className="flex items-center space-x-2 shrink-0" data-testid="header-logo">
            <div className="text-xl font-black tracking-tighter text-white uppercase italic">
              Down<span className="text-orange-500">Pricer</span>
            </div>
          </Link>

          <div className="hidden md:flex flex-1 max-w-md">
            <form onSubmit={handleSearch} className="w-full relative group">
              {/* Icône passée en white/20 */}
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-orange-500 transition-colors" />
              <Input
                type="text"
                placeholder="Rechercher un article..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                /* Suppression du zinc-900 pour du white/5, bordure white/10 */
                className="pl-10 w-full bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:ring-orange-500/20 focus:border-orange-500/50 rounded-full transition-all h-10 border"
                data-testid="header-search-input"
              />
            </form>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {!user ? (
              <>
                <NavLink onClick={() => navigate('/faire-demande')}>Demande</NavLink>
                <NavLink onClick={() => navigate('/minisite')}>Mon Site</NavLink>
                <NavLink onClick={() => navigate('/devenir-vendeur')}>Vendre</NavLink>
                <div className="h-4 w-[1px] bg-white/10 mx-2" />
                <Button
                  onClick={() => navigate('/login')}
                  className="bg-white hover:bg-white/90 text-black font-bold rounded-full px-6 h-9 text-xs transition-all active:scale-95"
                  data-testid="header-login-btn"
                >
                  Connexion
                </Button>
              </>
            ) : (
              <>
                {hasRole('CLIENT') && <NavLink onClick={() => navigate('/mes-demandes')}>Mes demandes</NavLink>}
                <NavLink onClick={() => navigate('/minisite')}>Mon Site</NavLink>
                {hasRole('SELLER') ? (
                  <NavLink onClick={() => navigate('/seller/dashboard')} active>Espace Vendeur</NavLink>
                ) : (
                  <NavLink onClick={() => navigate('/devenir-vendeur')}>Devenir vendeur</NavLink>
                )}
                {hasSTier() && <NavLink onClick={() => navigate('/pro/dashboard')}>Pro</NavLink>}
                {hasRole('ADMIN') && <NavLink onClick={() => navigate('/admin/dashboard')} className="text-orange-500">Admin</NavLink>}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    {/* Icône user en white/40 */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-2 text-white/40 hover:text-white hover:bg-white/5 rounded-full"
                      data-testid="header-account-menu-btn"
                    >
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-black border-white/10 text-white min-w-[180px] p-2 shadow-2xl">
                    <DropdownMenuItem onClick={() => navigate('/mon-compte')} className="rounded-md focus:bg-white/10 focus:text-white cursor-pointer">
                      Mon compte
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem onClick={handleLogout} className="rounded-md focus:bg-red-500/10 text-red-400 focus:text-red-400 cursor-pointer">
                      Déconnexion
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </nav>

          <button
            className="md:hidden text-white/40 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="header-mobile-menu-toggle"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-6 space-y-4 border-t border-white/5 bg-black animate-in slide-in-from-top-4 duration-200">
            <form onSubmit={handleSearch} className="px-2">
              <Input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/5 border-white/10 text-white rounded-xl placeholder:text-white/20"
              />
            </form>
            <div className="grid gap-1 px-2">
              <MobileNavLink onClick={() => { navigate('/faire-demande'); setMobileMenuOpen(false); }}>Faire une demande</MobileNavLink>
              <MobileNavLink onClick={() => { navigate('/minisite'); setMobileMenuOpen(false); }}>Mon Site</MobileNavLink>
              <MobileNavLink onClick={() => { navigate('/devenir-vendeur'); setMobileMenuOpen(false); }}>Devenir vendeur</MobileNavLink>
              <Button
                className="w-full mt-4 bg-orange-600 hover:bg-orange-500 text-white rounded-xl h-12 font-bold shadow-lg shadow-orange-900/20"
                onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}
              >
                Connexion
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

const NavLink = ({ children, onClick, active, className }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors rounded-full hover:text-white ${
      active ? 'text-orange-500' : 'text-white/50 hover:bg-white/5'
    } ${className}`}
  >
    {children}
  </button>
);

const MobileNavLink = ({ children, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center justify-between w-full p-4 text-sm font-semibold text-white/70 hover:bg-white/5 rounded-xl transition-colors"
  >
    {children}
    <ChevronRight className="h-4 w-4 text-white/20" />
  </button>
);