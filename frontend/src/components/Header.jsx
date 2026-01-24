// import React, { useState, useEffect } from 'react';
// import { Link, useNavigate, useLocation } from 'react-router-dom';
// import { Search, Menu, X, User } from 'lucide-react';
// import { Button } from './ui/button';
// import { Input } from './ui/input';
// import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
// import { getUser, logout, hasRole, hasSTier, refreshUser } from '../utils/auth';

// export const Header = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [user, setUser] = useState(null);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

//   const isMarketplace = !location.pathname.startsWith('/admin') && 
//                         !location.pathname.startsWith('/mini-site');

//   useEffect(() => {
//     // Au changement de page, rafraîchir les données utilisateur
//     const loadUser = async () => {
//       const currentUser = getUser();
//       if (currentUser) {
//         // Rafraîchir les données depuis le serveur pour avoir les rôles à jour
//         const freshUser = await refreshUser();
//         setUser(freshUser || currentUser);
//       } else {
//         setUser(null);
//       }
//     };
//     loadUser();
//   }, [location.pathname]);

//   const handleSearch = (e) => {
//     e.preventDefault();
//     navigate(`/?search=${searchQuery}`);
//     setMobileMenuOpen(false);
//   };

//   const handleLogout = () => {
//     logout();
//   };

//   return (
//     <header className={`sticky top-0 z-50 w-full border-b ${
//       isMarketplace 
//         ? 'bg-slate-900/95 backdrop-blur-xl border-slate-800 text-white' 
//         : 'bg-white/95 backdrop-blur-xl border-slate-200 text-slate-900'
//     }`} data-testid="main-header">
//       <div className="container mx-auto px-4">
//         <div className="flex h-16 items-center justify-between gap-4">
//           <Link to="/" className="flex items-center space-x-2" data-testid="header-logo">
//             <div className={`text-xl font-bold tracking-tight ${
//               isMarketplace ? 'text-orange-500' : 'text-slate-900'
//             }`}>
//               DownPricer
//             </div>
//           </Link>

//           <div className="hidden md:flex flex-1 max-w-md mx-8">
//             <form onSubmit={handleSearch} className="w-full relative">
//               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//               <Input
//                 type="text"
//                 placeholder="Rechercher un article…"
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//                 className={`pl-10 w-full ${
//                   isMarketplace 
//                     ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 focus:border-orange-500' 
//                     : 'bg-white border-slate-300 focus:border-blue-500'
//                 }`}
//                 data-testid="header-search-input"
//               />
//             </form>
//           </div>

//           <nav className="hidden md:flex items-center space-x-2">
//             {!user ? (
//               <>
//                 <Button
//                   variant="ghost"
//                   onClick={() => navigate('/faire-demande')}
//                   className={isMarketplace ? 'text-white hover:text-orange-500' : ''}
//                   data-testid="header-faire-demande-btn"
//                 >
//                   Faire une demande
//                 </Button>
//                 <Button
//                   variant="ghost"
//                   onClick={() => navigate('/minisite')}
//                   className={isMarketplace ? 'text-white hover:text-orange-500' : ''}
//                   data-testid="header-mon-site-btn"
//                 >
//                   Mon Site
//                 </Button>
//                 <Button
//                   variant="ghost"
//                   onClick={() => navigate('/devenir-vendeur')}
//                   className={isMarketplace ? 'text-white hover:text-orange-500' : ''}
//                   data-testid="header-devenir-vendeur-btn"
//                 >
//                   Devenir vendeur
//                 </Button>
//                 <Button
//                   onClick={() => navigate('/login')}
//                   className={isMarketplace 
//                     ? 'bg-orange-500 hover:bg-orange-600 text-white rounded-full'
//                     : 'bg-slate-900 hover:bg-slate-800 text-white'
//                   }
//                   data-testid="header-login-btn"
//                 >
//                   Connexion
//                 </Button>
//               </>
//             ) : (
//               <>
//                 {hasRole('CLIENT') && (
//                   <Button
//                     variant="ghost"
//                     onClick={() => navigate('/mes-demandes')}
//                     className={isMarketplace ? 'text-white hover:text-orange-500' : ''}
//                     data-testid="header-mes-demandes-btn"
//                   >
//                     Mes demandes
//                   </Button>
//                 )}
//                 <Button
//                   variant="ghost"
//                   onClick={() => navigate('/minisite')}
//                   className={isMarketplace ? 'text-white hover:text-orange-500' : ''}
//                   data-testid="header-mon-site-btn"
//                 >
//                   Mon Site
//                 </Button>
//                 {hasRole('SELLER') ? (
//                   <Button
//                     variant="ghost"
//                     onClick={() => navigate('/seller/dashboard')}
//                     className={isMarketplace ? 'text-white hover:text-orange-500' : ''}
//                     data-testid="header-seller-btn"
//                   >
//                     Espace Vendeur
//                   </Button>
//                 ) : (
//                   <Button
//                     variant="ghost"
//                     onClick={() => navigate('/devenir-vendeur')}
//                     className={isMarketplace ? 'text-white hover:text-orange-500' : ''}
//                     data-testid="header-devenir-vendeur-btn"
//                   >
//                     Devenir vendeur
//                   </Button>
//                 )}
//                 {hasSTier() && (
//                   <Button
//                     variant="ghost"
//                     onClick={() => navigate('/pro/dashboard')}
//                     className={isMarketplace ? 'text-white hover:text-orange-500' : ''}
//                     data-testid="header-pro-btn"
//                   >
//                     Achat / Revente
//                   </Button>
//                 )}
//                 {hasRole('ADMIN') && (
//                   <Button
//                     variant="ghost"
//                     onClick={() => navigate('/admin/dashboard')}
//                     className={isMarketplace ? 'text-white hover:text-orange-500' : ''}
//                     data-testid="header-admin-btn"
//                   >
//                     Admin
//                   </Button>
//                 )}
//                 <DropdownMenu>
//                   <DropdownMenuTrigger asChild>
//                     <Button
//                       variant="ghost"
//                       size="icon"
//                       className={isMarketplace ? 'text-white hover:text-orange-500' : ''}
//                       data-testid="header-account-menu-btn"
//                     >
//                       <User className="h-5 w-5" />
//                     </Button>
//                   </DropdownMenuTrigger>
//                   <DropdownMenuContent align="end" className={isMarketplace ? 'bg-slate-900 border-slate-800 text-white' : ''}>
//                     <DropdownMenuItem onClick={() => navigate('/mon-compte')} className={isMarketplace ? 'text-white focus:bg-slate-800' : ''}>
//                       Mon compte
//                     </DropdownMenuItem>
//                     <DropdownMenuSeparator className={isMarketplace ? 'bg-slate-800' : ''} />
//                     <DropdownMenuItem onClick={handleLogout} className={isMarketplace ? 'text-red-400 focus:bg-slate-800' : 'text-red-600'}>
//                       Déconnexion
//                     </DropdownMenuItem>
//                   </DropdownMenuContent>
//                 </DropdownMenu>
//               </>
//             )}
//           </nav>

