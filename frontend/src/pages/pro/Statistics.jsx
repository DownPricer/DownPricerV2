import React, { useState, useEffect } from 'react';
import { BarChart3, CheckCircle, TrendingUp, DollarSign, Loader2, AlertCircle, PieChart, Calendar, ArrowUpRight } from 'lucide-react';
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
      if (error.response?.status === 403) window.location.href = '/';
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black p-4 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
        <p className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Compilation des data...</p>
      </div>
    );
  }

  // --- LOGIQUE DE CALCUL (Conservée à l'identique) ---
  const soldArticles = data.articles.filter(a => a.status === 'Vendu');
  const lostArticles = data.articles.filter(a => a.status === 'Perte');
  const conversionRate = data.articles.length > 0 ? 
    Math.round((soldArticles.length / data.articles.length) * 100) : 0;
  const totalRevenue = soldArticles.reduce((sum, a) => sum + (a.actual_sale_price || 0), 0);
  const totalInvestment = data.articles.reduce((sum, a) => sum + a.purchase_price, 0);
  const totalMargin = totalRevenue - soldArticles.reduce((sum, a) => sum + a.purchase_price, 0);
  const averageMargin = soldArticles.length > 0 ? totalMargin / soldArticles.length : 0;

  const platformStats = data.articles.reduce((acc, article) => {
    acc[article.purchase_platform] = (acc[article.purchase_platform] || 0) + 1;
    return acc;
  }, {});

  const monthlyStats = soldArticles.reduce((acc, article) => {
    const month = new Date(article.updated_at).toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'long' 
    });
    if (!acc[month]) acc[month] = { sales: 0, revenue: 0, margin: 0 };
    acc[month].sales += 1;
    acc[month].revenue += article.actual_sale_price || 0;
    acc[month].margin += (article.actual_sale_price || 0) - article.purchase_price;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-black text-white selection:bg-orange-500/30 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        
        {/* Header : Tailles adaptatives */}
        <div className="mb-8 md:mb-12">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tighter uppercase italic leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Reporting <span className="text-orange-500">Performance</span>
          </h1>
          <p className="mt-2 text-zinc-500 text-[10px] sm:text-sm font-medium uppercase tracking-wider italic">Analyse approfondie de votre cycle d'achat-revente</p>
        </div>

        {/* Top KPIs : Grille 1 col mobile, 2 col tablette, 4 col desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-10">
          <KPICard icon={<BarChart3 size={18}/>} label="Total Articles" value={data.articles.length} color="white" />
          <KPICard icon={<CheckCircle size={18}/>} label="Vendus" value={soldArticles.length} color="green" />
          <KPICard icon={<TrendingUp size={18}/>} label="Taux de Vente" value={`${conversionRate}%`} color="orange" />
          <KPICard icon={<DollarSign size={18}/>} label="Revenue Total" value={`${totalRevenue.toFixed(0)}€`} color="white" />
        </div>

        {/* Second Row: Detailed Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 sm:mb-12">
          
          {/* Performance Box */}
          <div className="bg-[#080808] border border-white/5 rounded-2xl md:rounded-[2rem] p-6 sm:p-8">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-6 sm:mb-8 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Métriques de Profit
            </h3>
            <div className="space-y-5 sm:space-y-6">
              <StatRow label="Marge Totale" value={`${totalMargin.toFixed(2)}€`} color={totalMargin >= 0 ? 'text-green-500' : 'text-red-500'} />
              <StatRow label="Marge Moyenne" value={`${averageMargin.toFixed(2)}€`} color={averageMargin >= 0 ? 'text-green-500' : 'text-red-500'} />
              <StatRow label="Investissement" value={`${totalInvestment.toFixed(2)}€`} color="text-white" />
              <StatRow label="Pertes (Litiges)" value={lostArticles.length} color="text-red-500" />
            </div>
          </div>

          {/* Platform Distribution */}
          <div className="bg-[#080808] border border-white/5 rounded-2xl md:rounded-[2rem] p-6 sm:p-8">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-6 sm:mb-8 flex items-center gap-2">
              <PieChart className="h-4 w-4" /> Sourcing Platforms
            </h3>
            <div className="space-y-5">
              {Object.entries(platformStats).map(([platform, count]) => (
                <div key={platform} className="group">
                  <div className="flex justify-between text-[10px] sm:text-[11px] font-bold mb-2">
                    <span className="text-zinc-400 group-hover:text-white transition-colors truncate pr-2">{platform}</span>
                    <span className="text-white shrink-0">{count} items</span>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500" style={{ width: `${(count / data.articles.length) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Breakdown */}
          <div className="bg-[#080808] border border-white/5 rounded-2xl md:rounded-[2rem] p-6 sm:p-8">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-6 sm:mb-8 flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Historique Mensuel
            </h3>
            <div className="space-y-3 max-h-[220px] overflow-y-auto no-scrollbar pr-1">
              {Object.entries(monthlyStats).slice(0, 5).map(([month, stats]) => (
                <div key={month} className="flex justify-between items-center p-3 rounded-xl bg-white/[0.02] border border-white/5 gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-tighter text-white truncate">{month}</p>
                    <p className="text-[8px] sm:text-[9px] text-zinc-500 font-bold uppercase">{stats.sales} ventes</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-black text-green-500">{stats.revenue.toFixed(0)}€</p>
                    <p className={`text-[8px] sm:text-[9px] font-bold ${stats.margin >= 0 ? 'text-green-500/50' : 'text-red-500/50'}`}>
                      {stats.margin >= 0 ? '+' : ''}{stats.margin.toFixed(0)}€
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Profitable Articles : List-style on mobile */}
        <div className="bg-[#080808] border border-white/5 rounded-2xl md:rounded-[2rem] overflow-hidden mb-8 sm:mb-12">
          <div className="px-6 sm:px-8 py-5 sm:py-6 border-b border-white/5 bg-white/[0.01]">
            <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-zinc-400 italic">Top 5 - Rentabilité Maximale</h3>
          </div>
          <div className="divide-y divide-white/[0.03]">
            {soldArticles
              .sort((a, b) => ((b.actual_sale_price || 0) - b.purchase_price) - ((a.actual_sale_price || 0) - a.purchase_price))
              .slice(0, 5)
              .map((article, index) => (
                <div key={article.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 sm:p-6 hover:bg-white/[0.01] transition-colors group gap-4">
                  <div className="flex items-center gap-4 sm:gap-5 min-w-0">
                    <span className="text-base sm:text-lg font-black text-white/10 group-hover:text-orange-500 transition-colors italic shrink-0">0{index + 1}</span>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight truncate">{article.name}</h4>
                      <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-zinc-600 truncate">{article.purchase_platform}</p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-center">
                    <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-zinc-400">
                      <span>{article.purchase_price}€</span>
                      <ArrowUpRight size={10} className="text-zinc-700" />
                      <span className="text-white">{article.actual_sale_price}€</span>
                    </div>
                    <p className="text-sm font-black text-green-500 sm:mt-1">
                      + {((article.actual_sale_price || 0) - article.purchase_price).toFixed(2)}€
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Automatic Insights Diagnostic */}
        <div className="bg-orange-500/5 border border-orange-500/10 rounded-2xl md:rounded-[2rem] p-6 sm:p-8">
          <h4 className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-orange-500 mb-5 sm:mb-6 flex items-center gap-2">
            <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" /> Diagnostic Système
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <InsightItem condition={conversionRate < 50} text={`Taux de conversion faible (${conversionRate}%). Optimisez vos descriptions.`} />
            <InsightItem condition={averageMargin < 10} text={`Alerte Marge : Rentabilité moyenne sous le seuil critique.`} />
            <InsightItem condition={lostArticles.length > 0} text={`${lostArticles.length} litiges détectés. Vérifiez vos transporteurs.`} />
            <InsightItem condition={true} text={`Sourcing dominant identifié sur ${Object.keys(platformStats).reduce((a, b) => platformStats[a] > platformStats[b] ? a : b) || 'N/A'}.`} />
          </div>
        </div>

      </div>
    </div>
  );
};

// --- COMPOSANTS INTERNES OPTIMISÉS ---

const KPICard = ({ icon, label, value, color }) => (
  <div className="bg-[#080808] border border-white/5 p-5 sm:p-6 rounded-[1.25rem] sm:rounded-[1.5rem] hover:border-white/10 transition-all">
    <div className={`h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center mb-3 sm:mb-4 border ${
      color === 'green' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
      color === 'orange' ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' :
      color === 'purple' ? 'bg-purple-500/10 border-purple-500/20 text-purple-500' :
      'bg-white/5 border-white/10 text-white'
    }`}>
      {React.cloneElement(icon, { size: 16 })}
    </div>
    <p className="text-[9px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-xl sm:text-2xl font-black text-white leading-none tracking-tighter">{value}</p>
  </div>
);

const StatRow = ({ label, value, color }) => (
  <div className="flex justify-between items-center py-2 border-b border-white/[0.02] gap-4">
    <span className="text-[10px] sm:text-[11px] font-bold text-zinc-500 uppercase tracking-tight truncate">{label}</span>
    <span className={`text-xs sm:text-sm font-black shrink-0 ${color}`}>{value}</span>
  </div>
);

const InsightItem = ({ condition, text }) => condition ? (
  <div className="flex items-start gap-3 p-3 sm:p-4 rounded-xl bg-black/40 border border-white/5 animate-in slide-in-from-bottom-2 duration-300">
    <div className="h-1.5 w-1.5 rounded-full bg-orange-500 mt-1.5 shrink-0 shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
    <p className="text-[10px] sm:text-[11px] font-bold text-zinc-300 uppercase leading-relaxed">{text}</p>
  </div>
) : null;