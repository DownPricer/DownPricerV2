import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardFooter } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Search, Filter, ArrowUpDown, ShoppingBag, Star, Zap, X, Store } from 'lucide-react';
import api from '../utils/api';
import { resolveImageUrl } from '../utils/images';
import { Loader2 } from 'lucide-react';

export const Home = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // États
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'recent');
  const [heroCollapsed, setHeroCollapsed] = useState(false);
  
  // Auto-repli du HERO
  useEffect(() => {
    const timer = setTimeout(() => setHeroCollapsed(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => { fetchCategories(); }, []);

  useEffect(() => {
    const timer = setTimeout(() => { fetchArticles(); updateUrl(); }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, sortBy]);

  const updateUrl = () => {
    const params = {};
    if (searchQuery) params.search = searchQuery;
    if (selectedCategory && selectedCategory !== 'all') params.category = selectedCategory;
    if (sortBy && sortBy !== 'recent') params.sort = sortBy;
    setSearchParams(params);
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Erreur catégories');
    }
  };

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory && selectedCategory !== 'all') params.append('category_id', selectedCategory);
      params.append('sort', sortBy);
      params.append('limit', '60'); // On charge beaucoup d'articles pour remplir la grille

      const response = await api.get(`/articles?${params}`);
      setArticles(response.data.articles);
    } catch (error) {
      console.error('Erreur articles');
    }
    setLoading(false);
  };

  const calculateDiscount = (price, referencePrice) => {
    if (!referencePrice || referencePrice <= price) return 0;
    return Math.round(((referencePrice - price) / referencePrice) * 100);
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-orange-500/30">
      
      {/* --- HERO SECTION: COMPACTE & SOBRE --- */}
      {/* Fond noir pur, pas de flou de couleur derrière */}
      <div className={`overflow-hidden transition-all duration-500 ease-in-out border-b border-white/5 bg-black ${
        heroCollapsed ? 'max-h-0 opacity-0 border-none' : 'max-h-[250px] opacity-100'
      }`}>
        <div className="container mx-auto px-4 py-6 relative">
          <div className="flex flex-col items-center text-center">
            {/* Tag discret */}
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-orange-500 mb-2">
              <Zap size={10} className="fill-orange-500" /> Offres du jour
            </div>
            
            {/* Titre Blanc + Orange */}
            <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-white uppercase italic mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Les Bons Plans <span className="text-orange-500">DownPricer</span>
            </h1>
            
            <p className="text-zinc-500 text-xs max-w-lg mx-auto font-medium">
              Achetez malin, négociez directement. Le marketplace S-Tier.
            </p>
            
            <button 
              onClick={() => setHeroCollapsed(true)}
              className="absolute top-4 right-4 p-1 text-zinc-700 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-2 md:px-4 py-4 pb-24">
        
        {/* --- FILTRES: SOBRE & TECHNIQUE --- */}
        <div className="sticky top-2 z-30 mb-4 flex flex-col md:flex-row gap-2 items-center justify-between bg-black/90 backdrop-blur-md p-2 border border-white/10 rounded-lg shadow-xl">
          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-600 group-focus-within:text-orange-500 transition-colors" />
            <Input
              placeholder="Chercher un produit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-[#0A0A0A] border-white/10 text-white placeholder:text-zinc-700 focus:border-orange-500/50 focus:ring-0 h-9 rounded-md text-xs font-medium"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[130px] bg-[#0A0A0A] border-white/10 h-9 rounded-md text-[10px] font-bold uppercase tracking-wide text-zinc-400 focus:ring-0">
                <div className="flex items-center gap-2 truncate">
                  <Filter className="h-3 w-3 text-zinc-600" />
                  <SelectValue placeholder="Catégorie" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-[#0A0A0A] border-white/10 text-white">
                <SelectItem value="all">Toutes</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[130px] bg-[#0A0A0A] border-white/10 h-9 rounded-md text-[10px] font-bold uppercase tracking-wide text-zinc-400 focus:ring-0">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-3 w-3 text-zinc-600" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-[#0A0A0A] border-white/10 text-white">
                <SelectItem value="recent">Plus récents</SelectItem>
                <SelectItem value="price_low">Prix croissant</SelectItem>
                <SelectItem value="views">Populaires</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* --- GRID AMAZON STYLE (HAUTE DENSITÉ) --- */}
        {/* Mobile: 2 colonnes | Tablet: 4 colonnes | Desktop: 6 colonnes */}
        {loading ? (
          <ArticlesSkeleton />
        ) : articles.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3">
            {articles.map((article) => {
              const discount = calculateDiscount(article.price, article.reference_price);
              const imageUrl = resolveImageUrl(article.photos?.[0]);
              const vendor = article.vendor;
              // Nom vendeur court pour l'affichage compact
              const vendorName = vendor?.seller_name || vendor?.minisite_name || 'Boutique';

              return (
                <Card
                  key={article.id}
                  className="group bg-[#050505] border border-white/5 rounded-lg overflow-hidden hover:border-orange-500/40 transition-all duration-200 cursor-pointer flex flex-col h-full"
                  onClick={() => navigate(`/article/${article.id}`)}
                >
                  {/* Zone Image - Carrée pour uniformité */}
                  <div className="relative aspect-square bg-[#0a0a0a] overflow-hidden">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={article.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="h-6 w-6 text-zinc-800" />
                      </div>
                    )}
                    
                    {/* Badge Vendeur Tiers (Discret en haut à gauche) */}
                    {(article.is_third_party || article.source === 'minisite') && (
                      <div className="absolute top-0 left-0 bg-black/80 backdrop-blur-sm px-1.5 py-0.5 rounded-br-lg border-r border-b border-white/10">
                        <div className="flex items-center gap-1">
                          <Store size={8} className="text-orange-500" />
                          <span className="text-[8px] font-black uppercase text-white tracking-wider">Partner</span>
                        </div>
                      </div>
                    )}

                    {/* Badge Réduction (En haut à droite) */}
                    {discount > 0 && (
                      <div className="absolute top-0 right-0 bg-red-600 px-1.5 py-0.5 rounded-bl-lg">
                        <span className="text-[9px] font-black text-white">-{discount}%</span>
                      </div>
                    )}
                  </div>

                  {/* Contenu Compact */}
                  <CardContent className="p-2.5 flex-grow flex flex-col justify-between">
                    <div>
                      {/* Titre (2 lignes max) */}
                      <h3 className="text-[11px] md:text-xs font-bold text-zinc-200 leading-tight mb-1 line-clamp-2 h-8 group-hover:text-orange-500 transition-colors">
                        {article.name}
                      </h3>
                      
                      {/* Ligne Vendeur (Très petite) */}
                      {article.is_third_party && vendor ? (
                        <div className="flex items-center gap-1 mb-2 opacity-60">
                          <span className="text-[9px] text-zinc-400 truncate">Vendu par {vendorName}</span>
                        </div>
                      ) : (
                        <div className="h-4 mb-1" /> // Spacer
                      )}
                    </div>

                    {/* Prix Amazon Style */}
                    <div className="flex items-end gap-1">
                      {/* Prix Promo */}
                      <div className="flex items-start text-white">
                        <span className="text-[10px] font-bold mt-[2px]">€</span>
                        <span className="text-lg md:text-xl font-black tracking-tighter leading-none">
                          {Math.floor(article.price)}
                        </span>
                        <span className="text-[9px] font-bold mt-[2px]">
                          {Math.round((article.price % 1) * 100).toString().padEnd(2, '0')}
                        </span>
                      </div>

                      {/* Prix Barré (si réduction) */}
                      {discount > 0 && (
                        <span className="text-[9px] text-zinc-600 line-through mb-[2px] ml-1">
                          {article.reference_price}€
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

// --- SKELETON & EMPTY STATE ---

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <Search className="h-8 w-8 text-zinc-800 mb-2" />
    <p className="text-zinc-600 text-xs font-bold uppercase tracking-widest">Aucun résultat</p>
  </div>
);

const ArticlesSkeleton = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3">
    {[...Array(12)].map((_, i) => (
      <div key={i} className="bg-[#050505] rounded-lg overflow-hidden border border-white/5 flex flex-col h-64">
        <div className="aspect-square bg-white/5 animate-pulse" />
        <div className="p-2 space-y-2 flex-1">
          <div className="h-3 bg-white/5 rounded w-3/4 animate-pulse" />
          <div className="h-3 bg-white/5 rounded w-1/2 animate-pulse" />
          <div className="mt-auto h-5 bg-white/5 rounded w-12 animate-pulse" />
        </div>
      </div>
    ))}
  </div>
);