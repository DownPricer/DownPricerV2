import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import {
  CheckCircle,
  XCircle,
  Truck,
  ArrowLeft,
  DollarSign,
  User,
  ExternalLink,
  Calendar,
  Loader2,
  AlertCircle,
  Package,
} from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'sonner';
import { resolveImageUrl } from '../../utils/images';

export const AdminVenteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [rejectReason, setRejectReason] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');

  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showShipDialog, setShowShipDialog] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);

  const fetchVenteDetail = useCallback(async (aliveRef) => {
    try {
      const response = await api.get(`/admin/sales/${id}`);
      if (!aliveRef.alive) return;
      setData(response.data);
    } catch (error) {
      if (!aliveRef.alive) return;
      toast.error('Vente non trouvée');
      navigate('/admin/ventes');
    } finally {
      if (aliveRef.alive) setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    const aliveRef = { alive: true };
    setLoading(true);
    fetchVenteDetail(aliveRef);

    return () => {
      aliveRef.alive = false;
    };
  }, [fetchVenteDetail]);

  const resetDialogs = useCallback(() => {
    setShowRejectDialog(false);
    setShowShipDialog(false);
    setRejectReason('');
    setTrackingNumber('');
  }, []);

  const handleAction = useCallback(async (endpoint, payload = {}, successMsg) => {
    setActionLoading(true);
    try {
      await api.post(`/admin/sales/${id}/${endpoint}`, payload);
      toast.success(successMsg);

      // refresh (sans setState après unmount)
      const aliveRef = { alive: true };
      await fetchVenteDetail(aliveRef);
      aliveRef.alive = false;

      resetDialogs();
    } catch (error) {
      toast.error(error?.response?.data?.detail || 'Erreur technique');
    } finally {
      setActionLoading(false);
    }
  }, [fetchVenteDetail, id, resetDialogs]);

  // Routes / endpoints cohérents
  const handleValidate = useCallback(
    () => handleAction('validate', {}, 'Vente approuvée'),
    [handleAction]
  );

  const handleConfirmPayment = useCallback(
    () => handleAction('confirm-payment', {}, 'Paiement confirmé'),
    [handleAction]
  );

  const handleComplete = useCallback(
    () => handleAction('complete', {}, 'Vente finalisée'),
    [handleAction]
  );

  const handleReject = useCallback(() => {
    if (!rejectReason.trim()) {
      toast.error('Motif obligatoire');
      return;
    }
    handleAction('reject', { reason: rejectReason.trim() }, 'Vente refusée');
  }, [handleAction, rejectReason]);

  const handleRejectPayment = useCallback(() => {
    if (!rejectReason.trim()) {
      toast.error('Motif obligatoire');
      return;
    }
    handleAction('reject-payment', { reason: rejectReason.trim() }, 'Paiement refusé');
  }, [handleAction, rejectReason]);

  const handleMarkShipped = useCallback(() => {
    if (!trackingNumber.trim()) {
      toast.error('Tracking requis');
      return;
    }
    handleAction('mark-shipped', { tracking_number: trackingNumber.trim() }, 'Expédition confirmée');
  }, [handleAction, trackingNumber]);

  const openProof = useCallback((url) => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  const sale = data?.sale;
  const article = data?.article;
  const seller = data?.seller;

  const createdAtLabel = useMemo(() => {
    if (!sale?.created_at) return '';
    return new Date(sale.created_at).toLocaleString('fr-FR');
  }, [sale?.created_at]);

  const shortSaleId = useMemo(() => {
    if (!sale?.id) return '';
    return String(sale.id).slice(0, 8).toUpperCase();
  }, [sale?.id]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-black flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
        </div>
      </AdminLayout>
    );
  }

  if (!data || !sale) return null;

  return (
    <AdminLayout>
      <div className="min-h-screen text-white p-4 sm:p-6 md:p-12 selection:bg-orange-500/30 bg-gradient-to-b from-[#0B0B0B] via-[#070707] to-black">
        {/* Navigation & Header */}
        <div className="max-w-6xl mx-auto mb-10">
          <button
            onClick={() => navigate('/admin/ventes')}
            className="group flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Retour aux flux</span>
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1
                  className="text-3xl md:text-4xl font-black tracking-tighter uppercase italic"
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                >
                  Vente <span className="text-orange-500">#{shortSaleId}</span>
                </h1>
                <Badge className={`${getStatusStyle(sale.status)} border rounded-full text-[9px] font-black uppercase px-3 py-1`}>
                  {getStatusLabel(sale.status)}
                </Badge>
              </div>
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <Calendar size={12} /> {createdAtLabel}
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            {/* Financial */}
            <Card className="bg-[#0E0E0E] border-white/10 ring-1 ring-white/[0.03] rounded-[2rem] overflow-hidden shadow-2xl relative">
              <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/10 blur-3xl rounded-full -mr-16 -mt-16" />
              <CardHeader className="p-8 pb-0">
                <CardTitle className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400 flex items-center gap-3">
                  <DollarSign size={16} className="text-orange-500" /> Bilan de Transaction
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                  <div>
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">C.A Brut</p>
                    <p className="text-3xl font-black text-white">{sale.sale_price}€</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Coût Vendeur</p>
                    <p className="text-3xl font-black text-zinc-300">{sale.seller_cost}€</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Net DownPricer</p>
                    <p className="text-3xl font-black text-emerald-400">
                      +{Number.isFinite(sale.profit) ? sale.profit : 0}€
                    </p>
                  </div>
                </div>

                {/* Proof */}
                {sale.payment_proof && (
                  <div className="mt-10 pt-8 border-t border-white/[0.06] space-y-4">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Preuve de Règlement</p>
                    <div className="p-5 bg-black/50 border border-white/10 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-white uppercase">{sale.payment_method || 'Virement Manuel'}</p>
                        {sale.payment_proof?.note && (
                          <p className="text-xs text-zinc-400 italic">"{sale.payment_proof.note}"</p>
                        )}
                      </div>
                      {sale.payment_proof?.proof_url && (
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-xl border-white/10 bg-white hover:bg-zinc-200 text-black font-black uppercase text-[10px] px-6 h-10 shadow-lg shadow-white/5"
                          onClick={() => openProof(sale.payment_proof.proof_url)}
                        >
                          <ExternalLink size={14} className="mr-2" /> Ouvrir Preuve
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Bordereau d'expédition */}
                {sale.shipping_label && (
                  <div className="mt-10 pt-8 border-t border-white/[0.06] space-y-4">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Bordereau d'Expédition</p>
                    <div className="p-5 bg-black/50 border border-white/10 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <img 
                          src={sale.shipping_label.startsWith('http') ? sale.shipping_label : `${window.location.origin}${sale.shipping_label}`} 
                          alt="Bordereau" 
                          className="max-h-32 rounded cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => window.open(sale.shipping_label.startsWith('http') ? sale.shipping_label : `${window.location.origin}${sale.shipping_label}`, '_blank')}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl border-white/10 bg-white hover:bg-zinc-200 text-black font-black uppercase text-[10px] px-6 h-10 shadow-lg shadow-white/5"
                        onClick={() => {
                          const url = sale.shipping_label.startsWith('http') ? sale.shipping_label : `${window.location.origin}${sale.shipping_label}`;
                          window.open(url, '_blank');
                        }}
                      >
                        <ExternalLink size={14} className="mr-2" /> Télécharger Bordereau
                      </Button>
                    </div>
                  </div>
                )}

                {/* Tracking */}
                {sale.tracking_number && (
                  <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Truck className="text-purple-400" size={18} />
                      <div>
                        <p className="text-[8px] font-black text-purple-300/70 uppercase tracking-widest">Tracking Colis</p>
                        <p className="text-sm font-mono font-bold text-white">{sale.tracking_number}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Article */}
            <Card className="bg-[#0E0E0E] border-white/10 ring-1 ring-white/[0.03] rounded-[2rem] overflow-hidden">
              <CardContent className="p-8">
                {article ? (
                  <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start">
                    <div className="w-32 h-32 md:w-40 md:h-40 shrink-0 bg-black/60 rounded-3xl overflow-hidden border border-white/10 flex items-center justify-center">
                      {article.photos?.[0] ? (
                        <img
                          src={resolveImageUrl(article.photos[0])}
                          alt={article.name || 'Article'}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <Package className="h-10 w-10 text-zinc-700" />
                      )}
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1">Produit Vendu</p>
                      <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tight">
                        {article.name}
                      </h3>
                      <p className="text-sm text-zinc-400 leading-relaxed line-clamp-3">
                        {article.description || 'Aucune description.'}
                      </p>
                      <div className="mt-6 flex flex-wrap justify-center sm:justify-start gap-4">
                        <DataSnippet label="Ref. Price" value={`${article.reference_price ?? 0}€`} />
                        <DataSnippet label="Sale Price" value={`${article.price ?? 0}€`} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-zinc-500 italic">Données de l'article archivées.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Seller */}
            <Card className="bg-[#0E0E0E] border-white/10 ring-1 ring-white/[0.03] rounded-[2.5rem]">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400 flex items-center gap-3">
                  <User size={16} /> Identité Vendeur
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                {seller ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Nom Complet</p>
                      <p className="text-sm font-bold text-white uppercase">
                        {seller.first_name} {seller.last_name}
                      </p>
                    </div>
                    <div className="pt-4 border-t border-white/[0.06]">
                      <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Contact</p>
                      <p className="text-sm font-medium text-zinc-300 truncate">{seller.email}</p>
                      {seller.phone && <p className="text-xs font-medium text-zinc-400 mt-1">{seller.phone}</p>}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-600 font-bold uppercase italic">Utilisateur non lié</p>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="bg-[#0E0E0E] border-orange-500/20 ring-1 ring-orange-500/[0.06] rounded-[2.5rem] overflow-hidden">
              <CardHeader className="p-8 pb-4 bg-orange-500/10 border-b border-orange-500/20">
                <CardTitle className="text-xs font-black uppercase tracking-[0.3em] text-orange-400">
                  Commandes Système
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-3">
                {sale.status === 'WAITING_ADMIN_APPROVAL' && (
                  <>
                    <MainAction
                      label="Approuver la vente"
                      color="green"
                      icon={<CheckCircle />}
                      onClick={handleValidate}
                      loading={actionLoading}
                    />
                    <MainAction
                      label="Refuser la vente"
                      color="red"
                      icon={<XCircle />}
                      onClick={() => setShowRejectDialog(true)}
                      loading={false}
                    />
                  </>
                )}

                {sale.status === 'PAYMENT_SUBMITTED' && (
                  <>
                    <MainAction
                      label="Confirmer le paiement"
                      color="green"
                      icon={<DollarSign />}
                      onClick={handleConfirmPayment}
                      loading={actionLoading}
                    />
                    <MainAction
                      label="Refuser le paiement"
                      color="red"
                      icon={<XCircle />}
                      onClick={() => setShowRejectDialog(true)}
                      loading={false}
                    />
                  </>
                )}

                {sale.status === 'SHIPPING_PENDING' && (
                  <MainAction
                    label="Confirmer l'envoi"
                    color="blue"
                    icon={<Truck />}
                    onClick={() => setShowShipDialog(true)}
                    loading={false}
                  />
                )}

                {sale.status === 'SHIPPED' && (
                  <MainAction
                    label="Finaliser la vente"
                    color="green"
                    icon={<CheckCircle />}
                    onClick={handleComplete}
                    loading={actionLoading}
                  />
                )}

                {sale.status === 'COMPLETED' && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-400">
                    <CheckCircle size={20} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Transaction Clôturée</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Reject Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent className="bg-[#0B0B0B] border-red-500/20 text-white rounded-[2rem] p-8 max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
                <AlertCircle className="text-red-500" /> Annuler l'opération
              </DialogTitle>
            </DialogHeader>

            <div className="py-6 space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                Motif administratif (Obligatoire)
              </Label>
              <Textarea
                placeholder="Indiquez au vendeur pourquoi l'opération est refusée..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="bg-[#0E0E0E] border-white/10 rounded-2xl min-h-[120px] focus:border-red-500/50 text-zinc-100 placeholder:text-zinc-700"
              />
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowRejectDialog(false)}
                className="rounded-xl text-zinc-400 hover:text-white uppercase text-[10px] h-11"
              >
                Abandonner
              </Button>
              <Button
                type="button"
                disabled={actionLoading}
                onClick={sale.status === 'PAYMENT_SUBMITTED' ? handleRejectPayment : handleReject}
                className="bg-red-600 hover:bg-red-500 text-white font-black uppercase text-[10px] px-8 rounded-xl h-11"
              >
                {actionLoading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Confirmer le refus'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Shipping Dialog */}
        <Dialog open={showShipDialog} onOpenChange={setShowShipDialog}>
          <DialogContent className="bg-[#0B0B0B] border-white/10 text-white rounded-[2rem] p-8 max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-black uppercase tracking-tighter">
                Confirmation <span className="text-orange-500">Expédition</span>
              </DialogTitle>
            </DialogHeader>

            <div className="py-6 space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                Numéro de suivi (Tracking)
              </Label>
              <Input
                placeholder="Ex: 6A123456789..."
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="bg-[#0E0E0E] border-white/10 h-12 rounded-xl text-white placeholder:text-zinc-700 focus:border-orange-500/50"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                disabled={actionLoading}
                onClick={handleMarkShipped}
                className="bg-orange-600 hover:bg-orange-500 text-white font-black uppercase text-[10px] w-full h-12 rounded-xl shadow-lg shadow-orange-900/10"
              >
                {actionLoading ? <Loader2 className="animate-spin h-4 w-4" /> : "Déclencher l'envoi"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

// ---- Sub-components (simples, sans dépendances bizarres) ----

const DataSnippet = ({ label, value }) => (
  <div className="bg-black/60 border border-white/10 px-4 py-2 rounded-xl">
    <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">{label}</p>
    <p className="text-xs font-bold text-white">{value}</p>
  </div>
);

const MainAction = ({ label, color, icon, onClick, loading }) => {
  const colors = {
    green: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20 hover:bg-emerald-500 hover:text-white shadow-emerald-900/10',
    red: 'bg-red-500/10 text-red-300 border-red-500/20 hover:bg-red-500 hover:text-white shadow-red-900/10',
    blue: 'bg-blue-500/10 text-blue-300 border-blue-500/20 hover:bg-blue-500 hover:text-white shadow-blue-900/10',
    orange: 'bg-orange-500/10 text-orange-300 border-orange-500/20 hover:bg-orange-500 hover:text-white shadow-orange-900/10',
  };

  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`w-full justify-start h-12 px-6 rounded-2xl border font-black uppercase text-[10px] tracking-widest transition-all shadow-lg active:scale-[0.98] ${colors[color]}`}
    >
      {loading ? (
        <Loader2 className="animate-spin h-4 w-4 mr-3" />
      ) : (
        React.cloneElement(icon, { size: 16, className: 'mr-3 stroke-[3px]' })
      )}
      {label}
    </Button>
  );
};

const getStatusStyle = (status) => {
  const map = {
    WAITING_ADMIN_APPROVAL: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    PAYMENT_PENDING: 'bg-red-500/10 text-red-400 border-red-500/20',
    PAYMENT_SUBMITTED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    SHIPPING_PENDING: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    SHIPPED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    COMPLETED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    REJECTED: 'bg-red-500/10 text-red-400 border-red-500/20',
  };
  return map[status] || 'bg-white/5 text-zinc-300 border-white/10';
};

const getStatusLabel = (status) => {
  const labels = {
    WAITING_ADMIN_APPROVAL: 'Validation Admin',
    PAYMENT_PENDING: 'Paiement Requis',
    PAYMENT_SUBMITTED: 'Paiement à vérifier',
    SHIPPING_PENDING: 'Prêt Envoi',
    SHIPPED: 'En Transit',
    COMPLETED: 'Soldée',
    REJECTED: 'Annulée',
  };
  return labels[status] || status;
};
