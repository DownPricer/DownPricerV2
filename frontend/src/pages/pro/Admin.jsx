import React, { useState, useEffect } from 'react';
import { User, Package, TrendingUp, DollarSign, Loader2, AlertCircle, Users, ArrowUpRight, BarChart3 } from 'lucide-react';
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
      <div className="min-h-screen bg-black flex items-center justify-center px-6">
        <div className="bg-red-500/5 border border-red-500/20 rounded-[2rem] p-10 text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-black uppercase tracking-widest text-white mb-2">Accès restreint</h1>
          <p className="text-zinc-500 text-sm">Cette zone est réservée au personnel administratif de DownPricer.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
        <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
        <p className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Initialisation Admin...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-orange-500/30 pb-20">
      <div className="max-w-7xl mx-auto px-6 py-10">
        
        {/* Header Section */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] font-black uppercase tracking-widest mb-4">
            <BarChart3 className="h-3 w-3" /> System Overview
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Administration <span className="text-orange-500">Pro</span>
          </h1>
          <p className="mt-2 text-zinc-500 text-sm font-medium uppercase tracking-wider">Statistiques globales du module Achat/Revente</p>
        </div>

        {/* Top Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <AdminStatCard icon={<Users size={20}/>} label="Utilisateurs" value={data.stats.total_users} color="white" />
          <AdminStatCard icon={<Package size={20}/>} label="Articles Totaux" value={data.stats.total_articles} color="white" />
          <AdminStatCard icon={<TrendingUp size={20}/>} label="Transactions" value={data.stats.total_transactions} color="white" />
          <AdminStatCard 
            icon={<DollarSign size={20}/>} 
            label="CA Global" 
            value={`${(data.stats.total_revenue || 0).toFixed(0)}€`} 
            color="orange" 
          />
        </div>

        {/* Detailed Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          
          {/* Inventory Breakdown */}
          <div className="bg-[#080808] border border-white/5 rounded-[2rem] p-8">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 mb-8 flex items-center gap-2">
              <Package className="h-4 w-4" /> Inventaire
            </h3>
            <div className="space-y-6">
              <DetailRow label="En circulation" value={data.stats.articles_for_sale} color="text-orange-500" />
              <DetailRow label="Vendus" value={data.stats.articles_sold} color="text-green-500" />
              <DetailRow label="Pertes / Litiges" value={data.stats.articles_lost} color="text-red-500" />
            </div>
          </div>

          {/* Global Finances */}
          <div className="bg-[#080808] border border-white/5 rounded-[2rem] p-8">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 mb-8 flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> Finances Globales
            </h3>
            <div className="space-y-6">
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
          <div className="bg-[#080808] border border-white/5 rounded-[2rem] p-8">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 mb-8 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> État du Système
            </h3>
            <div className="flex flex-col items-center justify-center h-24">
              {data.stats.alerts_count > 0 ? (
                <div className="text-center group cursor-pointer">
                  <div className="text-4xl font-black text-red-500 group-hover:scale-110 transition-transform">{data.stats.alerts_count}</div>
                  <p className="text-[10px] font-bold text-red-500/50 uppercase tracking-widest mt-2">Retours critiques</p>
                </div>
              ) : (
                <div className="text-center">
                  <CheckCircle className="h-8 w-8 text-green-500/20 mx-auto mb-2" />
                  <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Aucune alerte</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-[#080808] border border-white/5 rounded-[2rem] overflow-hidden">
          <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
            <h3 className="text-sm font-black uppercase tracking-widest">Base Utilisateurs <span className="text-zinc-600 ml-2">({data.users.length})</span></h3>
            <button className="text-[10px] font-black text-orange-500 uppercase tracking-widest hover:opacity-80 transition-opacity">Exporter CSV</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/50 text-[10px] font-black uppercase tracking-widest text-zinc-500 border-b border-white/5">
                  <th className="px-8 py-5">Email Utilisateur</th>
                  <th className="px-8 py-5">Statut</th>
                  <th className="px-8 py-5 text-center">Articles</th>
                  <th className="px-8 py-5 text-center">Ventes</th>
                  <th className="px-8 py-5 text-right">Date Inscription</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {data.users.map((u) => (
                  <tr key={u.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-8 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-white group-hover:text-orange-500 transition-colors">{u.email}</div>
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap">
                      <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${
                        u.is_admin ? 'bg-orange-500/10 text-orange-500' : 'bg-white/5 text-zinc-500'
                      }`}>
                        {u.is_admin ? 'Admin' : 'Pro S-Tier'}
                      </span>
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap text-center text-sm font-medium text-zinc-400">
                      {u.articles_count || 0}
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap text-center text-sm font-medium text-zinc-400">
                      {u.transactions_count || 0}
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap text-right text-xs font-medium text-zinc-600 uppercase">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// Composants internes stylisés
const AdminStatCard = ({ icon, label, value, color }) => (
  <div className="bg-[#080808] border border-white/5 p-6 rounded-[1.5rem] hover:border-white/10 transition-all group">
    <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-4 border transition-colors ${
      color === 'orange' ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' : 'bg-white/5 border-white/10 text-zinc-400 group-hover:text-white'
    }`}>
      {icon}
    </div>
    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-2xl font-black text-white">{value}</p>
  </div>
);

const DetailRow = ({ label, value, color, bold }) => (
  <div className="flex justify-between items-center group">
    <span className="text-xs font-bold text-zinc-500 group-hover:text-zinc-300 transition-colors">{label}</span>
    <span className={`text-sm ${bold ? 'font-black' : 'font-bold'} ${color} tracking-tight`}>{value}</span>
  </div>
);