import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import { ExternalLink, ChevronLeft, ChevronRight, ZoomIn, ArrowLeft } from 'lucide-react';
import { Header } from '../components/Header';
import api from '../utils/api';
import { toast } from 'sonner';
import { resolveImageUrl } from '../utils/images';
import { SafeImage } from '../components/SafeImage';

export const MinisiteArticleDetail = () => {
  const { slug, id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [minisite, setMinisite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    fetchData();
  }, [slug, id]);

  const fetchData = async () => {
    try {
      // Récupérer le minisite et l'article
      const [minisiteRes, articleRes] = await Promise.all([
        api.get(`/minisites/slug/${slug}`).catch(() => null),
        api.get(`/articles/${id}`).catch(() => null)
      ]);

      if (!minisiteRes || !articleRes) {
        toast.error('Article ou mini-site introuvable');
        navigate(`/s/${slug}`);
        return;
      }

      setMinisite(minisiteRes.data);
      setArticle(articleRes.data);
    } catch (error) {
      toast.error('Erreur lors du chargement');
      navigate(`/s/${slug}`);
    } finally {
      setLoading(false);
    }
  };

  const nextPhoto = () => {
    if (article && article.photos && article.photos.length > 0) {
      setCurrentPhotoIndex((prev) => (prev + 1) % article.photos.length);
    }
  };

  const prevPhoto = () => {
    if (article && article.photos && article.photos.length > 0) {
      setCurrentPhotoIndex((prev) => (prev - 1 + article.photos.length) % article.photos.length);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-zinc-400">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!article || !minisite) {
    return null;
  }

  const discount = article.reference_price > 0 
    ? Math.round(((article.reference_price - article.price) / article.reference_price) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-white" style={{ fontFamily: minisite.font_family || 'system-ui' }}>
      {/* Header global DownPricer - uniquement pour plan 1 */}
      {minisite.plan_id === 'SITE_PLAN_1' && <Header />}
      
      {/* Header local du minisite */}
      <header className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => navigate(`/s/${slug}`)}
              className="text-zinc-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            {minisite.logo_url ? (
              <img src={minisite.logo_url} alt={minisite.site_name} className="h-10 w-10 rounded-full object-cover" onError={(e) => e.target.style.display = 'none'} />
            ) : (
              <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: minisite.primary_color || '#FF5722' }}>
                <span className="text-white font-bold">{minisite.site_name.charAt(0)}</span>
              </div>
            )}
            <h1 className="text-xl font-bold" style={{ color: minisite.primary_color || '#FF5722' }}>{minisite.site_name}</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Photos */}
          <div>
            <div className="relative aspect-square bg-zinc-900 rounded-xl overflow-hidden mb-4">
              {article.photos && article.photos.length > 0 ? (
                <>
                  <SafeImage 
                    src={article.photos[currentPhotoIndex]} 
                    alt={article.name}
                    className={`w-full h-full object-cover ${isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'}`}
                    onClick={() => setIsZoomed(!isZoomed)}
                  />
                  
                  {article.photos.length > 1 && (
                    <>
                      <Button
                        variant="outline"
                        size="icon"
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-zinc-900/80 hover:bg-zinc-800 border-zinc-700"
                        onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-zinc-900/80 hover:bg-zinc-800 border-zinc-700"
                        onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
                        {article.photos.map((_, idx) => (
                          <button
                            key={idx}
                            className={`w-2 h-2 rounded-full transition-all ${
                              idx === currentPhotoIndex ? 'bg-white' : 'bg-white/50'
                            }`}
                            onClick={(e) => { e.stopPropagation(); setCurrentPhotoIndex(idx); }}
                          />
                        ))}
                      </div>
                    </>
                  )}
                  
                  {!isZoomed && (
                    <div className="absolute top-2 right-2 bg-zinc-900/80 px-2 py-1 rounded text-xs flex items-center gap-1">
                      <ZoomIn className="h-3 w-3" />
                      Cliquez pour zoomer
                    </div>
                  )}
                  
                  {discount > 0 && (
                    <Badge className="absolute top-2 left-2 bg-red-500 text-white text-lg font-bold px-4 py-2">
                      -{discount}%
                    </Badge>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-600">
                  Pas d'image disponible
                </div>
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
                  >
                    <SafeImage src={photo} alt={`${article.name} ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Infos */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                {article.name}
              </h1>
              <div className="flex items-baseline gap-4 mb-4">
                <span className="text-4xl font-bold tracking-tight" style={{ color: minisite.primary_color || '#FF5722' }}>
                  {article.price}€
                </span>
                {article.reference_price > article.price && (
                  <span className="text-xl text-zinc-500 line-through">
                    {article.reference_price}€
                  </span>
                )}
              </div>
              {article.condition && (
                <Badge className="bg-zinc-800 text-zinc-300 mb-4">
                  {article.condition}
                </Badge>
              )}
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
                    >
                      Voir l'annonce Leboncoin
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {article.contact_email && (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-6 space-y-4">
                  <h2 className="text-xl font-semibold text-white">Contact</h2>
                  <p className="text-zinc-300 text-sm">
                    Pour contacter le vendeur de cet article :
                  </p>
                  <p className="text-white">
                    Email : <a href={`mailto:${article.contact_email}`} className="text-orange-500 hover:underline">{article.contact_email}</a>
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