//           <button
//             className="md:hidden"
//             onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
//             data-testid="header-mobile-menu-toggle"
//           >
//             {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
//           </button>
//         </div>

//         {mobileMenuOpen && (
//           <div className="md:hidden py-4 space-y-2 border-t border-slate-800">
//             <form onSubmit={handleSearch} className="mb-4">
//               <Input
//                 type="text"
//                 placeholder="Rechercher…"
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//                 className={isMarketplace ? 'bg-slate-800 border-slate-700 text-white' : ''}
//               />
//             </form>
//             {!user ? (
//               <>
//                 <Button
//                   variant="ghost"
//                   className="w-full justify-start"
//                   onClick={() => { navigate('/faire-demande'); setMobileMenuOpen(false); }}
//                 >
//                   Faire une demande
//                 </Button>
//                 <Button
//                   variant="ghost"
//                   className="w-full justify-start"
//                   onClick={() => { navigate('/minisite'); setMobileMenuOpen(false); }}
//                 >
//                   Mon Site
//                 </Button>
//                 <Button
//                   variant="ghost"
//                   className="w-full justify-start"
//                   onClick={() => { navigate('/devenir-vendeur'); setMobileMenuOpen(false); }}
//                 >
//                   Devenir vendeur
//                 </Button>
//                 <Button
//                   className="w-full"
//                   onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}
//                 >
//                   Connexion
//                 </Button>
//               </>
//             ) : (
//               <>
//                 {hasRole('CLIENT') && (
//                   <Button
//                     variant="ghost"
//                     className="w-full justify-start"
//                     onClick={() => { navigate('/mes-demandes'); setMobileMenuOpen(false); }}
//                   >
//                     Mes demandes
//                   </Button>
//                 )}
//                 <Button
//                   variant="ghost"
//                   className="w-full justify-start"
//                   onClick={() => { navigate('/minisite'); setMobileMenuOpen(false); }}
//                 >
//                   Mon Site
//                 </Button>
//                 {hasRole('SELLER') ? (
//                   <Button
//                     variant="ghost"
//                     className="w-full justify-start"
//                     onClick={() => { navigate('/seller/dashboard'); setMobileMenuOpen(false); }}
//                   >
//                     Espace Vendeur
//                   </Button>
//                 ) : (
//                   <Button
//                     variant="ghost"
//                     className="w-full justify-start"
//                     onClick={() => { navigate('/devenir-vendeur'); setMobileMenuOpen(false); }}
//                   >
//                     Devenir vendeur
//                   </Button>
//                 )}
//                 {hasSTier() && (
//                   <Button
//                     variant="ghost"
//                     className="w-full justify-start"
//                     onClick={() => { navigate('/pro/dashboard'); setMobileMenuOpen(false); }}
//                   >
//                     Achat / Revente
//                   </Button>
//                 )}
//                 {hasRole('ADMIN') && (
//                   <Button
//                     variant="ghost"
//                     className="w-full justify-start"
//                     onClick={() => { navigate('/admin/dashboard'); setMobileMenuOpen(false); }}
//                   >
//                     Admin
//                   </Button>
//                 )}
//                 <Button
//                   variant="ghost"
//                   className="w-full justify-start"
//                   onClick={() => { navigate('/mon-compte'); setMobileMenuOpen(false); }}
//                 >
//                   Mon compte
//                 </Button>
//                 <Button
//                   variant="ghost"
//                   className="w-full justify-start"
//                   onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
//                 >
//                   Déconnexion
//                 </Button>
//               </>
//             )}
//           </div>
//         )}
//       </div>
//     </header>
//   );
// };

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

  // On force le thème sombre/noir partout pour l'unité visuelle
  const isDark = true; 

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
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800/50 bg-[#050505]/80 backdrop-blur-md" data-testid="main-header">
      <div className="container mx-auto px-6">
        <div className="flex h-16 items-center justify-between gap-8">
          
          {/* Logo avec style épuré */}
          <Link to="/" className="flex items-center space-x-2 shrink-0" data-testid="header-logo">
            <div className="text-xl font-black tracking-tighter text-white uppercase italic">
              Down<span className="text-orange-500">Pricer</span>
            </div>
          </Link>

          {/* Barre de recherche style "Command Palette" */}
          <div className="hidden md:flex flex-1 max-w-md">
            <form onSubmit={handleSearch} className="w-full relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-orange-500 transition-colors" />
              <Input
                type="text"
                placeholder="Rechercher un article..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full bg-zinc-900/50 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 focus:ring-orange-500/20 focus:border-orange-500/50 rounded-full transition-all h-10"
                data-testid="header-search-input"
              />
            </form>
          </div>

          {/* Navigation principale */}
          <nav className="hidden md:flex items-center gap-1">
            {!user ? (
              <>
                <NavLink onClick={() => navigate('/faire-demande')}>Demande</NavLink>
                <NavLink onClick={() => navigate('/minisite')}>Mon Site</NavLink>
                <NavLink onClick={() => navigate('/devenir-vendeur')}>Vendre</NavLink>
                <div className="h-4 w-[1px] bg-zinc-800 mx-2" />
                <Button
                  onClick={() => navigate('/login')}
                  className="bg-white hover:bg-zinc-200 text-black font-bold rounded-full px-6 h-9 text-xs transition-transform active:scale-95"
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
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-full"
                      data-testid="header-account-menu-btn"
                    >
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-white min-w-[180px] p-2">
                    <DropdownMenuItem onClick={() => navigate('/mon-compte')} className="rounded-md focus:bg-zinc-800 focus:text-white cursor-pointer">
                      Mon compte
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-zinc-800" />
                    <DropdownMenuItem onClick={handleLogout} className="rounded-md focus:bg-red-500/10 text-red-400 focus:text-red-400 cursor-pointer">
                      Déconnexion
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </nav>

          {/* Mobile Toggle */}
          <button
            className="md:hidden text-zinc-400 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="header-mobile-menu-toggle"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Menu Mobile */}
        {mobileMenuOpen && (
          <div className="md:hidden py-6 space-y-4 border-t border-zinc-900 animate-in slide-in-from-top-4 duration-200">
            <form onSubmit={handleSearch} className="px-2">
              <Input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-white rounded-xl"
              />
            </form>
            <div className="grid gap-1 px-2">
              <MobileNavLink onClick={() => { navigate('/faire-demande'); setMobileMenuOpen(false); }}>Faire une demande</MobileNavLink>
              <MobileNavLink onClick={() => { navigate('/minisite'); setMobileMenuOpen(false); }}>Mon Site</MobileNavLink>
              <MobileNavLink onClick={() => { navigate('/devenir-vendeur'); setMobileMenuOpen(false); }}>Devenir vendeur</MobileNavLink>
              <Button
                className="w-full mt-4 bg-orange-600 hover:bg-orange-500 text-white rounded-xl h-12 font-bold"
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

// Sous-composants pour garder un code propre
const NavLink = ({ children, onClick, active, className }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors rounded-full hover:text-white ${
      active ? 'text-orange-500' : 'text-zinc-400 hover:bg-zinc-900'
    } ${className}`}
  >
    {children}
  </button>
);

const MobileNavLink = ({ children, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center justify-between w-full p-4 text-sm font-semibold text-zinc-300 hover:bg-zinc-900 rounded-xl transition-colors"
  >
    {children}
    <ChevronRight className="h-4 w-4 text-zinc-600" />
  </button>
);