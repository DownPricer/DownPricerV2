import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../../components/Header';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Download, AlertTriangle, ExternalLink } from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'sonner';
import { resolveImageUrl } from '../../utils/images';

export const SellerArticleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSaleDialog, setShowSaleDialog] = useState(false);
  const [salePrice, setSalePrice] = useState('');
  const [shippingLabel, setShippingLabel] = useState('');
  const [uploadingLabel, setUploadingLabel] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    fetchArticle();
  }, [id]);

  const fetchArticle = async () => {
    try {
      const response = await api.get(`/articles/${id}`);
      setArticle(response.data);
    } catch (error) {
      toast.error('Article non trouvé');
      navigate('/seller/articles');
    }
    setLoading(false);
  };

  const handleDownloadPhotos = async () => {
    if (!article || !article.photos || article.photos.length === 0) {
      toast.error('Aucune photo à télécharger');
      return;
    }

    // Simuler le téléchargement (en production, créer un ZIP côté backend)
    article.photos.forEach((photoUrl, index) => {
      const link = document.createElement('a');
      link.href = photoUrl;
      link.download = `${article.name}_photo_${index + 1}`;
      link.target = '_blank';
      link.click();
    });

    toast.success(`${article.photos.length} photo(s) téléchargée(s)`);
  };

  const handleShippingLabelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Le fichier doit être une image');
      return;
    }

    setUploadingLabel(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/upload/image?no_restrictions=true', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.url) {
        setShippingLabel(response.data.url);
        toast.success('Bordereau uploadé avec succès');
      } else {
        toast.error('Erreur lors de l\'upload');
      }
    } catch (error) {
      const errorDetail = error.response?.data?.detail;
      const errorMessage = typeof errorDetail === 'object' && errorDetail?.detail 
        ? errorDetail.detail 
        : (typeof errorDetail === 'string' ? errorDetail : error.message || 'Erreur lors de l\'upload');
      toast.error(errorMessage);
    }
    setUploadingLabel(false);
    e.target.value = '';
  };

  const handleDeclareVente = async () => {
    if (!salePrice || parseFloat(salePrice) <= 0) {
      toast.error('Prix de vente invalide');
      return;
    }

    if (!shippingLabel || !shippingLabel.trim()) {
      toast.error('Le bordereau d\'expédition est obligatoire');
      return;
    }

    try {
      const response = await api.post('/seller/sales', {
        article_id: article.id,
        sale_price: parseFloat(salePrice),
        shipping_label: shippingLabel
      });

      toast.success('Vente enregistrée. Elle est en attente de validation par DownPricer.');
      setShowSaleDialog(false);
      setSalePrice('');
      setShippingLabel('');
      
      // Rediriger vers les ventes
      setTimeout(() => navigate('/seller/ventes'), 1500);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'enregistrement');
    }
  };

  const calculateDiscount = () => {
    if (!article || !article.reference_price || article.reference_price === 0) return 0;
    return Math.round(((article.reference_price - article.price) / article.reference_price) * 100);
  };

  const calculatePotentialProfit = () => {
    if (!salePrice || !article) return 0;
    return parseFloat(salePrice) - article.price;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white">
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-zinc-400">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!article) return null;

  const discount = calculateDiscount();

  return (
    <div className="min-h-screen bg-zinc-950 text-white" data-testid="seller-article-detail">
      
      <main className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/seller/articles')}
          className="mb-4 text-zinc-400 hover:text-white"
        >
          ← Retour au catalogue
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <div className="relative aspect-square bg-zinc-900 rounded-xl overflow-hidden mb-4">
              {(() => {
                const imageUrl = resolveImageUrl(article.photos?.[currentPhotoIndex]);
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
                    alt={article.name}
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

            {article.photos && article.photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto mb-4">
                {article.photos.map((photo, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPhotoIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                      index === currentPhotoIndex ? 'border-orange-500' : 'border-zinc-800'
                    }`}
                  >
                    {(() => {
                      const thumbUrl = resolveImageUrl(photo);
                      return thumbUrl ? (
                        <img 
                          src={thumbUrl} 
                          alt={`${article.name} ${index + 1}`} 
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

            <Card className="bg-red-500/10 border-red-500/50 mb-4">
              <CardContent className="p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-400 font-semibold mb-1">⚠️ IMPORTANT</p>
                  <p className="text-sm text-red-300">
                    Ne faites pas de captures d'écran. Utilisez le bouton "Télécharger les photos" pour éviter des problèmes de qualité et de plateforme.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handleDownloadPhotos}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white mb-4"
              data-testid="download-photos-btn"
            >
              <Download className="h-4 w-4 mr-2" />
              Télécharger les photos ({article.photos?.length || 0})
            </Button>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-bold text-white flex-1" style={{fontFamily: 'Outfit, sans-serif'}}>
                  {article.name}
                </h1>
                {article.is_third_party && (
                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50">Vendeur tiers</Badge>
                )}
              </div>
              {article.posted_by_info && (
                <p className="text-sm text-zinc-400 mb-2">
                  Posté par <span className="text-zinc-300 font-medium">{article.posted_by_info.name || article.posted_by_info.username}</span>
                </p>
              )}
            </div>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-zinc-400">Prix vendeur</span>
                    <p className="text-2xl font-bold text-orange-500">{article.price}€</p>
                    <p className="text-xs text-zinc-500">Ce que vous payez</p>
                  </div>
                  <div>
                    <span className="text-sm text-zinc-400">Prix de référence</span>
                    <p className="text-2xl font-bold text-zinc-300">{article.reference_price}€</p>
                    <p className="text-xs text-zinc-500">Prix habituel</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-800">
                  <span className="text-sm text-zinc-400">Bénéfice potentiel</span>
                  <p className="text-3xl font-bold text-green-500">
                    +{(article.reference_price - article.price).toFixed(2)}€
                  </p>
                  <p className="text-xs text-zinc-500">Si vendu au prix de référence</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-white mb-3">Description</h2>
                <p className="text-zinc-300 whitespace-pre-wrap">{article.description}</p>
              </CardContent>
            </Card>

            {/* Bloc vendeur tiers : Discord + CTA plateformes */}
            {article.is_third_party && (
              <>
                {/* Liens plateformes */}
                {(article.platform_links?.vinted || article.platform_links?.leboncoin) && (
                  <Card className="bg-zinc-900 border-zinc-800">
                    <CardContent className="p-6 space-y-3">
                      <h2 className="text-xl font-semibold text-white mb-3">Acheter l'article</h2>
                      {article.platform_links.vinted && (
                        <Button
                          variant="outline"
                          className="w-full justify-between border-cyan-500 text-cyan-500 hover:bg-cyan-500 hover:text-white"
                          onClick={() => window.open(article.platform_links.vinted, '_blank')}
                        >
                          Acheter sur Vinted
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                      {article.platform_links.leboncoin && (
                        <Button
                          variant="outline"
                          className="w-full justify-between border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white"
                          onClick={() => window.open(article.platform_links.leboncoin, '_blank')}
                        >
                          Acheter sur Leboncoin
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Bloc Discord */}
                <Card className="bg-blue-950/20 border-blue-900/30">
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <h2 className="text-xl font-semibold text-white mb-2">Contact vendeur</h2>
                      {article.posted_by_info && (
                        <p className="text-zinc-300 mb-2">
                          Vendeur : <span className="text-white font-medium">{article.posted_by_info.name || article.posted_by_info.username}</span>
                        </p>
                      )}
                      {article.discord_tag && (
                        <p className="text-zinc-300">
                          Discord : <span className="text-blue-400 font-medium">{article.discord_tag}</span>
                        </p>
                      )}
                    </div>
                    
                    <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                      <p className="text-sm text-zinc-300 mb-2">
                        <strong className="text-white">Pour éviter les arnaques, achetez via Vinted.</strong> Sinon contactez via Discord DownPricer :
                      </p>
                      <p className="text-sm text-zinc-400 mb-3">
                        Rejoignez le <a href="https://discord.gg/downpricer" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Discord officiel DownPricer</a> et contactez <strong className="text-white">{article.discord_tag || article.posted_by_info?.username || 'le vendeur'}</strong> dans le canal <strong className="text-white">#transactions</strong>.
                      </p>
                      <Button
                        variant="outline"
                        className="w-full border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                        onClick={() => window.open('https://discord.gg/downpricer', '_blank')}
                      >
                        Rejoindre Discord DownPricer
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Bouton "J'ai vendu" uniquement pour articles admin (pas vendeur tiers) */}
            {!article.is_third_party && (
              <Dialog open={showSaleDialog} onOpenChange={setShowSaleDialog}>
                <Button
                  onClick={() => setShowSaleDialog(true)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-6"
                  data-testid="declare-sale-btn"
                >
                  ✓ J'ai vendu cet article
                </Button>

              <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
                <DialogHeader>
                  <DialogTitle className="text-white">Déclarer une vente</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-zinc-400 mb-2">Article : <strong className="text-white">{article.name}</strong></p>
                    <p className="text-sm text-zinc-400">Prix vendeur : <strong className="text-orange-500">{article.price}€</strong></p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Prix de vente réel * (obligatoire)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={salePrice}
                      onChange={(e) => setSalePrice(e.target.value)}
                      placeholder="Ex: 650"
                      className="bg-zinc-800 border-zinc-700 text-white"
                      required
                    />
                  </div>

                  {salePrice && parseFloat(salePrice) > 0 && (
                    <Card className="bg-zinc-800 border-zinc-700">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-400">Votre bénéfice estimé :</span>
                          <span className={`text-xl font-bold ${calculatePotentialProfit() > 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {calculatePotentialProfit() > 0 ? '+' : ''}{calculatePotentialProfit().toFixed(2)}€
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="space-y-2">
                    <Label className="text-white">Bordereau d'expédition * (obligatoire)</Label>
                    <div className="border-2 border-dashed border-zinc-600 rounded-lg p-4 text-center hover:border-orange-500/50 transition-colors bg-zinc-800/30">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleShippingLabelUpload}
                        disabled={uploadingLabel}
                        className="hidden"
                        id="shipping-label-upload"
                      />
                      <label 
                        htmlFor="shipping-label-upload" 
                        className={`cursor-pointer ${uploadingLabel ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {uploadingLabel ? (
                          <p className="text-sm text-zinc-300">Upload en cours...</p>
                        ) : shippingLabel ? (
                          <div className="space-y-2">
                            <img src={resolveImageUrl(shippingLabel)} alt="Bordereau" className="max-h-32 mx-auto rounded" />
                            <p className="text-xs text-green-400">Bordereau uploadé ✓</p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                setShippingLabel('');
                              }}
                              className="text-xs"
                            >
                              Changer
                            </Button>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm text-zinc-300 font-medium">Cliquez pour uploader le bordereau</p>
                            <p className="text-xs text-zinc-500 mt-1">Tous formats image acceptés</p>
                          </>
                        )}
                      </label>
                    </div>
                  </div>

                  <div className="pt-4 space-y-2">
                    <Button
                      onClick={handleDeclareVente}
                      className="w-full bg-green-600 hover:bg-green-700"
                      disabled={!salePrice || parseFloat(salePrice) <= 0 || !shippingLabel}
                    >
                      Confirmer la vente
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowSaleDialog(false)}
                      className="w-full border-zinc-700 text-white hover:bg-zinc-800"
                    >
                      Annuler
                    </Button>
                  </div>

                  <p className="text-xs text-zinc-500">
                    La vente sera enregistrée en statut "En attente de validation". DownPricer la validera avant que vous ne deviez effectuer le paiement.
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </main>
    </div>
  );
};
