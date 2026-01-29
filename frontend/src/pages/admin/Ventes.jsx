import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import {
  ShoppingCart,
  ArrowUpRight,
  Loader2,
  DollarSign,
  Search,
  Filter,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { AvatarCircle } from '../../components/AvatarCircle';
import api from '../../utils/api';
import { toast } from 'sonner';

export const AdminVentesPage = () => {
  const navigate = useNavigate();
  const [ventes, setVentes] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('ALL');

  const fetchVentes = async () => {
    try {
      const response = await api.get('/admin/sales');
      setVentes(response.data || []);
    } catch (error) {
      toast.error('Erreur lors du chargement des flux');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVentes();
  }, []);

  const getStatusStyle = (s) => {
    const map = {
      WAITING_ADMIN_APPROVAL: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      PAYMENT_PENDING: 'bg-red-500/10 text-red-400 border-red-500/20',
      PAYMENT_SUBMITTED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      SHIPPING_PENDING: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      SHIPPED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      COMPLETED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      REJECTED: 'bg-zinc-800 text-zinc-400 border-white/10',
      CANCELLED: 'bg-zinc-800 text-zinc-400 border-white/10',
    };
    return map[s] || 'bg-white/5 text-zinc-300 border-white/10';
  };

  const getStatusLabel = (s) => {
    const labels = {
      WAITING_ADMIN_APPROVAL: 'Validation Admin',
      PAYMENT_PENDING: 'Attente Paiement',
      PAYMENT_SUBMITTED: 'Paiement Reçu',
      SHIPPING_PENDING: 'À Expédier',
      SHIPPED: 'En Transit',
      COMPLETED: 'Terminé',
      REJECTED: 'Refusé',
      CANCELLED: 'Annulé',
    };
    return labels[s] || s;
  };

  const safeNumber = (v) => {
    const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ventes.filter((v) => {
      const matchStatus = status === 'ALL' ? true : v.status === status;
      const matchQuery =
        !q ||
        String(v.article_name || '').toLowerCase().includes(q) ||
        String(v.id || '').toLowerCase().includes(q) ||
        String(v.payment_method || '').toLowerCase().includes(q);
      return matchStatus && matchQuery;
    });
  }, [ventes, query, status]);

  const stats = useMemo(() => {
    const volume = filtered.reduce((acc, v) => acc + safeNumber(v.sale_price), 0);
    const profit = filtered.reduce((acc, v) => acc + safeNumber(v.profit), 0);
    const pending = filtered.filter((v) => ['WAITING_ADMIN_APPROVAL', 'PAYMENT_SUBMITTED'].includes(v.status)).length;
    const completed = filtered.filter((v) => v.status === 'COMPLETED').length;
    return { volume, profit, pending, completed, total: filtered.length };
  }, [filtered]);

  return (
    <AdminLayout>
      <div className="min-h-screen text-white p-4 sm:p-6 md:p-12 selection:bg-orange-500/30 bg-gradient-to-b from-[#0B0B0B] via-[#070707] to-black">

        {/* Header */}
        <div className="max-w-6xl mx-auto mb-8 md:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-4">
            <ShoppingCart className="h-3 w-3" /> Transaction Ledger
          </div>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Ventes <span className="text-orange-500">Vendeurs</span>
              </h2>
              <p className="mt-2 text-zinc-500 text-xs md:text-sm font-medium uppercase tracking-wider italic">
                Supervision des transactions, paiements et expéditions
              </p>
            </div>

            <Button
              variant="outline"
              onClick={() => { setLoading(true); fetchVentes(); }}
              className="rounded-xl border-white/10 bg-white hover:bg-zinc-200 text-black font-black uppercase text-[10px] tracking-widest h-11 px-6 shadow-lg shadow-white/5"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Rafraîchir'}
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4">
            {/* Search */}
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 group-focus-within:text-orange-500 transition-colors" />
              <Input
                placeholder="Rechercher par article, ID, méthode..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="bg-[#0E0E0E] border-white/10 pl-12 h-12 rounded-2xl focus:border-orange-500/50 focus:ring-orange-500/10 text-white placeholder:text-zinc-700"
              />
            </div>

            {/* Filter */}
            <div className="bg-[#0E0E0E] border border-white/10 p-2 rounded-2xl md:rounded-full flex items-center gap-3">
              <div className="flex items-center gap-2 pl-3 text-zinc-500">
                <Filter size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                  Statut
                </span>
              </div>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full md:w-64 bg-black border-white/10 h-10 rounded-full text-[11px] font-bold uppercase tracking-wider text-white focus:ring-orange-500/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0A0A0A] border-white/10 text-white">
                  <SelectItem value="ALL">Toutes</SelectItem>
                  <SelectItem value="WAITING_ADMIN_APPROVAL">Validation Admin</SelectItem>
                  <SelectItem value="PAYMENT_PENDING">Attente Paiement</SelectItem>
                  <SelectItem value="PAYMENT_SUBMITTED">Paiement Reçu</SelectItem>
                  <SelectItem value="SHIPPING_PENDING">À Expédier</SelectItem>
                  <SelectItem value="SHIPPED">En Transit</SelectItem>
                  <SelectItem value="COMPLETED">Terminé</SelectItem>
                  <SelectItem value="REJECTED">Refusé</SelectItem>
                  <SelectItem value="CANCELLED">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
          </div>
        ) : (
          <div className="max-w-6xl mx-auto space-y-8">

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <StatCard label="Volume Brut" value={`${stats.volume.toFixed(0)}€`} icon={<DollarSign />} accent="orange" />
              <StatCard label="Net Admin" value={`+${stats.profit.toFixed(0)}€`} icon={<CheckCircle />} accent="green" />
              <StatCard label="En attente" value={stats.pending} icon={<Clock />} accent="orange" />
              <StatCard label="Clôturées" value={stats.completed} icon={<CheckCircle />} accent="green" />
              <StatCard label="Total" value={stats.total} icon={<ShoppingCart />} accent="zinc" />
            </div>

            {/* List */}
            {filtered.length === 0 ? (
              <div className="bg-[#0E0E0E] border border-white/10 p-16 rounded-[2.5rem] text-center">
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Aucun résultat</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {filtered.map((vente) => (
                  <Card
                    key={vente.id}
                    className="bg-[#0E0E0E] border-white/10 ring-1 ring-white/[0.03] rounded-2xl md:rounded-full hover:border-white/20 transition-all cursor-pointer group active:scale-[0.99]"
                    onClick={() => navigate(`/admin/ventes/${vente.id}`)}
                  >
                    <CardContent className="p-4 md:p-2 md:pl-8 md:pr-2">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

                        {/* Left */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <h3 className="font-bold text-sm text-white group-hover:text-orange-500 transition-colors truncate">
                              {vente.article_name}
                            </h3>
                            <Badge className={`${getStatusStyle(vente.status)} border text-[8px] font-black uppercase px-2 py-0.5 rounded-full md:hidden`}>
                              {getStatusLabel(vente.status)}
                            </Badge>
                          </div>
                        <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-tighter mt-0.5">
                          ID: {String(vente.id).slice(0, 8).toUpperCase()} • {new Date(vente.created_at).toLocaleDateString('fr-FR')}
                        </p>
                        <div className="flex items-center gap-3 mt-3">
                          <AvatarCircle
                            src={vente.seller_avatar_url}
                            name={vente.seller_display_name || vente.seller_id || 'Vendeur'}
                            size={36}
                          />
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-white">
                              {vente.seller_display_name || vente.seller_id || 'Vendeur'}
                            </span>
                            {vente.seller_email && (
                              <span className="text-xs text-zinc-500">{vente.seller_email}</span>
                            )}
                          </div>
                        </div>
                        </div>

                        {/* Middle */}
                        <div className="flex items-center gap-2 md:gap-8 overflow-x-auto no-scrollbar">
                          <DataPill label="Prix" value={`${safeNumber(vente.sale_price)}€`} tone="white" />
                          <DataPill label="Coût" value={`${safeNumber(vente.seller_cost)}€`} tone="muted" />
                          <DataPill label="Profit" value={`+${safeNumber(vente.profit)}€`} tone="good" />
                        </div>

                        {/* Right */}
                        <div className="flex items-center justify-between md:justify-end gap-4 border-t border-white/[0.06] pt-4 md:pt-0 md:border-t-0">
                          <Badge className={`${getStatusStyle(vente.status)} border text-[9px] font-black uppercase px-4 py-1.5 rounded-full hidden md:block`}>
                            {getStatusLabel(vente.status)}
                          </Badge>
                          <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-black border border-white/10 flex items-center justify-center text-zinc-500 group-hover:text-white group-hover:border-white/30 transition-all">
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

// --- UI helpers ---

const StatCard = ({ label, value, icon, accent = 'zinc' }) => {
  const accents = {
    orange: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    green: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
    zinc: 'text-zinc-300 bg-white/5 border-white/10',
  };

  return (
    <div className="bg-[#0E0E0E] border border-white/10 ring-1 ring-white/[0.03] p-4 rounded-2xl">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.2em]">{label}</p>
        <div className={`h-8 w-8 rounded-xl border flex items-center justify-center ${accents[accent]}`}>
          {React.cloneElement(icon, { size: 16 })}
        </div>
      </div>
      <p className="text-xl font-black text-white tracking-tighter">{value}</p>
    </div>
  );
};

const DataPill = ({ label, value, tone }) => {
  const tones = {
    white: 'text-white',
    muted: 'text-zinc-300',
    good: 'text-emerald-300',
  };
  return (
    <div className="flex flex-col min-w-[72px] md:items-center">
      <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">{label}</span>
      <span className={`text-xs font-black ${tones[tone]} tracking-tighter`}>{value}</span>
    </div>
  );
};
