import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, BarChart3, CheckCircle, AlertCircle, Package, Loader2, Calendar, Target, Zap } from 'lucide-react';
import api from '../../utils/api';

export const ProAnalytics = () => {
  const [data, setData] = useState({
    articles: [],
    transactions: []
  });
  const [loading, setLoading] = useState(true);
  const [interval, setInterval] = useState(7);

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
        <Loader2 className="h-10 w-10 animate-spin text-orange-500 mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Calcul des données...</p>
      </div>
    );
  }

  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(now.getDate() - interval);

  const inRange = (dateValue) => {
    if (!dateValue) return false;
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) return false;
    return parsed >= cutoff;
  };

  const articlesInRange = data.articles.filter((article) =>
    inRange(article.updated_at || article.purchase_date || article.created_at)
  );
  const transactionsInRange = data.transactions.filter((tx) =>
    inRange(tx.updated_at || tx.created_at)
  );

  // --- LOGIQUE DE CALCUL (Période sélectionnée) ---
  const soldArticles = articlesInRange.filter(a => a.status === 'Vendu');
  const totalRevenue = soldArticles.reduce((sum, a) => sum + (a.actual_sale_price || 0), 0);
  const totalInvestment = soldArticles.reduce((sum, a) => sum + (a.purchase_price || 0), 0);
  const totalMargin = totalRevenue - totalInvestment;
  const conversionRate = articlesInRange.length > 0 ? (soldArticles.length / articlesInRange.length * 100) : 0;
  const avgMargin = soldArticles.length > 0 ? totalMargin / soldArticles.length : 0;
  const avgDaysToSell = soldArticles.length > 0
    ? soldArticles.reduce((sum, a) => {
        const pDate = a.purchase_date ? new Date(a.purchase_date) : null;
        const sDate = a.updated_at ? new Date(a.updated_at) : null;
        if (!pDate || !sDate || Number.isNaN(pDate.getTime()) || Number.isNaN(sDate.getTime())) {
          return sum;
        }
        return sum + Math.max(0, Math.floor((sDate - pDate) / (1000 * 60 * 60 * 24)));
      }, 0) / soldArticles.length
    : 0;

  const marginData = soldArticles.map(article => ({
    name: article.name || 'Article',
    margin: (article.actual_sale_price || 0) - (article.purchase_price || 0)
  })).sort((a, b) => b.margin - a.margin).slice(0, 8);

  const salePlatformStats = soldArticles.reduce((acc, article) => {
    const platform = article.sale_platform || 'Non spécifié';
    acc[platform] = (acc[platform] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-black text-white selection:bg-orange-500/30 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        
        {/* Header Section : Responsive Gap & Alignment */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 md:mb-12">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter uppercase italic leading-none" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Advanced <span className="text-orange-500">Analytics</span>
            </h1>
            <p className="mt-2 text-zinc-500 text-[10px] sm:text-sm font-medium uppercase tracking-wider">Analyse de performance et rentabilité</p>
            <p className="mt-1 text-[10px] font-black uppercase tracking-[0.25em] text-zinc-700">
              Période : {interval === 1 ? '24H' : `${interval} jours`} • {soldArticles.length} ventes • {articlesInRange.length} articles • {transactionsInRange.length} transactions
            </p>
          </div>

          {/* Interval Selector : Full width on small mobile if needed */}
          <div className="bg-[#080808] border border-white/5 p-1 rounded-full flex overflow-x-auto no-scrollbar gap-1 w-fit">
            {[1, 7, 14, 21].map(days => (
              <button
                key={days}
                onClick={() => setInterval(days)}
                className={`px-3 sm:px-4 py-2 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  interval === days ? 'bg-orange-500 text-white' : 'text-zinc-500 hover:text-white'
                }`}
              >
                {days === 1 ? 'Daily' : `${days}D`}
              </button>
            ))}
          </div>
        </div>

        {/* Rapid Stats Grid : 1 col mobile, 2 col tablet, 4 col desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-10">
          <StatCard icon={<TrendingUp size={18}/>} label="Conversion" value={`${conversionRate.toFixed(1)}%`} color="green" />
          <StatCard icon={<DollarSign size={18}/>} label="Marge Moyenne" value={`${avgMargin.toFixed(0)}€`} color="orange" />
          <StatCard icon={<Calendar size={18}/>} label="Vitesse Vente" value={`${avgDaysToSell.toFixed(0)} j`} color="white" />
          <StatCard icon={<CheckCircle size={18}/>} label="Volumes" value={soldArticles.length} color="white" />
        </div>

        {/* Charts Section : Empilement vertical sur mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          
          {/* Sales Evolution Placeholder */}
          <div className="bg-[#080808] border border-white/5 rounded-2xl sm:rounded-[2rem] p-6 sm:p-8 min-h-[300px] flex flex-col">
            <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-zinc-500 mb-6 sm:mb-8">Évolution des ventes</h3>
            <div className="flex-1 flex flex-col items-center justify-center border border-white/[0.02] rounded-2xl bg-black/40 p-4">
              <BarChart3 className="h-8 w-8 text-zinc-800 mb-4 animate-pulse" />
              <p className="text-[9px] sm:text-[10px] font-bold text-zinc-600 uppercase tracking-widest text-center max-w-[250px] leading-relaxed">
                Visualisation temporelle bientôt disponible<br/>
                <span className="text-orange-500/40 italic">Integration Chart.js v4</span>
              </p>
            </div>
          </div>

          {/* Top Margins List */}
          <div className="bg-[#080808] border border-white/5 rounded-2xl sm:rounded-[2rem] p-6 sm:p-8">
            <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-zinc-500 mb-6 sm:mb-8">Top Marges par Article</h3>
            <div className="space-y-4">
              {marginData.length > 0 ? marginData.map((item, index) => (
                <div key={index} className="flex items-center justify-between group gap-3">
                  <span className="text-[10px] sm:text-xs font-bold text-zinc-400 group-hover:text-white transition-colors truncate flex-1 min-w-0">{item.name}</span>
                  <div className="flex items-center gap-3 sm:gap-4 flex-1">
                     <div className="h-1 bg-white/5 flex-1 rounded-full overflow-hidden hidden sm:block">
                        <div
                          className="h-full bg-orange-500"
                          style={{ width: `${marginData[0]?.margin ? (item.margin / marginData[0].margin) * 100 : 0}%` }}
                        />
                     </div>
                     <span className={`text-[10px] sm:text-xs font-black min-w-[45px] text-right shrink-0 ${item.margin >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      +{item.margin.toFixed(0)}€
                    </span>
                  </div>
                </div>
              )) : (
                <p className="text-center text-zinc-600 text-xs py-20 italic">Aucune donnée sur la période sélectionnée</p>
              )}
            </div>
          </div>
        </div>

        {/* Lower Grid: Platforms & Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          
          {/* Platforms */}
          <div className="bg-[#080808] border border-white/5 rounded-2xl sm:rounded-[2rem] p-6 sm:p-8">
            <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-zinc-500 mb-6 sm:mb-8">Répartition Plateformes</h3>
            <div className="space-y-5 sm:space-y-6">
              {soldArticles.length === 0 ? (
                <p className="text-center text-zinc-600 text-xs py-16 italic">Aucune vente sur la période</p>
              ) : (
                Object.entries(salePlatformStats).map(([platform, count]) => (
                  <div key={platform} className="space-y-2">
                    <div className="flex justify-between text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
                      <span>{platform}</span>
                      <span className="text-zinc-500">{count} ventes</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="bg-orange-500 h-full rounded-full" 
                        style={{ width: `${(count / soldArticles.length) * 100}%` }} 
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Smart Insights */}
          <div className="bg-[#080808] border border-white/5 rounded-2xl sm:rounded-[2rem] p-6 sm:p-8">
            <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-zinc-500 mb-6 sm:mb-8">🎯 AI Insights</h3>
            <div className="space-y-3 sm:space-y-4">
              {conversionRate > 70 && (
                <InsightRow icon={<Zap size={14}/>} color="green" text={`Conversion d'élite : ${conversionRate.toFixed(0)}%`} />
              )}
              {avgMargin > 10 && (
                <InsightRow icon={<Target size={14}/>} color="orange" text={`Marge saine (> ${avgMargin.toFixed(0)}€/unité)`} />
              )}
              {avgDaysToSell < 14 && soldArticles.length > 0 && (
                <InsightRow icon={<TrendingUp size={14}/>} color="blue" text={`Rotation rapide des stocks (${avgDaysToSell.toFixed(0)}j)`} />
              )}
              {Object.keys(salePlatformStats).length > 0 && (
                <InsightRow icon={<Package size={14}/>} color="white" text={`Lead Platform : ${Object.keys(salePlatformStats).reduce((a, b) => salePlatformStats[a] > salePlatformStats[b] ? a : b)}`} />
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// --- COMPOSANTS INTERNES ---

const StatCard = ({ icon, label, value, color }) => {
  const colors = {
    green: "text-green-500 bg-green-500/10 border-green-500/20",
    orange: "text-orange-500 bg-orange-500/10 border-orange-500/20",
    white: "text-white bg-white/5 border-white/10",
    blue: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  };

  return (
    <div className="bg-[#080808] border border-white/5 p-5 sm:p-6 rounded-2xl sm:rounded-[1.5rem] hover:border-white/10 transition-all">
      <div className={`h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center mb-3 sm:mb-4 border ${colors[color]}`}>
        {icon}
      </div>
      <p className="text-[9px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-[0.15em] mb-1">{label}</p>
      <p className="text-xl sm:text-2xl font-black text-white leading-none">{value}</p>
    </div>
  );
};

const InsightRow = ({ icon, color, text }) => {
  const colors = {
    green: "bg-green-500/10 text-green-500 border-green-500/10",
    orange: "bg-orange-500/10 text-orange-500 border-orange-500/10",
    blue: "bg-blue-500/10 text-blue-500 border-blue-500/10",
    white: "bg-white/5 text-white/70 border-white/10",
  };

  return (
    <div className={`flex items-center gap-3 p-2.5 sm:p-3 rounded-xl border ${colors[color]} animate-in slide-in-from-right-2 duration-500`}>
      <div className="shrink-0">{icon}</div>
      <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-tight leading-tight">{text}</span>
    </div>
  );
};