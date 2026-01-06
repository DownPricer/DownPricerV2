import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Truck, Package } from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'sonner';

export const AdminExpeditionsPage = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    fetchShippableSales();
  }, []);

  const fetchShippableSales = async () => {
    try {
      const response = await api.get('/admin/sales');
      const shippable = response.data.filter(s => s.status === 'SHIPPING_PENDING');
      setSales(shippable);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    }
    setLoading(false);
  };

  const handleOpenDialog = (sale) => {
    setSelectedSale(sale);
    setTrackingNumber('');
    setShowDialog(true);
  };

  const handleMarkShipped = async () => {
    if (!selectedSale) return;
    
    try {
      await api.post(`/admin/sales/${selectedSale.id}/mark-shipped`, {
        tracking_number: trackingNumber
      });
      toast.success('Vente marquée comme expédiée');
      setShowDialog(false);
      fetchShippableSales();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex items-center gap-2 mb-6">
          <Truck className="h-8 w-8 text-blue-600" />
          <h2 className="text-3xl font-bold text-slate-900">Expéditions</h2>
        </div>

        {loading ? (
          <p className="text-slate-500">Chargement...</p>
        ) : sales.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Aucune commande à expédier</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {sales.map((sale) => (
              <Card key={sale.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{sale.article_name}</h3>
                      <p className="text-sm text-slate-500">Vente #{sale.id.slice(0, 8)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-slate-900">{sale.sale_price}€</p>
                      <p className="text-xs text-slate-500">Prix de vente</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500">Coût vendeur</p>
                        <p className="font-medium">{sale.seller_cost}€</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Profit</p>
                        <p className="font-medium text-green-600">{sale.profit}€</p>
                      </div>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => handleOpenDialog(sale)}
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    Marquer comme expédié
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmer l'expédition</DialogTitle>
            </DialogHeader>
            
            {selectedSale && (
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="font-medium">{selectedSale.article_name}</p>
                  <p className="text-sm text-slate-500">Vente #{selectedSale.id.slice(0, 8)}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tracking">Numéro de suivi (optionnel)</Label>
                  <Input
                    id="tracking"
                    placeholder="Ex: 1Z999AA10123456784"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Annuler
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleMarkShipped}
              >
                Confirmer l'expédition
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};