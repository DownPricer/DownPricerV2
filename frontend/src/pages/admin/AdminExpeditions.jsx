import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Truck, Package, Hash, ArrowUpRight, Loader2, Search } from 'lucide-react';
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
      toast.success('Colis marqué comme expédié');
      setShowDialog(false);
      fetchShippableSales();
    } catch (error) {
      toast.error('Erreur technique');
    }
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-black text-white p-6 md:p-12 selection:bg-orange-500/30">
        
        {/* Header Section */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] font-black uppercase tracking-widest mb-4">
            <Truck className="h-3 w-3" /> Logistics Hub
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Gestion des <span className="text-orange-500">Expéditions</span>
          </h2>
          <p className="mt-2 text-zinc-500 text-sm font-medium uppercase tracking-wider italic">Commandes prêtes pour enlèvement et transport</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
          </div>
        ) : sales.length === 0 ? (
          /* Empty State OLED */
          <div className="bg-[#080808] border border-white/5 p-20 rounded-[3rem] text-center max-w-2xl mx-auto">
            <div className="h-20 w-20 bg-black border border-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-zinc-800">
              <Package size={40} />
            </div>
            <h3 className="text-white font-black uppercase tracking-widest mb-2">Entrepôt Vide</h3>
            <p className="text-zinc-600 text-sm font-medium uppercase tracking-widest">Aucune commande n'attend d'expédition pour le moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {sales.map((sale) => (
              <Card key={sale.id} className="bg-[#080808] border-white/5 rounded-[2rem] overflow-hidden hover:border-white/10 transition-all group">
                <CardContent className="p-8">
                  <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-black border border-white/10 flex items-center justify-center text-zinc-600 group-hover:text-orange-500 transition-colors">
                        <Package size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-white leading-none mb-2 tracking-tight group-hover:text-orange-500 transition-colors">{sale.article_name}</h3>
                        <p className="text-[10px] font-black font-mono text-zinc-600 uppercase tracking-widest flex items-center gap-1">
                          <Hash size={10} /> ID {sale.id.slice(0, 8)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-white tracking-tighter leading-none">{sale.sale_price}€</p>
                      <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mt-1">Order Value</p>
                    </div>
                  </div>

                  {/* Financial Details Box */}
                  <div className="bg-black/40 border border-white/5 rounded-2xl p-4 mb-8 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Coût Vendeur</p>
                      <p className="text-sm font-bold text-zinc-300">{sale.seller_cost}€</p>
                    </div>
                    <div className="text-right border-l border-white/5 pl-4">
                      <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Profit Net</p>
                      <p className="text-sm font-black text-green-500">+{sale.profit}€</p>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-white hover:bg-zinc-200 text-black font-black uppercase tracking-widest text-[11px] h-12 rounded-xl shadow-lg shadow-white/5 transition-all active:scale-95 group/btn"
                    onClick={() => handleOpenDialog(sale)}
                  >
                    <Truck className="h-4 w-4 mr-2 group-hover/btn:translate-x-1 transition-transform" />
                    Expédier le colis
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal Expédition OLED */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="bg-[#0A0A0A] border-white/10 text-white rounded-[2rem] p-0 overflow-hidden">
            <DialogHeader className="p-8 pb-4">
              <DialogTitle className="text-xl font-black uppercase tracking-tighter">Confirmation <span className="text-orange-500">Transport</span></DialogTitle>
            </DialogHeader>
            
            {selectedSale && (
              <div className="px-8 space-y-6">
                <div className="bg-black border border-white/5 p-4 rounded-2xl">
                  <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-1">Article en cours</p>
                  <p className="text-sm font-bold text-white">{selectedSale.article_name}</p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="tracking" className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Numéro de suivi (Tracking)</Label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-700" />
                    <Input
                      id="tracking"
                      placeholder="Ex: 1Z999AA101234..."
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      className="bg-black border-white/10 h-12 pl-12 rounded-xl text-white placeholder:text-zinc-800 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20"
                    />
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="p-8 flex-col sm:flex-row gap-2 bg-black/40 mt-4">
              <Button variant="ghost" onClick={() => setShowDialog(false)} className="text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl px-6">
                Annuler
              </Button>
              <Button
                className="bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-widest text-xs px-8 h-11 rounded-xl"
                onClick={handleMarkShipped}
              >
                Confirmer l'envoi <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};