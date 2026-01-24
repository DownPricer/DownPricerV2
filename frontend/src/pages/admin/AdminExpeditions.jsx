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
      {/* Ajustement padding : p-4 sur mobile */}
      <div className="min-h-screen bg-black text-white p-4 sm:p-6 md:p-12 selection:bg-orange-500/30">
        
        {/* Header Section : Tailles de police adaptatives */}
        <div className="mb-8 md:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-4">
            <Truck className="h-3 w-3" /> Logistics Hub
          </div>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tighter uppercase italic leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Gestion des <span className="text-orange-500">Expéditions</span>
          </h2>
          <p className="mt-2 text-zinc-500 text-[10px] sm:text-sm font-medium uppercase tracking-wider italic">Commandes prêtes pour enlèvement et transport</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
          </div>
        ) : sales.length === 0 ? (
          /* Empty State : Padding réduit sur mobile */
          <div className="bg-[#080808] border border-white/5 p-10 sm:p-20 rounded-2xl sm:rounded-[3rem] text-center max-w-2xl mx-auto">
            <div className="h-16 w-16 sm:h-20 sm:w-20 bg-black border border-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-zinc-800">
              <Package className="h-8 w-8 sm:h-10 sm:w-10" />
            </div>
            <h3 className="text-white font-black uppercase tracking-widest mb-2 text-sm sm:text-base">Entrepôt Vide</h3>
            <p className="text-zinc-600 text-[10px] sm:text-sm font-medium uppercase tracking-widest">Aucune commande n'attend d'expédition pour le moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {sales.map((sale) => (
              <Card key={sale.id} className="bg-[#080808] border-white/5 rounded-[1.5rem] md:rounded-[2rem] overflow-hidden hover:border-white/10 transition-all group">
                <CardContent className="p-5 sm:p-8">
                  {/* Header de la carte : Flex wrap pour petits écrans */}
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6 sm:mb-8">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 shrink-0 rounded-xl bg-black border border-white/10 flex items-center justify-center text-zinc-600 group-hover:text-orange-500 transition-colors">
                        <Package size={20} className="sm:size-6" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-base sm:text-lg text-white leading-tight mb-1 tracking-tight group-hover:text-orange-500 transition-colors truncate">{sale.article_name}</h3>
                        <p className="text-[9px] sm:text-[10px] font-black font-mono text-zinc-600 uppercase tracking-widest flex items-center gap-1">
                          <Hash size={10} /> ID {sale.id.slice(0, 8)}
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right shrink-0">
                      <p className="text-xl sm:text-2xl font-black text-white tracking-tighter leading-none">{sale.sale_price}€</p>
                      <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mt-1">Order Value</p>
                    </div>
                  </div>

                  {/* Financial Details Box */}
                  <div className="bg-black/40 border border-white/5 rounded-xl sm:rounded-2xl p-4 mb-6 sm:mb-8 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[8px] sm:text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Coût Vendeur</p>
                      <p className="text-xs sm:text-sm font-bold text-zinc-300">{sale.seller_cost}€</p>
                    </div>
                    <div className="text-right border-l border-white/5 pl-4">
                      <p className="text-[8px] sm:text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Profit Net</p>
                      <p className="text-xs sm:text-sm font-black text-green-500">+{sale.profit}€</p>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-white hover:bg-zinc-200 text-black font-black uppercase tracking-widest text-[10px] sm:text-[11px] h-11 sm:h-12 rounded-xl shadow-lg shadow-white/5 transition-all active:scale-95 group/btn"
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

        {/* Modal Expédition : Adaptation mobile du Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="bg-[#0A0A0A] border-white/10 text-white rounded-[1.5rem] sm:rounded-[2rem] p-0 overflow-hidden w-[95vw] max-w-lg mx-auto">
            <DialogHeader className="p-6 sm:p-8 pb-2 sm:pb-4">
              <DialogTitle className="text-lg sm:text-xl font-black uppercase tracking-tighter text-center sm:text-left">
                Confirmation <span className="text-orange-500">Transport</span>
              </DialogTitle>
            </DialogHeader>
            
            {selectedSale && (
              <div className="px-6 sm:px-8 space-y-4 sm:space-y-6">
                <div className="bg-black border border-white/5 p-4 rounded-xl sm:rounded-2xl">
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">Article en cours</p>
                  <p className="text-xs sm:text-sm font-bold text-white truncate">{selectedSale.article_name}</p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="tracking" className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Numéro de suivi (Tracking)</Label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-700" />
                    <Input
                      id="tracking"
                      placeholder="Ex: 1Z999AA101234..."
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      className="bg-black border-white/10 h-11 sm:h-12 pl-12 rounded-xl text-white text-sm placeholder:text-zinc-800 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20"
                    />
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="p-6 sm:p-8 flex flex-col sm:flex-row gap-3 bg-black/40 mt-6">
              <Button variant="ghost" onClick={() => setShowDialog(false)} className="w-full sm:w-auto text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl px-6 h-11">
                Annuler
              </Button>
              <Button
                className="w-full sm:flex-1 bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-widest text-[10px] sm:text-xs h-11 rounded-xl"
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