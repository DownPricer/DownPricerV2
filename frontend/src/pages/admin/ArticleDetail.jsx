import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { ArrowLeft, Save, Loader2, Trash2, Package, Eye, ShieldCheck, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../utils/api';
import { ImageUpload } from '../../components/ImageUpload';
import { SafeImage } from '../../components/SafeImage';

export const AdminArticleDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [article, setArticle] = useState(null);
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

  useEffect(() => {
    fetchArticle();
    fetchCategories();
  }, [id]);

  const fetchArticle = async () => {
    try {
      const response = await api.get(`/articles/${id}`);
      const data = response.data;
      setArticle(data);
      setFormData({
        name: data.name || '',
        description: data.description || '',
        photos: data.photos || [],
        price: data.price?.toString() || '',
        reference_price: data.reference_price?.toString() || '',
        category_id: data.category_id || '',
        stock: data.stock || 1,
        platform_links: data.platform_links || { vinted: '', leboncoin: '' },
        visible_public: data.visible_public !== false,
        visible_seller: data.visible_seller !== false
      });
    } catch (error) {
      toast.error('Erreur lors du chargement');
      navigate('/admin/articles');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data || []);
    } catch (error) {
      console.error('Erreur categories:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/admin/articles/${id}`, {
        ...formData,
        price: parseFloat(formData.price),
        reference_price: parseFloat(formData.reference_price),
        stock: parseInt(formData.stock)
      });
      toast.success('Article mis à jour');
      navigate('/admin/articles');
    } catch (error) {
      toast.error('Erreur de mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Supprimer définitivement cet article ?')) return;
    try {
      await api.delete(`/admin/articles/${id}`);
      toast.success('Article supprimé');
      navigate('/admin/articles');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-black flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-black text-white p-6 md:p-12 selection:bg-orange-500/30">
        
        {/* Header & Back Action */}
        <div className="max-w-5xl mx-auto mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <button 
              onClick={() => navigate('/admin/articles')}
              className="group flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Retour Catalogue</span>
            </button>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Edition <span className="text-orange-500">Produit</span>
            </h1>
          </div>

          <div className="flex gap-3">
             <Button 
                type="button" 
                variant="ghost" 
                className="bg-red-500/5 hover:bg-red-500/10 text-red-500 border border-red-500/10 rounded-xl px-6 font-black uppercase text-[10px] tracking-widest"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" /> Supprimer
              </Button>
          </div>
        </div>

        <div className="max-w-5xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* --- SECTION 1: VISUELS --- */}
            <Card className="bg-[#080808] border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
              <CardHeader className="p-8 pb-4 border-b border-white/[0.03]">
                <CardTitle className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 flex items-center gap-3">
                  <ImageIcon size={16} className="text-orange-500" /> Galerie Media
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                {formData.photos.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
                    {formData.photos.map((photo, idx) => (
                      <div key={idx} className="relative group aspect-square rounded-2xl overflow-hidden border border-white/10 bg-black">
                        <SafeImage src={photo} alt={`Image ${idx}`} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => setFormData({...formData, photos: formData.photos.filter((_, i) => i !== idx)})}
                            className="bg-red-500 text-white rounded-full p-2 hover:scale-110 transition-transform shadow-lg"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 border-2 border-dashed border-white/5 rounded-3xl text-center mb-8">
                    <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">Aucun visuel enregistré</p>
                  </div>
                )}
                
                <div className="bg-black/40 p-6 rounded-3xl border border-white/5">
                  <ImageUpload
                    images={formData.photos}
                    onChange={(photos) => setFormData({...formData, photos})}
                    maxImages={10}
                    label="Uploader de nouvelles photos"
                  />
                </div>
              </CardContent>
            </Card>

            {/* --- SECTION 2: INFOS & PRIX --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-2 bg-[#080808] border-white/5 rounded-[2.5rem] shadow-2xl">
                <CardHeader className="p-8 pb-0">
                  <CardTitle className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 flex items-center gap-3">
                    <Package size={16} className="text-orange-500" /> Détails Techniques
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <Field label="Désignation" value={formData.name} onChange={(v) => setFormData({...formData, name: v})} required />
                    
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Catégorie</Label>
                      <Select value={formData.category_id} onValueChange={(val) => setFormData({...formData, category_id: val})}>
                        <SelectTrigger className="bg-black border-white/10 h-12 rounded-xl text-white focus:ring-orange-500/20">
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0A0A0A] border-white/10 text-white">
                          {categories.map(cat => (
                            <SelectItem key={cat.id} value={cat.id} className="focus:bg-white/5">{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Description Catalogue</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={6}
                      className="bg-black border-white/10 rounded-2xl text-sm focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/10 transition-all"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#080808] border-white/5 rounded-[2.5rem] shadow-2xl">
                <CardHeader className="p-8 pb-0">
                  <CardTitle className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 flex items-center gap-3">
                    <DollarSign size={16} className="text-orange-500" /> Tarification
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <Field label="Prix de Vente (€)" type="number" value={formData.price} onChange={(v) => setFormData({...formData, price: v})} required />
                  <Field label="Prix Référence (€)" type="number" value={formData.reference_price} onChange={(v) => setFormData({...formData, reference_price: v})} hint="Prix barré affiché" />
                  <Field label="Unités en Stock" type="number" value={formData.stock} onChange={(v) => setFormData({...formData, stock: v})} />
                </CardContent>
              </Card>
            </div>

            {/* --- SECTION 3: EXTERNE & VISIBILITÉ --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-[#080808] border-white/5 rounded-[2.5rem] shadow-2xl">
                <CardHeader className="p-8 pb-0">
                  <CardTitle className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 flex items-center gap-3">
                    <LinkIcon size={16} className="text-orange-500" /> Marketplace Links
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <Field label="Lien Vinted" type="url" value={formData.platform_links.vinted} onChange={(v) => setFormData({...formData, platform_links: {...formData.platform_links, vinted: v}})} />
                  <Field label="Lien Leboncoin" type="url" value={formData.platform_links.leboncoin} onChange={(v) => setFormData({...formData, platform_links: {...formData.platform_links, leboncoin: v}})} />
                </CardContent>
              </Card>

              <Card className="bg-[#080808] border-white/5 rounded-[2.5rem] shadow-2xl">
                <CardHeader className="p-8 pb-0">
                  <CardTitle className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 flex items-center gap-3">
                    <Eye size={16} className="text-orange-500" /> Visibilité Système
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                   <VisibilityToggle 
                    label="Catalogue Public" 
                    checked={formData.visible_public} 
                    onChange={(v) => setFormData({...formData, visible_public: v})} 
                    color="green" 
                  />
                   <VisibilityToggle 
                    label="Catalogue Revendeur" 
                    checked={formData.visible_seller} 
                    onChange={(v) => setFormData({...formData, visible_seller: v})} 
                    color="purple" 
                  />
                </CardContent>
              </Card>
            </div>

            {/* Final Action */}
            <div className="pt-8 border-t border-white/[0.03] flex justify-end">
              <Button 
                type="submit" 
                disabled={saving} 
                className="bg-white hover:bg-zinc-200 text-black font-black uppercase tracking-[0.2em] text-xs h-14 px-12 rounded-2xl shadow-xl transition-all active:scale-95"
              >
                {saving ? <Loader2 className="h-5 w-5 animate-spin mr-3" /> : <Save className="h-5 w-5 mr-3 stroke-[3px]" />}
                Sauvegarder les modifications
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

// --- COMPOSANTS INTERNES ---

const Field = ({ label, value, onChange, type = "text", placeholder, required, hint }) => (
  <div className="space-y-3">
    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">
      {label} {required && <span className="text-orange-500">*</span>}
    </Label>
    <Input
      type={type} value={value} placeholder={placeholder} required={required}
      onChange={(e) => onChange(e.target.value)}
      className="bg-black border-white/10 h-12 rounded-xl text-sm focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/10 transition-all placeholder:text-zinc-800"
    />
    {hint && <p className="text-[9px] font-bold text-zinc-700 uppercase tracking-widest ml-1">{hint}</p>}
  </div>
);

const VisibilityToggle = ({ label, checked, onChange, color }) => {
  const colors = {
    green: checked ? 'border-green-500/50 bg-green-500/10' : 'border-white/5 bg-black',
    purple: checked ? 'border-purple-500/50 bg-purple-500/10' : 'border-white/5 bg-black',
  };

  return (
    <label className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all hover:border-white/20 ${colors[color]}`}>
      <div className="flex items-center gap-3">
        <ShieldCheck className={`h-4 w-4 ${checked ? 'text-white' : 'text-zinc-700'}`} />
        <span className={`text-[11px] font-black uppercase tracking-widest ${checked ? 'text-white' : 'text-zinc-500'}`}>{label}</span>
      </div>
      <input 
        type="checkbox" 
        checked={checked} 
        onChange={(e) => onChange(e.target.checked)} 
        className="w-5 h-5 accent-orange-500 bg-black border-white/10 rounded"
      />
    </label>
  );
};