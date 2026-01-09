import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import api from '../utils/api';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { resolveImageUrl } from '../utils/images';

export const DemandeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [demande, setDemande] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDemande();
  }, [id]);

  const fetchDemande = async () => {
    try {
      const response = await api.get(`/demandes/${id}`);
      setDemande(response.data);
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate('/login');
      } else {
        toast.error('Demande non trouvée');
        navigate('/mes-demandes');
      }
    }
    setLoading(false);
  };

  const handleCancel = async () => {
    try {
      await api.post(`/demandes/${id}/cancel`);
      toast.success('Demande annulée avec succès');
      navigate('/mes-demandes');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'annulation');
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'AWAITING_DEPOSIT': { label: 'En attente d\'acompte', className: 'bg-orange-500/20 text-orange-400 border-orange-500/50' },
      'DEPOSIT_PAID': { label: 'Acompte payé', className: 'bg-green-500/20 text-green-400 border-green-500/50' },
      'IN_ANALYSIS': { label: 'En analyse', className: 'bg-blue-500/20 text-blue-400 border-blue-500/50' },
      'PURCHASE_LAUNCHED': { label: 'Achat lancé', className: 'bg-purple-500/20 text-purple-400 border-purple-500/50' },
      'PROPOSAL_FOUND': { label: 'Proposition trouvée', className: 'bg-green-500/20 text-green-400 border-green-500/50' },
      'AWAITING_BALANCE': { label: 'En attente du solde', className: 'bg-orange-500/20 text-orange-400 border-orange-500/50' },
      'COMPLETED': { label: 'Terminé', className: 'bg-green-500/20 text-green-400 border-green-500/50' },
      'CANCELLED': { label: 'Annulée', className: 'bg-red-500/20 text-red-400 border-red-500/50' }
    };
    
    const { label, className } = statusMap[status] || { label: status, className: 'bg-zinc-500/20 text-zinc-400' };
    return <Badge className={className}>{label}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white">
        <Header />
        <div className="container mx-auto px-4 py-12 text-center">
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  if (!demande) return null;

  return (
    <div className="min-h-screen bg-zinc-950 text-white" data-testid="demande-detail-page">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/mes-demandes')}
          className="mb-4 text-zinc-400 hover:text-white"
        >
          ← Retour aux demandes
        </Button>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-orange-500 mb-2" style={{fontFamily: 'Outfit, sans-serif'}}>
              {demande.name}
            </h1>
            {getStatusBadge(demande.status)}
          </div>

          {demande.photos && demande.photos.length > 0 && (
            <div className="flex gap-2 overflow-x-auto">
              {demande.photos.map((photo, index) => {
                const imageUrl = resolveImageUrl(photo);
                if (!imageUrl) return null;
                return (
                  <div key={index} className="flex-shrink-0 w-32 h-32 rounded-lg overflow-hidden bg-zinc-800">
                    <img src={imageUrl} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" loading="lazy" onError={(e) => e.target.style.display = 'none'} />
                  </div>
                );
              })}
            </div>
          )}

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6 space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-white mb-2">Description</h2>
                <p className="text-zinc-300 whitespace-pre-wrap">{demande.description}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-zinc-800">
                <div>
                  <span className="text-sm text-zinc-400">Prix maximum</span>
                  <p className="text-xl font-bold text-orange-500">{demande.max_price}€</p>
                </div>
                <div>
                  <span className="text-sm text-zinc-400">Prix de référence</span>
                  <p className="text-xl font-bold text-zinc-300">{demande.reference_price}€</p>
                </div>
                <div>
                  <span className="text-sm text-zinc-400">Acompte</span>
                  <p className="text-xl font-bold text-white">{demande.deposit_amount}€</p>
                </div>
                <div>
                  <span className="text-sm text-zinc-400">Type de paiement</span>
                  <p className="text-sm text-zinc-300">{demande.payment_type || 'Non payé'}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800">
                <h3 className="text-sm font-semibold text-white mb-2">Préférences de livraison</h3>
                <div className="space-y-1 text-sm text-zinc-300">
                  {demande.prefer_delivery && <p>✓ Préfère une livraison</p>}
                  {demande.prefer_hand_delivery && <p>✓ Peut récupérer en main propre</p>}
                  {!demande.prefer_delivery && !demande.prefer_hand_delivery && <p className="text-zinc-500">Aucune préférence spécifiée</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {demande.can_cancel && demande.status !== 'CANCELLED' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                  data-testid="demande-detail-cancel-btn"
                >
                  Annuler cette demande
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white">
                <AlertDialogHeader>
                  <AlertDialogTitle>Annuler la demande ?</AlertDialogTitle>
                  <AlertDialogDescription className="text-zinc-400">
                    Vous allez annuler cette demande. Si un paiement a été effectué, un remboursement sera déclenché (selon les conditions).
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-white">Retour</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-500 hover:bg-red-600 text-white"
                    onClick={handleCancel}
                  >
                    Confirmer l'annulation
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {!demande.can_cancel && demande.status !== 'CANCELLED' && (
            <Card className="bg-red-500/10 border-red-500/50">
              <CardContent className="p-4">
                <p className="text-red-400 text-sm">
                  Annulation impossible : l'achat a déjà été lancé. Contactez-nous si besoin.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};