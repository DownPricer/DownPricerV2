import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { ArrowLeft, User, Package, DollarSign, Truck, Calendar, CheckCircle, XCircle, AlertCircle, Loader2, CreditCard } from 'lucide-react';
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
  }, [id]);

  const fetchDemandeDetail = async () => {
    try {
      const response = await api.get(`/demandes/${id}`);
      setDemande(response.data);
      
      const usersResponse = await api.get('/admin/users');
      const userFound = usersResponse.data.find(u => u.id === response.data.client_id);
      setClient(userFound);
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
      toast.error('Erreur lors de la mise à jour');
    }
    setUpdating(false);
  };

  const handleQuickAction = async (action) => {
    setUpdating(true);
    let newStatus;
    switch (action) {
      case 'accept':
        newStatus = 'ACCEPTED';
        break;
      case 'analysis':
        newStatus = 'IN_ANALYSIS';
        break;
      case 'proposal':
        newStatus = 'PROPOSAL_FOUND';
        break;
      case 'complete':
        newStatus = 'COMPLETED';
        break;
      default:
        return;
    }
    try {
      await api.put(`/admin/demandes/${id}/status`, { status: newStatus });
      toast.success(`Demande ${action === 'accept' ? 'acceptée' : action === 'analysis' ? 'en analyse' : action === 'proposal' ? 'avec proposition' : 'terminée'}`);
      fetchDemandeDetail();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
    setUpdating(false);
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error('Veuillez saisir une raison d\'annulation');
      return;
    }
    setUpdating(true);
    try {
      // Utiliser le nouvel endpoint PATCH /admin/demandes/{id}/cancel qui conserve les infos de paiement
      await api.patch(`/admin/demandes/${id}/cancel`, { 
        reason: cancelReason 
      });
      toast.success('Demande annulée avec succès');
      setShowCancelModal(false);
      setCancelReason('');
      fetchDemandeDetail();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'annulation');
    }
    setUpdating(false);
  };

  const handleRequestDeposit = async () => {
    if (!depositPaymentUrl.trim()) {
      toast.error('Veuillez saisir un lien Stripe');
      return;
    }
    
    // Validation basique du format URL
    try {
      new URL(depositPaymentUrl);
    } catch {
      toast.error('Veuillez saisir une URL valide');
      return;
    }
    
    setUpdating(true);
    try {
      await api.patch(`/admin/demandes/${id}/request-deposit`, {
        deposit_payment_url: depositPaymentUrl.trim()
      });
      toast.success('Demande d\'acompte envoyée');
      setShowDepositModal(false);
      setDepositPaymentUrl('');
      fetchDemandeDetail();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la demande d\'acompte');
    }
    setUpdating(false);
  };

  const getStatusColor = (status) => {
    const colors = {
      'ANALYSIS': 'bg-purple-100 text-purple-800',
      'DEPOSIT_PENDING': 'bg-yellow-100 text-yellow-800',
      'DEPOSIT_PAID': 'bg-blue-100 text-blue-800',
      'ANALYSIS_AFTER_DEPOSIT': 'bg-indigo-100 text-indigo-800',
      'AWAITING_DEPOSIT': 'bg-yellow-100 text-yellow-800',
      'ACCEPTED': 'bg-emerald-100 text-emerald-800',
      'IN_ANALYSIS': 'bg-purple-100 text-purple-800',
      'PROPOSAL_FOUND': 'bg-green-100 text-green-800',
      'AWAITING_BALANCE': 'bg-orange-100 text-orange-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };
  
  const getStatusLabel = (status) => {
    const labels = {
      'ANALYSIS': 'En analyse',
      'DEPOSIT_PENDING': 'En attente acompte',
      'DEPOSIT_PAID': 'Acompte payé',
      'ANALYSIS_AFTER_DEPOSIT': 'En analyse (après acompte)',
      'AWAITING_DEPOSIT': 'En attente acompte',
      'ACCEPTED': 'Acceptée',
      'IN_ANALYSIS': 'En analyse',
      'PROPOSAL_FOUND': 'Proposition trouvée',
      'AWAITING_BALANCE': 'En attente solde',
      'COMPLETED': 'Terminée',
      'CANCELLED': 'Annulée'
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-8">
          <p className="text-slate-500">Chargement...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!demande) {
    return (
      <AdminLayout>
        <div className="p-8">
          <p className="text-red-500">Demande non trouvée</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin/demandes')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux demandes
        </Button>

        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Détail de la demande</h2>
            <Badge className={getStatusColor(demande.status)}>
              {getStatusLabel(demande.status)}
            </Badge>
          </div>
          
          <div className="flex flex-col gap-2">
            {/* Boutons d'actions rapides */}
            <div className="flex flex-wrap gap-2 mb-2">
              {demande.status === 'ANALYSIS' && (
                <Button 
                  onClick={() => setShowDepositModal(true)}
                  disabled={updating}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  {updating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CreditCard className="h-4 w-4 mr-1" />}
                  Demander un acompte
                </Button>
              )}
              {demande.status === 'DEPOSIT_PAID' && (
                <Button 
                  onClick={() => handleQuickAction('accept')}
                  disabled={updating}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {updating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                  Accepter
                </Button>
              )}
              {demande.status === 'ACCEPTED' && (
                <Button 
                  onClick={() => handleQuickAction('analysis')}
                  disabled={updating}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {updating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <AlertCircle className="h-4 w-4 mr-1" />}
                  Passer en analyse
                </Button>
              )}
              {demande.status === 'IN_ANALYSIS' && (
                <Button 
                  onClick={() => handleQuickAction('proposal')}
                  disabled={updating}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {updating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <AlertCircle className="h-4 w-4 mr-1" />}
                  Proposition trouvée
                </Button>
              )}
              {(demande.status === 'AWAITING_BALANCE' || demande.status === 'PROPOSAL_FOUND') && (
                <Button 
                  onClick={() => handleQuickAction('complete')}
                  disabled={updating}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {updating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                  Terminer
                </Button>
              )}
              {demande.status !== 'CANCELLED' && demande.status !== 'COMPLETED' && (
                <Button 
                  onClick={() => setShowCancelModal(true)}
                  disabled={updating}
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                  title="Annuler la demande (même après acompte payé)"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Annuler
                </Button>
              )}
            </div>
            
            {/* Sélecteur de statut manuel */}
            <Select value={demande.status} onValueChange={handleStatusChange} disabled={updating}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ANALYSIS">En analyse</SelectItem>
                <SelectItem value="DEPOSIT_PENDING">En attente acompte</SelectItem>
                <SelectItem value="DEPOSIT_PAID">Acompte payé</SelectItem>
                <SelectItem value="ANALYSIS_AFTER_DEPOSIT">En analyse (après acompte)</SelectItem>
                <SelectItem value="AWAITING_DEPOSIT">En attente acompte (ancien)</SelectItem>
                <SelectItem value="ACCEPTED">Acceptée</SelectItem>
                <SelectItem value="IN_ANALYSIS">En analyse (ancien)</SelectItem>
                <SelectItem value="PROPOSAL_FOUND">Proposition trouvée</SelectItem>
                <SelectItem value="AWAITING_BALANCE">En attente solde</SelectItem>
                <SelectItem value="COMPLETED">Terminée</SelectItem>
                <SelectItem value="CANCELLED">Annulée</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informations client
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {client && (
                <>
                  <div>
                    <p className="text-sm text-slate-500">Nom</p>
                    <p className="font-medium">{client.first_name} {client.last_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Email</p>
                    <p className="font-medium">{client.email}</p>
                  </div>
                  {client.phone && (
                    <div>
                      <p className="text-sm text-slate-500">Téléphone</p>
                      <p className="font-medium">{client.phone}</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Détails du produit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-slate-500">Nom</p>
                <p className="font-medium">{demande.name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Description</p>
                <p className="text-sm">{demande.description}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Informations financières
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-500">Prix maximum</span>
                <span className="font-bold text-lg">{demande.max_price}€</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Prix de référence</span>
                <span className="font-medium">{demande.reference_price}€</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Acompte</span>
                <span className="font-medium text-blue-600">{demande.deposit_amount}€</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Préférences de livraison
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={demande.prefer_delivery} disabled className="rounded" />
                <span className="text-sm">Livraison à domicile</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={demande.prefer_hand_delivery} disabled className="rounded" />
                <span className="text-sm">Remise en main propre</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {demande.photos && demande.photos.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Photos du produit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {demande.photos.map((photo, index) => (
                  <img
                    key={index}
                    src={photo}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border"
                    loading="lazy"
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Historique
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">
              Créé le {new Date(demande.created_at).toLocaleString('fr-FR')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Modal d'annulation */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Annuler la demande
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Raison de l'annulation *</Label>
              <Textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Expliquez la raison de l'annulation..."
                rows={4}
                className="border-slate-300"
              />
              <p className="text-xs text-slate-500">Cette raison sera enregistrée et potentiellement communiquée au client.</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCancelModal(false);
                setCancelReason('');
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleCancel}
              disabled={updating || !cancelReason.trim()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {updating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Confirmer l'annulation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal demande acompte */}
      <Dialog open={showDepositModal} onOpenChange={setShowDepositModal}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-orange-600 flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Demander un acompte
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Lien Stripe de l'acompte *</Label>
              <Input
                type="url"
                value={depositPaymentUrl}
                onChange={(e) => setDepositPaymentUrl(e.target.value)}
                placeholder="https://checkout.stripe.com/..."
                className="border-slate-300"
              />
              <p className="text-xs text-slate-500">Collez ici le lien Stripe Checkout pour l'acompte. Un email sera envoyé au client avec ce lien.</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDepositModal(false);
                setDepositPaymentUrl('');
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleRequestDeposit}
              disabled={updating || !depositPaymentUrl.trim()}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {updating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Valider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};