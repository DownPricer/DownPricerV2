// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Header } from '../components/Header';
// import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
// import { Button } from '../components/ui/button';
// import { Input } from '../components/ui/input';
// import { Label } from '../components/ui/label';
// import { Textarea } from '../components/ui/textarea';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
// import { Badge } from '../components/ui/badge';
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
// import { Globe, Eye, Share2, Settings, Plus, Copy, Check, Trash2, Mail, AlertTriangle, Zap, Crown, Grid, List, LayoutGrid, Columns, ArrowUpRight, X, Loader2 } from 'lucide-react';
// import { ImageUpload } from '../components/ImageUpload';
// import { SafeImage } from '../components/SafeImage';
// import api from '../utils/api';
// import { toast } from 'sonner';

// export const MinisiteDashboard = () => {
//   const navigate = useNavigate();
//   const [minisite, setMinisite] = useState(null);
//   const [articles, setArticles] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [showArticleModal, setShowArticleModal] = useState(false);
//   const [showDeleteModal, setShowDeleteModal] = useState(false);
//   const [showCancelModal, setShowCancelModal] = useState(false);
//   const [deleteReason, setDeleteReason] = useState('');
//   const [deleting, setDeleting] = useState(false);
//   const [copied, setCopied] = useState(false);
//   const [supportEmail, setSupportEmail] = useState('support@downpricer.com');
  
//   const [articleForm, setArticleForm] = useState({
//     name: '',
//     description: '',
//     photos: [],
//     price: '',
//     reference_price: '',
//     platform_links: { vinted: '', leboncoin: '' },
//     show_in_reseller_catalog: false
//   });

//   const [settingsForm, setSettingsForm] = useState({
//     site_name: '',
//     logo_url: '',
//     welcome_text: '',
//     template: 'modern-grid',
//     primary_color: '#FF5722',
//     font_family: 'Arial'
//   });

//   // Templates avec descriptions et preview icons
//   const ALL_TEMPLATES = [
//     { id: 'modern-grid', name: 'Grille Moderne', desc: 'Style Amazon/E-commerce', icon: Grid },
//     { id: 'classic-list', name: 'Liste Classique', desc: 'Style YouTube/Reddit', icon: List },
//     { id: 'card-stack', name: 'Cards Empilées', desc: 'Style Spotify/Netflix', icon: Columns },
//     { id: 'minimal-clean', name: 'Minimaliste', desc: 'Clean avec espaces', icon: LayoutGrid },
//     { id: 'bold-hero', name: 'Hero Bold', desc: 'Gros visuels', icon: ArrowUpRight },
//     { id: 'elegant-split', name: 'Split Élégant', desc: 'Vue 1/3 - 2/3', icon: Columns },
//     { id: 'masonry-flow', name: 'Masonry', desc: 'Style Pinterest', icon: Grid },
//     { id: 'side-scroll', name: 'Scroll Horizontal', desc: 'Carrousel', icon: ArrowUpRight },
//     { id: 'full-width', name: 'Pleine Largeur', desc: 'Articles géants', icon: LayoutGrid },
//     { id: 'compact-tiles', name: 'Tuiles Compactes', desc: 'Dense et rapide', icon: Grid },
//     { id: 'magazine-style', name: 'Style Magazine', desc: 'Mise en page édito', icon: Columns },
//     { id: 'portfolio-pro', name: 'Portfolio Pro', desc: 'Galerie pro', icon: LayoutGrid },
//     { id: 'showcase-xl', name: 'Showcase XL', desc: 'Mise en avant', icon: ArrowUpRight },
//     { id: 'gallery-view', name: 'Vue Galerie', desc: 'Photos focus', icon: Grid },
//     { id: 'business-card', name: 'Business Card', desc: 'Pro et sobre', icon: List },
//     { id: 'storyteller', name: 'Storyteller', desc: 'Narratif', icon: Columns },
//     { id: 'product-focus', name: 'Product Focus', desc: 'Détails produit', icon: LayoutGrid },
//     { id: 'dark-luxe', name: 'Dark Luxe', desc: 'Premium sombre', icon: Crown },
//     { id: 'bright-fresh', name: 'Bright Fresh', desc: 'Léger et aéré', icon: Zap },
//     { id: 'premium-elite', name: 'Premium Elite', desc: 'Haut de gamme', icon: Crown }
//   ];

//   const ALL_FONTS = [
//     'Arial', 'Helvetica', 'Georgia', 'Verdana', 'Roboto', 
//     'Open Sans', 'Outfit', 'Lato', 'Montserrat', 'Poppins',
//     'Inter', 'Nunito', 'Raleway', 'Oswald', 'Playfair Display',
//     'Merriweather', 'Source Sans Pro', 'PT Sans', 'Ubuntu', 'Cabin'
//   ];

//   useEffect(() => {
//     fetchMinisiteData();
//     fetchSettings();
//   }, []);

//   const fetchMinisiteData = async () => {
//     try {
//       const siteRes = await api.get('/minisites/my');
//       setMinisite(siteRes.data);
//       setSettingsForm({
//         site_name: siteRes.data.site_name,
//         logo_url: siteRes.data.logo_url || '',
//         welcome_text: siteRes.data.welcome_text || '',
//         template: siteRes.data.template || 'modern-grid',
//         primary_color: siteRes.data.primary_color || '#FF5722',
//         font_family: siteRes.data.font_family || 'Arial'
//       });
      
//       const articlesResponse = await api.get(`/minisites/${siteRes.data.id}/articles`);
//       setArticles(articlesResponse.data);
//     } catch (error) {
//       if (error.response?.status === 404) {
//         navigate('/minisite');
//       } else {
//         toast.error('Erreur lors du chargement');
//       }
//     }
//     setLoading(false);
//   };

//   const fetchSettings = async () => {
//     try {
//       const response = await api.get('/settings');
//       const settings = response.data;
//       if (settings.support_email) setSupportEmail(settings.support_email);
//       else if (settings.billing_support_email) setSupportEmail(settings.billing_support_email);
//       else if (settings.contact_email) setSupportEmail(settings.contact_email);
//     } catch (error) {
//       console.error('Error fetching settings:', error);
//     }
//   };

