import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../../components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { ArrowLeft, Package, DollarSign, Clock, CheckCircle, XCircle, Truck, AlertCircle } from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'sonner';
import { resolveImageUrl } from '../../utils/images';

export const SellerVenteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sale, setSale] = useState(null);
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSaleDetail();
  }, [id]);

  const fetchSaleDetail = async () => {
    try {
      const response = await api.get(`/seller/sales/${id}`);
      setSale(response.data.sale);
      setArticle(response.data.article);
    } catch (error) {
      toast.error('Erreur lors du chargement de la vente');
    }
    setLoading(false);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'WAITING_ADMIN_APPROVAL': { label: 'En attente validation', color: 'bg-yellow-500' },
      'PAYMENT_PENDING': { label: 'Paiement requis', color: 'bg-orange-500' },
      'PAYMENT_SUBMITTED': { label: 'Paiement soumis', color: 'bg-blue-500' },
      'SHIPPING_PENDING': { label: 'En attente expédition', color: 'bg-purple-500' },
      'SHIPPED': { label: 'Expédié', color: 'bg-indigo-500' },
      'COMPLETED': { label: 'Terminé', color: 'bg-green-500' },
      'REJECTED': { label: 'Refusé', color: 'bg-red-500' }
    };
    
    const config = statusConfig[status] || { label: status, color: 'bg-zinc-500' };
    return <Badge className={`${config.color} text-white`}>{config.label}</Badge>;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'WAITING_ADMIN_APPROVAL': return <Clock className="h-6 w-6 text-yellow-500" />;
      case 'PAYMENT_PENDING': return <AlertCircle className="h-6 w-6 text-orange-500" />;
      case 'PAYMENT_SUBMITTED': return <DollarSign className="h-6 w-6 text-blue-500" />;
      case 'SHIPPING_PENDING': return <Package className="h-6 w-6 text-purple-500" />;
      case 'SHIPPED': return <Truck className="h-6 w-6 text-indigo-500" />;
      case 'COMPLETED': return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'REJECTED': return <XCircle className="h-6 w-6 text-red-500" />;
      default: return <Clock className="h-6 w-6 text-zinc-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white">
        <main className="container mx-auto px-4 py-8">
          <p className="text-center text-zinc-400">Chargement...</p>
        </main>
      </div>
    );
  }

  if (!sale || !article) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white">
        <main className="container mx-auto px-4 py-8">
          <p className="text-center text-red-500">Vente non trouvée</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      
      <main className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/seller/ventes')}
          className="mb-4 text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux ventes
        </Button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-orange-500 mb-2" style={{fontFamily: 'Outfit, sans-serif'}}>
            Détail de la vente
          </h1>
          <div className="flex items-center gap-3 mt-3">
            {getStatusIcon(sale.status)}
            {getStatusBadge(sale.status)}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-orange-500">Informations article</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(() => {
                const imageUrl = resolveImageUrl(article.photos?.[0]);
                if (!imageUrl) return null;
                return (
                  <img
                    src={imageUrl}
                    alt={article.name}
                    className="w-full h-48 object-cover rounded-lg"
                    loading="lazy"
                    onError={(e) => e.target.style.display = 'none'}
                  />
                );
              })()}
              <div>
                <p className="text-sm text-zinc-400">Nom</p>
                <p className="text-lg font-semibold">{article.name}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-400">Description</p>
                <p className="text-sm text-zinc-300">{article.description}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-orange-500">Informations financières</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Prix de vente</span>
                <span className="text-xl font-bold text-white">{sale.sale_price}€</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Coût DownPricer</span>
                <span className="text-lg text-zinc-300">-{sale.seller_cost}€</span>
              </div>
              <div className="border-t border-zinc-700 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 font-semibold">Votre profit</span>
                  <span className="text-2xl font-bold text-green-500">+{sale.profit}€</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-orange-500">Chronologie</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Vente créée</p>
                  <p className="text-xs text-zinc-400">
                    {new Date(sale.created_at).toLocaleString('fr-FR')}
                  </p>
                </div>
              </div>
              
              {sale.updated_at && (
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Clock className="h-4 w-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Dernière mise à jour</p>
                    <p className="text-xs text-zinc-400">
                      {new Date(sale.updated_at).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
              )}

              {sale.tracking_number && (
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <Truck className="h-4 w-4 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Numéro de suivi</p>
                    <p className="text-xs text-zinc-300 font-mono">{sale.tracking_number}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {sale.payment_proof && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-orange-500">Preuve de paiement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-zinc-400">Méthode</p>
                  <p className="text-sm font-medium text-white capitalize">{sale.payment_proof.method || sale.payment_method}</p>
                </div>
                {sale.payment_proof.proof_url && (
                  <div>
                    <p className="text-sm text-zinc-400">Capture</p>
                    <a
                      href={sale.payment_proof.proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-400 hover:underline flex items-center gap-1"
                    >
                      Voir la preuve
                      <ArrowLeft className="h-3 w-3 rotate-180" />
                    </a>
                  </div>
                )}
                {sale.payment_proof.link && (
                  <div>
                    <p className="text-sm text-zinc-400">Lien</p>
                    <p className="text-sm text-white font-mono break-all">{sale.payment_proof.link}</p>
                  </div>
                )}
                {sale.payment_proof.note && (
                  <div>
                    <p className="text-sm text-zinc-400">Note</p>
                    <p className="text-sm text-zinc-300">{sale.payment_proof.note}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {sale.rejection_reason && (
            <Card className="bg-red-500/10 border-red-500/50 md:col-span-2">
              <CardHeader>
                <CardTitle className="text-red-500 flex items-center gap-2">
                  <XCircle className="h-5 w-5" />
                  Motif de refus
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-300">{sale.rejection_reason}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {sale.status === 'PAYMENT_PENDING' && (
          <div className="mt-6">
            <Button
              className="bg-orange-600 hover:bg-orange-700 w-full md:w-auto"
              onClick={() => navigate('/seller/paiements-en-attente')}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Soumettre une preuve de paiement
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};