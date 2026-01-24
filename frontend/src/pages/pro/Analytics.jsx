import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, BarChart3, CheckCircle, AlertCircle, Package, Loader } from 'lucide-react';
import api from '../../utils/api';

// Note: Chart.js n'est pas installé dans Downpricer
// Pour activer les graphiques, installer: npm install chart.js react-chartjs-2
// Puis décommenter les imports et composants ci-dessous

// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   Title,
//   Tooltip,
//   Legend,
//   BarElement,
// } from 'chart.js';
// import { Line, Bar } from 'react-chartjs-2';

// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   Title,
//   Tooltip,
//   Legend,
//   BarElement
// );

export const ProAnalytics = () => {
  const [data, setData] = useState({
    articles: [],
    transactions: []
  });
  const [loading, setLoading] = useState(true);
  const [interval, setInterval] = useState(7); // Intervalle en jours (1, 7, 14, 21)

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

  // Calculer les données de ventes par date
  const soldArticles = data.articles.filter(a => a.status === 'Vendu');
  
  // Grouper les ventes par date selon l'intervalle
  const getSalesData = () => {
    const salesByDate = {};
    const now = new Date();
    const daysToShow = interval * 10; // Afficher 10 périodes
    
    // Initialiser toutes les dates avec 0
    for (let i = daysToShow; i >= 0; i -= interval) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateKey = interval === 1 
        ? date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
        : `S${Math.floor(i/interval) + 1}`;
      salesByDate[dateKey] = 0;
    }

    // Compter les ventes réelles
    soldArticles.forEach(article => {
      const saleDate = new Date(article.updated_at);
      const daysDiff = Math.floor((now - saleDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= daysToShow) {
        const periodIndex = Math.floor(daysDiff / interval);
        const periodKey = interval === 1 
          ? saleDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
          : `S${Math.floor((daysToShow - daysDiff)/interval) + 1}`;
        
        if (salesByDate.hasOwnProperty(periodKey)) {
          salesByDate[periodKey]++;
        }
      }
    });

    return salesByDate;
  };

  const salesData = getSalesData();
  const labels = Object.keys(salesData).reverse();
  const values = Object.values(salesData).reverse();

  // Données pour le graphique des marges
  const marginData = soldArticles.map(article => ({
    name: article.name.length > 15 ? article.name.substring(0, 15) + '...' : article.name,
    margin: (article.actual_sale_price || 0) - article.purchase_price
  })).sort((a, b) => b.margin - a.margin).slice(0, 10);

  // Calculs des stats avancées
  const totalRevenue = soldArticles.reduce((sum, a) => sum + (a.actual_sale_price || 0), 0);
  const totalInvestment = soldArticles.reduce((sum, a) => sum + a.purchase_price, 0);
  const totalMargin = totalRevenue - totalInvestment;
  const conversionRate = data.articles.length > 0 ? (soldArticles.length / data.articles.length * 100) : 0;
  const avgMargin = soldArticles.length > 0 ? totalMargin / soldArticles.length : 0;
  const avgDaysToSell = soldArticles.length > 0 ? 
    soldArticles.reduce((sum, a) => {
      const purchaseDate = new Date(a.purchase_date);
      const saleDate = new Date(a.updated_at);
      return sum + Math.floor((saleDate - purchaseDate) / (1000 * 60 * 60 * 24));
    }, 0) / soldArticles.length : 0;

  // Répartition par plateforme de vente
  const salePlatformStats = soldArticles.reduce((acc, article) => {
    const platform = article.sale_platform || 'Non spécifié';
    acc[platform] = (acc[platform] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics Avancées</h1>
        <p className="mt-2 text-gray-600">Graphiques et analyses détaillées de votre activité</p>
      </div>

      {/* Contrôles d'intervalle */}
      <div className="mb-8 bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Paramètres d'analyse</h3>
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">Intervalle:</span>
          {[1, 7, 14, 21].map(days => (
            <button
              key={days}
              onClick={() => setInterval(days)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                interval === days
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {days === 1 ? '1 jour' : `${days} jours`}
            </button>
          ))}
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <TrendingUp className="h-6 w-6 text-green-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Taux de conversion</p>
              <p className="text-xl font-bold text-green-600">{conversionRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <DollarSign className="h-6 w-6 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Marge moyenne</p>
              <p className={`text-xl font-bold ${avgMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {avgMargin.toFixed(2)}€
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Jours moy. vente</p>
              <p className="text-xl font-bold text-blue-600">{avgDaysToSell.toFixed(0)} j</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <CheckCircle className="h-6 w-6 text-indigo-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Articles vendus</p>
              <p className="text-xl font-bold text-indigo-600">{soldArticles.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Graphiques - Placeholder si Chart.js n'est pas installé */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Évolution des ventes</h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>Graphiques disponibles après installation de Chart.js</p>
              <p className="text-sm mt-2">npm install chart.js react-chartjs-2</p>
            </div>
          </div>
          {/* Décommenter quand Chart.js est installé:
          <Line data={salesChartData} options={salesChartOptions} />
          */}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top 10 - Marges par article</h3>
          <div className="space-y-2">
            {marginData.slice(0, 10).map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{item.name}</span>
                <span className={`text-sm font-medium ${item.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {item.margin >= 0 ? '+' : ''}{item.margin.toFixed(2)}€
                </span>
              </div>
            ))}
          </div>
          {/* Décommenter quand Chart.js est installé:
          <Bar data={marginChartData} options={marginChartOptions} />
          */}
        </div>
      </div>

      {/* Analyses textuelles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Répartition par plateforme de vente */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Plateformes de vente préférées</h3>
          <div className="space-y-3">
            {Object.entries(salePlatformStats).map(([platform, count]) => (
              <div key={platform} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{platform}</span>
                <div className="flex items-center space-x-3">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-indigo-600 h-2 rounded-full" 
                      style={{ width: `${(count / soldArticles.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-8">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Insights automatiques */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">🎯 Insights automatiques</h3>
          <div className="space-y-3 text-sm">
            {conversionRate > 70 && (
              <div className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 mr-2" />
                <span className="text-green-800">Excellent taux de conversion ({conversionRate.toFixed(1)}%) !</span>
              </div>
            )}
            
            {avgMargin > 10 && (
              <div className="flex items-start">
                <TrendingUp className="h-4 w-4 text-green-600 mt-0.5 mr-2" />
                <span className="text-green-800">Marge moyenne très profitable ({avgMargin.toFixed(2)}€)</span>
              </div>
            )}
            
            {avgDaysToSell < 14 && soldArticles.length > 0 && (
              <div className="flex items-start">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 mr-2" />
                <span className="text-blue-800">Ventes rapides : {avgDaysToSell.toFixed(0)} jours en moyenne</span>
              </div>
            )}

            {Object.keys(salePlatformStats).length > 0 && (
              <div className="flex items-start">
                <BarChart3 className="h-4 w-4 text-purple-600 mt-0.5 mr-2" />
                <span className="text-purple-800">
                  Plateforme star : {Object.keys(salePlatformStats).reduce((a, b) => salePlatformStats[a] > salePlatformStats[b] ? a : b)}
                </span>
              </div>
            )}

            {soldArticles.length === 0 && (
              <div className="flex items-start">
                <Package className="h-4 w-4 text-gray-500 mt-0.5 mr-2" />
                <span className="text-gray-600">Commencez par vendre quelques articles pour voir vos analytics !</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


