import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/AdminLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import api from '../../utils/api';
import { toast } from 'sonner';

export const AdminVentesPage = () => {
  const navigate = useNavigate();
  const [ventes, setVentes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchVentes = async () => {
    try {
      const response = await api.get('/admin/sales');
      setVentes(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchVentes();
  }, []);

  const updateStatus = async (saleId, newStatus) => {
    try {
      await api.put(`/admin/sales/${saleId}/status`, { status: newStatus });
      toast.success('Statut mis à jour');
      fetchVentes();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      'WAITING_ADMIN_APPROVAL': 'En attente',
      'PAYMENT_PENDING': 'Paiement en attente',
      'PAYMENT_SUBMITTED': 'Paiement soumis',
      'SHIPPING_PENDING': 'Expédition en attente',
      'SHIPPED': 'Expédié',
      'COMPLETED': 'Terminé',
      'REJECTED': 'Refusé',
      'CANCELLED': 'Annulé'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      'WAITING_ADMIN_APPROVAL': 'bg-yellow-100 text-yellow-800',
      'PAYMENT_PENDING': 'bg-orange-100 text-orange-800',
      'PAYMENT_SUBMITTED': 'bg-blue-100 text-blue-800',
      'SHIPPING_PENDING': 'bg-purple-100 text-purple-800',
      'SHIPPED': 'bg-indigo-100 text-indigo-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800',
      'CANCELLED': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-8">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4 md:mb-6">Ventes vendeurs</h2>

        {loading ? (
          <div className="text-center py-12"><p className="text-slate-500">Chargement...</p></div>
        ) : ventes.length === 0 ? (
          <Card className="bg-white border-slate-200"><CardContent className="p-12 text-center"><p className="text-slate-500">Aucune vente</p></CardContent></Card>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {ventes.map((vente) => (
              <Card 
                key={vente.id} 
                className="bg-white border-slate-200 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/admin/ventes/${vente.id}`)}
              >
                <CardContent className="p-3 md:p-4">
                  {/* Mobile layout */}
                  <div className="md:hidden space-y-2">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-slate-900 text-sm truncate flex-1 pr-2">{vente.article_name}</h3>
                      <Badge className={`${getStatusColor(vente.status)} text-xs flex-shrink-0`}>
                        {getStatusLabel(vente.status)}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-slate-500">Vente</p>
                        <p className="font-bold">{vente.sale_price}€</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Coût</p>
                        <p className="font-bold">{vente.seller_cost}€</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Profit</p>
                        <p className="font-bold text-green-600">{vente.profit}€</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400">
                      {new Date(vente.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>

                  {/* Desktop layout */}
                  <div className="hidden md:flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 hover:text-blue-600">{vente.article_name}</h3>
                      <div className="flex flex-wrap gap-4 mt-2 text-sm">
                        <span>Prix vente: <strong>{vente.sale_price}€</strong></span>
                        <span>Coût: <strong>{vente.seller_cost}€</strong></span>
                        <span className="text-green-600">Profit: <strong>{vente.profit}€</strong></span>
                        <span className="text-slate-400">{new Date(vente.created_at).toLocaleDateString('fr-FR')}</span>
                      </div>
                      {vente.rejection_reason && (
                        <p className="text-sm text-red-600 mt-1">Motif: {vente.rejection_reason}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(vente.status)}>{getStatusLabel(vente.status)}</Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => { e.stopPropagation(); navigate(`/admin/ventes/${vente.id}`); }}
                      >
                        Détail
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