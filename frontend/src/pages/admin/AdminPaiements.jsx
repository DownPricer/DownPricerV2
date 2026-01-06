import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'sonner';

export const AdminPaiementsPage = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const response = await api.get('/admin/sales');
      setSales(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    }
    setLoading(false);
  };

  const handleConfirmPayment = async (saleId) => {
    try {
      await api.post(`/admin/sales/${saleId}/confirm-payment`);
      toast.success('Paiement confirmé');
      fetchSales();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleRejectPayment = async (saleId) => {
    const reason = prompt('Motif du refus:');
    if (!reason) return;
    
    try {
      await api.post(`/admin/sales/${saleId}/reject-payment`, { reason });
      toast.success('Paiement refusé');
      fetchSales();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const pendingSales = sales.filter(s => s.status === 'PAYMENT_SUBMITTED');
  const confirmedSales = sales.filter(s => s.status === 'SHIPPING_PENDING' || s.status === 'SHIPPED' || s.status === 'COMPLETED');

  const filteredPending = pendingSales.filter(s => 
    s.article_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredConfirmed = confirmedSales.filter(s => 
    s.article_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="p-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-6">Gestion des paiements</h2>

        <Card className="mb-6">
          <CardContent className="p-4">
            <Input
              placeholder="Rechercher un article..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </CardContent>
        </Card>

        {loading ? (
          <p className="text-slate-500">Chargement...</p>
        ) : (
          <Tabs defaultValue="pending">
            <TabsList>
              <TabsTrigger value="pending">
                <Clock className="h-4 w-4 mr-2" />
                En attente ({pendingSales.length})
              </TabsTrigger>
              <TabsTrigger value="confirmed">
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirmés ({confirmedSales.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-6">
              {filteredPending.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <p className="text-slate-500">Aucun paiement en attente</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredPending.map((sale) => (
                    <Card key={sale.id}>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-2">{sale.article_name}</h3>
                            <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                              <div>
                                <p className="text-slate-500">Prix vente</p>
                                <p className="font-medium">{sale.sale_price}€</p>
                              </div>
                              <div>
                                <p className="text-slate-500">Coût vendeur</p>
                                <p className="font-medium">{sale.seller_cost}€</p>
                              </div>
                              <div>
                                <p className="text-slate-500">Méthode</p>
                                <p className="font-medium capitalize">{sale.payment_method || 'N/A'}</p>
                              </div>
                            </div>
                            {sale.payment_proof && sale.payment_proof.proof_url && (
                              <a
                                href={sale.payment_proof.proof_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-sm"
                              >
                                Voir la preuve de paiement
                              </a>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleConfirmPayment(sale.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Confirmer
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-300 text-red-600 hover:bg-red-50"
                              onClick={() => handleRejectPayment(sale.id)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Refuser
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="confirmed" className="mt-6">
              {filteredConfirmed.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <p className="text-slate-500">Aucun paiement confirmé</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredConfirmed.map((sale) => (
                    <Card key={sale.id}>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-semibold text-lg">{sale.article_name}</h3>
                            <p className="text-sm text-slate-500">Montant: {sale.sale_price}€</p>
                          </div>
                          <Badge className="bg-green-100 text-green-800">
                            {sale.status === 'SHIPPING_PENDING' ? 'Prêt à expédier' : sale.status === 'SHIPPED' ? 'Expédié' : 'Terminé'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AdminLayout>
  );
};