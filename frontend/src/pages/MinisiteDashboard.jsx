// import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Progress } from '../components/ui/progress'; // Assure-toi d'avoir ce composant ou remplace par une div simple
import { 
  Globe, Eye, Share2, Settings, Plus, Copy, Check, Trash2, Mail, 
  AlertTriangle, Zap, Crown, Grid, List, LayoutGrid, Columns, 
  ArrowUpRight, Loader2, ExternalLink, BarChart3, Palette, Box, CheckCircle2
} from 'lucide-react';
import { ImageUpload } from '../components/ImageUpload';
import { SafeImage } from '../components/SafeImage';
import api from '../utils/api';
import { toast } from 'sonner';

// --- CONFIGURATION CONSTANTE ---
const ALL_TEMPLATES = [
  { id: 'modern-grid', name: 'Grille Moderne', desc: 'Style Amazon/E-commerce', icon: Grid },
  { id: 'classic-list', name: 'Liste Classique', desc: 'Style YouTube/Reddit', icon: List },
  { id: 'card-stack', name: 'Cards Empilées', desc: 'Style Spotify/Netflix', icon: Columns },
  { id: 'minimal-clean', name: 'Minimaliste', desc: 'Clean avec espaces', icon: LayoutGrid },
  { id: 'bold-hero', name: 'Hero Bold', desc: 'Gros visuels', icon: ArrowUpRight },
  { id: 'elegant-split', name: 'Split Élégant', desc: 'Vue 1/3 - 2/3', icon: Columns },
  { id: 'masonry-flow', name: 'Masonry', desc: 'Style Pinterest', icon: Grid },
  { id: 'side-scroll', name: 'Scroll Horizontal', desc: 'Carrousel', icon: ArrowUpRight },
  { id: 'full-width', name: 'Pleine Largeur', desc: 'Articles géants', icon: LayoutGrid },
  { id: 'compact-tiles', name: 'Tuiles Compactes', desc: 'Dense et rapide', icon: Grid },
  { id: 'magazine-style', name: 'Style Magazine', desc: 'Mise en page édito', icon: Columns },
  { id: 'portfolio-pro', name: 'Portfolio Pro', desc: 'Galerie pro', icon: LayoutGrid },
  { id: 'showcase-xl', name: 'Showcase XL', desc: 'Mise en avant', icon: ArrowUpRight },
  { id: 'gallery-view', name: 'Vue Galerie', desc: 'Photos focus', icon: Grid },
  { id: 'business-card', name: 'Business Card', desc: 'Pro et sobre', icon: List },
  { id: 'storyteller', name: 'Storyteller', desc: 'Narratif', icon: Columns },
  { id: 'product-focus', name: 'Product Focus', desc: 'Détails produit', icon: LayoutGrid },
  { id: 'dark-luxe', name: 'Dark Luxe', desc: 'Premium sombre', icon: Crown },
  { id: 'bright-fresh', name: 'Bright Fresh', desc: 'Léger et aéré', icon: Zap },
  { id: 'premium-elite', name: 'Premium Elite', desc: 'Haut de gamme', icon: Crown }
];

const ALL_FONTS = [
  'Arial', 'Helvetica', 'Georgia', 'Verdana', 'Roboto', 
  'Open Sans', 'Outfit', 'Lato', 'Montserrat', 'Poppins',
  'Inter', 'Nunito', 'Raleway', 'Oswald', 'Playfair Display',
  'Merriweather', 'Source Sans Pro', 'PT Sans', 'Ubuntu', 'Cabin'
];

