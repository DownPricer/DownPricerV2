import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import {
  ArrowLeft,
  User,
  Package,
  DollarSign,
  Truck,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  CreditCard,
  Hash,
  Eye,
} from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import api from '../../utils/api';
import { toast } from 'sonner';

export const AdminDemandeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [demande, setDemande] = useState(null);
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositPaymentUrl, setDepositPaymentUrl] = useState('');

  useEffect(() => {
    fetchDemandeDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchDemandeDetail = async () => {
    try {
      const response = await api.get(`/demandes/${id}`);
      setDemande(response.data);

      const usersResponse = await api.get('/admin/users');
      const userFound = (usersResponse.data || []).find((u) => u.id === response.data.client_id);
      setClient(userFound || null);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    }
    setLoading(false);
  };

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    try {
      await api.put(`/admin/demandes/${id}/status`, { status: newStatus });
      toast.success('Statut mis à jour');
      fetchDemandeDetail();
    } catch (error) {
      toast.error('Erreur technique');
    }
    setUpdating(false);
  };

  const handleQuickAction = async (action) => {
    setUpdating(true);
    const statusMap = {
      accept: 'ACCEPTED',
      analysis: 'IN_ANALYSIS',
      proposal: 'PROPOSAL_FOUND',
      complete: 'COMPLETED',
    };
    try {
      await api.put(`/admin/demandes/${id}/status`, { status: statusMap[action] });
      toast.success(`Action : ${action} validée`);
      fetchDemandeDetail();
    } catch (error) {
      toast.error('Erreur de mise à jour');
    }
    setUpdating(false);
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error('Raison obligatoire');
      return;
    }
    setUpdating(true);
    try {
      await api.patch(`/admin/demandes/${id}/cancel`, { reason: cancelReason });
      toast.success('Demande annulée');
      setShowCancelModal(false);
      setCancelReason('');
      fetchDemandeDetail();
    } catch (error) {
      toast.error("Erreur lors de l'annulation");
    }
    setUpdating(false);
  };

  const handleRequestDeposit = async () => {
    if (!depositPaymentUrl.trim()) {
      toast.error('Lien Stripe manquant');
      return;
    }
    setUpdating(true);
    try {
      await api.patch(`/admin/demandes/${id}/request-deposit`, {
        deposit_payment_url: depositPaymentUrl.trim(),
      });
      toast.success('Acompte réclamé');
      setShowDepositModal(false);
      setDepositPaymentUrl('');
      fetchDemandeDetail();
    } catch (error) {
      toast.error('Erreur Stripe');
    }
    setUpdating(false);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-[#070707] flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
        </div>
      </AdminLayout>
    );
  }

  if (!demande) return null;

  const statusUpper = String(demande.status || '').toUpperCase();
  const canCancel = !['CANCELLED', 'COMPLETED'].includes(statusUpper);

  // Compat : certains statuts diffèrent selon tes pages
  const showDepositAction =
    statusUpper.includes('ANALYSIS') || statusUpper === 'AWAITING_DEPOSIT' || statusUpper === 'DEPOSIT_PENDING';

  return (
    <AdminLayout>
      {/* Fond moins noir + gradient */}
      <div className="min-h-screen text-white p-4 sm:p-6 md:p-12 selection:bg-orange-500/30 bg-gradient-to-b from-[#090909] via-[#070707] to-black">
        <div className="max-w-6xl mx-auto">
          {/* Navigation + Header */}
          <div className="mb-8 md:mb-10">
            <button
              onClick={() => navigate('/admin/demandes')}
              className="group flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-6"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Flux des Demandes</span>
            </button>

            <div className="flex flex-col xl:flex-row justify-between items-start gap-8">
              <div className="w-full xl:w-auto">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <h1
                    className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter uppercase italic"
                    style={{ fontFamily: 'Outfit, sans-serif' }}
                  >
                    Détail <span className="text-orange-500">Sourcing</span>
                  </h1>
                  <Badge className={`${getStatusStyle(demande.status)} border rounded-full text-[9px] font-black uppercase px-3 py-1 whitespace-nowrap`}>
                    {getStatusLabel(demande.status)}
                  </Badge>
                </div>

                <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                  <Hash size={12} /> ID: {String(id).slice(0, 12).toUpperCase()}
                </p>
              </div>

              {/* Quick Actions */}
              <div className="w-full xl:w-auto grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                {showDepositAction && (
                  <ActionButton
                    icon={<CreditCard size={14} />}
                    label="Acompte"
                    color="orange"
                    onClick={() => setShowDepositModal(true)}
                    className="w-full sm:w-auto"
                    disabled={updating}
                  />
                )}

                {statusUpper === 'DEPOSIT_PAID' && (
                  <ActionButton
                    icon={<CheckCircle size={14} />}
                    label="Accepter"
                    color="green"
                    onClick={() => handleQuickAction('accept')}
                    className="w-full sm:w-auto"
                    disabled={updating}
                  />
                )}

                {statusUpper === 'ACCEPTED' && (
                  <ActionButton
                    icon={<AlertCircle size={14} />}
                    label="Analyser"
                    color="purple"
                    onClick={() => handleQuickAction('analysis')}
                    className="w-full sm:w-auto"
                    disabled={updating}
                  />
                )}

                {statusUpper === 'IN_ANALYSIS' && (
                  <ActionButton
                    icon={<Package size={14} />}
                    label="Trouvé"
                    color="blue"
                    onClick={() => handleQuickAction('proposal')}
                    className="w-full sm:w-auto"
                    disabled={updating}
                  />
                )}

                {['AWAITING_BALANCE', 'PROPOSAL_FOUND'].includes(statusUpper) && (
                  <ActionButton
                    icon={<CheckCircle size={14} />}
                    label="Clôturer"
                    color="green"
                    onClick={() => handleQuickAction('complete')}
                    className="w-full sm:w-auto"
                    disabled={updating}
                  />
                )}

                {canCancel && (
                  <Button
                    onClick={() => setShowCancelModal(true)}
                    variant="ghost"
                    disabled={updating}
                    className="bg-red-500/5 hover:bg-red-500/10 text-red-500 border border-red-500/10 rounded-xl h-10 px-4 text-[10px] font-black uppercase tracking-widest w-full sm:w-auto"
                  >
                    <XCircle className="h-4 w-4 mr-2" /> Annuler
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* MAIN */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-[#0E0E0E] border-white/10 ring-1 ring-white/[0.03] rounded-[1.5rem] md:rounded-[2rem] overflow-hidden hover:ring-white/[0.06] transition-all">
                <CardHeader className="p-6 md:p-8 pb-0">
                  <CardTitle className="text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] text-zinc-500 flex items-center gap-3">
                    <Package size={16} className="text-orange-500" /> Cahier des charges
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-6 md:p-8 space-y-6">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-3">{demande.name}</h3>
                    <div className="text-sm text-zinc-300 leading-relaxed bg-[#0B0B0B] p-4 rounded-2xl border border-white/[0.08] whitespace-pre-wrap">
                      {demande.description || 'Aucune description fournie.'}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 pt-2">
                    <DataPill icon={<Truck size={12} />} label="Livraison" value={demande.prefer_delivery ? 'OUI' : 'NON'} />
                    <DataPill icon={<User size={12} />} label="Main Propre" value={demande.prefer_hand_delivery ? 'OUI' : 'NON'} />
                    <DataPill icon={<Calendar size={12} />} label="Date" value={new Date(demande.created_at).toLocaleDateString()} />

                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest ml-1">Force Status</p>
                      <Select value={demande.status} onValueChange={handleStatusChange} disabled={updating}>
                        <SelectTrigger className="bg-[#0B0B0B] border-white/10 ring-1 ring-white/[0.02] h-10 rounded-xl text-[9px] font-black uppercase">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0E0E0E] border-white/10 text-white">
                          <SelectItem value="ANALYSIS">En analyse</SelectItem>
                          <SelectItem value="AWAITING_DEPOSIT">Attente acompte</SelectItem>
                          <SelectItem value="DEPOSIT_PAID">Acompte payé</SelectItem>
                          <SelectItem value="ACCEPTED">Acceptée</SelectItem>
                          <SelectItem value="IN_ANALYSIS">Recherche</SelectItem>
                          <SelectItem value="PROPOSAL_FOUND">Proposition</SelectItem>
                          <SelectItem value="AWAITING_BALANCE">Attente solde</SelectItem>
                          <SelectItem value="COMPLETED">Terminée</SelectItem>
                          <SelectItem value="CANCELLED">Annulée</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* PHOTOS */}
              {demande.photos && demande.photos.length > 0 && (
                <Card className="bg-[#0E0E0E] border-white/10 ring-1 ring-white/[0.03] rounded-[1.5rem] md:rounded-[2rem] overflow-hidden hover:ring-white/[0.06] transition-all">
                  <CardHeader className="p-6 md:p-8 pb-0">
                    <CardTitle className="text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] text-zinc-500">
                      Références visuelles
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 md:p-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {demande.photos.map((photo, index) => (
                      <div
                        key={index}
                        className="aspect-square rounded-2xl overflow-hidden border border-white/10 bg-[#0B0B0B] group relative"
                      >
                        <img
                          src={photo}
                          alt="Ref"
                          className="w-full h-full object-cover transition-transform group-hover:scale-110"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Eye className="text-white h-5 w-5" />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* SIDEBAR */}
            <div className="space-y-6">
              <Card className="bg-[#0E0E0E] border-white/10 ring-1 ring-white/[0.03] rounded-[1.5rem] md:rounded-[2.5rem] shadow-2xl relative overflow-hidden hover:ring-white/[0.06] transition-all">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-3xl rounded-full -mr-16 -mt-16" />
                <CardHeader className="p-6 md:p-8 pb-4">
                  <CardTitle className="text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] text-orange-500 flex items-center gap-3">
                    <DollarSign size={16} /> Data Finance
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 md:p-8 space-y-6">
                  <div className="flex justify-between items-end border-b border-white/[0.06] pb-4">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Max Budget</span>
                    <span className="text-3xl font-black text-white">{demande.max_price}€</span>
                  </div>
                  <div className="space-y-4">
                    <SidebarRow label="Prix Référence" value={`${demande.reference_price || 0}€`} />
                    <SidebarRow label="Acompte S-Tier" value={`${demande.deposit_amount || 0}€`} color="text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#0E0E0E] border-white/10 ring-1 ring-white/[0.03] rounded-[1.5rem] md:rounded-[2.5rem] hover:ring-white/[0.06] transition-all">
                <CardHeader className="p-6 md:p-8 pb-4">
                  <CardTitle className="text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] text-zinc-500 flex items-center gap-3">
                    <User size={16} /> Profil Client
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 md:p-8 space-y-6">
                  {client ? (
                    <div className="space-y-5">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-[#0B0B0B] flex items-center justify-center text-zinc-300 font-black border border-white/10">
                          {client.first_name?.[0]}
                          {client.last_name?.[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white uppercase truncate">
                            {client.first_name} {client.last_name}
                          </p>
                          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                            Membre S-Tier
                          </p>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-white/[0.06] space-y-3">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Email Direct</span>
                          <span className="text-xs font-medium text-zinc-300 truncate">{client.email}</span>
                        </div>

                        {client.phone && (
                          <div className="flex flex-col">
                            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Contact GSM</span>
                            <span className="text-xs font-medium text-zinc-300">{client.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-600 font-bold uppercase italic animate-pulse">Lien client corrompu...</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* MODAL CANCEL */}
          <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
            <DialogContent className="bg-[#0E0E0E] border-white/10 ring-1 ring-white/[0.03] text-white rounded-[1.5rem] sm:rounded-[2rem] p-6 md:p-10 w-[95vw] max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-red-500 font-black uppercase tracking-tighter text-lg sm:text-xl flex items-center gap-2">
                  <XCircle /> Annuler Transaction
                </DialogTitle>
              </DialogHeader>

              <div className="py-6 space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">
                  Raison de l&apos;interruption
                </Label>
                <Textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Ex: Rupture de stock chez le fournisseur..."
                  className="bg-[#0B0B0B] border-white/10 ring-1 ring-white/[0.02] rounded-2xl min-h-[120px] focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 text-sm text-white placeholder:text-zinc-600 p-4"
                />
              </div>

              <DialogFooter className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setShowCancelModal(false)}
                  className="rounded-xl text-zinc-500 font-bold uppercase text-[10px] h-12"
                >
                  Abandonner
                </Button>
                <Button
                  onClick={handleCancel}
                  disabled={updating}
                  className="bg-red-600 hover:bg-red-500 text-white font-black uppercase text-[10px] px-8 rounded-xl h-12"
                >
                  {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmer'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* MODAL DEPOSIT */}
          <Dialog open={showDepositModal} onOpenChange={setShowDepositModal}>
            <DialogContent className="bg-[#0E0E0E] border-white/10 ring-1 ring-white/[0.03] text-white rounded-[1.5rem] sm:rounded-[2rem] p-6 md:p-10 w-[95vw] max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-orange-500 font-black uppercase tracking-tighter text-lg sm:text-xl flex items-center gap-2">
                  <CreditCard /> Lien de Paiement
                </DialogTitle>
              </DialogHeader>

              <div className="py-6 space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Stripe Checkout URL</Label>
                <Input
                  type="url"
                  value={depositPaymentUrl}
                  onChange={(e) => setDepositPaymentUrl(e.target.value)}
                  placeholder="https://checkout.stripe.com/..."
                  className="bg-[#0B0B0B] border-white/10 ring-1 ring-white/[0.02] h-12 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20"
                />
              </div>

              <DialogFooter className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setShowDepositModal(false)}
                  className="rounded-xl text-zinc-500 font-bold uppercase text-[10px] h-12"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleRequestDeposit}
                  disabled={updating}
                  className="bg-orange-600 hover:bg-orange-500 text-white font-black uppercase text-[10px] px-8 rounded-xl h-12"
                >
                  {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Envoyer au client'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </AdminLayout>
  );
};

// ---------------- UI HELPERS ----------------

const ActionButton = ({ icon, label, color, onClick, className, disabled }) => {
  const colors = {
    orange: 'bg-orange-500/10 text-orange-500 border-orange-500/20 hover:bg-orange-500 hover:text-white',
    green: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500 hover:text-white',
    purple: 'bg-purple-500/10 text-purple-500 border-purple-500/20 hover:bg-purple-500 hover:text-white',
    blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500 hover:text-white',
  };

  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className={`h-10 px-4 rounded-xl border font-black uppercase text-[10px] tracking-widest transition-all duration-300 active:scale-95 ${colors[color]} ${className}`}
    >
      {icon} <span className="ml-2">{label}</span>
    </Button>
  );
};

const DataPill = ({ icon, label, value }) => (
  <div className="bg-[#0B0B0B] border border-white/[0.08] ring-1 ring-white/[0.02] p-3 rounded-xl flex flex-col justify-center">
    <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-1 mb-1">
      {icon} {label}
    </p>
    <p className="text-[10px] font-bold text-white uppercase">{value}</p>
  </div>
);

const SidebarRow = ({ label, value, color = 'text-white' }) => (
  <div className="flex justify-between items-center text-[11px] font-bold">
    <span className="text-zinc-500 uppercase tracking-widest">{label}</span>
    <span className={color}>{value}</span>
  </div>
);

const getStatusStyle = (status) => {
  const s = String(status || '').toUpperCase();
  if (s.includes('COMPLETED') || s.includes('ACCEPTED')) return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
  if (s.includes('ANALYSIS') || s.includes('PROPOSAL') || s.includes('IN_ANALYSIS')) return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
  if (s.includes('DEPOSIT') || s.includes('AWAITING')) return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
  if (s.includes('CANCELLED')) return 'bg-red-500/10 text-red-500 border-red-500/20';
  return 'bg-white/5 text-zinc-400 border-white/10';
};

const getStatusLabel = (status) => {
  const labels = {
    ANALYSIS: 'En analyse',
    DEPOSIT_PENDING: 'Attente Acompte',
    AWAITING_DEPOSIT: 'Attente Acompte',
    DEPOSIT_PAID: 'Acompte OK',
    ACCEPTED: 'Validée',
    IN_ANALYSIS: 'Recherche',
    PROPOSAL_FOUND: 'Trouvé !',
    AWAITING_BALANCE: 'Attente solde',
    COMPLETED: 'Clôturée',
    CANCELLED: 'Annulée',
  };
  return labels[String(status || '').toUpperCase()] || status;
};
