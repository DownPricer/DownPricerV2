import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, TrendingUp, CheckCircle, DollarSign, AlertCircle, Plus, Loader, ArrowUpRight } from 'lucide-react';
import api from '../../utils/api';

export const ProDashboard = () => {
  const [data, setData] = useState({
    articles: [],
    stats: {},
    alerts: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await api.get('/pro/articles-light');
      const articles = response.data;

      const stats = {
        total_articles: articles.length,
        articles_for_sale: articles.filter(a => a.status === 'À vendre').length,
        articles_sold: articles.filter(a => a.status === 'Vendu').length,
        current_margin: articles.reduce((sum, a) => {
          if (a.status === 'Vendu' && a.actual_sale_price) {
            return sum + (a.actual_sale_price - a.purchase_price);
          }
          return sum;
        }, 0)
      };

      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      const alerts = articles.filter(a => 
        a.return_deadline && 
        new Date(a.return_deadline) <= threeDaysFromNow &&
        a.status !== 'Vendu'
      );

      setData({
        articles: articles.slice(0, 5),
        stats,
        alerts
      });
    } catch (error) {
      console.error('Erreur:', error);
      if (error.response?.status === 403) window.location.href = '/';
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black">
        <Loader className="h-10 w-10 animate-spin text-orange-500" />
        <p className="mt-4 text-zinc-500 text-xs font-bold uppercase tracking-widest">Chargement du dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-orange-500/30 pb-12">
      <div className="max-w-7xl mx-auto px-6 py-10">
        
        {/* Header Dashboard */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black tracking-tighter" style={{ fontFamily: 'Outfit, sans-serif' }}>
              PRO <span className="text-orange-500">DASHBOARD</span>
            </h1>
            <p className="text-zinc-500 text-sm mt-2">Suivez vos performances d'achat-revente en temps réel.</p>
          </div>
          <Link
            to="/pro/articles/new"
            className="inline-flex items-center px-6 py-3 bg-white hover:bg-zinc-200 text-black text-xs font-black uppercase tracking-widest rounded-full transition-all active:scale-95 shadow-lg shadow-white/5"
          >
            <Plus className="h-4 w-4 mr-2 stroke-[3px]" />
            Ajouter un article
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatCard icon={<Package size={20}/>} label="Total Stock" value={data.stats.total_articles} color="orange" />
          <StatCard icon={<TrendingUp size={20}/>} label="En Vente" value={data.stats.articles_for_sale} color="white" />
          <StatCard icon={<CheckCircle size={20}/>} label="Vendus" value={data.stats.articles_sold} color="white" />
          <StatCard 
            icon={<DollarSign size={20}/>} 
            label="Marge Nette" 
            value={`${(data.stats.current_margin || 0).toFixed(0)}€`} 
            color={(data.stats.current_margin || 0) >= 0 ? 'green' : 'red'} 
          />
        </div>

        {/* Alerts Section */}
        {data.alerts && data.alerts.length > 0 && (
          <div className="mb-10 animate-in fade-in slide-in-from-top-2">
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <h3 className="text-sm font-black uppercase tracking-widest text-red-500 text-white">Alertes de retour imminentes</h3>
              </div>
              <div className="grid gap-2">
                {data.alerts.map(article => (
                  <div key={article.id} className="flex justify-between items-center bg-black/40 border border-red-500/10 p-4 rounded-xl">
                    <span className="text-sm font-bold text-zinc-200">{article.name}</span>
                    <span className="text-[10px] font-black bg-red-500/20 text-red-500 px-3 py-1 rounded-full uppercase">
                      Expire le {new Date(article.return_deadline).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recent Articles Table */}
        <div className="bg-[#080808] border border-white/5 rounded-[2rem] overflow-hidden">
          <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Dernières Activités</h3>
            <Link to="/pro/articles" className="text-[10px] font-bold text-orange-500 hover:underline uppercase tracking-widest flex items-center gap-1">
              Voir tout <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="p-4">
            {data.articles && data.articles.length > 0 ? (
              <div className="space-y-2">
                {data.articles.map(article => (
                  <div key={article.id} className="flex items-center justify-between p-4 bg-white/[0.02] hover:bg-white/[0.04] border border-transparent hover:border-white/5 rounded-2xl transition-all group">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-xl bg-black border border-white/10 flex items-center justify-center mr-4 group-hover:border-orange-500/50 transition-colors">
                        <Package className="h-5 w-5 text-zinc-500 group-hover:text-orange-500" />
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">{article.name}</p>
                        <p className="text-[10px] text-zinc-500 uppercase font-medium tracking-wider">
                          {article.purchase_platform} • <span className="text-zinc-300">{article.purchase_price}€</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-tighter ${
                        article.status === 'Vendu' ? 'bg-green-500/10 text-green-500' :
                        article.status === 'À vendre' ? 'bg-orange-500/10 text-orange-500' :
                        'bg-zinc-800 text-zinc-400'
                      }`}>
                        {article.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="h-16 w-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                  <Package className="h-8 w-8 text-zinc-700" />
                </div>
                <p className="text-zinc-500 text-sm font-medium">Aucun article en inventaire</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant Statistique pour le look "Grid"
const StatCard = ({ icon, label, value, color }) => {
  const colors = {
    orange: "text-orange-500 bg-orange-500/10 border-orange-500/20",
    white: "text-white bg-white/5 border-white/10",
    green: "text-green-500 bg-green-500/10 border-green-500/20",
    red: "text-red-500 bg-red-500/10 border-red-500/20",
  };

  return (
    <div className="bg-[#080808] border border-white/5 p-6 rounded-[1.5rem] hover:border-white/10 transition-all">
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-4 border ${colors[color]}`}>
        {icon}
      </div>
      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.15em] mb-1">{label}</p>
      <p className="text-2xl font-black text-white">{value}</p>
    </div>
  );
};