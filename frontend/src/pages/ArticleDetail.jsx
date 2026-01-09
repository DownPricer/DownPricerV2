import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import { ExternalLink } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'sonner';

export const ArticleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    fetchArticle();
    fetchSettings();
  }, [id]);

  const fetchArticle = async () => {
    try {
      const response = await api.get(`/articles/${id}`);
      setArticle(response.data);
    } catch (error) {
      toast.error('Article non trouvé');
      navigate('/');
    }
    setLoading(false);
  };

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings/public');
      setSettings(response.data);
    } catch (error) {
      console.error('Erreur chargement paramètres:', error);
    }
  };

  const calculateDiscount = () => {
    if (!article || !article.reference_price || article.reference_price === 0) return 0;
    return Math.round(((article.reference_price - article.price) / article.reference_price) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white">
        <Header />
        <div className="container mx-auto px-4 py-12 text-center">
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return null;
  }

  const discount = calculateDiscount();

  return (
    <div className="min-h-screen bg-zinc-950 text-white" data-testid="article-detail-page">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <div className="relative aspect-square bg-zinc-900 rounded-xl overflow-hidden mb-4">
              {article.photos && article.photos.length > 0 ? (
                <img
                  src={article.photos[currentPhotoIndex]}
                  alt={article.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-600">
                  Pas d'image disponible
                </div>
              )}
              {discount > 0 && (
                <Badge className="absolute top-4 right-4 bg-red-500 text-white text-lg font-bold px-4 py-2">
                  -{discount}%
                </Badge>
              )}
            </div>
            {article.photos && article.photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {article.photos.map((photo, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPhotoIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                      index === currentPhotoIndex ? 'border-orange-500' : 'border-zinc-800'
                    }`}
                    data-testid={`article-photo-thumb-${index}`}
                  >
                    <img src={photo} alt={`${article.name} ${index + 1}`} className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4" style={{fontFamily: 'Outfit, sans-serif'}}>
                {article.name}
              </h1>
              <div className="flex items-baseline gap-4 mb-4">
                <span className="text-4xl font-bold text-orange-500 tracking-tight" style={{fontFamily: 'Outfit, sans-serif'}}>
                  {article.price}€
                </span>
                {article.reference_price > article.price && (
                  <span className="text-xl text-zinc-500 line-through">
                    {article.reference_price}€
                  </span>
                )}
              </div>
            </div>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-3 text-white">Description</h2>
                <p className="text-zinc-300 whitespace-pre-wrap">{article.description}</p>
              </CardContent>
            </Card>

            {(article.platform_links?.vinted || article.platform_links?.leboncoin) && (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-6 space-y-3">
                  <h2 className="text-xl font-semibold mb-3 text-white">Liens d'achat</h2>
                  {article.platform_links.vinted && (
                    <Button
                      variant="outline"
                      className="w-full justify-between border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white"
                      onClick={() => window.open(article.platform_links.vinted, '_blank')}
                      data-testid="article-vinted-link-btn"
                    >
                      Voir l'annonce Vinted
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                  {article.platform_links.leboncoin && (
                    <Button
                      variant="outline"
                      className="w-full justify-between border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white"
                      onClick={() => window.open(article.platform_links.leboncoin, '_blank')}
                      data-testid="article-leboncoin-link-btn"
                    >
                      Voir l'annonce Leboncoin
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-6 space-y-4">
                <h2 className="text-xl font-semibold text-white">Remise en main propre</h2>
                <p className="text-zinc-300 text-sm">
                  Pour une remise en main propre (souvent moins cher), contactez-nous.
                </p>
                {settings.contact_phone && (
                  <p className="text-white">
                    Téléphone : <span className="text-orange-500">{settings.contact_phone}</span>
                  </p>
                )}
                {settings.contact_email && (
                  <p className="text-white">
                    Email : <span className="text-orange-500">{settings.contact_email}</span>
                  </p>
                )}
                <Button
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-full"
                  onClick={() => navigate('/faire-demande')}
                  data-testid="article-request-btn"
                >
                  Demander une remise en main propre
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};