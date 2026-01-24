import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/AdminLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { ShoppingCart, ArrowUpRight, Loader2, DollarSign, Clock, CheckCircle, Search, Filter } from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'sonner';

export const AdminVentesPage = () => {
  const navigate = useNavigate();
  const [ventes, setVentes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchVentes = async () => {
    try {
      const response = await api.get('/admin/sales');
      setVentes(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des flux');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchVentes();
  }, []);

  const getStatusStyle = (status) => {
    const map = {
      'WAITING_ADMIN_APPROVAL': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      'PAYMENT_PENDING': 'bg-red-500/10 text-red-500 border-red-500/20',
      'PAYMENT_SUBMITTED': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      'SHIPPING_PENDING': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      'SHIPPED': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      'COMPLETED': 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30',
      'REJECTED': 'bg-zinc-800 text-zinc-500 border-white/5',
      'CANCELLED': 'bg-zinc-800 text-zinc-500 border-white/5'
    };
    return map[status] || 'bg-white/5 text-zinc-500 border-white/5';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'WAITING_ADMIN_APPROVAL': 'Validation Admin',
      'PAYMENT_PENDING': 'Attente Paiement',
      'PAYMENT_SUBMITTED': 'Paiement Reçu',
      'SHIPPING_PENDING': 'À Expédier',
      'SHIPPED': 'En Transit',
      'COMPLETED': 'Terminé',
      'REJECTED': 'Refusé',
      'CANCELLED': 'Annulé'
    };
    return labels[status] || status;
  };

  // Calculs rapides pour le dashboard
  const totalVolume = ventes.reduce((acc, v) => acc + v.sale_price, 0);
  const totalProfit = ventes.reduce((acc, v) => acc + (v.profit || 0), 0);

  return (
    <AdminLayout>
      <div className="min-h-screen bg-black text-white p-4 sm:p-6 md:p-12 selection:bg-orange-500/30">
        
        {/* Header Responsiv */}
        <div className="max-w-6xl mx-auto mb-10 md:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] font-black uppercase tracking-widest mb-4">
            <ShoppingCart className="h-3 w-3" /> Transaction Ledger
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Ventes <span className="text-orange-500">Vendeurs</span>
          </h2>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
          </div>
        ) : (
          <div className="max-w-6xl mx-auto space-y-8">
            
            {/* Quick Stats Section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <div className="bg-[#080808] border border-white/5 p-4 rounded-2xl">
                  <p className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-1">Volume Brut</p>
                  <p className="text-xl font-black text-white">{totalVolume.toFixed(0)}€</p>
               </div>
               <div className="bg-[#080808] border border-white/5 p-4 rounded-2xl">
                  <p className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-1">Net Admin</p>
                  <p className="text-xl font-black text-green-500">+{totalProfit.toFixed(0)}€</p>
               </div>
               <div className="bg-[#080808] border border-white/5 p-4 rounded-2xl col-span-2 md:col-span-1">
                  <p className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-1">Total Ventes</p>
                  <p className="text-xl font-black text-white">{ventes.length}</p>
               </div>
            </div>

            {/* List Table */}
            {ventes.length === 0 ? (
              <div className="bg-[#080808] border border-white/5 p-20 rounded-[2.5rem] text-center">
                <p className="text-zinc-600 text-xs font-bold uppercase tracking-widest">Aucun flux enregistré</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {ventes.map((vente) => (
                  <Card 
                    key={vente.id} 
                    className="bg-[#080808] border-white/5 rounded-2xl md:rounded-full hover:border-white/10 transition-all cursor-pointer group active:scale-[0.99]"
                    onClick={() => navigate(`/admin/ventes/${vente.id}`)}
                  >
                    <CardContent className="p-4 md:p-2 md:pl-8 md:pr-2">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        
                        {/* Article Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <h3 className="font-bold text-sm text-white group-hover:text-orange-500 transition-colors truncate">
                              {vente.article_name}
                            </h3>
                            <Badge className={`${getStatusStyle(vente.status)} border text-[8px] font-black uppercase px-2 py-0.5 rounded-full md:hidden`}>
                              {getStatusLabel(vente.status)}
                            </Badge>
                          </div>
                          <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-tighter mt-0.5">
                            ID: {vente.id.slice(0, 8).toUpperCase()} • {new Date(vente.created_at).toLocaleDateString('fr-FR')}
                          </p>
                        </div>

                        {/* Financial Data - Pills look */}
                        <div className="flex items-center gap-2 md:gap-6 overflow-x-auto no-scrollbar">
                          <DataPill label="Prix" value={`${vente.sale_price}€`} color="white" />
                          <DataPill label="Coût" value={`${vente.seller_cost}€`} color="zinc" />
                          <DataPill label="Profit" value={`+${vente.profit}€`} color="green" />
                        </div>

                        {/* Status & Action */}
                        <div className="flex items-center justify-between md:justify-end gap-4 border-t border-white/[0.03] pt-4 md:pt-0 md:border-t-0">
                          <Badge className={`${getStatusStyle(vente.status)} border text-[9px] font-black uppercase px-4 py-1.5 rounded-full hidden md:block`}>
                            {getStatusLabel(vente.status)}
                          </Badge>
                          
                          <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-black border border-white/5 flex items-center justify-center text-zinc-600 group-hover:text-white group-hover:border-white/20 transition-all">
                            <ArrowUpRight size={18} />
                          </div>
                        </div>

                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

// --- HELPERS STYLISÉS ---

const DataPill = ({ label, value, color }) => {
  const colors = {
    white: "text-white",
    zinc: "text-zinc-500",
    green: "text-green-500"
  };
  return (
    <div className="flex flex-col min-w-[60px] md:items-center">
      <span className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">{label}</span>
      <span className={`text-xs font-black ${colors[color]} tracking-tighter`}>{value}</span>
    </div>
  );
};