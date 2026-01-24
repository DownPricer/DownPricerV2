import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Search, Plus, Trash2, Loader2, ArrowUpRight, Filter } from 'lucide-react';
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
      if (error.response?.status === 403) navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (articleId) => {
    if (window.confirm('Supprimer cet article définitivement ?')) {
      try {
        await api.delete(`/pro/articles/${articleId}`);
        setArticles(prev => prev.filter(article => article.id !== articleId));
      } catch (error) {
        console.error('Erreur:', error);
      }
    }
  };

  const filteredArticles = articles.filter(article =>
    article.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black">
        <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
        <p className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Chargement de l'inventaire...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-orange-500/30 pb-20">
      <div className="max-w-7xl mx-auto px-6 py-10">
        
        {/* Header avec Titre et Action */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Mon <span className="text-orange-500">Inventaire</span>
            </h1>
            <p className="mt-2 text-zinc-500 text-sm font-medium uppercase tracking-wider">Gérez vos stocks et suivez vos marges</p>
          </div>
          
          <Link
            to="/pro/articles/new"
            className="inline-flex items-center px-6 py-3 bg-white hover:bg-zinc-200 text-black text-xs font-black uppercase tracking-widest rounded-full transition-all active:scale-95"
          >
            <Plus className="h-4 w-4 mr-2 stroke-[3px]" />
            Nouveau Produit
          </Link>
        </div>

        {/* Barre de Recherche OLED */}
        <div className="mb-10 flex gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 group-focus-within:text-orange-500 transition-colors" />
            <input
              type="text"
              placeholder="Rechercher une référence, une plateforme..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-[#080808] border border-white/5 rounded-2xl text-sm focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/10 transition-all"
            />
          </div>
          <button className="hidden sm:flex items-center justify-center px-6 bg-[#080808] border border-white/5 rounded-2xl text-zinc-500 hover:text-white transition-colors">
            <Filter size={18} />
          </button>
        </div>

        {/* Grille d'Articles */}
        {filteredArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map(article => (
              <div 
                key={article.id} 
                className="bg-[#080808] border border-white/5 rounded-[1.5rem] p-6 hover:border-white/10 transition-all group relative overflow-hidden"
              >
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 blur-2xl rounded-full -mr-10 -mt-10" />

                <div className="flex items-start justify-between mb-6 relative z-10">
                  <div className="flex items-center">
                    <div className="h-12 w-12 rounded-xl bg-black border border-white/10 flex items-center justify-center mr-4 group-hover:border-orange-500/50 transition-colors">
                      <Package className="h-6 w-6 text-zinc-600 group-hover:text-orange-500 transition-colors" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white tracking-tight line-clamp-1">{article.name}</h3>
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{article.purchase_platform}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(article.id)}
                    className="p-2 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="space-y-3 mb-6 relative z-10">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Investissement</span>
                    <span className="text-sm font-medium">{article.purchase_price}€</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Prix Estimé</span>
                    <span className="text-sm font-black text-orange-500">{article.estimated_sale_price}€</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-white/[0.03] relative z-10">
                  <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${
                    article.status === 'Vendu' ? 'bg-green-500/10 text-green-500' :
                    article.status === 'À vendre' ? 'bg-orange-500/10 text-orange-500' :
                    'bg-white/5 text-zinc-500'
                  }`}>
                    {article.status}
                  </span>
                  
                  <Link 
                    to={`/pro/articles/${article.id}`}
                    className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    Détails <ArrowUpRight size={12} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State OLED */
          <div className="flex flex-col items-center justify-center py-24 bg-[#080808] border border-white/5 rounded-[3rem]">
            <div className="h-20 w-20 bg-black border border-white/5 rounded-full flex items-center justify-center mb-6">
              <Package className="h-10 w-10 text-zinc-800" />
            </div>
            <p className="text-zinc-500 font-bold uppercase tracking-widest mb-6">Aucun article dans l'inventaire</p>
            <Link
              to="/pro/articles/new"
              className="px-8 py-3 bg-white text-black text-xs font-black uppercase tracking-[0.2em] rounded-full hover:bg-zinc-200 transition-all"
            >
              Ajouter votre premier stock
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};