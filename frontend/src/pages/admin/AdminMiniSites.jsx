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
import { Globe, Eye, Trash2, ExternalLink, Ban, CheckCircle, Loader2, Package, AlertTriangle, Search } from 'lucide-react';
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
  
  // Modal pour suspension/suppression
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState(''); // 'suspend', 'delete', 'suspend-article'
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
      toast.error('Erreur lors du chargement des mini-sites');
    } finally {
      setLoading(false);
    }
  };

  const fetchMiniSiteArticles = async () => {
    try {
      const response = await api.get('/admin/minisite-articles');
      setMiniSiteArticles(response.data || []);
    } catch (error) {
      console.error('Erreur articles mini-sites:', error);
    }
  };

  const openActionModal = (type, item) => {
    setActionType(type);
    setSelectedItem(item);
    setActionReason('');
    setShowActionModal(true);
  };

  const handleAction = async () => {
    if (!actionReason.trim()) {
      toast.error('Veuillez indiquer une raison');
      return;
    }

    try {
      if (actionType === 'suspend') {
        await api.patch(`/admin/minisites/${selectedItem.id}/status`, {
          status: 'suspended',
          reason: actionReason
        });
        toast.success('Mini-site suspendu');
      } else if (actionType === 'delete') {
        await api.delete(`/admin/minisites/${selectedItem.id}`, {
          data: { reason: actionReason }
        });
        toast.success('Mini-site supprimé');
      } else if (actionType === 'activate') {
        await api.patch(`/admin/minisites/${selectedItem.id}/status`, {
          status: 'active',
          reason: actionReason
        });
        toast.success('Mini-site réactivé');
      } else if (actionType === 'suspend-article') {
        await api.patch(`/admin/minisite-articles/${selectedItem.id}/status`, {
          status: 'suspended',
          reason: actionReason
        });
        toast.success('Article suspendu');
        fetchMiniSiteArticles();
      }
      
      setShowActionModal(false);
      fetchMiniSites();
    } catch (error) {
      toast.error('Erreur lors de l\'action');
    }
  };

  const filteredSites = miniSites.filter(site =>
    site.site_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    site.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    site.slug?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredArticles = miniSiteArticles.filter(article =>
    article.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.minisite_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeSites = miniSites.filter(s => s.status === 'active');
  const monthlyRevenue = activeSites.reduce((acc, site) => {
    const planPrices = { 'SITE_PLAN_1': 1, 'SITE_PLAN_10': 10, 'SITE_PLAN_15': 15 };
    return acc + (planPrices[site.plan_id] || 0);
  }, 0);

  return (
    <AdminLayout>
      <div className="p-4 md:p-8">
        <div className="flex items-center gap-2 mb-6">
          <Globe className="h-8 w-8 text-blue-600" />
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Gestion Mini-sites</h2>
        </div>

        {/* KPIs */}
        <Card className="mb-6">
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs md:text-sm text-slate-500 mb-1">Mini-sites actifs</p>
                <p className="text-xl md:text-3xl font-bold text-slate-900">{activeSites.length}</p>
              </div>
              <div>
                <p className="text-xs md:text-sm text-slate-500 mb-1">Suspendus</p>
                <p className="text-xl md:text-3xl font-bold text-orange-600">{miniSites.filter(s => s.status === 'suspended').length}</p>
              </div>
              <div>
                <p className="text-xs md:text-sm text-slate-500 mb-1">Vues totales</p>
                <p className="text-xl md:text-3xl font-bold text-slate-900">{totalViews}</p>
              </div>
              <div>
                <p className="text-xs md:text-sm text-slate-500 mb-1">Revenus mensuels</p>
                <p className="text-xl md:text-3xl font-bold text-green-600">{monthlyRevenue}€</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search & Tabs */}
        <div className="mb-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sites">Mini-sites ({filteredSites.length})</TabsTrigger>
              <TabsTrigger value="articles">Articles ({filteredArticles.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="sites" className="mt-4">
              {loading ? (
                <Card><CardContent className="p-12 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" /></CardContent></Card>
              ) : filteredSites.length === 0 ? (
                <Card><CardContent className="p-12 text-center text-slate-500">Aucun mini-site trouvé</CardContent></Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredSites.map((site) => (
                    <Card key={site.id} className={`bg-white border-l-4 ${site.status === 'active' ? 'border-l-green-500' : site.status === 'suspended' ? 'border-l-orange-500' : 'border-l-red-500'}`}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-slate-900 truncate">{site.site_name}</h3>
                            <p className="text-sm text-slate-500 truncate">{site.user_email}</p>
                            <p className="text-xs text-slate-400">/{site.slug}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1 ml-2">
                            <Badge className={site.plan_id === 'SITE_PLAN_15' ? 'bg-purple-100 text-purple-800' : site.plan_id === 'SITE_PLAN_10' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}>
                              {site.plan_id === 'SITE_PLAN_15' ? '15€' : site.plan_id === 'SITE_PLAN_10' ? '10€' : '1€'}
                            </Badge>
                          </div>
                        </div>

                        <div className="text-sm text-slate-600 mb-3 flex items-center gap-4">
                          <span><Eye className="h-3 w-3 inline mr-1" />{site.views || 0}</span>
                          <span><Package className="h-3 w-3 inline mr-1" />{site.articles?.length || 0} articles</span>
                        </div>

                        {site.suspension_reason && (
                          <div className="bg-orange-50 text-orange-700 text-xs p-2 rounded mb-3">
                            <AlertTriangle className="h-3 w-3 inline mr-1" />
                            {site.suspension_reason}
                          </div>
                        )}

                        <div className="flex gap-2 flex-wrap">
                          <Button size="sm" variant="outline" onClick={() => window.open(`/s/${site.slug}`, '_blank')}>
                            <ExternalLink className="h-3 w-3 mr-1" />Voir
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => navigate(`/admin/minisites/${site.id}`)}>
                            Détail
                          </Button>
                          {site.status === 'active' ? (
                            <Button size="sm" variant="outline" className="border-orange-300 text-orange-600" onClick={() => openActionModal('suspend', site)}>
                              <Ban className="h-3 w-3" />
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" className="border-green-300 text-green-600" onClick={() => openActionModal('activate', site)}>
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                          )}
                          <Button size="sm" variant="outline" className="border-red-300 text-red-600" onClick={() => openActionModal('delete', site)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="articles" className="mt-4">
              {filteredArticles.length === 0 ? (
                <Card><CardContent className="p-12 text-center text-slate-500">Aucun article de mini-site</CardContent></Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredArticles.map((article) => (
                    <Card key={article.id} className={`bg-white ${article.status === 'suspended' ? 'opacity-60' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex gap-3 mb-3">
                          <div className="w-16 h-16 flex-shrink-0 bg-slate-100 rounded overflow-hidden">
                            {article.photos?.[0] ? (
                              <SafeImage src={article.photos[0]} alt={article.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400"><Package className="h-6 w-6" /></div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-medium text-slate-900 truncate">{article.name}</h4>
                            <p className="text-sm text-slate-500 truncate">{article.minisite_name}</p>
                            <p className="text-lg font-bold text-slate-900">{article.price}€</p>
                          </div>
                        </div>
                        
                        {article.moderation_reason && (
                          <div className="bg-red-50 text-red-700 text-xs p-2 rounded mb-3">
                            {article.moderation_reason}
                          </div>
                        )}

                        <div className="flex gap-2">
                          {article.status !== 'suspended' && (
                            <Button size="sm" variant="outline" className="border-orange-300 text-orange-600" onClick={() => openActionModal('suspend-article', article)}>
                              <Ban className="h-3 w-3 mr-1" />Suspendre
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Modal de confirmation avec raison */}
      <Dialog open={showActionModal} onOpenChange={setShowActionModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              {actionType === 'suspend' ? 'Suspendre le mini-site' :
               actionType === 'delete' ? 'Supprimer le mini-site' :
               actionType === 'activate' ? 'Réactiver le mini-site' :
               'Suspendre l\'article'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {selectedItem && (
              <div className="bg-slate-50 p-3 rounded">
                <p className="font-medium">{selectedItem.site_name || selectedItem.name}</p>
                <p className="text-sm text-slate-500">{selectedItem.user_email || selectedItem.minisite_email}</p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Raison (obligatoire)</Label>
              <Textarea
                placeholder="Indiquez la raison de cette action..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                rows={3}
              />
            </div>
            
            {actionType === 'delete' && (
              <div className="bg-red-50 text-red-700 p-3 rounded text-sm">
                <strong>Attention :</strong> Cette action désactivera également l'abonnement de l'utilisateur et retirera son rôle mini-site.
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActionModal(false)}>Annuler</Button>
            <Button
              onClick={handleAction}
              className={actionType === 'delete' ? 'bg-red-600 hover:bg-red-700' : actionType === 'activate' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'}
            >
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};
