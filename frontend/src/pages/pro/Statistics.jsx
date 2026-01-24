import React, { useState, useEffect } from 'react';
import { BarChart3, CheckCircle, TrendingUp, DollarSign, Loader } from 'lucide-react';
import api from '../../utils/api';

export const ProStatistics = () => {
  const [data, setData] = useState({
    articles: [],
    transactions: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [articlesRes, transactionsRes] = await Promise.all([
        api.get('/pro/articles-light'),
        api.get('/pro/transactions')
      ]);

      setData({
        articles: articlesRes.data,
        transactions: transactionsRes.data
      });
    } catch (error) {
      console.error('Erreur:', error);
      if (error.response?.status === 403) {
        window.location.href = '/';
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // Calculs des statistiques
  const soldArticles = data.articles.filter(a => a.status === 'Vendu');
  const lostArticles = data.articles.filter(a => a.status === 'Perte');
  
  const conversionRate = data.articles.length > 0 ? 
    Math.round((soldArticles.length / data.articles.length) * 100) : 0;

  const totalRevenue = soldArticles.reduce((sum, a) => sum + (a.actual_sale_price || 0), 0);
  const totalInvestment = data.articles.reduce((sum, a) => sum + a.purchase_price, 0);
  const totalMargin = totalRevenue - soldArticles.reduce((sum, a) => sum + a.purchase_price, 0);

  // Répartition par plateforme
  const platformStats = data.articles.reduce((acc, article) => {
    acc[article.purchase_platform] = (acc[article.purchase_platform] || 0) + 1;
    return acc;
  }, {});

  // Ventes par mois
  const monthlyStats = soldArticles.reduce((acc, article) => {
    const month = new Date(article.updated_at).toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'long' 
    });
    if (!acc[month]) {
      acc[month] = { sales: 0, revenue: 0, margin: 0 };
    }
    acc[month].sales += 1;
    acc[month].revenue += article.actual_sale_price || 0;
    acc[month].margin += (article.actual_sale_price || 0) - article.purchase_price;
    return acc;
  }, {});

  const averageMargin = soldArticles.length > 0 ? 
    soldArticles.reduce((sum, a) => sum + ((a.actual_sale_price || 0) - a.purchase_price), 0) / soldArticles.length : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Statistiques</h1>
        <p className="mt-2 text-gray-600">Analyse de votre activité d'achat-revente</p>
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Total Articles</p>
              <p className="text-xl font-bold text-blue-600">{data.articles.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Vendus</p>
              <p className="text-xl font-bold text-green-600">{soldArticles.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <TrendingUp className="h-6 w-6 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Taux de Vente</p>
              <p className="text-xl font-bold text-purple-600">{conversionRate}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <DollarSign className="h-6 w-6 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Revenus</p>
              <p className="text-xl font-bold text-yellow-600">{totalRevenue.toFixed(2)}€</p>
            </div>
          </div>
        </div>
      </div>

      {/* Métriques avancées */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Performance</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Marge totale</span>
              <span className={`font-medium ${totalMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalMargin.toFixed(2)}€
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Marge moyenne</span>
              <span className={`font-medium ${averageMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {averageMargin.toFixed(2)}€
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Investissement</span>
              <span className="font-medium text-blue-600">{totalInvestment.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Articles perdus</span>
              <span className="font-medium text-red-600">{lostArticles.length}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Répartition par plateforme</h3>
          <div className="space-y-3">
            {Object.entries(platformStats).map(([platform, count]) => (
              <div key={platform} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{platform}</span>
                <div className="flex items-center space-x-3">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-indigo-600 h-2 rounded-full" 
                      style={{ width: `${(count / data.articles.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-8">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Ventes par mois</h3>
          <div className="space-y-3">
            {Object.entries(monthlyStats).slice(0, 6).map(([month, stats]) => (
              <div key={month} className="border-l-4 border-indigo-500 pl-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">{month}</p>
                    <p className="text-sm text-gray-600">{stats.sales} ventes</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">{stats.revenue.toFixed(2)}€</p>
                    <p className={`text-sm ${stats.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stats.margin >= 0 ? '+' : ''}{stats.margin.toFixed(2)}€
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top articles */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Articles les plus rentables</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {soldArticles
              .sort((a, b) => ((b.actual_sale_price || 0) - b.purchase_price) - ((a.actual_sale_price || 0) - a.purchase_price))
              .slice(0, 5)
              .map((article, index) => (
                <div key={article.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-sm font-medium text-indigo-600">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{article.name}</p>
                      <p className="text-sm text-gray-500">{article.purchase_platform}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{article.purchase_price}€ → {article.actual_sale_price}€</p>
                    <p className="text-sm font-medium text-green-600">
                      +{((article.actual_sale_price || 0) - article.purchase_price).toFixed(2)}€
                    </p>
                  </div>
                </div>
              ))}
          </div>
          
          {soldArticles.length === 0 && (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucune vente pour le moment</p>
            </div>
          )}
        </div>
      </div>

      {/* Conseils basés sur les données */}
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-900 mb-2">📊 Insights automatiques</h4>
        <ul className="text-sm text-yellow-800 space-y-1">
          {conversionRate < 50 && (
            <li>• Votre taux de conversion est de {conversionRate}%. Essayez d'optimiser vos prix de vente.</li>
          )}
          {averageMargin < 0 && (
            <li>• Marge moyenne négative. Revoyez votre stratégie d'achat ou vos prix de vente.</li>
          )}
          {lostArticles.length > 0 && (
            <li>• {lostArticles.length} articles marqués comme perte. Analysez les causes.</li>
          )}
          {Object.keys(platformStats).length > 0 && (
            <li>• Votre plateforme la plus utilisée : {Object.keys(platformStats).reduce((a, b) => platformStats[a] > platformStats[b] ? a : b)}</li>
          )}
        </ul>
      </div>
    </div>
  );
};

