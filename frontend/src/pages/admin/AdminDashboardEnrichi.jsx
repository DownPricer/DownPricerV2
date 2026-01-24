import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge'; // Corrigé : Import ajouté
import { 
  Package, 
  ShoppingCart, 
  Users, 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  ArrowUpRight, 
  Activity, 
  Zap, 
  Loader2 
} from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'sonner';

export const AdminDashboardEnrichiPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    articlesCount: 0,
    usersCount: 0,
    demandesCount: 0,
    ventesCount: 0,
    revenueTotal: 0,
    demandesPending: 0,
    paiementsPending: 0,
    expeditionsPending: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const [articles, users, demandes, sales] = await Promise.all([
        api.get('/articles?limit=10000'),
        api.get('/admin/users'),
        api.get('/admin/demandes'),
        api.get('/admin/sales')
      ]);

      const dPending = demandes.data.filter(d => 
        d.status === 'AWAITING_DEPOSIT' || d.status === 'IN_ANALYSIS'
      ).length;

      const pPending = sales.data.filter(s => 
        s.status === 'PAYMENT_SUBMITTED'
      ).length;

      const ePending = sales.data.filter(s => 
        s.status === 'SHIPPING_PENDING'
      ).length;

      const completedSales = sales.data.filter(s => s.status === 'COMPLETED');
      const revTotal = completedSales.reduce((sum, s) => sum + s.sale_price, 0);

      setStats({
        articlesCount: articles.data.total || articles.data.articles?.length || 0,
        usersCount: users.data.length,
        demandesCount: demandes.data.length,
        ventesCount: sales.data.length,
        revenueTotal: revTotal,
        demandesPending: dPending,
        paiementsPending: pPending,
        expeditionsPending: ePending
      });

      const recent = [
        ...sales.data.slice(-5).map(s => ({
          type: 'vente',
          label: `Vente: ${s.article_name}`,
          time: new Date(s.created_at),
          status: s.status
        })),
        ...demandes.data.slice(-5).map(d => ({
          type: 'demande',
          label: `Demande: ${d.name}`,
          time: new Date(d.created_at),
          status: d.status
        }))
      ].sort((a, b) => b.time - a.time).slice(0, 10);

      setRecentActivity(recent);
    } catch (error) {
      toast.error('Échec de synchronisation système');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-black flex flex-col items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-orange-500 mb-4" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 italic">Initialisation du Centre de Commandement...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-black text-white p-4 sm:p-6 md:p-12 selection:bg-orange-500/30">
        
        {/* Header Section */}
        <div className="mb-10 md:mb-16 max-w-7xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-4">
            <Zap className="h-3 w-3 fill-orange-500" /> Administrative Command Center
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Dashboard <span className="text-orange-500">Enrichi</span>
          </h2>
          <p className="mt-2 text-zinc-500 text-xs md:text-sm font-medium uppercase tracking-widest italic opacity-70">Aperçu global de l'infrastructure DownPricer</p>
        </div>

        {/* --- ROW 1: CORE KPIs --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 max-w-7xl mx-auto">
          <MainStatCard 
            label="Articles" value={stats.articlesCount} icon={<Package />} 
            color="blue" onClick={() => navigate('/admin/articles')} 
          />
          <MainStatCard 
            label="Utilisateurs" value={stats.usersCount} icon={<Users />} 
            color="green" onClick={() => navigate('/admin/users')} 
          />
          <MainStatCard 
            label="Sourcing" value={stats.demandesCount} icon={<ShoppingCart />} 
            color="purple" onClick={() => navigate('/admin/demandes')} 
          />
          <MainStatCard 
            label="Chiffre d'Affaires" value={`${stats.revenueTotal.toFixed(0)}€`} icon={<DollarSign />} 
            color="orange" 
          />
        </div>

        {/* --- ROW 2: CRITICAL ALERTS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12 max-w-7xl mx-auto">
          <AlertCard 
            label="Dossiers en attente" value={stats.demandesPending} 
            icon={<Clock />} color="orange" onClick={() => navigate('/admin/demandes')}
          />
          <AlertCard 
            label="Paiements à valider" value={stats.paiementsPending} 
            icon={<AlertCircle />} color="blue" onClick={() => navigate('/admin/paiements')}
          />
          <AlertCard 
            label="Expéditions requises" value={stats.expeditionsPending} 
            icon={<Package />} color="purple" onClick={() => navigate('/admin/expeditions')}
          />
        </div>

        {/* --- ROW 3: DETAILED ANALYTICS & ACTIVITY --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          
          {/* Analytics Summary */}
          <Card className="bg-[#080808] border-white/5 rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl">
            <CardHeader className="p-6 md:p-10 pb-4">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-3">
                <TrendingUp className="h-4 w-4 text-blue-500" /> Analyse de Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 md:p-10 pt-4">
              <div className="space-y-6">
                <AnalyticsRow label="Volume de ventes total" value={stats.ventesCount} />
                <AnalyticsRow label="Revenus nets cumulés" value={`${stats.revenueTotal.toFixed(2)}€`} color="text-green-500" />
                <AnalyticsRow 
                  label="Valeur moyenne panier" 
                  value={`${stats.ventesCount > 0 ? (stats.revenueTotal / stats.ventesCount).toFixed(0) : 0}€`} 
                />
                <div className="pt-6 border-t border-white/[0.03]">
                  <p className="text-[9px] font-black text-zinc-600 uppercase mb-3">Progression du mois</p>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: '74%' }} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <Card className="bg-[#080808] border-white/5 rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-6 md:p-10 pb-4">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-3">
                <Activity className="h-4 w-4 text-orange-500" /> Flux d'activité live
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 md:p-10 pt-4">
              <div className="space-y-3 max-h-[350px] overflow-y-auto no-scrollbar">
                {recentActivity.length === 0 ? (
                  <div className="py-10 text-center text-zinc-800 text-[10px] font-bold uppercase tracking-widest">Zéro mouvement système</div>
                ) : (
                  recentActivity.map((activity, index) => (
                    <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-black border border-white/[0.03] rounded-2xl group hover:border-white/10 transition-all gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-zinc-200 group-hover:text-orange-500 transition-colors truncate">{activity.label}</p>
                        <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-tighter mt-0.5">
                          {activity.time.toLocaleDateString('fr-FR')} • {activity.time.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}
                        </p>
                      </div>
                      {/* Badge corrigé avec import */}
                      <Badge className={`text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-tighter w-fit border-0 ${getStatusStyle(activity.status)}`}>
                        {activity.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </AdminLayout>
  );
};

// --- COMPOSANTS DE STRUCTURE ---

const MainStatCard = ({ label, value, icon, color, onClick }) => {
  const colors = {
    blue: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    green: "text-green-500 bg-green-500/10 border-green-500/20",
    purple: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    orange: "text-orange-500 bg-orange-500/10 border-orange-500/20",
  };

  return (
    <Card 
      className={`bg-[#080808] border-white/5 rounded-[1.5rem] md:rounded-[2rem] transition-all duration-300 hover:border-white/10 group cursor-pointer active:scale-95`}
      onClick={onClick}
    >
      <CardContent className="p-6 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">{label}</p>
            <p className="text-2xl md:text-3xl font-black text-white tracking-tighter">{value}</p>
          </div>
          <div className={`h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl flex items-center justify-center border transition-transform group-hover:scale-110 ${colors[color]}`}>
            {React.cloneElement(icon, { size: 22 })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const AlertCard = ({ label, value, icon, color, onClick }) => {
  const colors = {
    orange: "text-orange-400 border-orange-500/20 bg-orange-500/5 hover:bg-orange-500/10",
    blue: "text-blue-400 border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10",
    purple: "text-purple-400 border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10",
  };

  return (
    <div 
      onClick={onClick}
      className={`p-6 rounded-[1.5rem] border flex items-center justify-between cursor-pointer transition-all active:scale-[0.98] ${colors[color]}`}
    >
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">{label}</p>
        <p className="text-2xl font-black">{value}</p>
      </div>
      <div className="opacity-30 group-hover:opacity-100 transition-opacity">
        {React.cloneElement(icon, { size: 24 })}
      </div>
    </div>
  );
};

const AnalyticsRow = ({ label, value, color = "text-zinc-300" }) => (
  <div className="flex justify-between items-center py-1.5 border-b border-white/[0.02]">
    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">{label}</span>
    <span className={`text-sm font-black ${color}`}>{value}</span>
  </div>
);

const getStatusStyle = (status) => {
  if (status.includes('COMPLETED') || status.includes('PAID')) return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
  if (status.includes('PENDING') || status.includes('AWAITING')) return 'bg-orange-500/10 text-orange-500 border border-orange-500/20';
  if (status.includes('REJECTED') || status.includes('CANCELLED')) return 'bg-red-500/10 text-red-500 border border-red-500/20';
  return 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
};