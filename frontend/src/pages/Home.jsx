
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardFooter } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Search, Filter, ArrowUpDown, ShoppingBag } from 'lucide-react';
import api from '../utils/api';
import { resolveImageUrl } from '../utils/images';

export const Home = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Utilisation directe des searchParams pour l'état initial
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'recent');
  
  // État du HERO pour auto-repli après 5 secondes
  const [heroCollapsed, setHeroCollapsed] = useState(false);
  
  // Auto-repli du HERO après 5 secondes
  useEffect(() => {
    const timer = setTimeout(() => {
      setHeroCollapsed(true);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);

  // 1. Chargement des catégories une seule fois
  useEffect(() => {
    fetchCategories();
  }, []);

  // 2. Gestion du debounce pour la recherche (évite de spammer l'API)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchArticles();
      updateUrl();
    }, 500); // Délai de 500ms après la frappe
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
      params.append('limit', '20');

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
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-orange-500/30">
      {/* --- HERO SECTION --- */}
      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
        heroCollapsed ? 'max-h-0 opacity-0' : 'max-h-96 opacity-100'
      }`}>
        <div className="relative border-b border-zinc-800/50 bg-zinc-900/30">
          <div className="container mx-auto px-4 py-12 md:py-16 text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-4 drop-shadow-sm" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Les bons plans <span className="text-orange-500">du moment</span>
            </h1>
            <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Découvrez notre sélection d'articles. Cliquez pour acheter ou demander une remise en main propre.
            </p>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        
        {/* --- BARRE DE FILTRES --- */}
        <div className="sticky top-4 z-30 mb-8 p-4 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl shadow-xl flex flex-col md:flex-row gap-4 items-center justify-between">
          
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Rechercher un article..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-zinc-950/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all h-10"
            />
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48 bg-zinc-950/50 border-zinc-700 h-10">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-orange-500" />
                  <SelectValue placeholder="Catégorie" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48 bg-zinc-950/50 border-zinc-700 h-10">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4 text-orange-500" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                <SelectItem value="recent">Plus récents</SelectItem>
                <SelectItem value="price_low">Prix croissant</SelectItem>
                <SelectItem value="views">Populaires</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* --- GRILLE DE PRODUITS --- */}
        {loading ? (
          <ArticlesSkeleton />
        ) : articles.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {articles.map((article) => {
              const discount = calculateDiscount(article.price, article.reference_price);
              const imageUrl = resolveImageUrl(article.photos?.[0]);

              return (
                <Card
                  key={article.id}
                  className="group bg-zinc-900 border-zinc-800 rounded-xl overflow-hidden hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col h-full"
                  onClick={() => navigate(`/article/${article.id}`)}
                >
                  {/* Image Container */}
                  <div className="relative aspect-square overflow-hidden bg-zinc-800">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={article.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-600 bg-zinc-800/50">
                        <ShoppingBag className="h-12 w-12 opacity-20" />
                      </div>
                    )}
                    
                    {/* Badges Flottants */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {(article.source === "minisite" || article.is_third_party) && (
                        <Badge className="bg-blue-600/90 backdrop-blur-sm text-white border-none shadow-sm hover:bg-blue-700">
                          Vendeur tiers
                        </Badge>
                      )}
                    </div>
                    {discount > 0 && (
                      <Badge className="absolute top-2 right-2 bg-red-500 text-white border-none font-bold shadow-sm">
                        -{discount}%
                      </Badge>
                    )}
                  </div>

                  {/* Contenu */}
                  <CardContent className="p-4 flex-grow">
                    <h3 className="font-semibold text-base text-zinc-100 line-clamp-1 group-hover:text-orange-400 transition-colors mb-2">
                      {article.name}
                    </h3>
                    <p className="text-sm text-zinc-400 line-clamp-2 h-10 leading-snug">
                      {article.description || "Aucune description disponible."}
                    </p>
                  </CardContent>

                  {/* Footer Prix */}
                  <CardFooter className="p-4 pt-0 flex items-end justify-between border-t border-zinc-800/50 mt-auto">
                    <div className="flex flex-col pt-3">
                       {discount > 0 && (
                        <span className="text-xs text-zinc-500 line-through mb-0.5">
                          {article.reference_price}€
                        </span>
                      )}
                      <span className="text-xl font-bold text-white tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        {article.price}€
                      </span>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center group-hover:bg-orange-500 transition-colors">
                      <ShoppingBag className="h-4 w-4 text-zinc-400 group-hover:text-white" />
                    </div>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

// --- Composants UI secondaires pour la propreté du code ---

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-zinc-800 rounded-3xl bg-zinc-900/20">
    <Search className="h-12 w-12 text-zinc-600 mb-4" />
    <h3 className="text-xl font-semibold text-white mb-2">Aucun résultat</h3>
    <p className="text-zinc-400 max-w-sm">
      Nous n'avons trouvé aucun article correspondant à votre recherche. Essayez d'autres mots-clés.
    </p>
  </div>
);

const ArticlesSkeleton = () => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800">
        <div className="aspect-square bg-zinc-800 animate-pulse" />
        <div className="p-4 space-y-3">
          <div className="h-5 bg-zinc-800 rounded w-3/4 animate-pulse" />
          <div className="h-4 bg-zinc-800/50 rounded w-full animate-pulse" />
          <div className="h-8 bg-zinc-800 rounded w-1/3 mt-4 animate-pulse" />
        </div>
      </div>
    ))}
  </div>
);