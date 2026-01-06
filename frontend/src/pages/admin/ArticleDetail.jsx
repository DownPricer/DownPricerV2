import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { ArrowLeft, Save, Loader2, Trash2 } from 'lucide-react';
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
      toast.error('Erreur lors du chargement de l\'article');
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
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) return;
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
        <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => navigate('/admin/articles')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />Retour aux articles
        </Button>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Modifier l'article</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Images */}
              <div>
                <Label className="mb-2 block">Images actuelles</Label>
                {formData.photos.length > 0 ? (
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {formData.photos.map((photo, idx) => (
                      <div key={idx} className="relative group">
                        <SafeImage src={photo} alt={`Image ${idx}`} className="w-full h-24 object-cover rounded" />
                        <button
                          type="button"
                          onClick={() => setFormData({...formData, photos: formData.photos.filter((_, i) => i !== idx)})}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm mb-4">Aucune image</p>
                )}
                <ImageUpload
                  images={formData.photos}
                  onChange={(photos) => setFormData({...formData, photos})}
                  maxImages={10}
                  label="Ajouter des images"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nom de l'article *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Catégorie</Label>
                  <Select value={formData.category_id} onValueChange={(val) => setFormData({...formData, category_id: val})}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={4}
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Prix de vente (€) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prix de référence (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.reference_price}
                    onChange={(e) => setFormData({...formData, reference_price: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Stock</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Lien Vinted</Label>
                  <Input
                    type="url"
                    value={formData.platform_links.vinted}
                    onChange={(e) => setFormData({...formData, platform_links: {...formData.platform_links, vinted: e.target.value}})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Lien Leboncoin</Label>
                  <Input
                    type="url"
                    value={formData.platform_links.leboncoin}
                    onChange={(e) => setFormData({...formData, platform_links: {...formData.platform_links, leboncoin: e.target.value}})}
                  />
                </div>
              </div>

              {/* Visibilité */}
              <div className="space-y-3 p-4 bg-slate-50 rounded-lg">
                <Label className="font-medium">Visibilité</Label>
                <div className="flex flex-wrap gap-4">
                  <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer ${formData.visible_public ? 'border-green-500 bg-green-50' : 'border-slate-200 bg-white'}`}>
                    <input type="checkbox" checked={formData.visible_public} onChange={(e) => setFormData({...formData, visible_public: e.target.checked})} className="w-4 h-4 accent-green-600" />
                    <span>Catalogue Public</span>
                  </label>
                  <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer ${formData.visible_seller ? 'border-purple-500 bg-purple-50' : 'border-slate-200 bg-white'}`}>
                    <input type="checkbox" checked={formData.visible_seller} onChange={(e) => setFormData({...formData, visible_seller: e.target.checked})} className="w-4 h-4 accent-purple-600" />
                    <span>Catalogue Revendeur</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t">
                <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Enregistrer
                </Button>
                <Button type="button" variant="outline" className="border-red-300 text-red-600" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />Supprimer
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};
