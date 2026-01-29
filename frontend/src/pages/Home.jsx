import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardFooter } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Search, Filter, ArrowUpDown, ShoppingBag, Star, Zap, X } from 'lucide-react';
import api from '../utils/api';
import { resolveImageUrl } from '../utils/images';
import { RatingStars } from '../components/RatingStars';
import { AvatarCircle } from '../components/AvatarCircle';
import { Loader2 } from 'lucide-react';

export const Home = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // États de recherche
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'recent');
  
  // État du HERO
  const [heroCollapsed, setHeroCollapsed] = useState(false);
  
  // Auto-repli du HERO
  useEffect(() => {
    const timer = setTimeout(() => {
      setHeroCollapsed(true);
    }, 6000); // Un peu plus long pour laisser le temps de lire
    return () => clearTimeout(timer);
  }, []);

  // Chargement initial
  useEffect(() => {
    fetchCategories();
  }, []);

  // Recherche avec Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchArticles();
      updateUrl();
    }, 500);
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
      console.error('Erreur catégories:', error);
    }
  };

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory && selectedCategory !== 'all') params.append('category_id', selectedCategory);
      params.append('sort', sortBy);
      params.append('limit', '50'); // On charge plus d'articles pour l'effet "Infinite Scroll" visuel

      const response = await api.get(`/articles?${params}`);
      setArticles(response.data.articles);
    } catch (error) {
      console.error('Erreur articles:', error);
    }
    setLoading(false);
  };

  const calculateDiscount = (price, referencePrice) => {
    if (!referencePrice || referencePrice <= price) return 0;
    return Math.round(((referencePrice - price) / referencePrice) * 100);
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-orange-500/30">
      
      {/* --- HERO SECTION (Compactable) --- */}
      <div className={`overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${
        heroCollapsed ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100'
      }`}>
        <div className="relative border-b border-white/5 bg-[#080808]">
          <div className="absolute inset-0 bg-orange-500/5 blur-[100px] pointer-events-none" />
          <div className="container mx-auto px-4 py-12 md:py-20 text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] font-black uppercase tracking-widest mb-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
              <Zap size={12} className="fill-orange-500" /> Offres Flash
            </div>
            <h1 className="text-4xl md:text-7xl font-black tracking-tighter text-white mb-6 uppercase italic" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Les Bons Plans <br className="md:hidden" /><span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">du Moment</span>
            </h1>
            <p className="text-zinc-400 text-sm md:text-lg max-w-2xl mx-auto leading-relaxed font-medium">
              Accédez aux meilleures offres négociées. Cliquez, achetez ou négociez directement avec nos vendeurs certifiés.
            </p>
            <button 
              onClick={() => setHeroCollapsed(true)}
              className="absolute top-4 right-4 p-2 text-zinc-600 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 pb-24">
        
        {/* --- FILTRES FLOTTANTS (Glassmorphism) --- */}
        <div className="sticky top-4 z-30 mb-8 p-3 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col md:flex-row gap-3 items-center justify-between">
          
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-orange-500 transition-colors" />
            <Input
              placeholder="Rechercher un produit, une marque..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 bg-[#0A0A0A] border-white/5 text-white placeholder:text-zinc-600 focus:border-orange-500/50 focus:ring-orange-500/20 h-11 rounded-xl transition-all font-medium text-sm"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto overflow-x-auto no-scrollbar pb-1 md:pb-0">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[160px] bg-[#0A0A0A] border-white/5 h-11 rounded-xl text-xs font-bold uppercase tracking-wide text-zinc-300">
                <div className="flex items-center gap-2 truncate">
                  <Filter className="h-3 w-3 text-orange-500" />
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
              <SelectTrigger className="w-[160px] bg-[#0A0A0A] border-white/5 h-11 rounded-xl text-xs font-bold uppercase tracking-wide text-zinc-300">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-3 w-3 text-orange-500" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-[#0A0A0A] border-white/10 text-white">
                <SelectItem value="recent">Nouveautés</SelectItem>
                <SelectItem value="price_low">Prix Croissant</SelectItem>
                <SelectItem value="views">Populaires</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* --- CATALOGUE GRID (Responsive: 2 cols mobile, 4 cols desktop) --- */}
        {loading ? (
          <ArticlesSkeleton />
        ) : articles.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
            {articles.map((article) => {
              const discount = calculateDiscount(article.price, article.reference_price);
              const imageUrl = resolveImageUrl(article.photos?.[0]);
              const vendor = article.vendor;
              const vendorName = vendor?.seller_name || vendor?.minisite_name || 'Boutique';

              return (
                <Card
                  key={article.id}
                  className="group bg-[#080808] border border-white/5 rounded-2xl overflow-hidden hover:border-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/5 transition-all duration-300 cursor-pointer flex flex-col h-full"
                  onClick={() => navigate(`/article/${article.id}`)}
                >
                  {/* Image Zone */}
                  <div className="relative aspect-[4/5] bg-black overflow-hidden">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={article.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                        <ShoppingBag className="h-8 w-8 text-zinc-700" />
                      </div>
                    )}
                    
                    {/* Badges Flottants */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {article.is_third_party && (
                        <Badge className="bg-black/60 backdrop-blur-md text-white border border-white/10 text-[9px] font-black uppercase tracking-widest px-2">
                          Partenaire
                        </Badge>
                      )}
                    </div>
                    {discount > 0 && (
                      <Badge className="absolute top-2 right-2 bg-red-600 text-white border-none font-black text-[10px] shadow-lg">
                        -{discount}%
                      </Badge>
                    )}
                  </div>

                  {/* Content Zone */}
                  <CardContent className="p-4 flex-grow flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-white leading-tight mb-1 line-clamp-2 group-hover:text-orange-500 transition-colors">
                        {article.name}
                      </h3>
                      
                      {/* Vendor Mini-Block */}
                      {article.is_third_party && vendor ? (
                        <div className="flex items-center gap-2 mt-2 mb-3" onClick={(e) => e.stopPropagation()}>
                          <button 
                            className="text-[10px] text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5"
                            onClick={() => navigate(`/s/${vendor.minisite_slug}`)}
                          >
                            <span className="w-4 h-4 rounded-full bg-zinc-800 flex items-center justify-center text-[8px] font-bold text-zinc-500 border border-white/5">
                              {vendorName.charAt(0)}
                            </span>
                            <span className="truncate max-w-[100px]">{vendorName}</span>
                          </button>
                          {vendor.rating_avg > 0 && (
                            <div className="flex items-center gap-0.5 text-[9px] text-orange-400">
                              <Star size={8} className="fill-orange-400" />
                              <span>{Number(vendor.rating_avg).toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="h-2" /> // Spacer si pas de vendeur
                      )}
                    </div>

                    {/* Price Block */}
                    <div className="mt-2 pt-3 border-t border-white/5 flex items-end justify-between">
                      <div className="flex flex-col">
                        {discount > 0 && (
                          <span className="text-[10px] text-zinc-600 line-through font-medium">
                            {article.reference_price}€
                          </span>
                        )}
                        <div className="flex items-baseline gap-0.5">
                          <span className="text-lg font-black text-white tracking-tight leading-none">
                            {Math.floor(article.price)}
                          </span>
                          <span className="text-xs font-bold text-white leading-none mb-1">
                            ,{Math.round((article.price % 1) * 100).toString().padEnd(2, '0')}€
                          </span>
                        </div>
                      </div>
                      
                      <button className="h-8 w-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-zinc-400 group-hover:bg-orange-500 group-hover:text-white group-hover:border-orange-500 transition-all">
                        <ShoppingBag size={14} />
                      </button>
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

// --- COMPOSANTS UI STYLISÉS ---

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-32 text-center">
    <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
      <Search className="h-8 w-8 text-zinc-600" />
    </div>
    <h3 className="text-xl font-bold text-white mb-2 uppercase italic tracking-wider">Catalogue Vide</h3>
    <p className="text-zinc-500 text-sm max-w-xs">
      Aucun produit ne correspond à vos critères. Essayez une autre catégorie.
    </p>
  </div>
);

const ArticlesSkeleton = () => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
    {[...Array(10)].map((_, i) => (
      <div key={i} className="bg-[#080808] rounded-2xl overflow-hidden border border-white/5 flex flex-col">
        <div className="aspect-[4/5] bg-white/5 animate-pulse" />
        <div className="p-4 space-y-3 flex-1">
          <div className="h-4 bg-white/5 rounded w-3/4 animate-pulse" />
          <div className="h-3 bg-white/5 rounded w-1/2 animate-pulse" />
          <div className="mt-auto pt-4 flex justify-between items-end">
            <div className="h-6 bg-white/5 rounded w-16 animate-pulse" />
            <div className="h-8 w-8 rounded-full bg-white/5 animate-pulse" />
          </div>
        </div>
      </div>
    ))}
  </div>
);