//   const getPlanLabel = (planId) => {
//     const plans = {
//       'SITE_PLAN_1': 'Starter (1€/mois)',
//       'SITE_PLAN_2': 'Standard (10€/mois)',
//       'SITE_PLAN_3': 'Premium (15€/mois)'
//     };
//     return plans[planId] || planId;
//   };

//   const getPlanQuota = (planId) => {
//     const quotas = { 'SITE_PLAN_1': 5, 'SITE_PLAN_2': 10, 'SITE_PLAN_3': 20 };
//     return quotas[planId] || 5;
//   };

//   const getPlanFeatures = (planId) => {
//     const features = {
//       'SITE_PLAN_1': {
//         templates: ALL_TEMPLATES.slice(0, 3),
//         fonts: ALL_FONTS.slice(0, 3),
//         customColors: false,
//         canShowInResellerCatalog: false
//       },
//       'SITE_PLAN_2': {
//         templates: ALL_TEMPLATES.slice(0, 10),
//         fonts: ALL_FONTS.slice(0, 10),
//         customColors: true,
//         canShowInResellerCatalog: true
//       },
//       'SITE_PLAN_3': {
//         templates: ALL_TEMPLATES,
//         fonts: ALL_FONTS,
//         customColors: true,
//         canShowInResellerCatalog: true
//       }
//     };
//     return features[planId] || features['SITE_PLAN_1'];
//   };

//   const handleAddArticle = async () => {
//     if (!articleForm.name || !articleForm.price) {
//       toast.error('Nom et prix requis');
//       return;
//     }
//     if (!articleForm.platform_links.vinted && !articleForm.platform_links.leboncoin) {
//       toast.error('Au moins un lien (Vinted ou Leboncoin) requis');
//       return;
//     }
//     try {
//       await api.post(`/minisites/${minisite.id}/articles`, {
//         ...articleForm,
//         price: parseFloat(articleForm.price),
//         reference_price: parseFloat(articleForm.reference_price) || parseFloat(articleForm.price)
//       });
//       toast.success('Article ajouté');
//       setShowArticleModal(false);
//       setArticleForm({ name: '', description: '', photos: [], price: '', reference_price: '', platform_links: { vinted: '', leboncoin: '' }, show_in_reseller_catalog: false, condition: '', show_in_public_catalog: false, contact_email: '', discord_tag: '' });
//       fetchMinisiteData();
//     } catch (error) {
//       toast.error(error.response?.data?.detail || 'Erreur');
//     }
//   };

//   const handleDeleteArticle = async (articleId) => {
//     if (!window.confirm('Supprimer cet article ?')) return;
//     try {
//       await api.delete(`/minisites/${minisite.id}/articles/${articleId}`);
//       toast.success('Article supprimé');
//       fetchMinisiteData();
//     } catch (error) {
//       toast.error('Erreur lors de la suppression');
//     }
//   };

//   const handleDeleteMinisite = async () => {
//     if (!deleteReason.trim()) {
//       toast.error('Veuillez indiquer une raison');
//       return;
//     }
//     setDeleting(true);
//     try {
//       await api.delete(`/minisites/${minisite.id}`, { data: { reason: deleteReason } });
//       toast.success('Mini-site supprimé');
//       navigate('/minisite');
//     } catch (error) {
//       toast.error('Erreur lors de la suppression');
//     }
//     setDeleting(false);
//   };

//   const handleSaveSettings = async () => {
//     try {
//       await api.put(`/minisites/${minisite.id}`, settingsForm);
//       toast.success('Paramètres mis à jour');
//       fetchMinisiteData();
//     } catch (error) {
//       toast.error(error.response?.data?.detail || 'Erreur lors de la mise à jour');
//     }
//   };

//   const handleCopyUrl = () => {
//     navigator.clipboard.writeText(siteUrl);
//     setCopied(true);
//     setTimeout(() => setCopied(false), 2000);
//     toast.success('URL copiée !');
//   };

//   const handleUpgrade = () => {
//     navigate('/minisite/upgrade');
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
//         <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
//       </div>
//     );
//   }

//   if (!minisite) return null;

//   const siteUrl = `${window.location.origin}/s/${minisite.slug}`;
//   const quota = getPlanQuota(minisite.plan_id);
//   const features = getPlanFeatures(minisite.plan_id);

//   return (
//     <div className="min-h-screen bg-zinc-950 text-white">
//       <Header />
      
//       <main className="container mx-auto px-4 py-8">
//         {/* Header */}
//         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
//           <div>
//             <h1 className="text-2xl md:text-3xl font-bold text-orange-500 flex items-center gap-2">
//               <Globe className="h-7 w-7" /> {minisite.site_name}
//             </h1>
//             <p className="text-zinc-400 text-sm mt-1">/{minisite.slug}</p>
//           </div>
//           <div className="flex flex-wrap gap-2">
//             <Badge className="bg-zinc-800 text-orange-400">{getPlanLabel(minisite.plan_id)}</Badge>
//             {minisite.plan_id !== 'SITE_PLAN_3' && (
//               <Button size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={handleUpgrade}>
//                 <Crown className="h-4 w-4 mr-1" /> Upgrade
//               </Button>
//             )}
//           </div>
//         </div>

//         <Tabs defaultValue="articles" className="w-full">
//           <TabsList className="bg-zinc-900 border-zinc-800 w-full flex overflow-x-auto">
//             <TabsTrigger value="articles" className="flex-1 data-[state=active]:bg-orange-500">
//               Articles ({articles.length}/{quota})
//             </TabsTrigger>
//             <TabsTrigger value="share" className="flex-1 data-[state=active]:bg-orange-500">Partage</TabsTrigger>
//             <TabsTrigger value="stats" className="flex-1 data-[state=active]:bg-orange-500">Stats</TabsTrigger>
//             <TabsTrigger value="appearance" className="flex-1 data-[state=active]:bg-orange-500">Apparence</TabsTrigger>
//             <TabsTrigger value="settings" className="flex-1 data-[state=active]:bg-orange-500">Param.</TabsTrigger>
//           </TabsList>

