import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import { ExternalLink } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'sonner';
import { resolveImageUrl } from '../utils/images';
import { RatingStars } from '../components/RatingStars';
import { AvatarCircle } from '../components/AvatarCircle';

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
        <div className="container mx-auto px-4 py-12 text-center">
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white">
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Article introuvable</h1>
          <p className="text-zinc-400 mb-6">L'article que vous recherchez n'existe pas ou a été supprimé.</p>
          <Button onClick={() => navigate('/')} className="bg-orange-500 hover:bg-orange-600 text-white">
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  // Extraire les infos vendor de manière sûre après les guards
  const vendor = article?.vendor;
  const vendorAvatar = vendor?.avatar_url || vendor?.logo_url;
  const vendorName = vendor?.seller_name || vendor?.minisite_name || 'Boutique';

  const discount = calculateDiscount();

  return (
    <div className="min-h-screen bg-zinc-950 text-white" data-testid="article-detail-page">
      <main className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <div className="relative aspect-square bg-zinc-900 rounded-xl overflow-hidden mb-4">
              {(() => {
                const imageUrl = resolveImageUrl(article?.photos?.[currentPhotoIndex]);
                if (!imageUrl) {
                  return (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600">
                      Pas d'image disponible
                    </div>
                  );
                }
                return (
                  <img
                    src={imageUrl}
                    alt={article?.name || 'Article'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      const placeholder = e.target.parentElement.querySelector('.img-placeholder');
                      if (placeholder) placeholder.style.display = 'flex';
                    }}
                  />
                );
              })()}
              <div className="w-full h-full hidden items-center justify-center text-zinc-600 img-placeholder">
                Pas d'image disponible
              </div>
              {discount > 0 && (
                <Badge className="absolute top-4 right-4 bg-red-500 text-white text-lg font-bold px-4 py-2">
                  -{discount}%
                </Badge>
              )}
            </div>
            {article?.photos && article.photos.length > 1 && (
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
                    {(() => {
                      const thumbUrl = resolveImageUrl(photo);
                      return thumbUrl ? (
                        <img 
                          src={thumbUrl} 
                          alt={`${article?.name || 'Article'} ${index + 1}`} 
                          className="w-full h-full object-cover" 
                          loading="lazy"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-600 text-xs">Image</div>
                      );
                    })()}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              {(article?.source === "minisite" || article?.is_third_party) && (
                <Badge className="bg-blue-600/90 backdrop-blur-sm text-white border-none shadow-sm hover:bg-blue-700 mb-3">
                  Vendeur tiers
                </Badge>
              )}
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4" style={{fontFamily: 'Outfit, sans-serif'}}>
                {article?.name || 'Article'}
              </h1>
              {article?.vendor && (
                <div className="mb-4 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                  <div className="flex items-center gap-2">
                    {article.vendor.logo_url ? (
                      <img
                        src={article.vendor.logo_url}
                        alt={article.vendor.minisite_name || 'Boutique'}
                        className="h-9 w-9 rounded-full object-cover border border-zinc-700"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-zinc-500">
                        {article.vendor.minisite_name?.slice(0, 1)?.toUpperCase() || 'V'}
                      </div>
                    )}
                    <div className="flex-1">
                      <button
                        type="button"
                        onClick={() => navigate(`/s/${article.vendor?.minisite_slug || ''}`)}
                        className="text-sm text-white hover:text-orange-400"
                      >
                        {article.vendor.minisite_name || 'Boutique'}
                      </button>
                      <RatingStars rating={article.vendor?.rating_avg || 0} count={article.vendor?.rating_count || 0} />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/boutique/${article.vendor?.minisite_slug || ''}/avis`)}
                    className="mt-2 text-xs text-blue-400 hover:underline"
                  >
                    Voir les avis boutique
                  </button>
                </div>
              )}
              <div className="flex items-baseline gap-4 mb-4">
                <span className="text-4xl font-bold text-orange-500 tracking-tight" style={{fontFamily: 'Outfit, sans-serif'}}>
                  {article?.price || 0}€
                </span>
                {article?.reference_price && article.reference_price > (article?.price || 0) && (
                  <span className="text-xl text-zinc-500 line-through">
                    {article.reference_price}€
                  </span>
                )}
              </div>
              {vendor && (
                <div className="mb-4 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 space-y-2">
                  <div className="flex items-center gap-3">
                    <AvatarCircle src={vendorAvatar} name={vendorName} size={44} />
                    <div>
                      <button
                        type="button"
                        onClick={() => navigate(`/s/${vendor?.minisite_slug || ''}`)}
                        className="text-sm text-white hover:text-orange-400"
                      >
                        {vendorName}
                      </button>
                      <RatingStars rating={vendor?.rating_avg || 0} count={vendor?.rating_count || 0} />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/boutique/${vendor?.minisite_slug || ''}/avis`)}
                    className="text-xs text-blue-400 hover:underline"
                  >
                    Voir les avis boutique
                  </button>
                </div>
              )}
            </div>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-3 text-white">Description</h2>
                <p className="text-zinc-300 whitespace-pre-wrap">{article?.description || 'Aucune description disponible.'}</p>
              </CardContent>
            </Card>

            {(article?.platform_links?.vinted || article?.platform_links?.leboncoin) && (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-6 space-y-3">
                  <h2 className="text-xl font-semibold mb-3 text-white">Liens d'achat</h2>
                  {article?.platform_links?.vinted && (
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
                  {article?.platform_links?.leboncoin && (
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

            {/* Contact pour articles vendeur tiers */}
            {(article?.source === "minisite" || article?.is_third_party) && article?.contact_email && (
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

            {/* Remise en main propre uniquement pour articles admin */}
            {article?.source !== "minisite" && !article?.is_third_party && (
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
                    onClick={() => {
                      const subject = encodeURIComponent(`Demande remise en main propre - DownPricer - ${article?.name || 'Article'}`);
                      const body = encodeURIComponent(
                        `Bonjour,\n\nJe souhaite demander une remise en main propre pour l'article suivant :\n\n` +
                        `- Nom : ${article?.name || 'Article'}\n` +
                        `- Prix : ${article?.price || 0}€\n` +
                        `- ID : ${article?.id || 'N/A'}\n` +
                        `- Lien : ${window.location.href}\n\n` +
                        `Merci de me contacter pour organiser la remise.\n\nCordialement`
                      );
                      window.location.href = `mailto:${settings.contact_email || 'contact@downpricer.com'}?subject=${subject}&body=${body}`;
                    }}
                    data-testid="article-request-btn"
                  >
                    Demander une remise en main propre
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};