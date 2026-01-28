import React, { useState, useEffect } from 'react';
import { Header } from '../../components/Header';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'sonner';
import { resolveImageUrl } from '../../utils/images';
import { hasSPlan3 } from '../../utils/auth';

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
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-orange-500" style={{fontFamily: 'Outfit, sans-serif'}}>
            Catalogue Articles Vendeur
          </h1>
          {hasSPlan3() && (
            <Button
              onClick={() => navigate('/seller/articles/new')}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvel article B2B
            </Button>
          )}
        </div>

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
                      {(() => {
                        const imageUrl = resolveImageUrl(article.photos?.[0]);
                        if (!imageUrl) {
                          return <div className="w-full h-full flex items-center justify-center text-zinc-600">Pas d'image</div>;
                        }
                        return <img src={imageUrl} alt={article.name} className="w-full h-full object-cover" loading="lazy" onError={(e) => e.target.style.display = 'none'} />;
                      })()}
                    </div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-white line-clamp-1 flex-1">{article.name}</h3>
                      {article.is_third_party && (
                        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50 text-xs flex-shrink-0">Vendeur tiers</Badge>
                      )}
                    </div>
                    {article.posted_by_info && (
                      <p className="text-xs text-zinc-500 mb-1">Posté par {article.posted_by_info.name || article.posted_by_info.username}</p>
                    )}
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