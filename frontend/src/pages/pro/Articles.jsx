import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Search, Plus, Trash2 } from 'lucide-react';
import api from '../../utils/api';

export const ProArticles = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const response = await api.get('/pro/articles-light');
      setArticles(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      if (error.response?.status === 403) {
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (articleId) => {
    if (window.confirm('Supprimer cet article ?')) {
      try {
        await api.delete(`/pro/articles/${articleId}`);
        setArticles(prev => prev.filter(article => article.id !== articleId));
      } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  const filteredArticles = articles.filter(article =>
    article.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mes articles</h1>
          <p className="mt-2 text-gray-600">Gérez votre inventaire</p>
        </div>
        <Link
          to="/pro/articles/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-500 hover:bg-orange-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un article
        </Link>
      </div>

      {/* Recherche */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
          />
        </div>
      </div>

      {/* Liste des articles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredArticles.map(article => (
          <div key={article.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                  <Package className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{article.name}</h3>
                  <p className="text-sm text-gray-500">{article.purchase_platform}</p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(article.id)}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Prix d'achat</span>
                <span className="font-medium">{article.purchase_price}€</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Prix estimé</span>
                <span className="font-medium">{article.estimated_sale_price}€</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-gray-600">Statut</span>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  article.status === 'Vendu' ? 'bg-green-100 text-green-800' :
                  article.status === 'À vendre' ? 'bg-blue-100 text-blue-800' :
                  article.status === 'Perte' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {article.status}
                </span>
              </div>
            </div>
          </div>
        ))}
        
        {filteredArticles.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Aucun article trouvé</p>
            <Link
              to="/pro/articles/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-500 hover:bg-orange-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un article
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};


