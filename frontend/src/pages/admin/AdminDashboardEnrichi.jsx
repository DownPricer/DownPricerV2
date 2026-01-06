import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Package, ShoppingCart, Users, DollarSign, TrendingUp, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'sonner';

export const AdminDashboardEnrichiPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    articlesCount: 0,
    usersCount: 0,
    demandesCount: 0,
    ventesCount: 0,
    revenueTotal: 0,
    demandesPending: 0,
    paiementsPending: 0,
    expeditionsPending: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const [articles, users, demandes, sales] = await Promise.all([
        api.get('/articles?limit=10000'),
        api.get('/admin/users'),
        api.get('/admin/demandes'),
        api.get('/admin/sales')
      ]);

      const demandesPending = demandes.data.filter(d => 
        d.status === 'AWAITING_DEPOSIT' || d.status === 'IN_ANALYSIS'
      ).length;

      const paiementsPending = sales.data.filter(s => 
        s.status === 'PAYMENT_SUBMITTED'
      ).length;

      const expeditionsPending = sales.data.filter(s => 
        s.status === 'SHIPPING_PENDING'
      ).length;

      const completedSales = sales.data.filter(s => 
        s.status === 'COMPLETED'
      );
      const revenueTotal = completedSales.reduce((sum, s) => sum + s.sale_price, 0);

      setStats({
        articlesCount: articles.data.total || articles.data.articles?.length || 0,
        usersCount: users.data.length,
        demandesCount: demandes.data.length,
        ventesCount: sales.data.length,
        revenueTotal: revenueTotal,
        demandesPending,
        paiementsPending,
        expeditionsPending
      });

      // Activité récente
      const recent = [
        ...sales.data.slice(-5).map(s => ({
          type: 'vente',
          label: `Vente: ${s.article_name}`,
          time: new Date(s.created_at),
          status: s.status
        })),
        ...demandes.data.slice(-5).map(d => ({
          type: 'demande',
          label: `Demande: ${d.name}`,
          time: new Date(d.created_at),
          status: d.status
        }))
      ].sort((a, b) => b.time - a.time).slice(0, 10);

      setRecentActivity(recent);

    } catch (error) {
      toast.error('Erreur lors du chargement du dashboard');
      console.error(error);
    }
    setLoading(false);
  };

  const getStatusColor = (status) => {
    if (status.includes('COMPLETED') || status.includes('PAID')) return 'text-green-600';
    if (status.includes('PENDING') || status.includes('AWAITING')) return 'text-orange-600';
    if (status.includes('REJECTED') || status.includes('CANCELLED')) return 'text-red-600';
    return 'text-blue-600';
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-8">
          <p className="text-slate-500">Chargement du dashboard...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-6">Dashboard DownPricer</h2>

        {/* KPIs principaux */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/articles')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Articles</p>
                  <p className="text-3xl font-bold">{stats.articlesCount}</p>
                </div>
                <Package className="h-10 w-10 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/users')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Utilisateurs</p>
                  <p className="text-3xl font-bold">{stats.usersCount}</p>
                </div>
                <Users className="h-10 w-10 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/demandes')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Demandes</p>
                  <p className="text-3xl font-bold">{stats.demandesCount}</p>
                </div>
                <ShoppingCart className="h-10 w-10 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Revenus</p>
                  <p className="text-3xl font-bold text-green-600">{stats.revenueTotal.toFixed(0)}€</p>
                </div>
                <DollarSign className="h-10 w-10 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alertes */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow border-orange-200" onClick={() => navigate('/admin/demandes')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Demandes en attente</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.demandesPending}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow border-blue-200" onClick={() => navigate('/admin/paiements')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Paiements à valider</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.paiementsPending}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow border-purple-200" onClick={() => navigate('/admin/expeditions')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Expéditions en attente</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.expeditionsPending}</p>
                </div>
                <Package className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Graphique simple ventes */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Statistiques ventes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Total ventes</span>
                  <span className="text-lg font-bold">{stats.ventesCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Revenus totaux</span>
                  <span className="text-lg font-bold text-green-600">{stats.revenueTotal.toFixed(0)}€</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Revenu moyen/vente</span>
                  <span className="text-lg font-bold">
                    {stats.ventesCount > 0 ? (stats.revenueTotal / stats.ventesCount).toFixed(0) : 0}€
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Activité récente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {recentActivity.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">Aucune activité récente</p>
                ) : (
                  recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div>
                        <p className="text-sm font-medium">{activity.label}</p>
                        <p className="text-xs text-slate-500">
                          {activity.time.toLocaleDateString('fr-FR')} à {activity.time.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}
                        </p>
                      </div>
                      <span className={`text-xs font-medium ${getStatusColor(activity.status)}`}>
                        {activity.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};
