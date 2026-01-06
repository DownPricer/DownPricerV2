import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../../components/Header';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Download, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import api from '../../utils/api';
import { toast } from 'sonner';

export const SellerArticleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSaleDialog, setShowSaleDialog] = useState(false);
  const [salePrice, setSalePrice] = useState('');
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    fetchArticle();
  }, [id]);

  const fetchArticle = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/articles/${id}`);
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

  const handleDeclareVente = async () => {
    if (!salePrice || parseFloat(salePrice) <= 0) {
      toast.error('Prix de vente invalide');
      return;
    }

    try {
      const response = await api.post('/seller/sales', {
        article_id: article.id,
        sale_price: parseFloat(salePrice)
      });

      toast.success('Vente enregistrée. Elle est en attente de validation par DownPricer.');
      setShowSaleDialog(false);
      setSalePrice('');
      
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
        <Header />
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
      <Header />
      
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
              <div className="flex gap-2 overflow-x-auto mb-4">
                {article.photos.map((photo, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPhotoIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                      index === currentPhotoIndex ? 'border-orange-500' : 'border-zinc-800'
                    }`}
                  >
                    <img src={photo} alt={`${article.name} ${index + 1}`} className="w-full h-full object-cover" loading="lazy" />
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
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4" style={{fontFamily: 'Outfit, sans-serif'}}>
                {article.name}
              </h1>
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

                  <div className="pt-4 space-y-2">
                    <Button
                      onClick={handleDeclareVente}
                      className="w-full bg-green-600 hover:bg-green-700"
                      disabled={!salePrice || parseFloat(salePrice) <= 0}
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
