import React, { useState, useEffect } from 'react';
import { Header } from '../../components/Header';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'sonner';

export const SellerArticles = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const response = await api.get('/seller/articles');
      setArticles(response.data);
    } catch (error) {
      toast.error('Erreur chargement articles');
    }
    setLoading(false);
  };

  const filteredArticles = articles.filter(a =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const calculateDiscount = (price, refPrice) => {
    if (!refPrice || refPrice === 0) return 0;
    return Math.round(((refPrice - price) / refPrice) * 100);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-orange-500 mb-6" style={{fontFamily: 'Outfit, sans-serif'}}>
          Catalogue Articles Vendeur
        </h1>

        <Card className="bg-zinc-900 border-zinc-800 mb-6">
          <CardContent className="p-4">
            <Input
              placeholder="Rechercher un article..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center py-12"><p className="text-zinc-400">Chargement...</p></div>
        ) : filteredArticles.length === 0 ? (
          <Card className="bg-zinc-900 border-zinc-800"><CardContent className="p-12 text-center"><p className="text-zinc-400">Aucun article disponible</p></CardContent></Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredArticles.map((article) => {
              const discount = calculateDiscount(article.price, article.reference_price);
              return (
                <Card key={article.id} className="bg-zinc-900 border-zinc-800 hover:border-orange-500/50 transition-colors cursor-pointer" onClick={() => navigate(`/seller/article/${article.id}`)}>
                  <CardContent className="p-4">
                    <div className="aspect-square bg-zinc-800 rounded-lg overflow-hidden mb-3">
                      {article.photos && article.photos.length > 0 ? (
                        <img src={article.photos[0]} alt={article.name} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600">Pas d'image</div>
                      )}
                    </div>
                    <h3 className="font-semibold text-white mb-1 line-clamp-1">{article.name}</h3>
                    <p className="text-sm text-zinc-400 line-clamp-2 mb-3">{article.description}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Prix vendeur :</span>
                        <span className="text-white font-semibold">{article.price}€</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Bénéfice potentiel :</span>
                        <span className="text-green-500 font-semibold">+{article.potential_profit?.toFixed(2) || 0}€</span>
                      </div>
                      {discount > 0 && (
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/50">-{discount}%</Badge>
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