import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Users, Package, FileText, DollarSign, Loader2, ArrowUpRight, Activity, Clock } from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'sonner';

export const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/dashboard');
      setStats(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des statistiques');
    }
    setLoading(false);
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-black text-white p-4 sm:p-6 md:p-12 selection:bg-orange-500/30" data-testid="admin-dashboard-content">
        
        {/* Header Section - Adapté Mobile */}
        <div className="mb-8 md:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-4">
            <Activity className="h-3 w-3" /> System Heartbeat
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Tableau de <span className="text-orange-500">Bord</span>
          </h2>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
            <p className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Collecte des données...</p>
          </div>
        ) : (
          <>
            {/* KPI Grid - Responsive: 1 col mobile, 2 col tablet, 4 col desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 md:mb-10">
              <KPICard label="Utilisateurs" value={stats?.total_users || 0} icon={<Users />} color="blue" />
              <KPICard label="Articles" value={stats?.total_articles || 0} icon={<Package />} color="orange" />
              <KPICard label="Demandes" value={stats?.total_demandes || 0} icon={<FileText />} color="purple" />
              <KPICard label="Ventes" value={stats?.total_sales || 0} icon={<DollarSign />} color="green" />
            </div>

            {/* Recent Requests Section */}
            <Card className="bg-[#080808] border-white/5 rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl">
              <CardHeader className="p-5 md:p-8 pb-4 border-b border-white/[0.03] flex flex-row items-center justify-between">
                <CardTitle className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-zinc-500 flex items-center gap-2 md:gap-3">
                  <Clock size={16} className="text-orange-500" /> Dernières Demandes
                </CardTitle>
                <button className="text-[9px] md:text-[10px] font-black text-zinc-500 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-1">
                  <span className="hidden sm:inline">Voir tout</span> <ArrowUpRight size={12} />
                </button>
              </CardHeader>
              
              <CardContent className="p-0">
                {stats?.recent_demandes && stats.recent_demandes.length > 0 ? (
                  <div className="divide-y divide-white/[0.03]">
                    {stats.recent_demandes.map((demande) => (
                      <div key={demande.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 md:p-6 hover:bg-white/[0.01] transition-all group gap-4">
                        
                        <div className="flex items-center gap-4 md:gap-5">
                          <div className="h-10 w-10 shrink-0 rounded-xl bg-black border border-white/5 flex items-center justify-center text-zinc-700 group-hover:border-orange-500/30 group-hover:text-orange-500 transition-colors">
                            <FileText size={18} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-white group-hover:text-orange-500 transition-colors truncate">{demande.name}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Budget: {demande.max_price}€</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between sm:justify-end gap-4">
                          <span className={`text-[8px] md:text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-tighter border ${getStatusStyle(demande.status)}`}>
                            {demande.status.replace(/_/g, ' ')}
                          </span>
                          <ArrowUpRight size={14} className="text-zinc-800 group-hover:text-white transition-colors hidden sm:block" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-20 text-center">
                    <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em]">Zéro activité détectée</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

// --- COMPOSANTS INTERNES ---

const KPICard = ({ label, value, icon, color }) => {
  const colorStyles = {
    blue: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    orange: "text-orange-500 bg-orange-500/10 border-orange-500/20",
    purple: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    green: "text-green-500 bg-green-500/10 border-green-500/20",
  };

  return (
    <div className="bg-[#080808] border border-white/5 p-5 md:p-6 rounded-2xl md:rounded-[1.5rem] hover:border-white/10 transition-all group">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[9px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest">{label}</p>
        <div className={`h-8 w-8 md:h-10 md:w-10 rounded-xl flex items-center justify-center border transition-transform group-hover:scale-110 ${colorStyles[color]}`}>
          {React.cloneElement(icon, { size: 18 })}
        </div>
      </div>
      <p className="text-2xl md:text-3xl font-black text-white leading-none tracking-tighter">{value}</p>
    </div>
  );
};

const getStatusStyle = (status) => {
  const s = status.toUpperCase();
  if (s.includes('COMPLETED') || s.includes('VALIDATED')) return 'bg-green-500/10 text-green-500 border-green-500/20';
  if (s.includes('PENDING') || s.includes('AWAITING')) return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
  if (s.includes('REJECTED') || s.includes('CANCELLED')) return 'bg-red-500/10 text-red-500 border-red-500/20';
  return 'bg-white/5 text-zinc-500 border-white/10';
};