export const MinisiteDashboard = () => {
  const navigate = useNavigate();
  const [minisite, setMinisite] = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  
  // Logic state
  const [deleteReason, setDeleteReason] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [supportEmail, setSupportEmail] = useState('support@downpricer.com');
  
  const [articleForm, setArticleForm] = useState({
    name: '',
    description: '',
    photos: [],
    price: '',
    reference_price: '',
    platform_links: { vinted: '', leboncoin: '' },
    show_in_reseller_catalog: false
  });

  const [settingsForm, setSettingsForm] = useState({
    site_name: '',
    logo_url: '',
    welcome_text: '',
    template: 'modern-grid',
    primary_color: '#FF5722',
    font_family: 'Arial'
  });

  useEffect(() => {
    fetchMinisiteData();
    fetchSettings();
  }, []);

  const fetchMinisiteData = async () => {
    try {
      const siteRes = await api.get('/minisites/my');
      setMinisite(siteRes.data);
      setSettingsForm({
        site_name: siteRes.data.site_name,
        logo_url: siteRes.data.logo_url || '',
        welcome_text: siteRes.data.welcome_text || '',
        template: siteRes.data.template || 'modern-grid',
        primary_color: siteRes.data.primary_color || '#FF5722',
        font_family: siteRes.data.font_family || 'Arial'
      });
      
      const articlesResponse = await api.get(`/minisites/${siteRes.data.id}/articles`);
      setArticles(articlesResponse.data);
    } catch (error) {
      if (error.response?.status === 404) {
        navigate('/minisite');
      } else {
        toast.error('Erreur lors du chargement du dashboard');
      }
    }
    setLoading(false);
  };

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings');
      const settings = response.data;
      if (settings.support_email) setSupportEmail(settings.support_email);
      else if (settings.billing_support_email) setSupportEmail(settings.billing_support_email);
      else if (settings.contact_email) setSupportEmail(settings.contact_email);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  // --- Helpers ---
  const getPlanLabel = (planId) => {
    const plans = { 'SITE_PLAN_1': 'Starter', 'SITE_PLAN_10': 'Standard', 'SITE_PLAN_15': 'Premium' };
    return plans[planId] || planId;
  };

  const getPlanQuota = (planId) => {
    const quotas = { 'SITE_PLAN_1': 5, 'SITE_PLAN_10': 10, 'SITE_PLAN_15': 20 };
    return quotas[planId] || 5;
  };

  const getPlanFeatures = (planId) => {
    const features = {
      'SITE_PLAN_1': { templates: ALL_TEMPLATES.slice(0, 3), fonts: ALL_FONTS.slice(0, 3), customColors: false, canShowInResellerCatalog: false },
      'SITE_PLAN_10': { templates: ALL_TEMPLATES.slice(0, 10), fonts: ALL_FONTS.slice(0, 10), customColors: true, canShowInResellerCatalog: true },
      'SITE_PLAN_15': { templates: ALL_TEMPLATES, fonts: ALL_FONTS, customColors: true, canShowInResellerCatalog: true }
    };
    return features[planId] || features['SITE_PLAN_1'];
  };

  // --- Handlers ---
  const handleAddArticle = async () => {
    if (!articleForm.name || !articleForm.price) {
      toast.error('Le nom et le prix sont requis');
      return;
    }
    if (!articleForm.platform_links.vinted && !articleForm.platform_links.leboncoin) {
      toast.error('Ajoutez au moins un lien (Vinted ou Leboncoin)');
      return;
    }
    try {
      await api.post(`/minisites/${minisite.id}/articles`, {
        ...articleForm,
        price: parseFloat(articleForm.price),
        reference_price: parseFloat(articleForm.reference_price) || parseFloat(articleForm.price)
      });
      toast.success('Article ajouté avec succès');
      setShowArticleModal(false);
      setArticleForm({ name: '', description: '', photos: [], price: '', reference_price: '', platform_links: { vinted: '', leboncoin: '' }, show_in_reseller_catalog: false });
      fetchMinisiteData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'ajout');
    }
  };

  const handleDeleteArticle = async (articleId) => {
    if (!window.confirm('Supprimer cet article ?')) return;
    try {
      await api.delete(`/minisites/${minisite.id}/articles/${articleId}`);
      toast.success('Article supprimé');
      fetchMinisiteData();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleDeleteMinisite = async () => {
    if (!deleteReason.trim()) {
      toast.error('Veuillez indiquer une raison');
      return;
    }
    setDeleting(true);
    try {
      await api.delete(`/minisites/${minisite.id}`, { data: { reason: deleteReason } });
      toast.success('Mini-site supprimé');
      navigate('/minisite');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
    setDeleting(false);
  };

  const handleSaveSettings = async () => {
    try {
      await api.put(`/minisites/${minisite.id}`, settingsForm);
      toast.success('Paramètres sauvegardés');
      fetchMinisiteData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur sauvegarde');
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(siteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('URL copiée dans le presse-papier');
  };

  const handleUpgrade = () => navigate('/minisite/upgrade');

  if (loading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div>;
  if (!minisite) return null;

  const siteUrl = `${window.location.origin}/s/${minisite.slug}`;
  const quota = getPlanQuota(minisite.plan_id);
  const features = getPlanFeatures(minisite.plan_id);
  const usagePercent = (articles.length / quota) * 100;

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-orange-500/30">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        
        {/* --- DASHBOARD HEADER --- */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16"></div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-zinc-800 rounded-xl flex items-center justify-center border border-zinc-700 shadow-inner">
                {minisite.logo_url ? (
                   <img src={minisite.logo_url} alt="Logo" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <Globe className="h-8 w-8 text-orange-500" />
                )}
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                  {minisite.site_name}
                  <Badge variant="outline" className="text-xs border-zinc-600 text-zinc-400 font-normal">
                    {getPlanLabel(minisite.plan_id)}
                  </Badge>
                </h1>
                <a href={siteUrl} target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:text-orange-400 text-sm flex items-center gap-1 mt-1 transition-colors group">
                  {siteUrl} <ExternalLink className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                </a>
              </div>
            </div>

            <div className="flex gap-3 w-full md:w-auto">
              <Button onClick={() => window.open(siteUrl, '_blank')} variant="outline" className="flex-1 md:flex-none border-zinc-700 hover:bg-zinc-800 text-white">
                <Eye className="h-4 w-4 mr-2" /> Voir
              </Button>
              <Button onClick={handleCopyUrl} className="flex-1 md:flex-none bg-zinc-100 text-zinc-900 hover:bg-white">
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Share2 className="h-4 w-4 mr-2" />}
                {copied ? 'Copié' : 'Partager'}
              </Button>
            </div>
          </div>
        </div>

        {/* --- TABS NAVIGATION --- */}
        <Tabs defaultValue="articles" className="w-full space-y-8">
          <TabsList className="bg-zinc-900/50 border border-zinc-800 p-1 rounded-xl w-full flex overflow-x-auto no-scrollbar justify-start md:justify-center">
            <TabsTrigger value="articles" className="flex-1 min-w-[100px] data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-lg transition-all">
              <Box className="h-4 w-4 mr-2" /> Articles
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex-1 min-w-[100px] data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-lg transition-all">
              <BarChart3 className="h-4 w-4 mr-2" /> Stats
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex-1 min-w-[100px] data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-lg transition-all">
              <Palette className="h-4 w-4 mr-2" /> Design
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex-1 min-w-[100px] data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-lg transition-all">
              <Settings className="h-4 w-4 mr-2" /> Config
            </TabsTrigger>
          </TabsList>

          {/* === TAB: ARTICLES === */}
          <TabsContent value="articles" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Quota Bar */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row items-center gap-4">
              <div className="flex-1 w-full">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-zinc-400">Utilisation du stockage</span>
                  <span className={usagePercent >= 100 ? "text-red-400 font-bold" : "text-white"}>
                    {articles.length} / {quota} articles
                  </span>
                </div>
                <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                   <div 
                      className={`h-full transition-all duration-500 ${usagePercent >= 100 ? 'bg-red-500' : 'bg-orange-500'}`} 
                      style={{ width: `${Math.min(usagePercent, 100)}%` }}
                   />
                </div>
              </div>
              {minisite.plan_id !== 'SITE_PLAN_15' && (
                <Button size="sm" onClick={handleUpgrade} className="bg-purple-600 hover:bg-purple-700 text-white shrink-0 w-full md:w-auto">
                  <Crown className="h-3 w-3 mr-2" /> Augmenter la limite
                </Button>
              )}
            </div>

            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Catalogue</h2>
              <Button onClick={() => setShowArticleModal(true)} disabled={articles.length >= quota} className="bg-orange-500 hover:bg-orange-600 text-white">
                <Plus className="h-4 w-4 mr-2" /> Nouvel article
              </Button>
            </div>

            {articles.length === 0 ? (
              <div className="border-2 border-dashed border-zinc-800 rounded-2xl p-12 text-center bg-zinc-900/30">
                <div className="h-16 w-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Box className="h-8 w-8 text-zinc-500" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Votre catalogue est vide</h3>
                <p className="text-zinc-400 mb-6">Commencez par ajouter votre premier produit à vendre.</p>
                <Button onClick={() => setShowArticleModal(true)} className="bg-white text-zinc-900 hover:bg-zinc-200">
                  Ajouter un article
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {articles.map((article) => (
                  <Card key={article.id} className="bg-zinc-900 border-zinc-800 overflow-hidden group hover:border-zinc-700 transition-all duration-300">
                    <div className="relative aspect-square bg-zinc-800 overflow-hidden">
                      <SafeImage src={article.photos?.[0]} alt={article.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute top-2 right-2 flex flex-col gap-1">
                        {article.reference_price > article.price && (
                           <Badge className="bg-red-500 text-white border-none font-bold">
                             -{Math.round(((article.reference_price - article.price) / article.reference_price) * 100)}%
                           </Badge>
                        )}
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-white truncate mb-1">{article.name}</h3>
                      <div className="flex justify-between items-end mt-2 mb-4">
                         <div>
                            <p className="text-xs text-zinc-500 line-through">{article.reference_price}€</p>
                            <p className="text-lg font-bold text-orange-500">{article.price}€</p>
                         </div>
                         <div className="flex gap-1">
                            {article.platform_links?.vinted && <div className="h-2 w-2 rounded-full bg-cyan-500" title="Vinted" />}
                            {article.platform_links?.leboncoin && <div className="h-2 w-2 rounded-full bg-orange-400" title="Leboncoin" />}
                         </div>
                      </div>
                      <Button variant="outline" size="sm" className="w-full border-zinc-700 hover:bg-red-950/30 hover:text-red-400 hover:border-red-900/50 transition-colors text-zinc-400" onClick={() => handleDeleteArticle(article.id)}>
                        <Trash2 className="h-3 w-3 mr-2" /> Supprimer
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* === TAB: STATS === */}
          <TabsContent value="stats" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-zinc-900 border-zinc-800">
                   <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-zinc-400">Vues Totales</CardTitle>
                   </CardHeader>
                   <CardContent>
                      <div className="text-4xl font-bold text-white">{minisite.views || 0}</div>
                      <p className="text-xs text-zinc-500 mt-1">Depuis la création</p>
                   </CardContent>
                </Card>
                <Card className="bg-zinc-900 border-zinc-800">
                   <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-zinc-400">Articles Actifs</CardTitle>
                   </CardHeader>
                   <CardContent>
                      <div className="text-4xl font-bold text-white">{articles.length}</div>
                      <p className="text-xs text-zinc-500 mt-1">Sur {quota} autorisés</p>
                   </CardContent>
                </Card>
                <Card className="bg-zinc-900 border-zinc-800">
                   <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-zinc-400">Plan Actuel</CardTitle>
                   </CardHeader>
                   <CardContent>
                      <div className="text-2xl font-bold text-orange-500">{getPlanLabel(minisite.plan_id)}</div>
                      {minisite.plan_id !== 'SITE_PLAN_15' && (
                         <Button variant="link" onClick={handleUpgrade} className="text-purple-400 h-auto p-0 text-xs mt-1 hover:text-purple-300">
                            Passer au niveau supérieur →
                         </Button>
                      )}
                   </CardContent>
                </Card>
             </div>
          </TabsContent>

          {/* === TAB: APPEARANCE === */}
          <TabsContent value="appearance" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle>Design du site</CardTitle>
                <CardDescription>Choisissez l'apparence qui correspond le mieux à votre marque.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                
                {/* Templates Grid */}
                <div>
                   <Label className="text-white mb-4 block">Modèle ({features.templates.length} disponibles)</Label>
                   <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {features.templates.map((t) => {
                         const Icon = t.icon || Grid;
                         const isSelected = settingsForm.template === t.id;
                         return (
                            <div 
                               key={t.id} 
                               onClick={() => setSettingsForm({...settingsForm, template: t.id})}
                               className={`cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 relative overflow-hidden group ${isSelected ? 'border-orange-500 bg-orange-500/10' : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'}`}
                            >
                               {isSelected && <div className="absolute top-2 right-2 text-orange-500"><CheckCircle2 className="h-5 w-5" /></div>}
                               <div className={`h-12 w-12 rounded-lg flex items-center justify-center mb-3 ${isSelected ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-400 group-hover:bg-zinc-700 group-hover:text-zinc-200'}`}>
                                  <Icon className="h-6 w-6" />
                               </div>
                               <h4 className={`font-semibold text-sm ${isSelected ? 'text-white' : 'text-zinc-300'}`}>{t.name}</h4>
                               <p className="text-xs text-zinc-500 mt-1 line-clamp-1">{t.desc}</p>
                            </div>
                         )
                      })}
                   </div>
                   {features.templates.length < 20 && (
                      <div className="mt-4 p-4 rounded-xl border border-purple-500/30 bg-purple-900/10 flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <Crown className="h-5 w-5 text-purple-400" />
                            <span className="text-sm text-purple-200">Débloquez +10 templates premium avec le plan supérieur</span>
                         </div>
                         <Button size="sm" variant="secondary" onClick={handleUpgrade} className="bg-purple-600 hover:bg-purple-700 text-white border-none">Voir les offres</Button>
                      </div>
                   )}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                   <div className="space-y-3">
                      <Label className="text-zinc-300">Typographie</Label>
                      <Select value={settingsForm.font_family} onValueChange={(val) => setSettingsForm({...settingsForm, font_family: val})}>
                         <SelectTrigger className="bg-zinc-950 border-zinc-700 text-white h-12">
                            <SelectValue />
                         </SelectTrigger>
                         <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                            {features.fonts.map(f => (
                               <SelectItem key={f} value={f} style={{fontFamily: f}}>{f}</SelectItem>
                            ))}
                         </SelectContent>
                      </Select>
                   </div>
                   <div className="space-y-3">
                      <Label className="text-zinc-300">Couleur Principale</Label>
                      <div className="flex gap-3">
                         <div className="h-12 w-12 rounded-lg overflow-hidden border border-zinc-700 shadow-sm shrink-0">
                            <input 
                               type="color" 
                               value={settingsForm.primary_color} 
                               onChange={(e) => features.customColors && setSettingsForm({...settingsForm, primary_color: e.target.value})} 
                               className={`w-full h-full cursor-pointer p-0 border-0 ${!features.customColors && 'opacity-50'}`}
                               disabled={!features.customColors}
                            />
                         </div>
                         <Input 
                            value={settingsForm.primary_color} 
                            onChange={(e) => features.customColors && setSettingsForm({...settingsForm, primary_color: e.target.value})} 
                            className="bg-zinc-950 border-zinc-700 text-white h-12 font-mono"
                            disabled={!features.customColors}
                         />
                      </div>
                      {!features.customColors && <p className="text-xs text-zinc-500 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Nécessite un plan supérieur</p>}
                   </div>
                </div>

                <Button onClick={handleSaveSettings} className="w-full md:w-auto bg-orange-600 hover:bg-orange-700 h-12 px-8 text-lg">
                   Enregistrer le design
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* === TAB: SETTINGS === */}
          <TabsContent value="settings" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="grid md:grid-cols-2 gap-6">
                
                {/* General Info */}
                <Card className="bg-zinc-900 border-zinc-800 md:col-span-2">
                   <CardHeader><CardTitle>Informations Générales</CardTitle></CardHeader>
                   <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <Label>Nom du site</Label>
                            <Input value={settingsForm.site_name} onChange={(e) => setSettingsForm({...settingsForm, site_name: e.target.value})} className="bg-zinc-950 border-zinc-700 text-white" />
                         </div>
                         <div className="space-y-2">
                            <Label>Logo (URL)</Label>
                            <Input value={settingsForm.logo_url} onChange={(e) => setSettingsForm({...settingsForm, logo_url: e.target.value})} placeholder="https://..." className="bg-zinc-950 border-zinc-700 text-white" />
                         </div>
                      </div>
                      <div className="space-y-2">
                         <Label>Message de bienvenue</Label>
                         <Textarea value={settingsForm.welcome_text} onChange={(e) => setSettingsForm({...settingsForm, welcome_text: e.target.value})} className="bg-zinc-950 border-zinc-700 text-white min-h-[100px]" />
                      </div>
                      <Button onClick={handleSaveSettings} className="bg-orange-600 hover:bg-orange-700">Enregistrer les infos</Button>
                   </CardContent>
                </Card>

                {/* Subscription */}
                <Card className="bg-zinc-900 border-zinc-800">
                   <CardHeader><CardTitle>Abonnement</CardTitle></CardHeader>
                   <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-lg border border-zinc-800">
                         <div>
                            <p className="font-bold text-white">{getPlanLabel(minisite.plan_id)}</p>
                            <p className="text-xs text-zinc-500">Renouvellement mensuel</p>
                         </div>
                         {minisite.plan_id !== 'SITE_PLAN_15' && (
                            <Button size="sm" onClick={handleUpgrade} className="bg-purple-600 hover:bg-purple-700">Upgrade</Button>
                         )}
                      </div>
                      <Button variant="ghost" className="w-full text-zinc-400 hover:text-white" onClick={() => setShowCancelModal(true)}>
                         <Mail className="h-4 w-4 mr-2" /> Demander l'annulation
                      </Button>
                   </CardContent>
                </Card>

                {/* Danger Zone */}
                <Card className="bg-red-950/10 border-red-900/30">
                   <CardHeader><CardTitle className="text-red-500">Zone de danger</CardTitle></CardHeader>
                   <CardContent>
                      <p className="text-sm text-zinc-400 mb-4">La suppression est définitive et entraînera la perte de toutes vos données.</p>
                      <Button variant="outline" className="w-full border-red-900/50 text-red-500 hover:bg-red-950" onClick={() => setShowDeleteModal(true)}>
                         Supprimer mon site
                      </Button>
                   </CardContent>
                </Card>
             </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* --- MODALS --- */}
      
      {/* 1. Add Article Modal */}
      <Dialog open={showArticleModal} onOpenChange={setShowArticleModal}>
        <DialogContent className="bg-zinc-900 text-white border-zinc-800 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ajouter un article</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
             <ImageUpload images={articleForm.photos} onChange={(photos) => setArticleForm({...articleForm, photos})} maxImages={5} label="Photos du produit" />
             
             <div className="space-y-3">
                <Label>Informations principales</Label>
                <Input placeholder="Nom de l'article (ex: iPhone 13)" value={articleForm.name} onChange={(e) => setArticleForm({...articleForm, name: e.target.value})} className="bg-zinc-950 border-zinc-700" />
                <Textarea placeholder="Description détaillée..." value={articleForm.description} onChange={(e) => setArticleForm({...articleForm, description: e.target.value})} className="bg-zinc-950 border-zinc-700" />
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <Label>Prix de vente (€)</Label>
                   <Input type="number" value={articleForm.price} onChange={(e) => setArticleForm({...articleForm, price: e.target.value})} className="bg-zinc-950 border-zinc-700" />
                </div>
                <div className="space-y-2">
                   <Label>Prix de référence (€)</Label>
                   <Input type="number" value={articleForm.reference_price} onChange={(e) => setArticleForm({...articleForm, reference_price: e.target.value})} className="bg-zinc-950 border-zinc-700" />
                </div>
             </div>

             <div className="space-y-3">
                <Label>Liens vers les plateformes</Label>
                <div className="flex gap-2 items-center">
                   <div className="w-24 text-sm text-zinc-400">Vinted</div>
                   <Input placeholder="https://vinted..." value={articleForm.platform_links.vinted} onChange={(e) => setArticleForm({...articleForm, platform_links: {...articleForm.platform_links, vinted: e.target.value}})} className="bg-zinc-950 border-zinc-700" />
                </div>
                <div className="flex gap-2 items-center">
                   <div className="w-24 text-sm text-zinc-400">Leboncoin</div>
                   <Input placeholder="https://leboncoin..." value={articleForm.platform_links.leboncoin} onChange={(e) => setArticleForm({...articleForm, platform_links: {...articleForm.platform_links, leboncoin: e.target.value}})} className="bg-zinc-950 border-zinc-700" />
                </div>
             </div>

             {features.canShowInResellerCatalog && (
                <div className="flex items-center space-x-2 bg-blue-900/20 p-3 rounded-lg border border-blue-900/30">
                   <input type="checkbox" id="reseller" checked={articleForm.show_in_reseller_catalog} onChange={(e) => setArticleForm({...articleForm, show_in_reseller_catalog: e.target.checked})} className="rounded border-zinc-700 bg-zinc-950 text-orange-500 focus:ring-orange-500" />
                   <label htmlFor="reseller" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Rendre visible dans le catalogue revendeur (B2B)
                   </label>
                </div>
             )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowArticleModal(false)}>Annuler</Button>
            <Button onClick={handleAddArticle} className="bg-orange-600 hover:bg-orange-700">Ajouter l'article</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. Cancel Subscription Modal */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent className="bg-zinc-900 text-white border-zinc-800">
          <DialogHeader><DialogTitle>Annulation</DialogTitle></DialogHeader>
          <DialogDescription className="text-zinc-400">
             Pour annuler, envoyez un email au support. Cliquez ci-dessous pour ouvrir votre client mail.
          </DialogDescription>
          <div className="py-4 flex justify-center">
             <Button variant="outline" className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white" onClick={() => window.location.href = `mailto:${supportEmail}?subject=Annulation abonnement`}>
                <Mail className="mr-2 h-4 w-4" /> Contacter {supportEmail}
             </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 3. Delete Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="bg-zinc-900 text-white border-zinc-800">
          <DialogHeader>
             <DialogTitle className="text-red-500 flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Suppression définitive</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
             <p className="text-zinc-300">Veuillez indiquer la raison de la suppression pour confirmer.</p>
             <Textarea value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)} placeholder="Raison..." className="bg-zinc-950 border-zinc-700" />
          </div>
          <DialogFooter>
             <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>Annuler</Button>
             <Button onClick={handleDeleteMinisite} disabled={!deleteReason.trim() || deleting} className="bg-red-600 hover:bg-red-700">
                {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Supprimer
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};