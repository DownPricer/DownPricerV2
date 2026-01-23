import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, TrendingUp, CheckCircle, DollarSign, AlertCircle, Plus } from 'lucide-react';
import api from '../../utils/api';
import { getUser } from '../../utils/auth';

export const ProDashboard = () => {
  const [data, setData] = useState({
    articles: [],
    stats: {},
    alerts: []
  });
  const [loading, setLoading] = useState(true);
  const user = getUser();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Récupérer les articles sans photos (optimisé)
      const articlesResponse = await api.get('/pro/articles-light');
      const articles = articlesResponse.data;

      // Récupérer les stats
      const statsResponse = await api.get('/pro/dashboard/stats');
      const stats = statsResponse.data;

      // Récupérer les alertes
      const alertsResponse = await api.get('/pro/dashboard/alerts');
      const alerts = alertsResponse.data;

      setData({
        articles: articles.slice(0, 5), // Seulement les 5 premiers
        stats,
        alerts
      });
    } catch (error) {
      console.error('Erreur:', error);
      if (error.response?.status === 403) {
        // Rediriger si pas S-tier
        window.location.href = '/';
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Achat / Revente</h1>
        <p className="mt-2 text-gray-600">Gérez vos achats et ventes</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <Package className="h-6 w-6 text-indigo-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Articles</p>
              <p className="text-xl font-bold text-indigo-600">{data.stats.total_articles || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <TrendingUp className="h-6 w-6 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">À vendre</p>
              <p className="text-xl font-bold text-blue-600">{data.stats.articles_for_sale || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Vendus</p>
              <p className="text-xl font-bold text-green-600">{data.stats.articles_sold || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <DollarSign className="h-6 w-6 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Marge</p>
              <p className={`text-xl font-bold ${(data.stats.current_margin || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(data.stats.current_margin || 0).toFixed(2)}€
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Alertes */}
      {data.alerts && data.alerts.length > 0 && (
        <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <h3 className="text-lg font-medium text-red-800">Alertes retour</h3>
          </div>
          <div className="space-y-2">
            {data.alerts.map(article => (
              <div key={article.id} className="flex justify-between items-center text-red-700 bg-red-100 p-3 rounded">
                <span className="font-medium">{article.name}</span>
                <span className="text-sm">
                  {new Date(article.return_deadline).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Articles récents */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Articles récents</h3>
          <Link
            to="/pro/articles/new"
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-orange-500 hover:bg-orange-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Link>
        </div>
        <div className="p-6">
          {data.articles && data.articles.length > 0 ? (
            <div className="space-y-3">
              {data.articles.map(article => (
                <div key={article.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                      <Package className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{article.name}</p>
                      <p className="text-sm text-gray-500">{article.purchase_platform} • {article.purchase_price}€</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      article.status === 'Vendu' ? 'bg-green-100 text-green-800' :
                      article.status === 'À vendre' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {article.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Aucun article</p>
              <Link
                to="/pro/articles/new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-500 hover:bg-orange-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter votre premier article
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

