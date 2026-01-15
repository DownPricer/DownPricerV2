// 

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator'; // Si tu l'as, sinon une div border-b fait l'affaire
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  CreditCard, 
  AlertTriangle, 
  Package, 
  CheckCircle, 
  Clock, 
  Wallet, 
  Ban, 
  Search,
  Truck
} from 'lucide-react';
import api from '../utils/api';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { resolveImageUrl } from '../utils/images';

// --- Même configuration que MesDemandes pour la cohérence ---
const STATUS_CONFIG = {
  'AWAITING_DEPOSIT': { label: 'Acompte requis', icon: Wallet, className: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  'DEPOSIT_PAID': { label: 'Recherche en cours', icon: Search, className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  'IN_ANALYSIS': { label: 'En analyse', icon: Clock, className: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
  'PURCHASE_LAUNCHED': { label: 'Achat lancé', icon: Package, className: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  'PROPOSAL_FOUND': { label: 'Offre trouvée !', icon: CheckCircle, className: 'bg-green-500/10 text-green-400 border-green-500/20' },
  'AWAITING_BALANCE': { label: 'Solde à payer', icon: Wallet, className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  'COMPLETED': { label: 'Terminé', icon: CheckCircle, className: 'bg-green-500/10 text-green-400 border-green-500/20' },
  'CANCELLED': { label: 'Annulée', icon: Ban, className: 'bg-red-500/10 text-red-400 border-red-500/20' }
};

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
        toast.error('Demande introuvable.');
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

  if (loading) return <DetailSkeleton />;
  if (!demande) return null;

  const statusInfo = STATUS_CONFIG[demande.status] || { label: demande.status, icon: AlertTriangle, className: 'bg-zinc-800 text-zinc-400' };
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-orange-500/30" data-testid="demande-detail-page">
      <Header />
      
      <main className="container mx-auto px-4 py-8 md:py-12">
        
        {/* --- Navigation & Titre --- */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/mes-demandes')}
            className="pl-0 text-zinc-400 hover:text-white hover:bg-transparent mb-4 group"
          >
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Retour à mes demandes
          </Button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="outline" className="text-zinc-500 border-zinc-700 font-mono text-xs">
                  #{id.slice(0, 8)}
                </Badge>
                <div className="flex items-center text-xs text-zinc-500">
                  <Calendar className="h-3 w-3 mr-1" />
                  {format(new Date(demande.created_at), 'dd MMM yyyy', { locale: fr })}
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight" style={{fontFamily: 'Outfit, sans-serif'}}>
                {demande.name}
              </h1>
            </div>
            
            <Badge className={`${statusInfo.className} px-4 py-2 text-sm flex items-center w-fit`}>
              <StatusIcon className="h-4 w-4 mr-2" />
              {statusInfo.label}
            </Badge>
          </div>
        </div>

        {/* --- Layout Principal (Grid) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLONNE GAUCHE (2/3) : Photos & Description */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Galerie Photos */}
            {demande.photos && demande.photos.length > 0 ? (
              <div className="space-y-4">
                {/* Grande image principale */}
                <div className="aspect-video bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800">
                   {(() => {
                      const mainImgUrl = resolveImageUrl(demande.photos[0]);
                      return mainImgUrl ? (
                         <img src={mainImgUrl} alt={demande.name} className="w-full h-full object-cover" />
                      ) : null;
                   })()}
                </div>
                {/* Grille de vignettes (si plus d'une photo) */}
                {demande.photos.length > 1 && (
                  <div className="grid grid-cols-4 gap-4">
                    {demande.photos.slice(1).map((photo, i) => (
                      <div key={i} className="aspect-square bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800">
                         <img src={resolveImageUrl(photo)} alt="" className="w-full h-full object-cover opacity-70 hover:opacity-100 transition-opacity" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
               <div className="aspect-video bg-zinc-900/50 rounded-2xl border border-zinc-800 flex items-center justify-center text-zinc-600">
                  <div className="text-center">
                    <Package className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>Aucune photo fournie</p>
                  </div>
               </div>
            )}

            {/* Description Détaillée */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-lg">Détails de la demande</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {demande.description || "Aucune description détaillée n'a été fournie pour cette demande."}
                </p>
                
                <div className="mt-8 grid sm:grid-cols-2 gap-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-zinc-800 rounded-lg shrink-0">
                      <Truck className="h-5 w-5 text-zinc-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-white text-sm">Mode de récupération</h4>
                      <p className="text-zinc-400 text-sm mt-1">
                        {demande.prefer_delivery ? 'Livraison souhaitée' : demande.prefer_hand_delivery ? 'Remise en main propre' : 'Non spécifié'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-zinc-800 rounded-lg shrink-0">
                      <CreditCard className="h-5 w-5 text-zinc-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-white text-sm">Paiement</h4>
                      <p className="text-zinc-400 text-sm mt-1">
                        {demande.payment_type || 'Standard'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* COLONNE DROITE (1/3) : Résumé Financier & Actions */}
          <div className="space-y-6">
            <Card className="bg-zinc-900 border-zinc-800 sticky top-6">
              <CardHeader className="bg-zinc-950/50 border-b border-zinc-800">
                <CardTitle className="text-base text-zinc-400">Résumé financier</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                
                <div className="space-y-4">
                   <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Prix de référence</span>
                    <span className="text-zinc-500 line-through decoration-zinc-600">{demande.reference_price} €</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white font-medium">Votre Prix Max</span>
                    <span className="text-white font-bold text-lg">{demande.max_price} €</span>
                  </div>
                  <div className="h-px bg-zinc-800 my-2" />
                  <div className="flex justify-between items-center p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                    <span className="text-orange-200 font-medium">Acompte</span>
                    <span className="text-orange-400 font-bold text-xl">{demande.deposit_amount} €</span>
                  </div>
                </div>

                {/* Bouton d'action contextuel (Annulation) */}
                <div className="pt-2">
                  {demande.can_cancel && demande.status !== 'CANCELLED' ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full border-red-900/30 text-red-500 hover:bg-red-950/50 hover:text-red-400 hover:border-red-900/50 transition-colors"
                          data-testid="demande-detail-cancel-btn"
                        >
                          <Ban className="h-4 w-4 mr-2" />
                          Annuler la demande
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                          <AlertDialogDescription className="text-zinc-400">
                            Cette action annulera définitivement votre demande. L'acompte sera remboursé selon nos CGV.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700">Retour</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700 text-white border-none"
                            onClick={handleCancel}
                          >
                            Confirmer l'annulation
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : demande.status === 'CANCELLED' ? (
                    <div className="w-full p-3 bg-zinc-800/50 rounded-lg border border-zinc-800 text-center text-zinc-500 text-sm">
                      Demande annulée
                    </div>
                  ) : (
                    <div className="w-full p-3 bg-blue-900/10 rounded-lg border border-blue-900/20 text-center text-blue-400 text-sm flex items-center justify-center gap-2">
                      <Package className="h-4 w-4" />
                      Achat en cours, annulation impossible
                    </div>
                  )}
                </div>

              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

// --- Skeleton pour le chargement ---
const DetailSkeleton = () => (
  <div className="min-h-screen bg-zinc-950 text-white">
    <Header />
    <div className="container mx-auto px-4 py-12">
      <div className="h-8 w-32 bg-zinc-900 rounded mb-8 animate-pulse" />
      <div className="flex justify-between mb-8">
         <div className="h-10 w-1/2 bg-zinc-900 rounded animate-pulse" />
         <div className="h-8 w-32 bg-zinc-900 rounded animate-pulse" />
      </div>
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
           <div className="aspect-video bg-zinc-900 rounded-2xl animate-pulse" />
           <div className="h-40 bg-zinc-900 rounded-2xl animate-pulse" />
        </div>
        <div className="h-64 bg-zinc-900 rounded-2xl animate-pulse" />
      </div>
    </div>
  </div>
);