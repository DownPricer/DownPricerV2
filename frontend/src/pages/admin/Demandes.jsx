import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Eye } from 'lucide-react';
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
      setDemandes(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    }
    setLoading(false);
  };

  const updateStatus = async (demandeId, newStatus) => {
    try {
      await api.put(`/admin/demandes/${demandeId}/status`, { status: newStatus });
      toast.success('Statut mis à jour');
      fetchDemandes();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      'AWAITING_DEPOSIT': { label: 'En attente acompte', color: 'bg-orange-100 text-orange-800' },
      'DEPOSIT_PAID': { label: 'Acompte payé', color: 'bg-green-100 text-green-800' },
      'IN_ANALYSIS': { label: 'En analyse', color: 'bg-blue-100 text-blue-800' },
      'PURCHASE_LAUNCHED': { label: 'Achat lancé', color: 'bg-purple-100 text-purple-800' },
      'PROPOSAL_FOUND': { label: 'Proposition trouvée', color: 'bg-green-100 text-green-800' },
      'AWAITING_BALANCE': { label: 'Attente solde', color: 'bg-orange-100 text-orange-800' },
      'COMPLETED': { label: 'Terminé', color: 'bg-green-100 text-green-800' },
      'CANCELLED': { label: 'Annulée', color: 'bg-red-100 text-red-800' }
    };
    const { label, color } = map[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
    return <Badge className={color}>{label}</Badge>;
  };

  const filteredDemandes = filter === 'all' ? demandes : demandes.filter(d => d.status === filter);

  return (
    <AdminLayout>
      <div className="p-4 md:p-8">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4 md:mb-6">Demandes clients</h2>

        <Card className="bg-white border-slate-200 mb-4 md:mb-6">
          <CardContent className="p-3 md:p-4">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="AWAITING_DEPOSIT">En attente acompte</SelectItem>
                <SelectItem value="DEPOSIT_PAID">Acompte payé</SelectItem>
                <SelectItem value="IN_ANALYSIS">En analyse</SelectItem>
                <SelectItem value="PURCHASE_LAUNCHED">Achat lancé</SelectItem>
                <SelectItem value="COMPLETED">Terminé</SelectItem>
                <SelectItem value="CANCELLED">Annulé</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-slate-500">Chargement...</p>
          </div>
        ) : filteredDemandes.length === 0 ? (
          <Card className="bg-white border-slate-200">
            <CardContent className="p-12 text-center">
              <p className="text-slate-500">Aucune demande</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {filteredDemandes.map((demande) => (
              <Card 
                key={demande.id} 
                className="bg-white border-slate-200 hover:shadow-lg transition-shadow cursor-pointer hover:border-blue-300"
                onClick={() => navigate(`/admin/demandes/${demande.id}`)}
              >
                <CardContent className="p-3 md:p-4">
                  {/* Mobile layout */}
                  <div className="md:hidden space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-semibold text-slate-900 text-sm truncate flex-1">{demande.name}</h3>
                      {getStatusBadge(demande.status)}
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2">{demande.description?.substring(0, 80)}...</p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-slate-400">Prix max</p>
                        <p className="font-semibold">{demande.max_price}€</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Acompte</p>
                        <p className="font-semibold">{demande.deposit_amount}€</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Type</p>
                        <p className="font-semibold truncate">{demande.payment_type || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Desktop layout */}
                  <div className="hidden md:flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900">{demande.name}</h3>
                      <p className="text-sm text-slate-500 mt-1 truncate">{demande.description?.substring(0, 100)}...</p>
                      <div className="flex flex-wrap gap-4 mt-2 text-sm">
                        <span className="text-slate-600">Prix max: <strong>{demande.max_price}€</strong></span>
                        <span className="text-slate-600">Acompte: <strong>{demande.deposit_amount}€</strong></span>
                        <span className="text-slate-600">Type: <strong>{demande.payment_type || 'N/A'}</strong></span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                      {getStatusBadge(demande.status)}
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/demandes/${demande.id}`);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};