import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { CreditCard, Globe, Star, Users, Loader2, TrendingUp, Calendar, Hash } from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'sonner';

export const AdminAbonnementsPage = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [subsResponse, usersResponse] = await Promise.all([
        api.get('/admin/subscriptions'),
        api.get('/admin/users')
      ]);
      setSubscriptions(subsResponse.data || []);
      setUsers(usersResponse.data || []);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    }
    setLoading(false);
  };

  const miniSiteUsers = users.filter(u => 
    u.roles.includes('SITE_PLAN_1') || u.roles.includes('SITE_PLAN_2') || u.roles.includes('SITE_PLAN_3')
  );
  const sPlanUsers = users.filter(u => 
    u.roles.includes('S_PLAN_5') || u.roles.includes('S_PLAN_15')
  );

  const monthlyMRR = (
    miniSiteUsers.filter(u => u.roles.includes('SITE_PLAN_1')).length * 1 +
    miniSiteUsers.filter(u => u.roles.includes('SITE_PLAN_2')).length * 10 +
    miniSiteUsers.filter(u => u.roles.includes('SITE_PLAN_3')).length * 15 +
    sPlanUsers.filter(u => u.roles.includes('S_PLAN_5')).length * 5 +
    sPlanUsers.filter(u => u.roles.includes('S_PLAN_15')).length * 15
  );

  const getPlanBadge = (roles) => {
    const config = roles.includes('SITE_PLAN_3') || roles.includes('S_PLAN_15') 
      ? { label: 'Premium 15€', class: 'bg-orange-500/10 text-orange-500 border-orange-500/20' }
      : roles.includes('SITE_PLAN_2') 
      ? { label: 'Standard 10€', class: 'bg-white/10 text-white border-white/10' }
      : { label: 'Starter', class: 'bg-white/5 text-zinc-500 border-white/5' };

    return <Badge className={`${config.class} border rounded-full text-[9px] font-black uppercase tracking-tighter`}>{config.label}</Badge>;
  };

  return (
    <AdminLayout>
      {/* Ajustement padding global : p-4 sur mobile */}
      <div className="min-h-screen bg-black text-white p-4 sm:p-8 md:p-12 selection:bg-orange-500/30">
        
        {/* Header : Reduction taille texte sur mobile */}
        <div className="mb-8 md:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter uppercase italic mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Abonnements <span className="text-orange-500">& Billing</span>
          </h2>
          <p className="text-zinc-500 text-[10px] sm:text-sm font-medium uppercase tracking-widest">Contrôle des flux financiers et des accès privilèges</p>
        </div>

        {/* Top KPIs : Grille adaptative */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <KPICard icon={<Globe size={18}/>} label="Mini-Sites" value={miniSiteUsers.length} color="orange" />
          <KPICard icon={<Star size={18}/>} label="S-Plan" value={sPlanUsers.length} color="white" />
          <KPICard icon={<Users size={18}/>} label="Abonnés" value={miniSiteUsers.length + sPlanUsers.length} color="white" />
          <KPICard icon={<TrendingUp size={18}/>} label="MRR Estimé" value={`${monthlyMRR}€`} color="green" />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
          </div>
        ) : (
          <Tabs defaultValue="mini-sites" className="space-y-6 md:space-y-8">
            {/* Tabs : Full width sur mobile avec padding réduit */}
            <TabsList className="bg-[#080808] border border-white/5 p-1 rounded-full flex w-full sm:inline-flex h-12">
              <TabsTrigger value="mini-sites" className="flex-1 sm:flex-none rounded-full px-4 sm:px-8 text-[9px] sm:text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                Mini-sites
              </TabsTrigger>
              <TabsTrigger value="s-plan" className="flex-1 sm:flex-none rounded-full px-4 sm:px-8 text-[9px] sm:text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                S-Plan
              </TabsTrigger>
            </TabsList>

            <TabsContent value="mini-sites" className="animate-in fade-in duration-500 outline-none">
              <div className="grid gap-3">
                {subscriptions.length === 0 ? (
                  <EmptyState text="Aucun abonnement Mini-site actif" />
                ) : (
                  subscriptions.filter(s => s.product === 'minisite').map((sub) => (
                    <SubscriptionRow key={sub.id} sub={sub} />
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="s-plan" className="animate-in fade-in duration-500 outline-none">
              <div className="grid gap-3">
                {sPlanUsers.length === 0 ? (
                  <EmptyState text="Aucun abonné S-Plan" />
                ) : (
                  sPlanUsers.map((user) => (
                    <UserRow key={user.id} user={user} badge={getPlanBadge(user.roles)} />
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AdminLayout>
  );
};

// --- COMPOSANTS INTERNES ---

const KPICard = ({ icon, label, value, color }) => (
  <div className="bg-[#080808] border border-white/5 p-5 md:p-6 rounded-[1.5rem] hover:border-white/10 transition-all group">
    <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-4 border transition-colors ${
      color === 'orange' ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' :
      color === 'green' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
      'bg-white/5 border-white/10 text-zinc-400 group-hover:text-white'
    }`}>
      {icon}
    </div>
    <p className="text-[9px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-xl md:text-2xl font-black text-white">{value}</p>
  </div>
);

const SubscriptionRow = ({ sub }) => {
  const statusConfig = {
    active: { class: "bg-green-500/10 text-green-500 border-green-500/20", label: "Actif" },
    past_due: { class: "bg-red-500/10 text-red-500 border-red-500/20", label: "Impayé" },
    trialing: { class: "bg-blue-500/10 text-blue-500 border-blue-500/20", label: "Essai" },
    canceled: { class: "bg-white/5 text-zinc-500 border-white/5", label: "Annulé" },
  }[sub.status] || { class: "bg-white/5 text-zinc-500 border-white/5", label: sub.status };

  return (
    <div className="bg-[#080808] border border-white/5 p-4 md:p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-white/10 transition-all group">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 shrink-0 rounded-full bg-black border border-white/10 flex items-center justify-center text-zinc-600 group-hover:text-orange-500 transition-colors">
          <CreditCard size={18} />
        </div>
        <div className="min-w-0"> {/* min-w-0 permet le truncate du texte long */}
          <h4 className="text-sm font-bold text-white group-hover:text-orange-500 transition-colors truncate">{sub.user_name || sub.user_email}</h4>
          <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider truncate">{sub.user_email}</p>
        </div>
      </div>
      
      <div className="flex flex-wrap items-center gap-3 md:justify-end">
        <Badge className="bg-white/5 border-white/10 text-[9px] font-black uppercase tracking-tighter shrink-0">
          {sub.plan === 'premium' ? 'Premium 15€' : sub.plan === 'standard' ? 'Standard 10€' : 'Starter 1€'}
        </Badge>
        <Badge className={`${statusConfig.class} border rounded-full text-[9px] font-black uppercase shrink-0`}>{statusConfig.label}</Badge>
        <div className="h-8 w-px bg-white/5 mx-2 hidden md:block" />
        <div className="text-left md:text-right w-full md:w-auto mt-2 md:mt-0">
          <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">ID STRIPE</p>
          <p className="text-[10px] font-mono text-zinc-400 break-all">{sub.stripe_subscription_id?.substring(0, 16)}...</p>
        </div>
      </div>
    </div>
  );
};

const UserRow = ({ user, badge }) => (
  <div className="bg-[#080808] border border-white/5 p-4 md:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-white/10 transition-all group">
    <div className="flex items-center gap-4">
      <div className="h-10 w-10 shrink-0 rounded-full bg-black border border-white/10 flex items-center justify-center text-zinc-600 group-hover:text-orange-500 transition-colors">
        <Users size={18} />
      </div>
      <div className="min-w-0">
        <h4 className="text-sm font-bold text-white truncate">{user.first_name} {user.last_name}</h4>
        <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider truncate">{user.email}</p>
      </div>
    </div>
    <div className="flex sm:justify-end">
      {badge}
    </div>
  </div>
);

const EmptyState = ({ text }) => (
  <div className="bg-[#080808] border border-white/5 p-8 md:p-12 rounded-[1.5rem] md:rounded-[2rem] text-center">
    <Hash className="h-8 w-8 md:h-10 md:w-10 text-zinc-800 mx-auto mb-4" />
    <p className="text-zinc-500 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em]">{text}</p>
  </div>
);