//           {/* Tab Articles */}
//           <TabsContent value="articles" className="mt-6">
//             <div className="flex justify-between items-center mb-4">
//               <h2 className="text-xl font-semibold">Mes articles</h2>
//               <Button onClick={() => setShowArticleModal(true)} disabled={articles.length >= quota} className="bg-orange-600 hover:bg-orange-700">
//                 <Plus className="h-4 w-4 mr-2" /> Ajouter un article
//               </Button>
//             </div>
            
//             {articles.length >= quota && (
//               <Card className="bg-orange-900/20 border-orange-500/50 mb-4">
//                 <CardContent className="p-4 flex items-center gap-3">
//                   <AlertTriangle className="h-5 w-5 text-orange-500" />
//                   <div>
//                     <p className="text-orange-400 font-medium">Limite atteinte ({quota} articles max)</p>
//                     <p className="text-sm text-zinc-400">Passez au plan supérieur pour ajouter plus d'articles</p>
//                   </div>
//                   <Button size="sm" className="ml-auto bg-purple-600 hover:bg-purple-700" onClick={handleUpgrade}>
//                     <Crown className="h-4 w-4 mr-1" /> Upgrade
//                   </Button>
//                 </CardContent>
//               </Card>
//             )}

//             {articles.length === 0 ? (
//               <Card className="bg-zinc-900 border-zinc-800">
//                 <CardContent className="p-12 text-center">
//                   <p className="text-zinc-400">Aucun article. Ajoutez votre premier article !</p>
//                 </CardContent>
//               </Card>
//             ) : (
//               <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
//                 {articles.map((article) => (
//                   <Card key={article.id} className="bg-zinc-900 border-zinc-800 overflow-hidden">
//                     <div className="h-40 bg-zinc-800">
//                       <SafeImage src={article.photos?.[0]} alt={article.name} className="w-full h-full object-cover" />
//                     </div>
//                     <CardContent className="p-4">
//                       <h3 className="font-semibold text-white truncate mb-1">{article.name}</h3>
//                       <p className="text-sm text-zinc-400 line-clamp-2 mb-2">{article.description}</p>
//                       <div className="flex justify-between items-center mb-3">
//                         <span className="text-lg font-bold text-orange-500">{article.price}€</span>
//                         {article.reference_price > article.price && (
//                           <Badge className="bg-green-600">-{Math.round(((article.reference_price - article.price) / article.reference_price) * 100)}%</Badge>
//                         )}
//                       </div>
//                       <Button size="sm" variant="outline" className="w-full border-red-400 text-red-400 hover:bg-red-900/20" onClick={() => handleDeleteArticle(article.id)}>
//                         <Trash2 className="h-4 w-4 mr-1" /> Supprimer
//                       </Button>
//                     </CardContent>
//                   </Card>
//                 ))}
//               </div>
//             )}
//           </TabsContent>

//           {/* Tab Partage */}
//           <TabsContent value="share" className="mt-6">
//             <Card className="bg-zinc-900 border-zinc-800">
//               <CardHeader><CardTitle className="text-orange-500">Partager votre mini-site</CardTitle></CardHeader>
//               <CardContent className="space-y-4">
//                 <div className="space-y-2">
//                   <Label className="text-zinc-300">URL publique</Label>
//                   <div className="flex gap-2">
//                     <Input value={siteUrl} readOnly className="bg-zinc-800 border-zinc-700 text-white" />
//                     <Button onClick={handleCopyUrl} className="bg-orange-600 hover:bg-orange-700">
//                       {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
//                     </Button>
//                   </div>
//                 </div>
//                 <Button onClick={() => window.open(siteUrl, '_blank')} className="bg-blue-600 hover:bg-blue-700">
//                   <Globe className="h-4 w-4 mr-2" /> Voir mon site
//                 </Button>
//               </CardContent>
//             </Card>
//           </TabsContent>

//           {/* Tab Stats */}
//           <TabsContent value="stats" className="mt-6">
//             <div className="grid md:grid-cols-3 gap-4">
//               <Card className="bg-zinc-900 border-zinc-800">
//                 <CardContent className="p-6">
//                   <p className="text-sm text-orange-400 font-medium mb-1">Vues totales</p>
//                   <p className="text-3xl font-bold text-white">{minisite.views || 0}</p>
//                 </CardContent>
//               </Card>
//               <Card className="bg-zinc-900 border-zinc-800">
//                 <CardContent className="p-6">
//                   <p className="text-sm text-orange-400 font-medium mb-1">Articles en ligne</p>
//                   <p className="text-3xl font-bold text-white">{articles.length}</p>
//                 </CardContent>
//               </Card>
//               <Card className="bg-zinc-900 border-zinc-800">
//                 <CardContent className="p-6">
//                   <p className="text-sm text-orange-400 font-medium mb-1">Plan actuel</p>
//                   <p className="text-lg font-bold text-white">{getPlanLabel(minisite.plan_id)}</p>
//                   {minisite.plan_id !== 'SITE_PLAN_3' && (
//                     <Button size="sm" className="mt-2 bg-purple-600 hover:bg-purple-700" onClick={handleUpgrade}>
//                       <Crown className="h-4 w-4 mr-1" /> Upgrade
//                     </Button>
//                   )}
//                 </CardContent>
//               </Card>
//             </div>
//           </TabsContent>

//           {/* Tab Apparence - TEMPLATES EN GRILLE */}
//           <TabsContent value="appearance" className="mt-6">
//             <Card className="bg-zinc-900 border-zinc-800">
//               <CardHeader>
//                 <CardTitle className="text-orange-500">Choisir un template</CardTitle>
//                 <p className="text-sm text-zinc-400">{features.templates.length} templates disponibles avec votre plan</p>
//               </CardHeader>
//               <CardContent>
//                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
//                   {features.templates.map((t) => {
//                     const IconComponent = t.icon || Grid;
//                     const isSelected = settingsForm.template === t.id;
//                     return (
//                       <div
//                         key={t.id}
//                         onClick={() => setSettingsForm({...settingsForm, template: t.id})}
//                         className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
//                           isSelected 
//                             ? 'border-orange-500 bg-orange-500/10' 
//                             : 'border-zinc-700 hover:border-zinc-600 bg-zinc-800/50'
//                         }`}
//                       >
//                         <div className={`h-16 flex items-center justify-center mb-2 ${isSelected ? 'text-orange-500' : 'text-zinc-400'}`}>
//                           <IconComponent className="h-8 w-8" />
//                         </div>
//                         <h3 className={`font-medium text-sm ${isSelected ? 'text-orange-500' : 'text-white'}`}>{t.name}</h3>
//                         <p className="text-xs text-zinc-500">{t.desc}</p>
//                         {isSelected && <Badge className="mt-2 bg-orange-600 text-xs">Actif</Badge>}
//                       </div>
//                     );
//                   })}
//                 </div>

