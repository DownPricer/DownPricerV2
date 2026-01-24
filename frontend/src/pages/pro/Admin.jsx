import React, { useState, useEffect } from 'react';
import { User, Package, TrendingUp, DollarSign, Loader2, AlertCircle, Users, ArrowUpRight, BarChart3, CheckCircle } from 'lucide-react';
import api from '../../utils/api';
import { getUser, hasRole } from '../../utils/auth';

export const ProAdmin = () => {
  const [data, setData] = useState({
    stats: {},
    users: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasRole('ADMIN')) return;
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        api.get('/pro/admin/stats'),
        api.get('/pro/admin/users')
      ]);
      setData({ stats: statsRes.data, users: usersRes.data });
    } catch (error) {
      console.error('Erreur admin:', error);
      if (error.response?.status === 403) window.location.href = '/';
    } finally {
      setLoading(false);
    }
  };

  if (!hasRole('ADMIN')) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4 sm:px-6">
        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl sm:rounded-[2rem] p-6 sm:p-10 text-center max-w-md">
          <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-lg sm:text-xl font-black uppercase tracking-widest text-white mb-2">Accès restreint</h1>
          <p className="text-zinc-500 text-xs sm:text-sm">Cette zone est réservée au personnel administratif de DownPricer.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white p-4">
        <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
        <p className="mt-4 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Initialisation Admin...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-orange-500/30 pb-20">
      {/* Container : Padding horizontal réduit sur mobile */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        
        {/* Header Section : Texte adaptatif */}
        <div className="mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-4">
            <BarChart3 className="h-3 w-3" /> System Overview
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter uppercase italic leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Administration <span className="text-orange-500">Pro</span>
          </h1>
          <p className="mt-2 text-zinc-500 text-[10px] sm:text-sm font-medium uppercase tracking-wider">Statistiques globales du module Achat/Revente</p>
        </div>

        {/* Top Stats Row : Grille adaptative */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-10">
          <AdminStatCard icon={<Users size={18}/>} label="Utilisateurs" value={data.stats.total_users} color="white" />
          <AdminStatCard icon={<Package size={18}/>} label="Articles Totaux" value={data.stats.total_articles} color="white" />
          <AdminStatCard icon={<TrendingUp size={18}/>} label="Transactions" value={data.stats.total_transactions} color="white" />
          <AdminStatCard 
            icon={<DollarSign size={18}/>} 
            label="CA Global" 
            value={`${(data.stats.total_revenue || 0).toFixed(0)}€`} 
            color="orange" 
          />
        </div>

        {/* Detailed Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-10 sm:mb-12">
          
          {/* Inventory Breakdown */}
          <div className="bg-[#080808] border border-white/5 rounded-2xl sm:rounded-[2rem] p-6 sm:p-8">
            <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-zinc-500 mb-6 sm:mb-8 flex items-center gap-2">
              <Package className="h-4 w-4" /> Inventaire
            </h3>
            <div className="space-y-4 sm:space-y-6">
              <DetailRow label="En circulation" value={data.stats.articles_for_sale} color="text-orange-500" />
              <DetailRow label="Vendus" value={data.stats.articles_sold} color="text-green-500" />
              <DetailRow label="Pertes / Litiges" value={data.stats.articles_lost} color="text-red-500" />
            </div>
          </div>

          {/* Global Finances */}
          <div className="bg-[#080808] border border-white/5 rounded-2xl sm:rounded-[2rem] p-6 sm:p-8">
            <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-zinc-500 mb-6 sm:mb-8 flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> Finances Globales
            </h3>
            <div className="space-y-4 sm:space-y-6">
              <DetailRow label="Investissement" value={`-${(data.stats.total_invested || 0).toFixed(0)}€`} color="text-red-400" />
              <DetailRow label="Revenus cumulés" value={`+${(data.stats.total_earned || 0).toFixed(0)}€`} color="text-green-400" />
              <DetailRow 
                label="Marge Nette" 
                value={`${(data.stats.current_margin || 0).toFixed(0)}€`} 
                color={(data.stats.current_margin || 0) >= 0 ? 'text-green-500' : 'text-red-500'} 
                bold
              />
            </div>
          </div>

          {/* System Alerts */}
          <div className="bg-[#080808] border border-white/5 rounded-2xl sm:rounded-[2rem] p-6 sm:p-8">
            <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-zinc-500 mb-6 sm:mb-8 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> État du Système
            </h3>
            <div className="flex flex-col items-center justify-center h-20 sm:h-24">
              {data.stats.alerts_count > 0 ? (
                <div className="text-center group cursor-pointer">
                  <div className="text-3xl sm:text-4xl font-black text-red-500 group-hover:scale-110 transition-transform">{data.stats.alerts_count}</div>
                  <p className="text-[9px] font-bold text-red-500/50 uppercase tracking-widest mt-2">Retours critiques</p>
                </div>
              ) : (
                <div className="text-center">
                  <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-500/20 mx-auto mb-2" />
                  <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Aucune alerte</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Users Table : Gestion du scroll horizontal */}
        <div className="bg-[#080808] border border-white/5 rounded-2xl sm:rounded-[2rem] overflow-hidden">
          <div className="px-5 sm:px-8 py-5 sm:py-6 border-b border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/[0.01]">
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest">
              Base Utilisateurs <span className="text-zinc-600 ml-2">({data.users.length})</span>
            </h3>
            <button className="text-[9px] sm:text-[10px] font-black text-orange-500 uppercase tracking-widest hover:opacity-80 transition-opacity">Exporter CSV</button>
          </div>

          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-black/50 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-zinc-500 border-b border-white/5">
                  <th className="px-5 sm:px-8 py-4 sm:py-5">Email Utilisateur</th>
                  <th className="px-5 sm:px-8 py-4 sm:py-5">Statut</th>
                  <th className="px-5 sm:px-8 py-4 sm:py-5 text-center">Articles</th>
                  <th className="px-5 sm:px-8 py-4 sm:py-5 text-center">Ventes</th>
                  <th className="px-5 sm:px-8 py-4 sm:py-5 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {data.users.map((u) => (
                  <tr key={u.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 sm:px-8 py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm font-bold text-white group-hover:text-orange-500 transition-colors">{u.email}</div>
                    </td>
                    <td className="px-5 sm:px-8 py-4 whitespace-nowrap">
                      <span className={`text-[8px] sm:text-[9px] font-black px-2.5 sm:px-3 py-1 rounded-full uppercase tracking-tighter shrink-0 ${
                        u.is_admin ? 'bg-orange-500/10 text-orange-500' : 'bg-white/5 text-zinc-500'
                      }`}>
                        {u.is_admin ? 'Admin' : 'Pro S-Tier'}
                      </span>
                    </td>
                    <td className="px-5 sm:px-8 py-4 whitespace-nowrap text-center text-xs sm:text-sm font-medium text-zinc-400">
                      {u.articles_count || 0}
                    </td>
                    <td className="px-5 sm:px-8 py-4 whitespace-nowrap text-center text-xs sm:text-sm font-medium text-zinc-400">
                      {u.transactions_count || 0}
                    </td>
                    <td className="px-5 sm:px-8 py-4 whitespace-nowrap text-right text-[10px] font-medium text-zinc-600 uppercase">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Indicateur de scroll pour mobile */}
          <div className="sm:hidden px-5 py-3 bg-black/40 border-t border-white/5">
             <p className="text-[8px] font-black text-zinc-700 uppercase tracking-widest text-center">Glisser horizontalement pour voir plus →</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Composants internes stylisés (Adaptés mobile)
const AdminStatCard = ({ icon, label, value, color }) => (
  <div className="bg-[#080808] border border-white/5 p-5 sm:p-6 rounded-2xl sm:rounded-[1.5rem] hover:border-white/10 transition-all group">
    <div className={`h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center mb-3 sm:mb-4 border transition-colors ${
      color === 'orange' ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' : 'bg-white/5 border-white/10 text-zinc-400 group-hover:text-white'
    }`}>
      {icon}
    </div>
    <p className="text-[9px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-xl sm:text-2xl font-black text-white">{value}</p>
  </div>
);

const DetailRow = ({ label, value, color, bold }) => (
  <div className="flex justify-between items-center group gap-4">
    <span className="text-[10px] sm:text-xs font-bold text-zinc-500 group-hover:text-zinc-300 transition-colors truncate">{label}</span>
    <span className={`text-xs sm:text-sm ${bold ? 'font-black' : 'font-bold'} ${color} tracking-tight shrink-0`}>{value}</span>
  </div>
);