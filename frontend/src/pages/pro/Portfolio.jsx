import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, DollarSign, Loader2, ArrowUpRight, ArrowDownRight, History, Info } from 'lucide-react';
import api from '../../utils/api';

export const ProPortfolio = () => {
  const [data, setData] = useState({
    transactions: [],
    articles: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [transactionsRes, articlesRes] = await Promise.all([
        api.get('/pro/transactions'),
        api.get('/pro/articles-light')
      ]);
      setData({
        transactions: transactionsRes.data,
        articles: articlesRes.data
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
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Synchronisation du portefeuille...</p>
      </div>
    );
  }

  // Calculs locaux
  const totalPurchases = data.transactions
    .filter(t => t.type === 'achat')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalSales = data.transactions
    .filter(t => t.type === 'vente')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalSales - totalPurchases;

  const potentialRevenue = data.articles
    .filter(a => a.status === 'À vendre')
    .reduce((sum, a) => sum + a.estimated_sale_price, 0);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-orange-500/30 pb-20">
      {/* Container : Padding horizontal ajusté (px-4) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        
        {/* Header Section : Texte adaptatif */}
        <div className="mb-8 md:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-4">
            <Wallet className="h-3 w-3" /> Financial Assets
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tighter uppercase italic leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Mon <span className="text-orange-500">Portefeuille</span>
          </h1>
          <p className="mt-2 text-zinc-500 text-[10px] sm:text-sm font-medium uppercase tracking-wider">Suivi en temps réel de vos flux de trésorerie</p>
        </div>

        {/* Portfolio Summary Cards : 1 col mobile, 2 col tablette, 4 col desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-10">
          <SummaryCard 
            icon={<ArrowDownRight size={18}/>} 
            label="Total Achats" 
            value={`-${totalPurchases.toFixed(0)}€`} 
            color="red" 
          />
          <SummaryCard 
            icon={<ArrowUpRight size={18}/>} 
            label="Total Revenus" 
            value={`+${totalSales.toFixed(0)}€`} 
            color="green" 
          />
          <SummaryCard 
            icon={<Wallet size={18}/>} 
            label="Solde Net" 
            value={`${balance >= 0 ? '+' : ''}${balance.toFixed(0)}€`} 
            color={balance >= 0 ? "orange" : "red"}
            highlight={true}
          />
          <SummaryCard 
            icon={<TrendingUp size={18}/>} 
            label="Plus-value potentielle" 
            value={`+${potentialRevenue.toFixed(0)}€`} 
            color="white" 
          />
        </div>

        {/* Transactions Table : Scroll vertical géré avec paddings réduits */}
        <div className="bg-[#080808] border border-white/5 rounded-2xl sm:rounded-[2rem] overflow-hidden">
          <div className="px-5 sm:px-8 py-5 sm:py-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white/[0.01]">
            <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
              <History className="h-4 w-4" /> Transactions Récentes
            </h3>
            <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Dernières 50 opérations</span>
          </div>
          
          <div className="max-h-[500px] overflow-y-auto no-scrollbar divide-y divide-white/[0.03]">
            {data.transactions.length > 0 ? (
              data.transactions.slice(0, 50).map((transaction) => (
                <div key={transaction.id} className="px-5 sm:px-8 py-4 sm:py-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group gap-4">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className={`h-9 w-9 sm:h-10 sm:w-10 shrink-0 rounded-full flex items-center justify-center border transition-all ${
                      transaction.type === 'achat' ? 'bg-red-500/5 border-red-500/10 text-red-500' : 'bg-green-500/5 border-green-500/10 text-green-500'
                    }`}>
                      {transaction.type === 'achat' ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-white group-hover:text-orange-500 transition-colors truncate">{transaction.description}</p>
                      <p className="text-[9px] font-medium text-zinc-600 uppercase tracking-wider">{new Date(transaction.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-6 shrink-0">
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter hidden xs:inline-block ${
                      transaction.type === 'achat' ? 'bg-white/5 text-zinc-500' : 'bg-green-500/10 text-green-500'
                    }`}>
                      {transaction.type}
                    </span>
                    <span className={`text-xs sm:text-sm font-black min-w-[70px] text-right ${transaction.amount >= 0 ? 'text-green-500' : 'text-white'}`}>
                      {transaction.amount >= 0 ? '+' : ''}{transaction.amount.toFixed(2)}€
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center px-4">
                <History className="h-10 w-10 text-zinc-800 mx-auto mb-4" />
                <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">Aucun mouvement enregistré</p>
              </div>
            )}
          </div>
        </div>

        {/* OLED Info Box : Grille adaptative */}
        <div className="mt-6 sm:mt-8 bg-orange-500/5 border border-orange-500/10 rounded-2xl p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <Info className="h-4 w-4 text-orange-500" />
            <h4 className="text-[10px] font-black uppercase tracking-widest text-orange-500">Business Logic</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-3 sm:gap-6 text-[9px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-tight">
            <div className="flex gap-2"><span className="text-orange-500">•</span> Achats : Investissement initial</div>
            <div className="flex gap-2"><span className="text-orange-500">•</span> Revenus : CA net encaissé</div>
            <div className="flex gap-2"><span className="text-orange-500">•</span> Solde : Marge nette réalisée</div>
            <div className="flex gap-2"><span className="text-orange-500">•</span> Potentiel : Valeur estimée du stock</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- COMPOSANT CARD OPTIMISÉ ---
const SummaryCard = ({ icon, label, value, color, highlight }) => {
  const colorStyles = {
    red: "text-red-500 bg-red-500/10 border-red-500/20",
    green: "text-green-500 bg-green-500/10 border-green-500/20",
    orange: "text-orange-500 bg-orange-500/10 border-orange-500/20",
    white: "text-white bg-white/5 border-white/10",
  };

  return (
    <div className={`
      relative overflow-hidden p-5 sm:p-6 rounded-[1.25rem] sm:rounded-[1.5rem] border transition-all duration-500 group
      ${highlight ? 'bg-orange-500/5 border-orange-500/20' : 'bg-[#080808] border-white/5 hover:border-white/10'}
    `}>
      {highlight && <div className="absolute -top-10 -right-10 w-24 h-24 sm:w-32 sm:h-32 bg-orange-500/10 blur-3xl rounded-full" />}
      
      <div className={`h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center mb-3 sm:mb-4 border transition-transform group-hover:scale-110 duration-300 ${colorStyles[color]}`}>
        {icon}
      </div>
      <p className="text-[9px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1 relative z-10">{label}</p>
      <p className="text-xl sm:text-2xl font-black text-white leading-none relative z-10">{value}</p>
    </div>
  );
};