//                 {features.templates.length < 20 && (
//                   <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4 flex items-center gap-3">
//                     <Crown className="h-6 w-6 text-purple-500" />
//                     <div className="flex-1">
//                       <p className="text-purple-400 font-medium">{20 - features.templates.length} templates supplémentaires disponibles</p>
//                       <p className="text-xs text-zinc-400">Passez au plan supérieur pour plus de choix</p>
//                     </div>
//                     <Button size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={handleUpgrade}>Upgrade</Button>
//                   </div>
//                 )}

//                 <div className="mt-6 space-y-4">
//                   <div className="space-y-2">
//                     <Label className="text-zinc-300">Police ({features.fonts.length} disponibles)</Label>
//                     <Select value={settingsForm.font_family} onValueChange={(val) => setSettingsForm({...settingsForm, font_family: val})}>
//                       <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white"><SelectValue /></SelectTrigger>
//                       <SelectContent className="bg-zinc-900 border-zinc-700 max-h-60">
//                         {features.fonts.map(f => (
//                           <SelectItem key={f} value={f} className="text-white hover:bg-zinc-800" style={{fontFamily: f}}>{f}</SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                   </div>

//                   <div className="space-y-2">
//                     <Label className="text-zinc-300">Couleur principale</Label>
//                     {features.customColors ? (
//                       <div className="flex gap-2">
//                         <Input type="color" value={settingsForm.primary_color} onChange={(e) => setSettingsForm({...settingsForm, primary_color: e.target.value})} className="w-20 h-10" />
//                         <Input value={settingsForm.primary_color} onChange={(e) => setSettingsForm({...settingsForm, primary_color: e.target.value})} className="bg-zinc-800 border-zinc-700 text-white" />
//                       </div>
//                     ) : (
//                       <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-zinc-500 text-sm">
//                         🔒 Couleurs personnalisées disponibles avec le plan Standard ou Premium
//                       </div>
//                     )}
//                   </div>

//                   <Button onClick={handleSaveSettings} className="bg-orange-600 hover:bg-orange-700">Enregistrer l'apparence</Button>
//                 </div>
//               </CardContent>
//             </Card>
//           </TabsContent>

//           {/* Tab Paramètres */}
//           <TabsContent value="settings" className="mt-6 space-y-6">
//             <Card className="bg-zinc-900 border-zinc-800">
//               <CardHeader><CardTitle className="text-orange-500">Informations du site</CardTitle></CardHeader>
//               <CardContent className="space-y-4">
//                 <div className="space-y-2">
//                   <Label className="text-zinc-300">Nom du site</Label>
//                   <Input value={settingsForm.site_name} onChange={(e) => setSettingsForm({...settingsForm, site_name: e.target.value})} className="bg-zinc-800 border-zinc-700 text-white" />
//                 </div>
//                 <div className="space-y-2">
//                   <Label className="text-zinc-300">Logo (URL)</Label>
//                   <Input value={settingsForm.logo_url} onChange={(e) => setSettingsForm({...settingsForm, logo_url: e.target.value})} placeholder="https://exemple.com/logo.png" className="bg-zinc-800 border-zinc-700 text-white" />
//                 </div>
//                 <div className="space-y-2">
//                   <Label className="text-zinc-300">Texte de bienvenue</Label>
//                   <Textarea value={settingsForm.welcome_text} onChange={(e) => setSettingsForm({...settingsForm, welcome_text: e.target.value})} rows={3} className="bg-zinc-800 border-zinc-700 text-white" />
//                 </div>
//                 <Button onClick={handleSaveSettings} className="bg-orange-600 hover:bg-orange-700">Enregistrer</Button>
//               </CardContent>
//             </Card>

//             {/* Plan & Abonnement */}
//             <Card className="bg-zinc-900 border-zinc-800">
//               <CardHeader><CardTitle className="text-orange-500">Plan & Abonnement</CardTitle></CardHeader>
//               <CardContent className="space-y-4">
//                 <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg">
//                   <div>
//                     <p className="font-medium text-white">{getPlanLabel(minisite.plan_id)}</p>
//                     <p className="text-sm text-zinc-400">{articles.length}/{quota} articles utilisés</p>
//                   </div>
//                   {minisite.plan_id !== 'SITE_PLAN_3' && (
//                     <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleUpgrade}>
//                       <Crown className="h-4 w-4 mr-1" /> Upgrade
//                     </Button>
//                   )}
//                 </div>

//                 <div className="p-4 bg-zinc-800/50 rounded-lg">
//                   <div className="flex items-start gap-3">
//                     <Mail className="h-5 w-5 text-zinc-400 mt-0.5" />
//                     <div>
//                       <p className="font-medium text-white">Annuler l'abonnement</p>
//                       <p className="text-sm text-zinc-400 mb-2">Pour annuler votre abonnement, veuillez contacter notre support :</p>
//                       <Button variant="outline" className="border-zinc-600 text-zinc-300" onClick={() => setShowCancelModal(true)}>
//                         <Mail className="h-4 w-4 mr-2" /> {supportEmail}
//                       </Button>
//                     </div>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>

//             {/* Zone de danger */}
//             <Card className="bg-red-900/10 border-red-500/30">
//               <CardHeader><CardTitle className="text-red-500">Zone de danger</CardTitle></CardHeader>
//               <CardContent>
//                 <p className="text-zinc-400 text-sm mb-4">
//                   La suppression de votre mini-site est irréversible. Tous vos articles seront supprimés et votre abonnement sera annulé.
//                 </p>
//                 <Button variant="outline" className="border-red-500 text-red-500 hover:bg-red-500/10" onClick={() => setShowDeleteModal(true)}>
//                   <Trash2 className="h-4 w-4 mr-2" /> Supprimer mon mini-site
//                 </Button>
//               </CardContent>
//             </Card>
//           </TabsContent>
//         </Tabs>
//       </main>

