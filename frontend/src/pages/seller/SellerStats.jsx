import React, { useState, useEffect } from 'react';
import { Header } from '../../components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { TrendingUp, Package, DollarSign } from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'sonner';

export const SellerStats = () => {
  const [ventes, setVentes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ventesRes, statsRes] = await Promise.all([
        api.get('/seller/sales'),
        api.get('/seller/stats')
      ]);
      setVentes(ventesRes.data);
      setStats(statsRes.data);
    } catch (error) {
      toast.error('Erreur chargement stats');
    }
    setLoading(false);
  };

  const calculateAverages = () => {
    const completedSales = ventes.filter(v => v.status === 'COMPLETED');
    
    if (completedSales.length === 0) {
      return { avgPrice: 0, avgProfit: 0, totalSales: 0 };
    }

    const avgPrice = completedSales.reduce((sum, v) => sum + v.sale_price, 0) / completedSales.length;
    const avgProfit = completedSales.reduce((sum, v) => sum + v.profit, 0) / completedSales.length;

    return { avgPrice, avgProfit, totalSales: completedSales.length };
  };

  const getVentesByMonth = () => {
    const ventesCompleted = ventes.filter(v => v.status === 'COMPLETED');
    const months = {};

    ventesCompleted.forEach(v => {
      const date = new Date(v.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!months[monthKey]) {
        months[monthKey] = { count: 0, revenue: 0, profit: 0 };
      }
      
      months[monthKey].count += 1;
      months[monthKey].revenue += v.sale_price;
      months[monthKey].profit += v.profit;
    });

    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6); // 6 derniers mois
  };

  const { avgPrice, avgProfit, totalSales } = calculateAverages();
  const monthlyData = getVentesByMonth();

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-orange-500 mb-6" style={{fontFamily: 'Outfit, sans-serif'}}>
          Statistiques
        </h1>

        {loading ? (
          <div className="text-center py-12"><p className="text-zinc-400">Chargement...</p></div>
        ) : (
          <>
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-400">Ventes totales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold text-white">{totalSales}</span>
                    <Package className="h-8 w-8 text-blue-500" />
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">Articles vendus</p>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-400">Prix moyen de vente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold text-white">{avgPrice.toFixed(2)}€</span>
                    <DollarSign className="h-8 w-8 text-green-500" />
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">Par article</p>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-400">Bénéfice moyen</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold text-green-500">+{avgProfit.toFixed(2)}€</span>
                    <TrendingUp className="h-8 w-8 text-green-500" />
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">Par vente</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-zinc-900 border-zinc-800 mb-6">
              <CardHeader>
                <CardTitle className="text-white">Ventes par mois (6 derniers mois)</CardTitle>
              </CardHeader>
              <CardContent>
                {monthlyData.length === 0 ? (
                  <p className="text-center text-zinc-400 py-8">Pas encore de données</p>
                ) : (
                  <div className="space-y-3">
                    {monthlyData.map(([month, data]) => (
                      <div key={month} className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg">
                        <div className="flex-1">
                          <p className="font-semibold text-white">{month}</p>
                          <p className="text-sm text-zinc-400">{data.count} vente(s)</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-white">{data.revenue.toFixed(2)}€</p>
                          <p className="text-sm text-green-500">+{data.profit.toFixed(2)}€ profit</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">Dernières ventes</CardTitle>
              </CardHeader>
              <CardContent>
                {ventes.filter(v => v.status === 'COMPLETED').length === 0 ? (
                  <p className="text-center text-zinc-400 py-8">Aucune vente terminée</p>
                ) : (
                  <div className="space-y-2">
                    {ventes
                      .filter(v => v.status === 'COMPLETED')
                      .slice(0, 5)
                      .map((vente) => (
                        <div key={vente.id} className="flex items-center justify-between p-3 bg-zinc-800 rounded">
                          <div>
                            <p className="font-medium text-white">{vente.article_name}</p>
                            <p className="text-xs text-zinc-500">{new Date(vente.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-white">{vente.sale_price}€</p>
                            <p className="text-xs text-green-500">+{vente.profit}€</p>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
};
