import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/Header';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';
import { Star } from 'lucide-react';
import { AvatarCircle } from '../../components/AvatarCircle';
import { RatingStars } from '../../components/RatingStars';
import api from '../../utils/api';
import { toast } from 'sonner';

export const SellerVentes = () => {
  const navigate = useNavigate();
  const [ventes, setVentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [marketplaceTxs, setMarketplaceTxs] = useState([]);
  const [marketplaceLoading, setMarketplaceLoading] = useState(true);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewTx, setReviewTx] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  useEffect(() => {
    fetchVentes();
    fetchMarketplaceTransactions();
  }, []);

  const fetchVentes = async () => {
    try {
      const response = await api.get('/seller/sales');
      setVentes(response.data);
    } catch (error) {
      toast.error('Erreur chargement ventes');
    }
    setLoading(false);
  };

  const fetchMarketplaceTransactions = async () => {
    try {
      const response = await api.get('/marketplace/transactions/my?role=buyer');
      setMarketplaceTxs(response.data || []);
    } catch (error) {
      toast.error('Erreur chargement transactions B2B');
    }
    setMarketplaceLoading(false);
  };

  const handleConfirmBuyer = async (transactionId) => {
    try {
      await api.patch(`/marketplace/transactions/${transactionId}/confirm`, { side: 'buyer' });
      toast.success('Confirmation envoyée');
      fetchMarketplaceTransactions();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur confirmation');
    }
  };

  const openReviewModal = (tx) => {
    setReviewTx(tx);
    setReviewRating(5);
    setReviewComment('');
    setReviewOpen(true);
  };

  const submitReview = async () => {
    if (!reviewTx?.id) return;
    try {
      await api.post('/reviews', {
        transaction_id: reviewTx.id,
        rating: reviewRating,
        comment: reviewComment,
        target: 'minisite'
      });
      toast.success('Avis envoyé');
      setReviewOpen(false);
      fetchMarketplaceTransactions();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'avis');
    }
  };

  const getTransactionStatusLabel = (status) => {
    const map = {
      requested: 'En attente d’acceptation',
      accepted: 'Accès accordé',
      declined: 'Refusée',
      completed: 'Terminée'
    };
    return map[status] || status;
  };

  const getStatusBadge = (status) => {
    const map = {
      'AWAITING_VALIDATION': { label: 'En attente validation', color: 'bg-orange-500/20 text-orange-400' },
      'PAYMENT_REQUIRED': { label: 'Paiement requis', color: 'bg-red-500/20 text-red-400' },
      'PAYMENT_RECEIVED': { label: 'Paiement reçu', color: 'bg-green-500/20 text-green-400' },
      'READY_TO_SHIP': { label: 'Prêt à expédier', color: 'bg-blue-500/20 text-blue-400' },
      'SHIPPED': { label: 'Expédié', color: 'bg-purple-500/20 text-purple-400' },
      'COMPLETED': { label: 'Terminé', color: 'bg-green-500/20 text-green-400' }
    };
    const { label, color } = map[status] || { label: status, color: 'bg-zinc-500/20 text-zinc-400' };
    return <Badge className={color}>{label}</Badge>;
  };

  const ventesEnCours = ventes.filter(v => !['COMPLETED'].includes(v.status));
  const ventesRealisees = ventes.filter(v => v.status === 'COMPLETED');

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-orange-500 mb-6" style={{fontFamily: 'Outfit, sans-serif'}}>
          Mes Ventes
        </h1>

        <div className="mb-10">
          <h2 className="text-xl font-semibold text-white mb-4">Transactions B2B</h2>
          {marketplaceLoading ? (
            <Card className="bg-zinc-900 border-zinc-800"><CardContent className="p-6 text-center text-zinc-400">Chargement...</CardContent></Card>
          ) : marketplaceTxs.length === 0 ? (
            <Card className="bg-zinc-900 border-zinc-800"><CardContent className="p-6 text-center text-zinc-400">Aucune transaction B2B</CardContent></Card>
          ) : (
            <div className="space-y-4">
              {marketplaceTxs.map((tx) => (
                <Card key={tx.id} className="bg-zinc-900 border-zinc-800">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-white">{tx.article?.name || 'Article'}</h3>
                        <p className="text-sm text-zinc-500">
                          Boutique : {tx.minisite?.site_name || 'Vendeur tiers'}
                        </p>
                      </div>
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                        {getTransactionStatusLabel(tx.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                      <AvatarCircle src={tx.buyer?.avatar} name={tx.buyer?.name} size={40} />
                      <div>
                        <p className="text-sm font-semibold text-white">{tx.buyer?.name || 'Revendeur'}</p>
                        <RatingStars rating={tx.buyer?.rating_avg || 0} count={tx.buyer?.rating_count || 0} showCount={false} size={12} />
                      </div>
                    </div>
                    {tx.status === 'accepted' && (
                      <div className="space-y-2">
                        {(tx.article?.platform_links?.vinted || tx.article?.platform_links?.leboncoin) && (
                          <div className="flex flex-col gap-2">
                            {tx.article?.platform_links?.vinted && (
                              <Button variant="outline" className="justify-between border-cyan-500 text-cyan-500 hover:bg-cyan-500 hover:text-white" onClick={() => window.open(tx.article.platform_links.vinted, '_blank')}>
                                Ouvrir Vinted
                              </Button>
                            )}
                            {tx.article?.platform_links?.leboncoin && (
                              <Button variant="outline" className="justify-between border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white" onClick={() => window.open(tx.article.platform_links.leboncoin, '_blank')}>
                                Ouvrir Leboncoin
                              </Button>
                            )}
                          </div>
                        )}
                        <p className="text-xs text-zinc-400">
                          Échangez via le Discord officiel DownPricer pour sécuriser la transaction.
                        </p>
                        <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleConfirmBuyer(tx.id)} disabled={tx.buyer_confirmed}>
                          {tx.buyer_confirmed ? 'Confirmation envoyée' : 'Confirmer transaction terminée'}
                        </Button>
                      </div>
                    )}
                    {tx.status === 'completed' && !tx.buyer_reviewed && (
                      <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => openReviewModal(tx)}>
                        Laisser un avis
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12"><p className="text-zinc-400">Chargement...</p></div>
        ) : (
          <Tabs defaultValue="en-cours" className="w-full">
            <TabsList className="bg-zinc-900 border-zinc-800 mb-6">
              <TabsTrigger value="en-cours" className="data-[state=active]:bg-orange-500">En cours ({ventesEnCours.length})</TabsTrigger>
              <TabsTrigger value="realisees" className="data-[state=active]:bg-orange-500">Réalisées ({ventesRealisees.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="en-cours">
              {ventesEnCours.length === 0 ? (
                <Card className="bg-zinc-900 border-zinc-800"><CardContent className="p-12 text-center"><p className="text-zinc-400">Aucune vente en cours</p></CardContent></Card>
              ) : (
                <div className="space-y-4">
                  {ventesEnCours.map((vente) => (
                    <Card 
                      key={vente.id} 
                      className="bg-zinc-900 border-zinc-800 hover:border-orange-500/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/seller/ventes/${vente.id}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-white">{vente.article_name}</h3>
                            <div className="flex gap-4 mt-2 text-sm">
                              <span className="text-zinc-400">Prix vente: <strong className="text-white">{vente.sale_price}€</strong></span>
                              <span className="text-zinc-400">Coût: <strong className="text-white">{vente.seller_cost}€</strong></span>
                              <span className="text-green-500">Profit: <strong>{vente.profit}€</strong></span>
                            </div>
                          </div>
                          {getStatusBadge(vente.status)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="realisees">
              {ventesRealisees.length === 0 ? (
                <Card className="bg-zinc-900 border-zinc-800"><CardContent className="p-12 text-center"><p className="text-zinc-400">Aucune vente réalisée</p></CardContent></Card>
              ) : (
                <div className="space-y-4">
                  {ventesRealisees.map((vente) => (
                    <Card 
                      key={vente.id} 
                      className="bg-zinc-900 border-zinc-800 hover:border-orange-500/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/seller/ventes/${vente.id}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-white">{vente.article_name}</h3>
                            <div className="flex gap-4 mt-2 text-sm">
                              <span className="text-zinc-400">Prix vente: <strong className="text-white">{vente.sale_price}€</strong></span>
                              <span className="text-green-500">Profit: <strong>{vente.profit}€</strong></span>
                            </div>
                          </div>
                          {getStatusBadge(vente.status)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
        <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
            <DialogHeader>
              <DialogTitle>Laisser un avis boutique</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setReviewRating(value)}
                    className="p-1"
                  >
                    <Star className={value <= reviewRating ? 'text-yellow-400' : 'text-zinc-600'} size={20} />
                  </button>
                ))}
              </div>
              <Textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Votre commentaire (optionnel)"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
              <div className="flex gap-2">
                <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={submitReview}>
                  Envoyer l’avis
                </Button>
                <Button variant="outline" className="border-zinc-700 text-white" onClick={() => setReviewOpen(false)}>
                  Annuler
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};