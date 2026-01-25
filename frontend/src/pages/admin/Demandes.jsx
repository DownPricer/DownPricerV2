import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Filter, Loader2, Package, Search, ArrowUpRight } from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export const AdminDemandesPage = () => {
  const navigate = useNavigate();
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchDemandes();
  }, []);

  const fetchDemandes = async () => {
    try {
      const response = await api.get('/admin/demandes');
      setDemandes(response.data || []);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    }
    setLoading(false);
  };

  const getStatusStyle = (status) => {
    const map = {
      AWAITING_DEPOSIT: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      DEPOSIT_PAID: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      IN_ANALYSIS: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      PURCHASE_LAUNCHED: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      PROPOSAL_FOUND: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      AWAITING_BALANCE: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      COMPLETED: 'bg-zinc-500/10 text-zinc-400 border-white/10',
      CANCELLED: 'bg-red-500/10 text-red-500 border-red-500/20',
    };
    return map[status] || 'bg-white/5 text-zinc-400 border-white/10';
  };

  const getStatusLabel = (status) => {
    const labels = {
      AWAITING_DEPOSIT: 'Attente Acompte',
      DEPOSIT_PAID: 'Acompte OK',
      IN_ANALYSIS: 'Analyse',
      PURCHASE_LAUNCHED: 'Achat en cours',
      PROPOSAL_FOUND: 'Trouvée',
      AWAITING_BALANCE: 'Solde Attente',
      COMPLETED: 'Terminée',
      CANCELLED: 'Annulée',
    };
    return labels[status] || status;
  };

  const filteredDemandes = filter === 'all' ? demandes : demandes.filter((d) => d.status === filter);

  return (
    <AdminLayout>
      <div className="min-h-screen text-white p-4 sm:p-6 md:p-12 selection:bg-orange-500/30 bg-gradient-to-b from-[#090909] via-[#070707] to-black">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8 md:mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-4">
              <Search className="h-3 w-3" /> Demand Stream
            </div>
            <h2
              className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tighter uppercase italic leading-tight"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              Demandes <span className="text-orange-500">Clients</span>
            </h2>
            <p className="mt-2 text-zinc-500 text-[10px] sm:text-sm font-medium uppercase tracking-wider italic">
              Liste des demandes et tri par statut
            </p>
          </div>

          {/* Filter Toolbar */}
          <div className="mb-8">
            <div className="bg-[#0E0E0E] border border-white/10 ring-1 ring-white/[0.03] p-3 rounded-2xl md:rounded-full flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="flex items-center gap-3 pl-1 md:pl-3 text-zinc-500">
                <Filter size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Filtrer par statut</span>
              </div>

              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-full md:w-72 bg-[#0B0B0B] border-white/10 ring-1 ring-white/[0.02] h-11 rounded-full text-[10px] font-black uppercase tracking-wider text-white focus:ring-orange-500/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0E0E0E] border-white/10 text-white">
                  <SelectItem value="all">Toutes les demandes</SelectItem>
                  <SelectItem value="AWAITING_DEPOSIT">En attente acompte</SelectItem>
                  <SelectItem value="DEPOSIT_PAID">Acompte payé</SelectItem>
                  <SelectItem value="IN_ANALYSIS">En analyse</SelectItem>
                  <SelectItem value="PURCHASE_LAUNCHED">Achat en cours</SelectItem>
                  <SelectItem value="PROPOSAL_FOUND">Trouvée</SelectItem>
                  <SelectItem value="AWAITING_BALANCE">Attente solde</SelectItem>
                  <SelectItem value="COMPLETED">Terminé</SelectItem>
                  <SelectItem value="CANCELLED">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* List Content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
            </div>
          ) : filteredDemandes.length === 0 ? (
            <div className="bg-[#0E0E0E] border border-white/10 ring-1 ring-white/[0.03] p-14 sm:p-20 rounded-[2rem] text-center">
              <Package className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500 text-[10px] sm:text-xs font-black uppercase tracking-widest">
                Aucun dossier correspondant
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredDemandes.map((demande) => (
                <Card
                  key={demande.id}
                  className="bg-[#0E0E0E] border-white/10 ring-1 ring-white/[0.03] rounded-2xl md:rounded-[1.25rem] hover:ring-white/[0.06] hover:border-white/15 transition-all cursor-pointer group active:scale-[0.99]"
                  onClick={() => navigate(`/admin/demandes/${demande.id}`)}
                >
                  <CardContent className="p-4 md:p-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Left: Basic Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1 md:mb-0">
                          <h3 className="font-bold text-sm text-white group-hover:text-orange-500 transition-colors truncate">
                            {demande.name}
                          </h3>
                          <Badge
                            className={`${getStatusStyle(demande.status)} border text-[8px] font-black uppercase px-2 py-0.5 rounded-full md:hidden`}
                          >
                            {getStatusLabel(demande.status)}
                          </Badge>
                        </div>

                        <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider truncate max-w-2xl hidden md:block">
                          {demande.description ? `${demande.description.substring(0, 90)}...` : 'Aucune description'}
                        </p>
                      </div>

                      {/* Center: Financial */}
                      <div className="flex flex-wrap items-center gap-3 md:gap-6">
                        <div className="bg-[#0B0B0B] border border-white/10 ring-1 ring-white/[0.02] rounded-xl px-3 py-2">
                          <span className="block text-[8px] font-black text-zinc-600 uppercase tracking-widest">Budget Max</span>
                          <span className="block text-xs font-black text-white">{demande.max_price}€</span>
                        </div>

                        <div className="bg-[#0B0B0B] border border-white/10 ring-1 ring-white/[0.02] rounded-xl px-3 py-2">
                          <span className="block text-[8px] font-black text-zinc-600 uppercase tracking-widest">Acompte</span>
                          <span className="block text-xs font-black text-orange-500">{demande.deposit_amount}€</span>
                        </div>

                        <div className="hidden lg:block bg-[#0B0B0B] border border-white/10 ring-1 ring-white/[0.02] rounded-xl px-3 py-2">
                          <span className="block text-[8px] font-black text-zinc-600 uppercase tracking-widest">Paiement</span>
                          <span className="block text-[10px] font-bold text-zinc-300 uppercase">
                            {demande.payment_type || 'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* Right: Status & Action */}
                      <div className="flex items-center justify-between md:justify-end gap-4 border-t border-white/[0.06] pt-4 md:pt-0 md:border-t-0">
                        <Badge className={`${getStatusStyle(demande.status)} border text-[9px] font-black uppercase px-4 py-1.5 rounded-full hidden md:block`}>
                          {getStatusLabel(demande.status)}
                        </Badge>

                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-[#0B0B0B] border border-white/10 ring-1 ring-white/[0.02] text-zinc-400 group-hover:text-white group-hover:border-white/20 transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/demandes/${demande.id}`);
                          }}
                        >
                          <ArrowUpRight size={18} />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};
