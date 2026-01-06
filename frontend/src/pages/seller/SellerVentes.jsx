import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/Header';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import api from '../../utils/api';
import { toast } from 'sonner';

export const SellerVentes = () => {
  const navigate = useNavigate();
  const [ventes, setVentes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVentes();
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
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-orange-500 mb-6" style={{fontFamily: 'Outfit, sans-serif'}}>
          Mes Ventes
        </h1>

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
      </main>
    </div>
  );
};