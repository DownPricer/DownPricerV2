import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import api from '../../utils/api';

export const SellerStatsGraph = () => {
  const [salesByMonth, setSalesByMonth] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSalesData();
  }, []);

  const fetchSalesData = async () => {
    try {
      const response = await api.get('/seller/sales');
      const completedSales = response.data.filter(s => s.status === 'COMPLETED');
      
      const monthlyData = {};
      completedSales.forEach(sale => {
        const date = new Date(sale.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { count: 0, revenue: 0 };
        }
        
        monthlyData[monthKey].count += 1;
        monthlyData[monthKey].revenue += sale.sale_price;
      });
      
      const sortedMonths = Object.keys(monthlyData).sort().slice(-6);
      const chartData = sortedMonths.map(month => ({
        month: month,
        displayMonth: new Date(month + '-01').toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
        count: monthlyData[month].count,
        revenue: monthlyData[month].revenue
      }));
      
      setSalesByMonth(chartData);
    } catch (error) {
      console.error('Erreur stats:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-orange-500">Statistiques mensuelles</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-zinc-400 text-sm">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  if (salesByMonth.length === 0) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-orange-500">Statistiques mensuelles</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-zinc-400 text-sm">Aucune vente complétée pour le moment</p>
        </CardContent>
      </Card>
    );
  }

  const maxRevenue = Math.max(...salesByMonth.map(d => d.revenue));

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-orange-500">Ventes des 6 derniers mois</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {salesByMonth.map((data, index) => (
            <div key={index}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-zinc-400">{data.displayMonth}</span>
                <div className="text-sm">
                  <span className="text-white font-semibold">{data.count} vente{data.count > 1 ? 's' : ''}</span>
                  <span className="text-zinc-500 mx-2">•</span>
                  <span className="text-green-500 font-semibold">{data.revenue.toFixed(0)}€</span>
                </div>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-orange-500 to-orange-600 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${(data.revenue / maxRevenue) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};