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
      <div className="flex flex-col items-center justify-center h-screen bg-black px-4 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
        <p className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Chargement de l'inventaire...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-orange-500/30 pb-20">
      {/* Container : Padding ajusté pour mobile (px-4) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        
        {/* Header : Stack vertical sur mobile */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 sm:mb-12">
          <div>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tighter uppercase italic leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Mon <span className="text-orange-500">Inventaire</span>
            </h1>
            <p className="mt-2 text-zinc-500 text-[10px] sm:text-sm font-medium uppercase tracking-wider">Gérez vos stocks et suivez vos marges</p>
          </div>
          
          <Link
            to="/pro/articles/new"
            className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-4 sm:py-3 bg-white hover:bg-zinc-200 text-black text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-full transition-all active:scale-95 shadow-lg shadow-white/5"
          >
            <Plus className="h-4 w-4 mr-2 stroke-[3px]" />
            Nouveau Produit
          </Link>
        </div>

        {/* Barre de Recherche : Pleine largeur et tactile */}
        <div className="mb-8 sm:mb-10 flex gap-3 sm:gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 group-focus-within:text-orange-500 transition-colors" />
            <input
              type="text"
              placeholder="Référence, plateforme..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-[#080808] border border-white/5 rounded-2xl text-xs sm:text-sm focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/10 transition-all placeholder:text-zinc-700"
            />
          </div>
          <button className="flex items-center justify-center px-4 sm:px-6 bg-[#080808] border border-white/5 rounded-2xl text-zinc-500 hover:text-white transition-colors active:bg-white/5">
            <Filter size={18} />
          </button>
        </div>

        {/* Grille d'Articles : Espacement gap-4 sur mobile */}
        {filteredArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredArticles.map(article => (
              <div 
                key={article.id} 
                className="bg-[#080808] border border-white/5 rounded-[1.5rem] p-5 sm:p-6 hover:border-white/10 transition-all group relative overflow-hidden"
              >
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 blur-2xl rounded-full -mr-10 -mt-10" />

                <div className="flex items-start justify-between mb-6 relative z-10">
                  <div className="flex items-center min-w-0">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 shrink-0 rounded-xl bg-black border border-white/10 flex items-center justify-center mr-3 sm:mr-4 group-hover:border-orange-500/50 transition-colors">
                      <Package className="h-5 w-5 sm:h-6 sm:w-6 text-zinc-600 group-hover:text-orange-500 transition-colors" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm sm:text-base text-white tracking-tight truncate pr-2">{article.name}</h3>
                      <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-zinc-500 truncate">{article.purchase_platform}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(article.id)}
                    className="p-2 shrink-0 text-zinc-700 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="space-y-3 mb-6 relative z-10">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-zinc-600">Investissement</span>
                    <span className="text-xs sm:text-sm font-medium">{article.purchase_price}€</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-zinc-600">Prix Estimé</span>
                    <span className="text-xs sm:text-sm font-black text-orange-500">{article.estimated_sale_price}€</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-white/[0.03] relative z-10">
                  <span className={`text-[8px] sm:text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-tighter ${
                    article.status === 'Vendu' ? 'bg-green-500/10 text-green-500' :
                    article.status === 'À vendre' ? 'bg-orange-500/10 text-orange-500' :
                    'bg-white/5 text-zinc-500'
                  }`}>
                    {article.status}
                  </span>
                  
                  <Link 
                    to={`/pro/articles/${article.id}`}
                    className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white flex items-center gap-1 transition-colors py-2 px-1"
                  >
                    Détails <ArrowUpRight size={12} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State : Adaptation mobile des arrondis et paddings */
          <div className="flex flex-col items-center justify-center py-16 sm:py-24 bg-[#080808] border border-white/5 rounded-2xl sm:rounded-[3rem] px-6 text-center">
            <div className="h-16 w-16 sm:h-20 sm:w-20 bg-black border border-white/5 rounded-full flex items-center justify-center mb-6">
              <Package className="h-8 w-8 sm:h-10 sm:w-10 text-zinc-800" />
            </div>
            <p className="text-zinc-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-6 max-w-[200px] sm:max-w-none">Aucun article dans l'inventaire</p>
            <Link
              to="/pro/articles/new"
              className="w-full sm:w-auto px-8 py-4 sm:py-3 bg-white text-black text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] rounded-full hover:bg-zinc-200 transition-all"
            >
              Ajouter votre premier stock
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};