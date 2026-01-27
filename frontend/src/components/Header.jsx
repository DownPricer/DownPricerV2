import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  Menu,
  X,
  User,
  ChevronRight,
  LogOut,
  LayoutDashboard,
  ShieldCheck,
  Zap,
  Star,
  ShoppingBag,
  ClipboardList,
} from "lucide-react";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { getUser, logout, hasRole, hasSTier, refreshUser, getToken } from "../utils/auth";
import api from "../utils/api";
import { resolveMinisiteEntry } from "../utils/minisiteAccess";

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Load user on route change (kept)
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

  // Prevent scroll behind mobile drawer (UX)
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const closeMobile = () => setMobileMenuOpen(false);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/?search=${encodeURIComponent(searchQuery)}`);
    closeMobile();
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    closeMobile();
    navigate("/");
  };

  const handleMinisiteClick = async () => {
    const token = getToken();
    if (!token) {
      // Pas connecté => pricing
      navigate("/minisite");
      return;
    }

    try {
      // Guard d'entrée : max 2 calls (/auth/me et /minisites/my)
      const [userResponse, minisiteResponse] = await Promise.allSettled([
        api.get('/auth/me'),
        api.get('/minisites/my').catch(err => {
          // 404 et 403 sont normaux (pas de minisite)
          if (err.response?.status === 404 || err.response?.status === 403) {
            return { data: null, exists: false };
          }
          throw err;
        })
      ]);

      const user = userResponse.status === 'fulfilled' ? userResponse.value.data : null;
      const minisiteExists = minisiteResponse.status === 'fulfilled' && 
                             minisiteResponse.value.data?.id ? true : false;

      // Résoudre la route d'entrée
      const entryRoute = resolveMinisiteEntry(user, minisiteExists);
      navigate(entryRoute);
    } catch (error) {
      console.error('Erreur lors de la vérification minisite:', error);
      // En cas d'erreur, rediriger vers pricing
      navigate("/minisite");
    }
  };

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-white/5 bg-gradient-to-t from-black to-zinc-900/95 backdrop-blur-sm"
      data-testid="main-header"
    >
      <div className="container mx-auto px-6">
        <div className="flex h-16 items-center justify-between gap-8">
          {/* LOGO */}
          <Link to="/" className="flex items-center space-x-2 shrink-0" data-testid="header-logo" onClick={closeMobile}>
            <div className="text-xl font-black tracking-tighter text-white uppercase italic">
              Down<span className="text-orange-500">Pricer</span>
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
                className="pl-10 w-full bg-[#0A0A0A] border-white/5 text-white placeholder:text-white/20 focus:ring-orange-500/20 focus:border-orange-500/50 rounded-full transition-all h-10 border text-sm outline-none"
              />
            </form>
          </div>

          {/* DESKTOP NAV */}
          <nav className="hidden md:flex items-center gap-1">
            {!user ? (
              <>
                <NavLink onClick={() => navigate("/faire-demande")}>Demande</NavLink>
                <NavLink onClick={handleMinisiteClick}>Mon Site</NavLink>
                <NavLink onClick={() => navigate("/devenir-vendeur")}>Vendre</NavLink>
                <div className="h-4 w-[1px] bg-white/10 mx-2" />
                <Button
                  onClick={() => navigate("/login")}
                  className="bg-white hover:bg-white/90 text-black font-extrabold rounded-full px-5 h-8 text-[11px] uppercase tracking-wider transition-all active:scale-95"
                >
                  Connexion
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-1">
                {hasRole("CLIENT") && <NavLink onClick={() => navigate("/mes-demandes")}>Mes demandes</NavLink>}
                <NavLink onClick={handleMinisiteClick}>Mon Site</NavLink>

                {hasRole("SELLER") ? (
                  <NavLink onClick={() => navigate("/seller/dashboard")}>Vendeur</NavLink>
                ) : (
                  <NavLink onClick={() => navigate("/devenir-vendeur")}>Vendre</NavLink>
                )}

                {/* PRO DESKTOP */}
                {hasSTier() && (
                  <button
                    onClick={() => navigate("/pro/dashboard")}
                    className="px-4 py-2 text-[11px] font-black uppercase tracking-widest text-emerald-400 hover:bg-emerald-500/5 rounded-full transition-colors flex items-center gap-2"
                  >
                    <Star size={12} className="fill-emerald-400" /> Pro
                  </button>
                )}

                {/* ADMIN DESKTOP */}
                {hasRole("ADMIN") && (
                  <button
                    onClick={() => navigate("/admin/dashboard")}
                    className="px-4 py-2 text-[11px] font-black uppercase tracking-widest text-orange-500 hover:bg-orange-500/5 rounded-full transition-colors"
                  >
                    Admin
                  </button>
                )}

                {/* USER DROPDOWN */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-2 text-white/40 hover:text-white hover:bg-white/5 rounded-full transition-colors h-9 w-9"
                    >
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-[#0A0A0A] border-white/10 text-white min-w-[180px] p-2 shadow-2xl">
                    <DropdownMenuItem
                      onClick={() => navigate("/mon-compte")}
                      className="rounded-md focus:bg-white/10 cursor-pointer text-xs uppercase font-black tracking-widest p-3"
                    >
                      Mon compte
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/5" />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="rounded-md text-red-500 focus:bg-red-500/10 cursor-pointer text-xs uppercase font-black tracking-widest p-3"
                    >
                      <LogOut size={14} className="mr-2" /> Déconnexion
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </nav>

          {/* MOBILE TOGGLE */}
          <button
            className="md:hidden p-2 text-white/70 hover:text-white bg-white/5 rounded-2xl border border-white/10 transition active:scale-[0.98]"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* MOBILE OVERLAY MENU */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <button
            className="fixed inset-0 z-40 md:hidden bg-black/60 backdrop-blur-sm"
            aria-label="Fermer le menu"
            onClick={closeMobile}
          />

          {/* Panel */}
          <div className="fixed left-0 right-0 top-16 z-50 md:hidden">
            <div className="mx-3 mt-3 rounded-3xl border border-white/10 bg-[#0A0A0A] shadow-2xl shadow-black/60 overflow-hidden animate-in slide-in-from-top-4 fade-in duration-200">
              {/* Search */}
              <div className="p-4 border-b border-white/5">
                <form onSubmit={handleSearch} className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                  <input
                    type="text"
                    placeholder="Rechercher un article..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full bg-black/40 border border-white/10 text-white placeholder:text-white/30 focus:border-orange-500/50 rounded-2xl h-11 text-sm outline-none"
                  />
                </form>
              </div>

              {/* Links */}
              <div className="p-3 space-y-2">
                {!user && (
                  <MobileNavLink icon={ClipboardList} onClick={() => { navigate("/faire-demande"); closeMobile(); }}>
                    Faire une demande
                  </MobileNavLink>
                )}

                <MobileNavLink icon={LayoutDashboard} onClick={() => { handleMinisiteClick(); closeMobile(); }}>
                  Mon site
                </MobileNavLink>

                {!user && (
                  <MobileNavLink icon={ShoppingBag} onClick={() => { navigate("/devenir-vendeur"); closeMobile(); }}>
                    Devenir vendeur
                  </MobileNavLink>
                )}

                {user ? (
                  <>
                    <div className="my-2 h-px bg-white/5" />

                    {hasRole("CLIENT") && (
                      <MobileNavLink icon={ClipboardList} onClick={() => { navigate("/mes-demandes"); closeMobile(); }}>
                        Mes demandes sourcing
                      </MobileNavLink>
                    )}

                    {hasRole("SELLER") ? (
                      <MobileNavLink icon={LayoutDashboard} onClick={() => { navigate("/seller/dashboard"); closeMobile(); }}>
                        Dashboard vendeur
                      </MobileNavLink>
                    ) : (
                      <MobileNavLink icon={ShoppingBag} onClick={() => { navigate("/devenir-vendeur"); closeMobile(); }}>
                        Devenir vendeur
                      </MobileNavLink>
                    )}

                    {hasSTier() && (
                      <MobileNavLink
                        icon={Star}
                        onClick={() => { navigate("/pro/dashboard"); closeMobile(); }}
                        className="text-emerald-200 bg-emerald-500/10 border-emerald-500/20"
                      >
                        <span className="flex items-center gap-2 italic font-black">
                          <Star size={14} className="fill-emerald-300 text-emerald-300" /> Accès Pro S-Tier
                        </span>
                      </MobileNavLink>
                    )}

                    {hasRole("ADMIN") && (
                      <MobileNavLink
                        icon={ShieldCheck}
                        onClick={() => { navigate("/admin/dashboard"); closeMobile(); }}
                        className="text-orange-200 bg-orange-500/10 border-orange-500/20"
                      >
                        Console administration
                      </MobileNavLink>
                    )}

                    <MobileNavLink icon={User} onClick={() => { navigate("/mon-compte"); closeMobile(); }}>
                      Mon compte
                    </MobileNavLink>

                    <div className="pt-2">
                      <Button
                        className="w-full bg-white/5 hover:bg-red-500/10 text-red-400 border border-red-500/20 rounded-2xl h-12 font-black uppercase text-[10px] tracking-[0.2em]"
                        onClick={handleLogout}
                      >
                        <LogOut className="h-4 w-4 mr-2" /> Terminer la session
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="pt-2">
                    <Button
                      className="w-full bg-orange-600 hover:bg-orange-500 text-white rounded-2xl h-12 font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-orange-900/20"
                      onClick={() => { navigate("/login"); closeMobile(); }}
                    >
                      Connexion / S&apos;inscrire
                    </Button>
                  </div>
                )}
              </div>

              {/* Tiny footer hint */}
              <div className="px-4 pb-4 pt-2 text-[10px] uppercase tracking-[0.22em] text-white/30">
                <span className="opacity-80">Down</span>
                <span className="text-orange-500">Pricer</span>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
};

// --------- Internal components ---------

const NavLink = ({ children, onClick, active, className = "" }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-[11px] font-black uppercase tracking-[0.1em] transition-all rounded-full ${
      active ? "text-orange-500 bg-white/5" : "text-white/40 hover:text-white hover:bg-white/5"
    } ${className}`}
  >
    {children}
  </button>
);

const MobileNavLink = ({ children, onClick, className = "", icon: Icon }) => (
  <button
    onClick={onClick}
    className={[
      "flex items-center justify-between w-full px-4 py-4",
      "rounded-2xl transition-all",
      "bg-white/[0.03] hover:bg-white/[0.06]",
      "border border-white/5 hover:border-white/10",
      "text-[11px] font-black uppercase tracking-[0.18em] text-white/80",
      "active:scale-[0.99]",
      className,
    ].join(" ")}
  >
    <span className="flex items-center gap-3">
      {Icon ? <Icon className="h-4 w-4 text-white/45" /> : null}
      {children}
    </span>
    <ChevronRight className="h-4 w-4 text-white/20" />
  </button>
);
