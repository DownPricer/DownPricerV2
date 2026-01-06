import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Users, Package, FileText, DollarSign } from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'sonner';

export const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/dashboard');
      setStats(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des statistiques');
    }
    setLoading(false);
  };

  return (
    <AdminLayout>
      <div className="p-8" data-testid="admin-dashboard-content">
        <h2 className="text-3xl font-bold text-slate-900 mb-6">Dashboard</h2>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-slate-500">Chargement...</p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card className="bg-white border-slate-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Utilisateurs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold text-slate-900">{stats?.total_users || 0}</span>
                    <Users className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-slate-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Articles</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold text-slate-900">{stats?.total_articles || 0}</span>
                    <Package className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-slate-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Demandes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold text-slate-900">{stats?.total_demandes || 0}</span>
                    <FileText className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-slate-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Ventes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold text-slate-900">{stats?.total_sales || 0}</span>
                    <DollarSign className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">Dernières demandes</CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.recent_demandes && stats.recent_demandes.length > 0 ? (
                  <div className="space-y-2">
                    {stats.recent_demandes.map((demande) => (
                      <div key={demande.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-medium text-slate-900">{demande.name}</p>
                          <p className="text-sm text-slate-500">Prix max: {demande.max_price}€</p>
                        </div>
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                          {demande.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-8">Aucune demande récente</p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
};
