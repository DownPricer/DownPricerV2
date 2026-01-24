import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Globe, Eye, Trash2, ExternalLink, Ban, CheckCircle, Loader2, Package, AlertTriangle, Search, Hash, TrendingUp, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../utils/api';
import { SafeImage } from '../../components/SafeImage';

export const AdminMiniSitesPage = () => {
  const navigate = useNavigate();
  const [miniSites, setMiniSites] = useState([]);
  const [miniSiteArticles, setMiniSiteArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalViews, setTotalViews] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('sites');
  
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState(''); 
  const [selectedItem, setSelectedItem] = useState(null);
  const [actionReason, setActionReason] = useState('');

  useEffect(() => {
    fetchMiniSites();
    fetchMiniSiteArticles();
  }, []);

  const fetchMiniSites = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/minisites');
      const sites = response.data || [];
      setMiniSites(sites);
      const views = sites.reduce((acc, site) => acc + (site.views || 0), 0);
      setTotalViews(views);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const fetchMiniSiteArticles = async () => {
    try {
      const response = await api.get('/admin/minisite-articles');
      setMiniSiteArticles(response.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAction = async () => {
    if (!actionReason.trim()) {
      toast.error('Raison obligatoire');
      return;
    }
    try {
      if (actionType === 'suspend') {
        await api.patch(`/admin/minisites/${selectedItem.id}/status`, { status: 'suspended', reason: actionReason });
        toast.success('Mini-site suspendu');
      } else if (actionType === 'delete') {
        await api.delete(`/admin/minisites/${selectedItem.id}`, { data: { reason: actionReason } });
        toast.success('Mini-site supprimé');
      } else if (actionType === 'activate') {
        await api.patch(`/admin/minisites/${selectedItem.id}/status`, { status: 'active', reason: actionReason });
        toast.success('Mini-site réactivé');
      } else if (actionType === 'suspend-article') {
        await api.patch(`/admin/minisite-articles/${selectedItem.id}/status`, { status: 'suspended', reason: actionReason });
        toast.success('Article suspendu');
        fetchMiniSiteArticles();
      }
      setShowActionModal(false);
      fetchMiniSites();
    } catch (error) {
      toast.error('Erreur technique');
    }
  };

  const activeSitesCount = miniSites.filter(s => s.status === 'active').length;
  const monthlyRevenue = miniSites.filter(s => s.status === 'active').reduce((acc, site) => {
    const planPrices = { 'SITE_PLAN_1': 1, 'SITE_PLAN_2': 10, 'SITE_PLAN_3': 15 };
    return acc + (planPrices[site.plan_id] || 0);
  }, 0);

  const filteredSites = miniSites.filter(site =>
    site.site_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    site.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    site.slug?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredArticles = miniSiteArticles.filter(article =>
    article.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.minisite_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="min-h-screen bg-black text-white p-6 md:p-12 selection:bg-orange-500/30">
        
        {/* Header Section */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] font-black uppercase tracking-widest mb-4">
            <Globe className="h-3 w-3" /> Network Management
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Gestion <span className="text-orange-500">Mini-sites</span>
          </h2>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <KPICard label="Sites Actifs" value={activeSitesCount} icon={<CheckCircle />} color="green" />
          <KPICard label="Suspendus" value={miniSites.filter(s => s.status === 'suspended').length} icon={<Ban />} color="orange" />
          <KPICard label="Vues Totales" value={totalViews} icon={<Eye />} color="white" />
          <KPICard label="Revenus Est." value={`${monthlyRevenue}€`} icon={<DollarSign />} color="orange" />
        </div>

        {/* Search & Navigation */}
        <div className="mb-10 space-y-6">
          <div className="relative group max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 group-focus-within:text-orange-500 transition-colors" />
            <Input
              placeholder="Rechercher un site, un email, un article..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#080808] border-white/5 pl-12 h-12 rounded-2xl focus:border-orange-500/50 focus:ring-orange-500/10"
            />
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-[#080808] border border-white/5 p-1 rounded-full inline-flex h-12">
              <TabsTrigger value="sites" className="rounded-full px-8 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                Mini-sites ({filteredSites.length})
              </TabsTrigger>
              <TabsTrigger value="articles" className="rounded-full px-8 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                Articles ({filteredArticles.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sites" className="mt-8 animate-in fade-in slide-in-from-bottom-2">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSites.map((site) => (
                  <MiniSiteCard 
                    key={site.id} 
                    site={site} 
                    onAction={(type) => openActionModal(type, site)} 
                    onDetail={() => navigate(`/admin/minisites/${site.id}`)}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="articles" className="mt-8 animate-in fade-in slide-in-from-bottom-2">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredArticles.map((article) => (
                  <ArticleCard 
                    key={article.id} 
                    article={article} 
                    onSuspend={() => openActionModal('suspend-article', article)}
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Dialog OLED */}
        <Dialog open={showActionModal} onOpenChange={setShowActionModal}>
          <DialogContent className="bg-[#0A0A0A] border-white/10 text-white rounded-[2rem] p-8 max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
                <AlertTriangle className="text-orange-500" /> 
                {actionType === 'suspend' ? 'Suspension' : actionType === 'delete' ? 'Suppression' : actionType === 'activate' ? 'Activation' : 'Modération Article'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 py-6">
              <div className="bg-black border border-white/5 p-4 rounded-2xl">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Cible</p>
                <p className="text-sm font-bold">{selectedItem?.site_name || selectedItem?.name}</p>
                <p className="text-[10px] font-mono text-zinc-600">{selectedItem?.user_email || selectedItem?.minisite_email}</p>
              </div>
              
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Raison administrative (obligatoire)</Label>
                <Textarea
                  placeholder="Justifiez cette action auprès de l'utilisateur..."
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="bg-black border-white/10 rounded-2xl focus:border-orange-500/50 min-h-[100px]"
                />
              </div>
            </div>

            <DialogFooter className="gap-3">
              <Button variant="ghost" onClick={() => setShowActionModal(false)} className="rounded-xl text-zinc-500 font-bold uppercase text-[10px]">Annuler</Button>
              <Button
                onClick={handleAction}
                className={`rounded-xl px-8 font-black uppercase tracking-widest text-[10px] ${
                  actionType === 'delete' ? 'bg-red-600 hover:bg-red-500' : 
                  actionType === 'activate' ? 'bg-green-600 hover:bg-green-500' : 'bg-orange-600 hover:bg-orange-500'
                }`}
              >
                Confirmer l'opération
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

// --- COMPOSANTS INTERNES STYLISÉS ---

const KPICard = ({ label, value, icon, color }) => {
  const colors = {
    green: "text-green-500 bg-green-500/10 border-green-500/20",
    orange: "text-orange-500 bg-orange-500/10 border-orange-500/20",
    white: "text-white bg-white/5 border-white/10"
  };
  return (
    <div className="bg-[#080808] border border-white/5 p-6 rounded-[1.5rem]">
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-4 border ${colors[color]}`}>
        {React.cloneElement(icon, { size: 18 })}
      </div>
      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-black text-white leading-none">{value}</p>
    </div>
  );
};

const MiniSiteCard = ({ site, onAction, onDetail }) => {
  const statusColors = {
    active: 'bg-green-500/20 text-green-500 border-green-500/20',
    suspended: 'bg-orange-500/20 text-orange-500 border-orange-500/20'
  };

  return (
    <Card className="bg-[#080808] border-white/5 rounded-[2rem] overflow-hidden hover:border-white/10 transition-all group">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-lg text-white truncate leading-none mb-2">{site.site_name}</h3>
            <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-tighter truncate">{site.user_email}</p>
            <p className="text-[10px] font-bold text-orange-500 mt-1 italic opacity-70">/{site.slug}</p>
          </div>
          <Badge className="bg-white/5 text-white border-white/10 rounded-full text-[9px] font-black">
            {site.plan_id === 'SITE_PLAN_3' ? '15€' : site.plan_id === 'SITE_PLAN_2' ? '10€' : '1€'}
          </Badge>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="flex items-center gap-1.5 text-[10px] font-black text-zinc-500 uppercase">
            <Eye size={12} className="text-zinc-700" /> {site.views || 0}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-black text-zinc-500 uppercase">
            <Package size={12} className="text-zinc-700" /> {site.articles?.length || 0} ITEMS
          </div>
        </div>

        {site.suspension_reason && (
          <div className="bg-red-500/5 border border-red-500/10 p-3 rounded-xl mb-6 flex gap-2">
            <AlertTriangle size={12} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-[10px] font-medium text-red-400 line-clamp-2 uppercase tracking-tighter">{site.suspension_reason}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Button size="sm" variant="outline" className="rounded-xl border-white/5 bg-black hover:bg-white/5 text-[9px] font-black uppercase" onClick={() => window.open(`/s/${site.slug}`, '_blank')}>
            <ExternalLink className="h-3 w-3 mr-1" /> Live Preview
          </Button>
          <Button size="sm" variant="outline" className="rounded-xl border-white/5 bg-black hover:bg-white/5 text-[9px] font-black uppercase" onClick={onDetail}>
            Management
          </Button>
          <div className="col-span-2 flex gap-2 mt-2 pt-4 border-t border-white/[0.03]">
            {site.status === 'active' ? (
              <Button size="sm" variant="ghost" className="flex-1 bg-orange-500/5 hover:bg-orange-500/10 text-orange-500 rounded-xl h-9" onClick={() => onAction('suspend')}>
                <Ban size={14} className="mr-2" /> Suspendre
              </Button>
            ) : (
              <Button size="sm" variant="ghost" className="flex-1 bg-green-500/5 hover:bg-green-500/10 text-green-500 rounded-xl h-9" onClick={() => onAction('activate')}>
                <CheckCircle size={14} className="mr-2" /> Réactiver
              </Button>
            )}
            <Button size="sm" variant="ghost" className="bg-red-500/5 hover:bg-red-500/10 text-red-500 rounded-xl h-9 px-4" onClick={() => onAction('delete')}>
              <Trash2 size={14} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ArticleCard = ({ article, onSuspend }) => (
  <Card className={`bg-[#080808] border-white/5 rounded-[1.5rem] overflow-hidden transition-all ${article.status === 'suspended' ? 'opacity-40 grayscale' : 'hover:border-white/10'}`}>
    <div className="aspect-square w-full relative bg-black">
      {article.photos?.[0] ? (
        <SafeImage src={article.photos[0]} alt={article.name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-zinc-800"><Package size={32} /></div>
      )}
      <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-xs font-black">
        {article.price}€
      </div>
    </div>
    <CardContent className="p-4">
      <h4 className="font-bold text-xs text-white truncate mb-1">{article.name}</h4>
      <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-4 truncate">{article.minisite_name}</p>
      
      {article.status !== 'suspended' && (
        <Button size="sm" variant="outline" className="w-full h-8 rounded-lg border-white/5 bg-black hover:bg-red-500/10 hover:text-red-500 text-[9px] font-black uppercase" onClick={onSuspend}>
          <Ban size={10} className="mr-2" /> Modérer
        </Button>
      )}
    </CardContent>
  </Card>
);