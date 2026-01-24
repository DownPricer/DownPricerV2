import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { CheckCircle, XCircle, Clock, Search, DollarSign, ExternalLink, Receipt, Hash, Loader2 } from 'lucide-react';
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
      toast.success('Paiement validé avec succès');
      fetchSales();
    } catch (error) {
      toast.error('Erreur de validation');
    }
  };

  const handleRejectPayment = async (saleId) => {
    const reason = prompt('Motif du refus (sera envoyé au vendeur):');
    if (!reason) return;
    
    try {
      await api.post(`/admin/sales/${saleId}/reject-payment`, { reason });
      toast.success('Paiement refusé');
      fetchSales();
    } catch (error) {
      toast.error('Erreur technique');
    }
  };

  const pendingSales = sales.filter(s => s.status === 'PAYMENT_SUBMITTED');
  const confirmedSales = sales.filter(s => ['SHIPPING_PENDING', 'SHIPPED', 'COMPLETED'].includes(s.status));

  const filteredPending = pendingSales.filter(s => 
    s.article_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredConfirmed = confirmedSales.filter(s => 
    s.article_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="min-h-screen bg-black text-white p-6 md:p-12 selection:bg-orange-500/30">
        
        {/* Header Section */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] font-black uppercase tracking-widest mb-4">
            <DollarSign className="h-3 w-3" /> Audit financier
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Gestion des <span className="text-orange-500">Paiements</span>
          </h2>
          <p className="mt-2 text-zinc-500 text-sm font-medium uppercase tracking-wider italic">Vérification des preuves et validation des transactions</p>
        </div>

        {/* Search Bar OLED */}
        <div className="relative group max-w-md mb-10">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 group-focus-within:text-orange-500 transition-colors" />
          <Input
            placeholder="Rechercher une transaction, un article..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-[#080808] border-white/5 pl-12 h-12 rounded-2xl focus:border-orange-500/50 focus:ring-orange-500/10 text-white placeholder:text-zinc-700"
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
          </div>
        ) : (
          <Tabs defaultValue="pending" className="space-y-8">
            <TabsList className="bg-[#080808] border border-white/5 p-1 rounded-full inline-flex h-12">
              <TabsTrigger value="pending" className="rounded-full px-8 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                <Clock className="h-3.5 w-3.5 mr-2" /> En attente ({pendingSales.length})
              </TabsTrigger>
              <TabsTrigger value="confirmed" className="rounded-full px-8 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                <CheckCircle className="h-3.5 w-3.5 mr-2" /> Historique ({confirmedSales.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="animate-in fade-in duration-500">
              {filteredPending.length === 0 ? (
                <EmptyState text="Aucun paiement en attente de validation" />
              ) : (
                <div className="grid gap-4">
                  {filteredPending.map((sale) => (
                    <PaymentCard 
                      key={sale.id} 
                      sale={sale} 
                      isPending={true}
                      onConfirm={() => handleConfirmPayment(sale.id)}
                      onReject={() => handleRejectPayment(sale.id)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="confirmed" className="animate-in fade-in duration-500">
              {filteredConfirmed.length === 0 ? (
                <EmptyState text="Aucun historique de paiement confirmé" />
              ) : (
                <div className="grid gap-4">
                  {filteredConfirmed.map((sale) => (
                    <PaymentCard key={sale.id} sale={sale} isPending={false} />
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

// --- COMPOSANTS INTERNES ---

const PaymentCard = ({ sale, isPending, onConfirm, onReject }) => (
  <Card className="bg-[#080808] border-white/5 rounded-[2rem] overflow-hidden hover:border-white/10 transition-all group">
    <CardContent className="p-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-black border border-white/10 flex items-center justify-center text-zinc-600 group-hover:text-orange-500 transition-colors">
              <Receipt size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white group-hover:text-orange-500 transition-colors">{sale.article_name}</h3>
              <p className="text-[10px] font-black font-mono text-zinc-600 uppercase tracking-[0.2em] flex items-center gap-1">
                <Hash size={10} /> {sale.id.slice(0, 8)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-2">
            <div>
              <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Prix de vente</p>
              <p className="text-sm font-black text-white">{sale.sale_price}€</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Coût Vendeur</p>
              <p className="text-sm font-bold text-zinc-400">{sale.seller_cost}€</p>
            </div>
            <div className="hidden md:block">
              <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Méthode</p>
              <Badge className="bg-white/5 border-white/10 text-white rounded-full text-[9px] font-black uppercase px-2 py-0">
                {sale.payment_method || 'N/A'}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
          {sale.payment_proof?.proof_url && (
            <Button 
              variant="outline" 
              className="rounded-xl border-white/5 bg-black hover:bg-white/5 text-[10px] font-black uppercase tracking-widest h-12 px-6"
              onClick={() => window.open(sale.payment_proof.proof_url, '_blank')}
            >
              <ExternalLink className="h-3.5 w-3.5 mr-2" /> Preuve
            </Button>
          )}

          {isPending ? (
            <div className="flex gap-2">
              <Button
                className="flex-1 bg-green-600 hover:bg-green-500 text-white font-black uppercase tracking-widest text-[10px] h-12 px-8 rounded-xl transition-all active:scale-95 shadow-lg shadow-green-900/10"
                onClick={onConfirm}
              >
                <CheckCircle className="h-4 w-4 mr-2" /> Valider
              </Button>
              <Button
                variant="ghost"
                className="bg-red-500/5 hover:bg-red-500/10 text-red-500 font-black uppercase tracking-widest text-[10px] h-12 px-4 rounded-xl border border-red-500/10"
                onClick={onReject}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Badge className={`h-10 px-6 rounded-xl border font-black uppercase text-[10px] tracking-widest ${
              sale.status === 'COMPLETED' 
                ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                : 'bg-orange-500/10 text-orange-500 border-orange-500/20'
            }`}>
              {sale.status === 'SHIPPING_PENDING' ? 'Payé (Prêt envoi)' : sale.status}
            </Badge>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

const EmptyState = ({ text }) => (
  <div className="bg-[#080808] border border-white/5 p-20 rounded-[3rem] text-center max-w-2xl mx-auto">
    <div className="h-16 w-16 bg-black border border-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-zinc-800">
      <Clock size={32} />
    </div>
    <p className="text-zinc-600 text-xs font-bold uppercase tracking-[0.2em]">{text}</p>
  </div>
);