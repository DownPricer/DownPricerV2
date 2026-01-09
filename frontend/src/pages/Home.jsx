import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import api from '../utils/api';

export const Home = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    fetchCategories();
    fetchArticles();
  }, [searchQuery, selectedCategory, sortBy]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Erreur chargement catégories:', error);
    }
  };

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory) params.append('category_id', selectedCategory);
      params.append('sort', sortBy);
      params.append('limit', '20');

      const response = await api.get(`/articles?${params}`);
      setArticles(response.data.articles);
    } catch (error) {
      console.error('Erreur chargement articles:', error);
    }
    setLoading(false);
  };

  const calculateDiscount = (price, referencePrice) => {
    if (!referencePrice || referencePrice === 0) return 0;
    return Math.round(((referencePrice - price) / referencePrice) * 100);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white" data-testid="home-page">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-orange-500 mb-2" style={{fontFamily: 'Outfit, sans-serif'}}>
            Les bons plans du moment
          </h1>
          <p className="text-zinc-400 text-base md:text-lg">
            Découvrez les articles disponibles. Cliquez sur un produit pour voir le lien d'achat ou demander une remise en main propre.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <Input
            placeholder="Rechercher un article…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-400 focus:border-orange-500"
            data-testid="home-search-input"
          />
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-48 bg-zinc-900 border-zinc-700 text-white" data-testid="home-category-select">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
              <SelectItem value="all">Toutes</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-48 bg-zinc-900 border-zinc-700 text-white" data-testid="home-sort-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
              <SelectItem value="recent">Récents</SelectItem>
              <SelectItem value="price_low">Prix le plus bas</SelectItem>
              <SelectItem value="views">Les plus consultés</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-zinc-400">Chargement...</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-zinc-400">Aucun article trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
            {articles.map((article) => {
              const discount = calculateDiscount(article.price, article.reference_price);
              return (
                <Card
                  key={article.id}
                  className="bg-zinc-900 border-zinc-800 rounded-xl overflow-hidden hover:border-orange-500/50 transition-colors cursor-pointer group relative"
                  onClick={() => navigate(`/article/${article.id}`)}
                  data-testid={`article-card-${article.id}`}
                >
                  <div className="relative aspect-square overflow-hidden bg-zinc-800">
                    {article.photos && article.photos.length > 0 ? (
                      <img
                        src={article.photos[0]}
                        alt={article.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-600">
                        Pas d'image
                      </div>
                    )}
                    {article.from_minisite && (
                      <Badge className="absolute top-2 left-2 bg-blue-600 text-white border-none text-xs">
                        🏪 Partenaire
                      </Badge>
                    )}
                    {discount > 0 && (
                      <Badge className="absolute top-2 right-2 bg-red-500/90 text-white border-none text-xs font-bold">
                        -{discount}%
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-3 md:p-4">
                    <h3 className="font-semibold text-sm md:text-base text-white line-clamp-1 mb-1">
                      {article.name}
                    </h3>
                    <p className="text-xs md:text-sm text-zinc-400 line-clamp-2 mb-2">
                      {article.description}
                    </p>
                    <p className="text-lg md:text-xl font-bold text-orange-500 tracking-tight" style={{fontFamily: 'Outfit, sans-serif'}}>
                      {article.price}€
                    </p>
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