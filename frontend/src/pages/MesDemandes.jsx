import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { DiscordCTA } from '../components/DiscordCTA';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import { Plus, Eye, X } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

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
        toast.error('Erreur lors du chargement des demandes');
      }
    }
    setLoading(false);
  };

  const handleCancel = async (demandeId) => {
    try {
      await api.post(`/demandes/${demandeId}/cancel`);
      toast.success('Demande annulée avec succès');
      fetchDemandes();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'annulation');
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'AWAITING_DEPOSIT': { label: 'En attente d\'acompte', className: 'bg-orange-500/20 text-orange-400 border-orange-500/50' },
      'DEPOSIT_PAID': { label: 'Acompte payé', className: 'bg-green-500/20 text-green-400 border-green-500/50' },
      'IN_ANALYSIS': { label: 'En analyse', className: 'bg-blue-500/20 text-blue-400 border-blue-500/50' },
      'PURCHASE_LAUNCHED': { label: 'Achat lancé (annulation impossible)', className: 'bg-purple-500/20 text-purple-400 border-purple-500/50' },
      'PROPOSAL_FOUND': { label: 'Proposition trouvée', className: 'bg-green-500/20 text-green-400 border-green-500/50' },
      'AWAITING_BALANCE': { label: 'En attente du solde', className: 'bg-orange-500/20 text-orange-400 border-orange-500/50' },
      'COMPLETED': { label: 'Terminé', className: 'bg-green-500/20 text-green-400 border-green-500/50' },
      'CANCELLED': { label: 'Annulée', className: 'bg-red-500/20 text-red-400 border-red-500/50' }
    };
    
    const { label, className } = statusMap[status] || { label: status, className: 'bg-zinc-500/20 text-zinc-400' };
    return <Badge className={className}>{label}</Badge>;
  };

  const getTimeAgo = (createdAt) => {
    try {
      return 'Créée ' + formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: fr });
    } catch {
      return 'Créée récemment';
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white" data-testid="mes-demandes-page">
      <Header />
      <DiscordCTA variant="banner" />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-orange-500" style={{fontFamily: 'Outfit, sans-serif'}}>
              Mes demandes
            </h1>
            <p className="text-zinc-400 mt-2">Retrouvez ici toutes vos demandes et leur statut.</p>
          </div>
          <Button
            className="bg-orange-500 hover:bg-orange-600 text-white rounded-full"
            onClick={() => navigate('/nouvelle-demande')}
            data-testid="mes-demandes-new-btn"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle demande
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-zinc-400">Chargement...</p>
          </div>
        ) : demandes.length === 0 ? (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-12 text-center">
              <p className="text-zinc-400 mb-4">Vous n'avez pas encore de demandes.</p>
              <Button
                className="bg-orange-500 hover:bg-orange-600 text-white rounded-full"
                onClick={() => navigate('/nouvelle-demande')}
              >
                Créer ma première demande
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {demandes.map((demande) => (
              <Card key={demande.id} className="bg-zinc-900 border-zinc-800 hover:border-orange-500/50 transition-colors" data-testid={`demande-card-${demande.id}`}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-20 h-20 bg-zinc-800 rounded-lg overflow-hidden">
                      {demande.photos && demande.photos.length > 0 ? (
                        <img src={demande.photos[0]} alt={demande.name} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">Pas de photo</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate mb-1">{demande.name}</h3>
                      <p className="text-sm text-zinc-400 line-clamp-2 mb-2">{demande.description}</p>
                      <p className="text-xs text-zinc-500">{getTimeAgo(demande.created_at)}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-zinc-400">Acompte :</span>
                      <span className="text-sm font-semibold text-white">{demande.deposit_amount}€</span>
                    </div>
                    {getStatusBadge(demande.status)}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white"
                      onClick={() => navigate(`/demande/${demande.id}`)}
                      data-testid={`demande-view-btn-${demande.id}`}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Voir
                    </Button>
                    {demande.can_cancel && demande.status !== 'CANCELLED' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                            data-testid={`demande-cancel-btn-${demande.id}`}
                          >
                            <X className="h-4 w-4" />
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
                              onClick={() => handleCancel(demande.id)}
                            >
                              Confirmer l'annulation
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};