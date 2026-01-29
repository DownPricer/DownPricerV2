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
    }, 6000); 
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    fetchCategories();
  }, []);

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
      params.append('limit', '50');

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
    <div className="min-h-screen bg-black text-white font-sans selection:bg-indigo-500/30">
      
      {/* --- HERO SECTION COMPACTE & BLEUTÉE --- */}
      <div className={`overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${
        heroCollapsed ? 'max-h-0 opacity-0' : 'max-h-[300px] opacity-100'
      }`}>
        <div className="relative border-b border-white/5 bg-[#050505]">
          {/* Changement couleur: Indigo/Blue au lieu d'Orange */}
          <div className="absolute inset-0 bg-indigo-500/5 blur-[80px] pointer-events-none" />
          
          <div className="container mx-auto px-4 py-8 md:py-10 text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-black uppercase tracking-widest mb-3 animate-in fade-in slide-in-from-bottom-2 duration-700">
              <Zap size={10} className="fill-indigo-400" /> Offres Flash
            </div>
            
            {/* Titre plus petit et plus fin */}
            <h1 className="text-2xl md:text-4xl font-black tracking-tighter text-white mb-3 uppercase italic" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Les Bons Plans <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">du Moment</span>
            </h1>
            
            <p className="text-zinc-500 text-xs md:text-sm max-w-xl mx-auto leading-relaxed font-medium">
              Accédez aux meilleures offres négociées. Cliquez, achetez ou négociez directement.
            </p>
            
            <button 
              onClick={() => setHeroCollapsed(true)}
              className="absolute top-2 right-2 md:top-4 md:right-4 p-2 text-zinc-700 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6 pb-24">
        
        {/* --- FILTRES FLOTTANTS --- */}
        <div className="sticky top-2 z-30 mb-6 p-2 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl flex flex-col md:flex-row gap-2 items-center justify-between">
          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-[#0A0A0A] border-white/5 text-white placeholder:text-zinc-600 focus:border-indigo-500/50 focus:ring-indigo-500/20 h-9 rounded-lg transition-all font-medium text-xs"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[140px] bg-[#0A0A0A] border-white/5 h-9 rounded-lg text-[10px] font-bold uppercase tracking-wide text-zinc-300">
                <div className="flex items-center gap-2 truncate">
                  <Filter className="h-3 w-3 text-indigo-400" />
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
              <SelectTrigger className="w-[140px] bg-[#0A0A0A] border-white/5 h-9 rounded-lg text-[10px] font-bold uppercase tracking-wide text-zinc-300">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-3 w-3 text-indigo-400" />
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

        {/* --- GRID COMPACTE (6 colonnes sur Desktop) --- */}
        {loading ? (
          <ArticlesSkeleton />
        ) : articles.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-4">
            {articles.map((article) => {
              const discount = calculateDiscount(article.price, article.reference_price);
              const imageUrl = resolveImageUrl(article.photos?.[0]);
              const vendor = article.vendor;
              const vendorName = vendor?.seller_name || vendor?.minisite_name || 'Boutique';

              return (
                <Card
                  key={article.id}
                  className="group bg-[#080808] border border-white/5 rounded-xl overflow-hidden hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 cursor-pointer flex flex-col h-full"
                  onClick={() => navigate(`/article/${article.id}`)}
                >
                  {/* Image Zone - Ratio légèrement réduit */}
                  <div className="relative aspect-[3/4] bg-black overflow-hidden">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={article.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                        <ShoppingBag className="h-6 w-6 text-zinc-700" />
                      </div>
                    )}
                    
                    <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
                      {article.is_third_party && (
                        <Badge className="bg-black/60 backdrop-blur-md text-white border border-white/10 text-[8px] font-black uppercase tracking-widest px-1.5 py-0">
                          Partner
                        </Badge>
                      )}
                    </div>
                    {discount > 0 && (
                      <Badge className="absolute top-1.5 right-1.5 bg-red-600 text-white border-none font-black text-[9px] shadow-sm px-1.5 py-0">
                        -{discount}%
                      </Badge>
                    )}
                  </div>

                  {/* Content Zone - Padding réduit */}
                  <CardContent className="p-3 flex-grow flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-xs text-white leading-tight mb-1 line-clamp-2 group-hover:text-indigo-400 transition-colors">
                        {article.name}
                      </h3>
                      
                      {/* Vendor Mini-Block */}
                      {article.is_third_party && vendor ? (
                        <div className="flex items-center gap-1.5 mt-1.5 mb-2 opacity-80" onClick={(e) => e.stopPropagation()}>
                          <button 
                            className="text-[9px] text-zinc-400 hover:text-white transition-colors flex items-center gap-1"
                            onClick={() => navigate(`/s/${vendor.minisite_slug}`)}
                          >
                            <span className="w-3 h-3 rounded-full bg-zinc-800 flex items-center justify-center text-[7px] font-bold text-zinc-500 border border-white/5">
                              {vendorName.charAt(0)}
                            </span>
                            <span className="truncate max-w-[80px]">{vendorName}</span>
                          </button>
                        </div>
                      ) : (
                        <div className="h-1.5" />
                      )}
                    </div>

                    {/* Price Block Compact */}
                    <div className="mt-1 pt-2 border-t border-white/5 flex items-end justify-between">
                      <div className="flex flex-col">
                        {discount > 0 && (
                          <span className="text-[9px] text-zinc-600 line-through font-medium leading-none mb-0.5">
                            {article.reference_price}€
                          </span>
                        )}
                        <div className="flex items-baseline gap-0.5">
                          <span className="text-base font-black text-white tracking-tight leading-none">
                            {Math.floor(article.price)}
                          </span>
                          <span className="text-[9px] font-bold text-zinc-400 leading-none mb-0.5">
                            ,{Math.round((article.price % 1) * 100).toString().padEnd(2, '0')}€
                          </span>
                        </div>
                      </div>
                      
                      <button className="h-6 w-6 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-zinc-400 group-hover:bg-indigo-500 group-hover:text-white group-hover:border-indigo-500 transition-all">
                        <ShoppingBag size={12} />
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
    <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
      <Search className="h-6 w-6 text-zinc-600" />
    </div>
    <h3 className="text-sm font-bold text-white mb-1 uppercase italic tracking-wider">Catalogue Vide</h3>
    <p className="text-zinc-600 text-xs max-w-xs">
      Aucun produit ne correspond à vos critères.
    </p>
  </div>
);

const ArticlesSkeleton = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-4">
    {[...Array(12)].map((_, i) => (
      <div key={i} className="bg-[#080808] rounded-xl overflow-hidden border border-white/5 flex flex-col">
        <div className="aspect-[3/4] bg-white/5 animate-pulse" />
        <div className="p-3 space-y-2 flex-1">
          <div className="h-3 bg-white/5 rounded w-3/4 animate-pulse" />
          <div className="h-2 bg-white/5 rounded w-1/2 animate-pulse" />
          <div className="mt-auto pt-2 flex justify-between items-end">
            <div className="h-5 bg-white/5 rounded w-12 animate-pulse" />
            <div className="h-6 w-6 rounded-full bg-white/5 animate-pulse" />
          </div>
        </div>
      </div>
    ))}
  </div>
);