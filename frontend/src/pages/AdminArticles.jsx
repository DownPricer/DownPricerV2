import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { Plus, Trash2, Eye, Package, Search, Filter, Loader2, ArrowUpRight, Globe, ShieldCheck, Zap } from 'lucide-react';
import { ImageUpload } from '../components/ImageUpload';
import { SafeImage } from '../components/SafeImage';
import api from '../utils/api';
import { toast } from 'sonner';

export const AdminArticlesPage = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    photos: [],
    price: '',
    reference_price: '',
    category_id: '',
    stock: 1,
    platform_links: { vinted: '', leboncoin: '' },
    visible_public: true,
    visible_seller: true
  });
  const [visibilityFilter, setVisibilityFilter] = useState('all');

  useEffect(() => {
    fetchArticles();
    fetchCategories();
  }, []);

  const fetchArticles = async () => {
    try {
      const response = await api.get('/articles?limit=100');
      setArticles(response.data.articles);
    } catch (error) {
      toast.error('Erreur de synchronisation catalogue');
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Erreur catégories');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const tid = toast.loading("Création de l'article...");
    try {
      const articleData = {
        ...formData,
        price: parseFloat(formData.price),
        reference_price: parseFloat(formData.reference_price),
        stock: parseInt(formData.stock) || 1,
        category_id: formData.category_id || null,
      };

      await api.post('/admin/articles', articleData);
      toast.success('Article injecté dans le catalogue', { id: tid });
      setShowCreateDialog(false);
      setFormData({
        name: '', description: '', photos: [], price: '', reference_price: '',
        category_id: '', stock: 1, platform_links: { vinted: '', leboncoin: '' },
        visible_public: true, visible_seller: true
      });
      fetchArticles();
    } catch (error) {
      toast.error('Échec de la création', { id: tid });
    }
  };

  const handleStockUpdate = async (articleId, newStock) => {
    try {
      await api.patch(`/admin/articles/${articleId}/stock`, { stock: newStock });
      toast.success('Stock synchronisé');
      fetchArticles();
    } catch (error) {
      toast.error('Erreur stock');
    }
  };

  const handleVisibilityToggle = async (articleId, field, value) => {
    try {
      await api.patch(`/admin/articles/${articleId}/visibility`, { [field]: value });
      toast.success('Visibilité mise à jour');
      fetchArticles();
    } catch (error) {
      toast.error('Erreur visibilité');
    }
  };

  const handleDelete = async (articleId) => {
    if (!window.confirm('Supprimer définitivement cet article ?')) return;
    try {
      await api.delete(`/admin/articles/${articleId}`);
      toast.success('Article supprimé');
      fetchArticles();
    } catch (error) {
      toast.error('Erreur suppression');
    }
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description.toLowerCase().includes(searchQuery.toLowerCase());
    if (visibilityFilter === 'public') return matchesSearch && article.visible_public !== false;
    if (visibilityFilter === 'seller') return matchesSearch && article.visible_seller !== false;
    return matchesSearch;
  });

  return (
    <AdminLayout>
      <div className="min-h-screen bg-black text-white p-4 sm:p-6 md:p-12 selection:bg-orange-500/30">
        
        {/* Header Section */}
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-4">
              <Package className="h-3 w-3" /> Catalog Engine
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Gestion des <span className="text-orange-500">Articles</span>
            </h2>
          </div>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-white hover:bg-zinc-200 text-black font-black uppercase tracking-widest text-[10px] h-12 px-8 rounded-full shadow-xl shadow-white/5 transition-all active:scale-95">
                <Plus className="h-4 w-4 mr-2 stroke-[3px]" /> Nouvel Article
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0A0A0A] border-white/10 text-white rounded-[2rem] p-6 md:p-10 w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto no-scrollbar">
              <DialogHeader className="mb-6">
                <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">Création <span className="text-orange-500">Produit</span></DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Nom de l'article *</Label>
                    <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required className="bg-black border-white/10 h-12 rounded-xl focus:border-orange-500/50" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Description Technique *</Label>
                    <Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required rows={4} className="bg-black border-white/10 rounded-2xl focus:border-orange-500/50" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Prix (€)</Label>
                      <Input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} required className="bg-black border-white/10 h-12 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Référence (€)</Label>
                      <Input type="number" step="0.01" value={formData.reference_price} onChange={(e) => setFormData({...formData, reference_price: e.target.value})} required className="bg-black border-white/10 h-12 rounded-xl" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Stock Initial</Label>
                    <Input type="number" value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} required className="bg-black border-white/10 h-12 rounded-xl" />
                  </div>
                </div>

                <div className="p-6 bg-white/5 border border-white/5 rounded-3xl">
                   <ImageUpload images={formData.photos} onChange={(photos) => setFormData({...formData, photos})} maxImages={10} label="Galerie Photos" />
                </div>

                <div className="flex gap-3 pt-6 border-t border-white/[0.03]">
                  <Button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-widest text-xs h-14 rounded-2xl">Finaliser l'article</Button>
                  <Button type="button" variant="ghost" onClick={() => setShowCreateDialog(false)} className="text-zinc-500 font-bold uppercase text-xs h-14 px-8">Annuler</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Toolbar: Search & Filters */}
        <div className="max-w-7xl mx-auto mb-8 space-y-4">
          <div className="bg-[#080808] border border-white/5 p-2 rounded-2xl md:rounded-full flex flex-col md:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
              <Input
                placeholder="Rechercher une référence..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-black border-0 h-10 pl-12 rounded-full text-white placeholder:text-zinc-800 focus:ring-orange-500/20"
              />
            </div>
            <div className="flex items-center gap-2 p-1 bg-black rounded-full w-full md:w-auto">
              <FilterBtn active={visibilityFilter === 'all'} label="Tous" onClick={() => setVisibilityFilter('all')} color="zinc" />
              <FilterBtn active={visibilityFilter === 'public'} label="Public" onClick={() => setVisibilityFilter('public')} color="green" />
              <FilterBtn active={visibilityFilter === 'seller'} label="Revendeur" onClick={() => setVisibilityFilter('seller')} color="purple" />
            </div>
          </div>
        </div>

        {/* Article Grid */}
        {loading ? (
          <div className="flex justify-center py-24"><Loader2 className="h-10 w-10 animate-spin text-orange-500" /></div>
        ) : filteredArticles.length === 0 ? (
          <div className="bg-[#080808] border border-white/5 p-20 rounded-[3rem] text-center max-w-2xl mx-auto">
            <Package className="h-12 w-12 text-zinc-800 mx-auto mb-4" />
            <p className="text-zinc-600 text-xs font-bold uppercase tracking-widest">Aucun article dans cette catégorie</p>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredArticles.map((article) => (
              <ArticleAdminCard 
                key={article.id} 
                article={article} 
                onDelete={handleDelete}
                onStockUpdate={handleStockUpdate}
                onVisibilityToggle={handleVisibilityToggle}
                onEdit={() => navigate(`/admin/articles/${article.id}`)}
                onPreview={() => navigate(`/article/${article.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

// --- COMPOSANTS INTERNES STYLISÉS ---

const FilterBtn = ({ active, label, onClick, color }) => {
  const colors = {
    zinc: active ? "bg-white/10 text-white" : "text-zinc-600 hover:text-white",
    green: active ? "bg-green-500/20 text-green-500" : "text-zinc-600 hover:text-green-500/50",
    purple: active ? "bg-purple-500/20 text-purple-500" : "text-zinc-600 hover:text-purple-500/50",
  };
  return (
    <button onClick={onClick} className={`px-4 h-8 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${colors[color]}`}>
      {label}
    </button>
  );
};

const ArticleAdminCard = ({ article, onDelete, onStockUpdate, onVisibilityToggle, onEdit, onPreview }) => (
  <Card className="bg-[#080808] border-white/5 rounded-[2rem] overflow-hidden hover:border-white/10 transition-all group">
    <div className="aspect-square relative bg-black overflow-hidden">
      {article.photos?.[0] ? (
        <SafeImage src={article.photos[0]} alt={article.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-zinc-900"><Package size={48} /></div>
      )}
      <div className="absolute top-4 left-4 flex gap-2">
        {article.visible_public && <Badge className="bg-green-500 text-black font-black text-[8px] uppercase px-2 py-0 border-0">Public</Badge>}
        {article.visible_seller && <Badge className="bg-purple-500 text-black font-black text-[8px] uppercase px-2 py-0 border-0">Pro</Badge>}
      </div>
    </div>
    
    <CardContent className="p-6">
      <h3 className="font-bold text-white truncate text-base mb-1">{article.name}</h3>
      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-lg font-black text-white">{article.price}€</span>
        <span className="text-[10px] text-zinc-600 line-through">{article.reference_price}€</span>
      </div>

      <div className="space-y-4 pt-4 border-t border-white/[0.03]">
        {/* Stock Control */}
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Unités Stock</span>
          <div className="flex items-center gap-2">
            <input 
              type="number" 
              value={article.stock} 
              onChange={(e) => onStockUpdate(article.id, parseInt(e.target.value))}
              className="bg-black border border-white/10 w-12 h-7 rounded-lg text-[10px] font-bold text-center focus:border-orange-500/50"
            />
            <span className={`text-[9px] font-black uppercase ${article.stock === 0 ? 'text-red-500' : 'text-zinc-500'}`}>
              {article.stock === 0 ? 'Rupture' : 'OK'}
            </span>
          </div>
        </div>

        {/* Fast Toggles */}
        <div className="grid grid-cols-2 gap-2">
          <VisibilityMiniToggle label="Public" checked={article.visible_public} onChange={(v) => onVisibilityToggle(article.id, 'visible_public', v)} color="green" />
          <VisibilityMiniToggle label="Revendeur" checked={article.visible_seller} onChange={(v) => onVisibilityToggle(article.id, 'visible_seller', v)} color="purple" />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <Button variant="outline" size="sm" className="bg-black border-white/5 hover:bg-white/5 rounded-xl h-9 p-0" onClick={onPreview}><Eye size={14}/></Button>
          <Button variant="outline" size="sm" className="bg-black border-white/5 hover:bg-white/5 rounded-xl h-9 text-[9px] font-black uppercase" onClick={onEdit}>Edit</Button>
          <Button variant="ghost" size="sm" className="text-zinc-800 hover:text-red-500 hover:bg-red-500/5 rounded-xl h-9 p-0" onClick={() => onDelete(article.id)}><Trash2 size={14}/></Button>
        </div>
      </div>
    </CardContent>
  </Card>
);

const VisibilityMiniToggle = ({ label, checked, onChange, color }) => {
  const activeClass = color === 'green' ? 'bg-green-500/20 text-green-500 border-green-500/30' : 'bg-purple-500/20 text-purple-500 border-purple-500/30';
  return (
    <button 
      onClick={() => onChange(!checked)}
      className={`h-7 rounded-lg border text-[8px] font-black uppercase tracking-tighter transition-all ${checked ? activeClass : 'bg-black border-white/5 text-zinc-700'}`}
    >
      {label}
    </button>
  );
};