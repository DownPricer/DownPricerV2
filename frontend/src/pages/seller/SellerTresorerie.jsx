import React, { useState, useEffect } from 'react';
import { Header } from '../../components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'sonner';

export const SellerTresorerie = () => {
  const [ventes, setVentes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ventesRes, statsRes] = await Promise.all([
        api.get('/seller/sales'),
        api.get('/seller/stats')
      ]);
      setVentes(ventesRes.data);
      setStats(statsRes.data);
    } catch (error) {
      toast.error('Erreur chargement trésorerie');
    }
    setLoading(false);
  };

  const calculateTotals = () => {
    const totalCA = ventes
      .filter(v => v.status === 'COMPLETED')
      .reduce((sum, v) => sum + v.sale_price, 0);
    
    const totalCost = ventes
      .filter(v => v.status === 'COMPLETED')
      .reduce((sum, v) => sum + v.seller_cost, 0);
    
    const pendingPayments = ventes
      .filter(v => v.payment_status === 'pending' && v.status !== 'AWAITING_VALIDATION')
      .reduce((sum, v) => sum + v.seller_cost, 0);
    
    const paidPayments = ventes
      .filter(v => v.payment_status === 'paid')
      .reduce((sum, v) => sum + v.seller_cost, 0);

    return { totalCA, totalCost, pendingPayments, paidPayments };
  };

  const { totalCA, totalCost, pendingPayments, paidPayments } = calculateTotals();

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-orange-500 mb-6" style={{fontFamily: 'Outfit, sans-serif'}}>
          Trésorerie
        </h1>

        {loading ? (
          <div className="text-center py-12"><p className="text-zinc-400">Chargement...</p></div>
        ) : (
          <>
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-400">CA Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold text-white">{totalCA.toFixed(2)}€</span>
                    <DollarSign className="h-8 w-8 text-green-500" />
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">Ventes terminées</p>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-400">Paiements à effectuer</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold text-orange-500">{pendingPayments.toFixed(2)}€</span>
                    <AlertCircle className="h-8 w-8 text-orange-500" />
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">En attente</p>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-400">Paiements OK</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold text-green-500">{paidPayments.toFixed(2)}€</span>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">Payés</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-zinc-900 border-zinc-800 mb-6">
              <CardHeader>
                <CardTitle className="text-white">Détail des paiements</CardTitle>
              </CardHeader>
              <CardContent>
                {ventes.filter(v => v.status !== 'AWAITING_VALIDATION' && v.status !== 'COMPLETED').length === 0 ? (
                  <p className="text-center text-zinc-400 py-8">Aucun paiement en attente</p>
                ) : (
                  <div className="space-y-3">
                    {ventes
                      .filter(v => v.status !== 'AWAITING_VALIDATION' && v.status !== 'COMPLETED')
                      .map((vente) => (
                        <div key={vente.id} className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg">
                          <div>
                            <p className="font-semibold text-white">{vente.article_name}</p>
                            <p className="text-sm text-zinc-400">Montant à payer : {vente.seller_cost}€</p>
                          </div>
                          <Badge className={vente.payment_status === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}>
                            {vente.payment_status === 'paid' ? 'Payé' : 'En attente'}
                          </Badge>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-blue-500/10 border-blue-500/50">
              <CardContent className="p-4">
                <p className="text-sm text-blue-300">
                  💡 <strong>Info :</strong> Les paiements doivent être effectués après validation de la vente par DownPricer.
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
};