//       {/* Modal Ajouter Article */}
//       <Dialog open={showArticleModal} onOpenChange={setShowArticleModal}>
//         <DialogContent className="bg-zinc-900 text-white border-zinc-800 max-w-[95vw] md:max-w-2xl max-h-[90vh] overflow-y-auto">
//           <DialogHeader><DialogTitle className="text-orange-500">Ajouter un article</DialogTitle></DialogHeader>
//           <div className="space-y-4 py-4">
//             <ImageUpload images={articleForm.photos} onChange={(photos) => setArticleForm({...articleForm, photos})} maxImages={5} label="Images de l'article" />
//             <div className="space-y-2">
//               <Label className="text-zinc-300">Nom de l'article *</Label>
//               <Input value={articleForm.name} onChange={(e) => setArticleForm({...articleForm, name: e.target.value})} placeholder="Ex: iPhone 13 128Go" className="bg-zinc-800 border-zinc-700 text-white" />
//             </div>
//             <div className="space-y-2">
//               <Label className="text-zinc-300">Description</Label>
//               <Textarea value={articleForm.description} onChange={(e) => setArticleForm({...articleForm, description: e.target.value})} rows={3} className="bg-zinc-800 border-zinc-700 text-white" />
//             </div>
//             <div className="grid grid-cols-2 gap-4">
//               <div className="space-y-2">
//                 <Label className="text-zinc-300">Prix de vente (€) *</Label>
//                 <Input type="number" value={articleForm.price} onChange={(e) => setArticleForm({...articleForm, price: e.target.value})} placeholder="50" className="bg-zinc-800 border-zinc-700 text-white" />
//               </div>
//               <div className="space-y-2">
//                 <Label className="text-zinc-300">Prix de référence (€)</Label>
//                 <Input type="number" value={articleForm.reference_price} onChange={(e) => setArticleForm({...articleForm, reference_price: e.target.value})} placeholder="100" className="bg-zinc-800 border-zinc-700 text-white" />
//               </div>
//             </div>
//             <div className="space-y-2">
//               <Label className="text-zinc-300">Lien Vinted *</Label>
//               <Input value={articleForm.platform_links.vinted} onChange={(e) => setArticleForm({...articleForm, platform_links: {...articleForm.platform_links, vinted: e.target.value}})} placeholder="https://vinted.fr/..." className="bg-zinc-800 border-zinc-700 text-white" />
//             </div>
//             <div className="space-y-2">
//               <Label className="text-zinc-300">Lien Leboncoin</Label>
//               <Input value={articleForm.platform_links.leboncoin} onChange={(e) => setArticleForm({...articleForm, platform_links: {...articleForm.platform_links, leboncoin: e.target.value}})} placeholder="https://leboncoin.fr/..." className="bg-zinc-800 border-zinc-700 text-white" />
//             </div>
//             {features.canShowInResellerCatalog && (
//               <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer ${articleForm.show_in_reseller_catalog ? 'border-blue-500 bg-blue-500/10' : 'border-zinc-700 bg-zinc-800/50'}`}>
//                 <input type="checkbox" checked={articleForm.show_in_reseller_catalog} onChange={(e) => setArticleForm({...articleForm, show_in_reseller_catalog: e.target.checked})} className="w-5 h-5 accent-blue-500" />
//                 <div>
//                   <span className="text-sm font-medium text-zinc-300">Afficher dans le catalogue revendeurs</span>
//                   <p className="text-xs text-zinc-500">Les autres vendeurs pourront voir cet article</p>
//                 </div>
//               </label>
//             )}
//           </div>
//           <DialogFooter>
//             <Button variant="outline" onClick={() => setShowArticleModal(false)} className="border-zinc-700 text-white">Annuler</Button>
//             <Button onClick={handleAddArticle} className="bg-orange-600 hover:bg-orange-700">Ajouter</Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* Modal Annuler Abonnement */}
//       <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
//         <DialogContent className="bg-zinc-900 text-white border-zinc-800">
//           <DialogHeader><DialogTitle className="text-orange-500">Annuler l'abonnement</DialogTitle></DialogHeader>
//           <div className="py-4">
//             <div className="bg-zinc-800 p-4 rounded-lg mb-4">
//               <p className="text-zinc-300 mb-2">Pour annuler votre abonnement, veuillez nous contacter par email :</p>
//               <a href={`mailto:${supportEmail}?subject=Annulation abonnement mini-site&body=Bonjour,%0A%0AJe souhaite annuler mon abonnement mini-site.%0A%0ASlug: ${minisite?.slug}%0APlan: ${getPlanLabel(minisite?.plan_id)}%0A%0ACordialement`} className="text-orange-500 hover:underline font-medium text-lg">
//                 {supportEmail}
//               </a>
//             </div>
//             <p className="text-sm text-zinc-500">Notre équipe traitera votre demande dans les 24-48h.</p>
//           </div>
//           <DialogFooter>
//             <Button onClick={() => setShowCancelModal(false)} className="bg-zinc-700 hover:bg-zinc-600">Fermer</Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* Modal Supprimer Mini-site */}
//       <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
//         <DialogContent className="bg-zinc-900 text-white border-zinc-800">
//           <DialogHeader>
//             <DialogTitle className="text-red-500 flex items-center gap-2">
//               <AlertTriangle className="h-5 w-5" /> Supprimer le mini-site
//             </DialogTitle>
//           </DialogHeader>
//           <div className="py-4 space-y-4">
//             <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-lg">
//               <p className="text-red-400 font-medium mb-2">⚠️ Cette action est irréversible</p>
//               <ul className="text-sm text-zinc-400 space-y-1">
//                 <li>• Tous vos articles seront supprimés</li>
//                 <li>• Votre URL publique sera désactivée</li>
//                 <li>• Votre abonnement sera annulé</li>
//               </ul>
//             </div>
//             <div className="space-y-2">
//               <Label className="text-zinc-300">Raison de la suppression (obligatoire)</Label>
//               <Textarea value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)} rows={3} placeholder="Indiquez pourquoi vous souhaitez supprimer votre mini-site..." className="bg-zinc-800 border-zinc-700 text-white" />
//             </div>
//           </div>
//           <DialogFooter className="gap-2">
//             <Button variant="outline" onClick={() => setShowDeleteModal(false)} className="border-zinc-700 text-white">Annuler</Button>
//             <Button onClick={handleDeleteMinisite} disabled={!deleteReason.trim() || deleting} className="bg-red-600 hover:bg-red-700">
//               {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
//               Supprimer définitivement
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// };
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { resolveMinisiteEntry, getUserPlanRole } from '../utils/minisiteAccess';
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
import { 
  Globe, Eye, Share2, Settings, Plus, Check, Trash2, Mail, 
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
  // L'erreur venait d'ici : useState doit être importé de 'react'
  const [minisite, setMinisite] = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  
  // Modals state
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [editingArticleId, setEditingArticleId] = useState(null);
  
  // Logic state
  const [deleteReason, setDeleteReason] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [supportEmail, setSupportEmail] = useState('support@downpricer.com');
  const [paymentsEnabled, setPaymentsEnabled] = useState(false);
  
  const [articleForm, setArticleForm] = useState({
    name: '',
    description: '',
    photos: [],
    price: '',
    reference_price: '',
    platform_links: { vinted: '', leboncoin: '' },
    show_in_reseller_catalog: false,
    condition: '',
    show_in_public_catalog: false,
    contact_email: '',
    discord_tag: ''
  });

  const [settingsForm, setSettingsForm] = useState({
    site_name: '',
    logo_url: '',
    welcome_text: '',
    template: 'modern-grid',
    primary_color: '#FF5722',
    font_family: 'Arial'
  });

  const pollTimeoutsRef = useRef([]);
  const isMountedRef = useRef(true);
  const didRunRef = useRef(false);

  useEffect(() => {
    if (didRunRef.current) return;
    didRunRef.current = true;
    isMountedRef.current = true;

    fetchMinisiteData();
    fetchSettings();
    fetchSubscription();

    // Vérifier si on revient d'un paiement Stripe réussi
    const urlParams = new URLSearchParams(window.location.search);
    const stripeSuccess = urlParams.get('stripe');
    const sessionId = urlParams.get('session_id');

    if (stripeSuccess === 'success' && sessionId) {
      // Pas de polling ici: un seul check (déjà fait au mount)
      window.history.replaceState({}, '', window.location.pathname);
    }

    // Cleanup: annuler tous les timeouts à l'unmount
    return () => {
      isMountedRef.current = false;
      pollTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      pollTimeoutsRef.current = [];
    };
  }, []);
  
  const pollSubscriptionActivation = (maxAttempts = 20) => {
    let attempts = 0;
    const pollInterval = 2000; // 2 secondes
    
    const poll = async () => {
      // Arrêter si le composant est démonté
      if (!isMountedRef.current) return;
      
      attempts++;
      
      try {
        // Vérifier l'abonnement
        const subResponse = await api.get('/billing/subscription');
        const subscription = subResponse.data;
        
        // Vérifier l'utilisateur (rôles) - rafraîchir les données
        const userResponse = await api.get('/auth/me');
        const user = userResponse.data;
        
        const hasPlanRole = user.roles?.some(role => 
          ['SITE_PLAN_1', 'SITE_PLAN_2', 'SITE_PLAN_3'].includes(role)
        );
        
        if (subscription?.has_subscription && hasPlanRole) {
          // Abonnement activé ! Vérifier si le minisite a été créé
          try {
            const siteRes = await api.get('/minisites/my');
            if (siteRes.data && siteRes.data.id) {
              // Minisite créé !
              if (isMountedRef.current) {
                toast.success('Abonnement activé avec succès !');
                fetchMinisiteData();
                fetchSubscription();
              }
              return;
            } else {
              // Pas encore de minisite créé, continuer à poller
              if (attempts < maxAttempts && isMountedRef.current) {
                const timeout = setTimeout(poll, pollInterval);
                pollTimeoutsRef.current.push(timeout);
              } else if (isMountedRef.current) {
                // Après plusieurs tentatives, rediriger vers la création
                toast.info('Abonnement activé ! Redirection vers la création de votre mini-site...');
                navigate('/minisite/create', { replace: true });
              }
              return;
            }
          } catch (siteError) {
            // 404 est normal si pas de minisite encore créé
            if (siteError.response?.status === 404) {
              // Pas de minisite encore, continuer à poller
              if (attempts < maxAttempts && isMountedRef.current) {
                const timeout = setTimeout(poll, pollInterval);
                pollTimeoutsRef.current.push(timeout);
              } else if (isMountedRef.current) {
                // Après plusieurs tentatives, rediriger vers la création
                toast.info('Abonnement activé ! Redirection vers la création de votre mini-site...');
                navigate('/minisite/create', { replace: true });
              }
              return;
            } else {
              // Autre erreur => logger et continuer à poller
              console.error('Erreur lors de la vérification du minisite:', siteError);
              if (attempts < maxAttempts && isMountedRef.current) {
                const timeout = setTimeout(poll, pollInterval);
                pollTimeoutsRef.current.push(timeout);
              }
            }
          }
        } else if (attempts < maxAttempts && isMountedRef.current) {
          const timeout = setTimeout(poll, pollInterval);
          pollTimeoutsRef.current.push(timeout);
        } else if (isMountedRef.current) {
          toast.warning('L\'activation prend plus de temps que prévu. Veuillez rafraîchir la page dans quelques instants.');
        }
      } catch (error) {
        console.error('Error polling subscription:', error);
        if (attempts < maxAttempts && isMountedRef.current) {
          const timeout = setTimeout(poll, pollInterval);
          pollTimeoutsRef.current.push(timeout);
        }
      }
    };
    
    // Démarrer le polling après un court délai
    const initialTimeout = setTimeout(poll, 1000);
    pollTimeoutsRef.current.push(initialTimeout);
  };

  const fetchMinisiteData = async () => {
    try {
      const siteRes = await api.get('/minisites/my');
      if (isMountedRef.current) {
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
      }
    } catch (error) {
      const status = error.response?.status;
      
      if (status === 404 || status === 403) {
        // 404 = pas de minisite encore créé (CAS NORMAL)
        // 403 = peut être ADMIN sans plan, vérifier quand même
        try {
          // Récupérer user pour résoudre la route
          const userResponse = await api.get('/auth/me');
          
          if (!isMountedRef.current) return;
          
          const user = userResponse.data;
          const minisiteExists = false; // On sait qu'il n'existe pas (404/403)
          
          // Résoudre la route d'entrée
          const entryRoute = resolveMinisiteEntry(user, minisiteExists);
          navigate(entryRoute, { replace: true });
        } catch (userError) {
          console.error('Erreur lors de la vérification:', userError);
          // En cas d'erreur, rediriger vers landing
          if (isMountedRef.current) {
            navigate('/minisite', { replace: true });
          }
        }
        return;
      } else {
        // Autre erreur => afficher un message d'erreur
        console.error('Erreur lors du chargement du minisite:', error);
        if (isMountedRef.current) {
          toast.error('Erreur lors du chargement du dashboard');
        }
      }
    }
    
    if (isMountedRef.current) {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings/public');
      const settings = response.data;
      if (settings.support_email) setSupportEmail(settings.support_email);
      else if (settings.billing_support_email) setSupportEmail(settings.billing_support_email);
      else if (settings.contact_email) setSupportEmail(settings.contact_email);
      setPaymentsEnabled(settings.payments_enabled || false);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchSubscription = async () => {
    try {
      const response = await api.get('/billing/subscription');
      setSubscription(response.data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const response = await api.post('/billing/portal');
      window.location.href = response.data.url;
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'ouverture du portail');
    }
  };

  const handleSubscribe = async (plan) => {
    try {
      const response = await api.post('/billing/minisite/checkout', { plan });
      window.location.href = response.data.url;
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la création de la session');
    }
  };

  // --- Helpers ---
  const getPlanLabel = (planId) => {
    const plans = { 'SITE_PLAN_1': 'Starter', 'SITE_PLAN_2': 'Standard', 'SITE_PLAN_3': 'Premium' };
    return plans[planId] || planId;
  };

  const getPlanQuota = (planId) => {
    const quotas = { 'SITE_PLAN_1': 5, 'SITE_PLAN_2': 10, 'SITE_PLAN_3': 20 };
    return quotas[planId] || 5;
  };

  const getPlanFeatures = (planId) => {
    const features = {
      'SITE_PLAN_1': { templates: ALL_TEMPLATES.slice(0, 3), fonts: ALL_FONTS.slice(0, 3), customColors: false, canShowInResellerCatalog: false },
      'SITE_PLAN_2': { templates: ALL_TEMPLATES.slice(0, 10), fonts: ALL_FONTS.slice(0, 10), customColors: true, canShowInResellerCatalog: true },
      'SITE_PLAN_3': { templates: ALL_TEMPLATES, fonts: ALL_FONTS, customColors: true, canShowInResellerCatalog: true }
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
      const articleData = {
        ...articleForm,
        price: parseFloat(articleForm.price),
        reference_price: parseFloat(articleForm.reference_price) || parseFloat(articleForm.price)
      };
      
      if (editingArticleId) {
        // Mise à jour d'un article existant
        await api.put(`/minisites/${minisite.id}/articles/${editingArticleId}`, articleData);
        toast.success('Article modifié avec succès');
      } else {
        // Création d'un nouvel article
        await api.post(`/minisites/${minisite.id}/articles`, articleData);
        toast.success('Article ajouté avec succès');
      }
      
      setShowArticleModal(false);
      setEditingArticleId(null);
      setArticleForm({ name: '', description: '', photos: [], price: '', reference_price: '', platform_links: { vinted: '', leboncoin: '' }, show_in_reseller_catalog: false, condition: '', show_in_public_catalog: false, contact_email: '', discord_tag: '' });
      fetchMinisiteData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'opération');
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
  
  // Si pas de minisite mais l'utilisateur a un rôle plan => afficher CTA pour créer
  if (!minisite) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-orange-500/30">
        <main className="container mx-auto px-4 py-16">
          <Card className="bg-gradient-to-r from-orange-900/20 to-red-900/20 border-orange-500/50 max-w-2xl mx-auto">
            <CardContent className="p-8 text-center space-y-6">
              <div className="h-16 w-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto">
                <Globe className="h-8 w-8 text-orange-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Configurez votre mini-site</h2>
                <p className="text-zinc-400">
                  Votre abonnement est actif ! Il est temps de créer et configurer votre mini-site pour commencer à vendre.
                </p>
              </div>
              <Button
                onClick={() => navigate('/minisite/create')}
                className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-6 text-lg"
              >
                <Settings className="h-5 w-5 mr-2" />
                Configurer mon mini-site
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const siteUrl = `${window.location.origin}/s/${minisite.slug}`;
  const quota = getPlanQuota(minisite.plan_id);
  const features = getPlanFeatures(minisite.plan_id);
  const usagePercent = (articles.length / quota) * 100;

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-orange-500/30">
      <main className="container mx-auto px-4 py-8">
        
        {/* --- DASHBOARD HEADER --- */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16"></div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-zinc-800 rounded-xl flex items-center justify-center border border-zinc-700 shadow-inner">
                {minisite.logo_url ? (
                   <SafeImage src={minisite.logo_url} alt="Logo" className="w-full h-full object-cover rounded-xl" />
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
              {minisite.plan_id !== 'SITE_PLAN_3' && (
                <Button size="sm" onClick={handleUpgrade} className="bg-purple-600 hover:bg-purple-700 text-white shrink-0 w-full md:w-auto">
                  <Crown className="h-3 w-3 mr-2" /> Augmenter la limite
                </Button>
              )}
            </div>

            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Catalogue</h2>
              <Button onClick={() => {
              setEditingArticleId(null);
              setArticleForm({ name: '', description: '', photos: [], price: '', reference_price: '', platform_links: { vinted: '', leboncoin: '' }, show_in_reseller_catalog: false, condition: '', show_in_public_catalog: false, contact_email: '', discord_tag: '' });
              setShowArticleModal(true);
            }} disabled={articles.length >= quota} className="bg-orange-500 hover:bg-orange-600 text-white">
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
                  <Card 
                    key={article.id} 
                    className="bg-zinc-900 border-zinc-800 overflow-hidden group hover:border-zinc-700 transition-all duration-300 cursor-pointer"
                    onClick={() => {
                      // Remplir le formulaire avec les données de l'article
                      setArticleForm({
                        name: article.name,
                        description: article.description || '',
                        photos: article.photos || [],
                        price: article.price.toString(),
                        reference_price: article.reference_price.toString(),
                        platform_links: article.platform_links || { vinted: '', leboncoin: '' },
                        show_in_reseller_catalog: article.show_in_reseller_catalog || false,
                        condition: article.condition || '',
                        show_in_public_catalog: article.show_in_public_catalog || false,
                        contact_email: article.contact_email || '',
                        discord_tag: article.discord_tag || ''
                      });
                      setEditingArticleId(article.id);
                      setShowArticleModal(true);
                    }}
                  >
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
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full border-zinc-700 hover:bg-red-950/30 hover:text-red-400 hover:border-red-900/50 transition-colors text-zinc-400" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteArticle(article.id);
                        }}
                      >
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
                      {minisite.plan_id !== 'SITE_PLAN_3' && (
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
                         <div className="space-y-2 md:col-span-2">
                            <Label>Logo</Label>
                            <ImageUpload 
                              images={settingsForm.logo_url ? [settingsForm.logo_url] : []} 
                              onChange={(logos) => setSettingsForm({...settingsForm, logo_url: logos[0] || ''})} 
                              maxImages={1}
                              label="Logo du site"
                              placeholder="https://exemple.com/logo.png"
                            />
                         </div>
                      </div>
                      <div className="space-y-2">
                         <Label>Message de bienvenue</Label>
                         <Textarea value={settingsForm.welcome_text} onChange={(e) => setSettingsForm({...settingsForm, welcome_text: e.target.value})} className="bg-zinc-950 border-zinc-700 text-white min-h-[100px]" />
                      </div>
                      <Button onClick={handleSaveSettings} className="bg-orange-600 hover:bg-orange-700">Enregistrer les infos</Button>
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
            <DialogTitle>{editingArticleId ? 'Modifier l\'article' : 'Ajouter un article'}</DialogTitle>
            <DialogDescription>{editingArticleId ? 'Modifiez les informations de l\'article ci-dessous.' : 'Remplissez les informations ci-dessous pour publier votre article.'}</DialogDescription>
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

             <div className="space-y-2">
                <Label>État de l'article</Label>
                <Select value={articleForm.condition || ''} onValueChange={(value) => setArticleForm({...articleForm, condition: value})}>
                   <SelectTrigger className="bg-zinc-950 border-zinc-700 text-white">
                      <SelectValue placeholder="Sélectionner l'état..." />
                   </SelectTrigger>
                   <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                      <SelectItem value="Neuf">Neuf</SelectItem>
                      <SelectItem value="Très bon état">Très bon état</SelectItem>
                      <SelectItem value="Bon état">Bon état</SelectItem>
                      <SelectItem value="État correct">État correct</SelectItem>
                      <SelectItem value="Pour pièces">Pour pièces</SelectItem>
                   </SelectContent>
                </Select>
             </div>

             {features.canShowInResellerCatalog && (
                <>
                  <div className="flex items-center space-x-2 bg-blue-900/20 p-3 rounded-lg border border-blue-900/30">
                     <input type="checkbox" id="reseller" checked={articleForm.show_in_reseller_catalog} onChange={(e) => setArticleForm({...articleForm, show_in_reseller_catalog: e.target.checked})} className="rounded border-zinc-700 bg-zinc-950 text-orange-500 focus:ring-orange-500" />
                     <label htmlFor="reseller" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Rendre visible dans le catalogue revendeur (B2B)
                     </label>
                  </div>
                  {articleForm.show_in_reseller_catalog && minisite?.plan_id === 'SITE_PLAN_3' && (
                    <div className="space-y-2">
                      <Label className="text-zinc-300">Pseudo Discord *</Label>
                      <Input
                        type="text"
                        value={articleForm.discord_tag}
                        onChange={(e) => setArticleForm({...articleForm, discord_tag: e.target.value})}
                        placeholder="votre_pseudo#1234"
                        required={articleForm.show_in_reseller_catalog}
                        className="bg-zinc-800 border-zinc-700 text-white"
                      />
                      <p className="text-xs text-zinc-500">Votre pseudo Discord pour les contacts B2B</p>
                    </div>
                  )}
                </>
             )}

             {minisite?.plan_id === 'SITE_PLAN_3' && (
                <>
                  <div className="flex items-center space-x-2 bg-purple-900/20 p-3 rounded-lg border border-purple-900/30">
                     <input type="checkbox" id="public_catalog" checked={articleForm.show_in_public_catalog} onChange={(e) => setArticleForm({...articleForm, show_in_public_catalog: e.target.checked})} className="rounded border-zinc-700 bg-zinc-950 text-purple-500 focus:ring-purple-500" />
                     <label htmlFor="public_catalog" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Afficher cet article dans le catalogue public DownPricer (downpricer.com)
                     </label>
                  </div>
                  {articleForm.show_in_public_catalog && (
                    <div className="space-y-2">
                      <Label className="text-zinc-300">Email de contact *</Label>
                      <Input
                        type="email"
                        value={articleForm.contact_email}
                        onChange={(e) => setArticleForm({...articleForm, contact_email: e.target.value})}
                        placeholder="votre@email.com"
                        required={articleForm.show_in_public_catalog}
                        className="bg-zinc-800 border-zinc-700 text-white"
                      />
                      <p className="text-xs text-zinc-500">Cet email sera affiché sur la page détail de l'article dans le catalogue public</p>
                    </div>
                  )}
                </>
             )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => {
              setShowArticleModal(false);
              setEditingArticleId(null);
              setArticleForm({ name: '', description: '', photos: [], price: '', reference_price: '', platform_links: { vinted: '', leboncoin: '' }, show_in_reseller_catalog: false, condition: '', show_in_public_catalog: false, contact_email: '', discord_tag: '' });
            }}>Annuler</Button>
            <Button onClick={handleAddArticle} className="bg-orange-600 hover:bg-orange-700">{editingArticleId ? 'Enregistrer les modifications' : 'Ajouter l\'article'}</Button>
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
             <DialogDescription>Cette action est irréversible.</DialogDescription>
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