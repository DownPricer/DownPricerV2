// 
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { DiscordCTA } from '../components/DiscordCTA';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import { Plus, Eye, X, Clock, CheckCircle, AlertCircle, Ban, Package, Search, Wallet } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { resolveImageUrl } from '../utils/images';

// --- Configuration des Statuts ---
const STATUS_CONFIG = {
  'AWAITING_DEPOSIT': { 
    label: 'Acompte requis', 
    icon: Wallet,
    className: 'bg-orange-500/10 text-orange-400 border-orange-500/20' 
  },
  'DEPOSIT_PAID': { 
    label: 'Recherche en cours', 
    icon: Search,
    className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
  },
  'IN_ANALYSIS': { 
    label: 'En analyse', 
    icon: Clock,
    className: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' 
  },
  'PURCHASE_LAUNCHED': { 
    label: 'Achat lancé', 
    icon: Package,
    className: 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
  },
  'PROPOSAL_FOUND': { 
    label: 'Offre trouvée !', 
    icon: CheckCircle,
    className: 'bg-green-500/10 text-green-400 border-green-500/20' 
  },
  'AWAITING_BALANCE': { 
    label: 'Solde à payer', 
    icon: Wallet,
    className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' 
  },
  'COMPLETED': { 
    label: 'Terminé', 
    icon: CheckCircle,
    className: 'bg-green-500/10 text-green-400 border-green-500/20' 
  },
  'CANCELLED': { 
    label: 'Annulée', 
    icon: Ban,
    className: 'bg-red-500/10 text-red-400 border-red-500/20' 
  }
};

export const MesDemandes = () => {
  const navigate = useNavigate();
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDemandes();
  }, []);

  const fetchDemandes = async () => {
    try {
      const response = await api.get('/demandes');
      setDemandes(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        navigate('/login');
      } else {
        toast.error('Impossible de charger vos demandes.');
      }
    }
    setLoading(false);
  };

  const handleCancel = async (demandeId) => {
    try {
      await api.post(`/demandes/${demandeId}/cancel`);
      toast.success('La demande a été annulée.');
      fetchDemandes(); // Rafraîchir la liste
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'annulation');
    }
  };

  const getTimeAgo = (createdAt) => {
    try {
      return formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: fr });
    } catch {
      return '';
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-orange-500/30" data-testid="mes-demandes-page">
      <Header />
      
      <main className="container mx-auto px-4 py-8 md:py-12">
        
        {/* --- Header de Section --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white" style={{fontFamily: 'Outfit, sans-serif'}}>
              Suivi des <span className="text-orange-500">demandes</span>
            </h1>
            <p className="text-zinc-400 mt-1">Consultez l'état d'avancement de vos recherches.</p>
          </div>
          <Button
            className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-lg shadow-orange-900/20 pl-4 pr-6"
            onClick={() => navigate('/nouvelle-demande')}
            data-testid="mes-demandes-new-btn"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nouvelle demande
          </Button>
        </div>

        {/* --- Discord Banner (Intégrée proprement) --- */}
        <div className="mb-8">
          <DiscordCTA variant="banner" />
        </div>

        {/* --- Liste des demandes --- */}
        {loading ? (
          <DemandesSkeleton />
        ) : demandes.length === 0 ? (
          <EmptyState navigate={navigate} />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {demandes.map((demande) => {
              const statusInfo = STATUS_CONFIG[demande.status] || { label: demande.status, className: 'bg-zinc-800 text-zinc-400', icon: AlertCircle };
              const StatusIcon = statusInfo.icon;

              return (
                <Card key={demande.id} className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-all duration-300 flex flex-col overflow-hidden group" data-testid={`demande-card-${demande.id}`}>
                  
                  {/* Image & Header */}
                  <div className="relative h-48 bg-zinc-800 overflow-hidden">
                    {(() => {
                      const imageUrl = resolveImageUrl(demande.photos?.[0]);
                      return imageUrl ? (
                        <img 
                          src={imageUrl} 
                          alt={demande.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          loading="lazy" 
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 bg-zinc-800/50">
                           <Package className="h-10 w-10 opacity-20 mb-2" />
                           <span className="text-xs">Aucune image</span>
                        </div>
                      );
                    })()}
                    
                    {/* Badge Statut Overlay */}
                    <div className="absolute top-3 right-3">
                      <Badge className={`${statusInfo.className} backdrop-blur-md border px-3 py-1`}>
                        <StatusIcon className="h-3 w-3 mr-1.5" />
                        {statusInfo.label}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-5 flex-grow">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg text-white truncate pr-2">{demande.name}</h3>
                      <span className="text-xs font-mono text-zinc-500 whitespace-nowrap pt-1">
                        {getTimeAgo(demande.created_at)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-zinc-400 line-clamp-2 mb-4 leading-relaxed">
                      {demande.description || "Aucune description fournie."}
                    </p>

                    <div className="flex items-center gap-2 p-3 bg-zinc-950 rounded-lg border border-zinc-800/50">
                      <Wallet className="h-4 w-4 text-zinc-500" />
                      <span className="text-sm text-zinc-400">Acompte prévu :</span>
                      <span className="text-sm font-bold text-white ml-auto">{demande.deposit_amount}€</span>
                    </div>
                  </CardContent>

                  <CardFooter className="p-5 pt-0 flex gap-3 mt-auto">
                    <Button
                      variant="outline"
                      className="flex-1 bg-zinc-900 border-zinc-700 hover:bg-zinc-800 text-white"
                      onClick={() => navigate(`/demande/${demande.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Détails
                    </Button>

                    {demande.can_cancel && demande.status !== 'CANCELLED' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-zinc-500 hover:text-red-400 hover:bg-red-400/10 border border-transparent hover:border-red-500/20"
                          >
                            <X className="h-5 w-5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Annuler cette demande ?</AlertDialogTitle>
                            <AlertDialogDescription className="text-zinc-400">
                              Cette action est irréversible. Si un acompte a été versé, il sera remboursé selon nos conditions générales.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700">Retour</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-600 hover:bg-red-700 text-white border-none"
                              onClick={() => handleCancel(demande.id)}
                            >
                              Confirmer l'annulation
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

// --- Composants Secondaires ---

const EmptyState = ({ navigate }) => (
  <Card className="bg-zinc-900 border-zinc-800 border-dashed">
    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-16 w-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
        <Package className="h-8 w-8 text-zinc-500" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">C'est vide par ici !</h3>
      <p className="text-zinc-400 max-w-sm mb-6">
        Vous n'avez pas encore fait de demande. Lancez votre première recherche de prix cassé dès maintenant.
      </p>
      <Button
        className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-8"
        onClick={() => navigate('/nouvelle-demande')}
      >
        Créer ma première demande
      </Button>
    </CardContent>
  </Card>
);

const DemandesSkeleton = () => (
  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden h-[400px]">
        <div className="h-48 bg-zinc-800 animate-pulse" />
        <div className="p-5 space-y-4">
          <div className="h-6 bg-zinc-800 rounded w-3/4 animate-pulse" />
          <div className="h-4 bg-zinc-800/50 rounded w-full animate-pulse" />
          <div className="h-12 bg-zinc-800 rounded mt-4 animate-pulse" />
        </div>
      </div>
    ))}
  </div>
);