import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../components/AdminLayout';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Plus, Trash2, Eye, Package } from 'lucide-react';
import { ImageUpload } from '../components/ImageUpload';
import { SafeImage } from '../components/SafeImage';
import api from '../utils/api';
import { toast } from 'sonner';
import axios from 'axios';

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
  const [visibilityFilter, setVisibilityFilter] = useState('all'); // 'all', 'public', 'seller'

  useEffect(() => {
    fetchArticles();
    fetchCategories();
  }, []);

  const fetchArticles = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/articles?limit=100`);
      setArticles(response.data.articles);
    } catch (error) {
      toast.error('Erreur lors du chargement des articles');
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Erreur catégories');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const articleData = {
        name: formData.name,
        description: formData.description,
        photos: formData.photos,
        price: parseFloat(formData.price),
        reference_price: parseFloat(formData.reference_price),
        category_id: formData.category_id || null,
        stock: parseInt(formData.stock) || 1,
        platform_links: {
          vinted: formData.platform_links.vinted || undefined,
          leboncoin: formData.platform_links.leboncoin || undefined
        },
        visible_public: formData.visible_public,
        visible_seller: formData.visible_seller
      };

      await api.post('/admin/articles', articleData);
      toast.success('Article créé avec succès');
      setShowCreateDialog(false);
      setFormData({
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
      fetchArticles();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la création');
    }
  };

  const handleStockUpdate = async (articleId, newStock) => {
    try {
      await api.patch(`/admin/articles/${articleId}/stock`, { stock: newStock });
      toast.success('Stock mis à jour');
      fetchArticles();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du stock');
    }
  };

  const handleDelete = async (articleId) => {
    if (!window.confirm('Supprimer cet article ?')) return;
    
    try {
      await api.delete(`/admin/articles/${articleId}`);
      toast.success('Article supprimé');
      fetchArticles();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (visibilityFilter === 'public') {
      return matchesSearch && article.visible_public !== false;
    } else if (visibilityFilter === 'seller') {
      return matchesSearch && article.visible_seller !== false;
    }
    return matchesSearch;
  });

  const handleVisibilityToggle = async (articleId, field, value) => {
    try {
      await api.patch(`/admin/articles/${articleId}/visibility`, { [field]: value });
      toast.success('Visibilité mise à jour');
      fetchArticles();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const calculateDiscount = (price, referencePrice) => {
    if (!referencePrice || referencePrice === 0) return 0;
    return Math.round(((referencePrice - price) / referencePrice) * 100);
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-slate-900">Gestion des articles</h2>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white" data-testid="create-article-btn">
                <Plus className="h-4 w-4 mr-2" />
                Nouvel article
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Créer un article</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nom de l'article *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                    placeholder="Ex: iPhone 13 Pro 128Go"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description *</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    required
                    rows={4}
                    placeholder="Décrivez l'article en détail..."
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Prix (€) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      required
                      placeholder="599"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Prix de référence (€) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.reference_price}
                      onChange={(e) => setFormData({...formData, reference_price: e.target.value})}
                      required
                      placeholder="1159"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Catégorie</Label>
                  <Select value={formData.category_id} onValueChange={(val) => setFormData({...formData, category_id: val})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <ImageUpload
                  images={formData.photos}
                  onChange={(photos) => setFormData({...formData, photos})}
                  maxImages={10}
                  label="Photos de l'article"
                />

                <div className="space-y-2">
                  <Label>Stock / Quantité *</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: e.target.value})}
                    required
                    placeholder="1"
                  />
                  <p className="text-xs text-slate-500">Le stock sera décrémenté automatiquement lors des ventes</p>
                </div>

                <div className="space-y-2">
                  <Label>Liens plateformes</Label>
                  <Input
                    type="url"
                    placeholder="Lien Vinted (optionnel)"
                    value={formData.platform_links.vinted}
                    onChange={(e) => setFormData({
                      ...formData, 
                      platform_links: {...formData.platform_links, vinted: e.target.value}
                    })}
                  />
                  <Input
                    type="url"
                    placeholder="Lien Leboncoin (optionnel)"
                    value={formData.platform_links.leboncoin}
                    onChange={(e) => setFormData({
                      ...formData, 
                      platform_links: {...formData.platform_links, leboncoin: e.target.value}
                    })}
                  />
                </div>

                {/* Options de visibilité */}
                <div className="space-y-3 p-4 bg-slate-50 rounded-lg">
                  <Label className="font-medium">Visibilité de l'article</Label>
                  <div className="flex flex-wrap gap-4">
                    <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition-all ${
                      formData.visible_public 
                        ? 'border-green-500 bg-green-50 text-green-700' 
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}>
                      <input
                        type="checkbox"
                        checked={formData.visible_public}
                        onChange={(e) => setFormData({...formData, visible_public: e.target.checked})}
                        className="w-4 h-4 accent-green-600"
                      />
                      <div>
                        <span className="font-medium">Catalogue Public</span>
                        <p className="text-xs opacity-70">Visible par tous les visiteurs</p>
                      </div>
                    </label>
                    <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition-all ${
                      formData.visible_seller 
                        ? 'border-purple-500 bg-purple-50 text-purple-700' 
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}>
                      <input
                        type="checkbox"
                        checked={formData.visible_seller}
                        onChange={(e) => setFormData({...formData, visible_seller: e.target.checked})}
                        className="w-4 h-4 accent-purple-600"
                      />
                      <div>
                        <span className="font-medium">Catalogue Revendeur</span>
                        <p className="text-xs opacity-70">Visible par les vendeurs/revendeurs</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                    Créer l'article
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Annuler
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="bg-white border-slate-200 mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <Input
                placeholder="Rechercher un article..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-md"
              />
              <div className="flex gap-2">
                <Button
                  variant={visibilityFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setVisibilityFilter('all')}
                  className={visibilityFilter === 'all' ? 'bg-blue-600 text-white' : ''}
                >
                  Tous
                </Button>
                <Button
                  variant={visibilityFilter === 'public' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setVisibilityFilter('public')}
                  className={visibilityFilter === 'public' ? 'bg-green-600 text-white' : ''}
                >
                  Catalogue Public
                </Button>
                <Button
                  variant={visibilityFilter === 'seller' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setVisibilityFilter('seller')}
                  className={visibilityFilter === 'seller' ? 'bg-purple-600 text-white' : ''}
                >
                  Catalogue Revendeur
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-slate-500">Chargement...</p>
          </div>
        ) : filteredArticles.length === 0 ? (
          <Card className="bg-white border-slate-200">
            <CardContent className="p-12 text-center">
              <p className="text-slate-500">Aucun article trouvé</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {filteredArticles.map((article) => {
              const discount = calculateDiscount(article.price, article.reference_price);
              return (
                <Card key={article.id} className="bg-white border-slate-200" data-testid={`admin-article-card-${article.id}`}>
                  <CardContent className="p-4">
                    <div className="flex gap-3 md:gap-4 mb-4">
                      <div className="flex-shrink-0 w-16 h-16 md:w-20 md:h-20 bg-slate-100 rounded-lg overflow-hidden">
                        {article.photos && article.photos.length > 0 ? (
                          <SafeImage src={article.photos[0]} alt={article.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">Pas de photo</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 truncate mb-1">{article.name}</h3>
                        <p className="text-sm text-slate-500 line-clamp-2">{article.description}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Prix :</span>
                        <span className="text-lg font-bold text-slate-900">{article.price}€</span>
                      </div>
                      {discount > 0 && (
                        <Badge className="bg-green-100 text-green-800 border-green-200">-{discount}%</Badge>
                      )}
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">{article.views || 0} vues</span>
                        <div className="flex items-center gap-1">
                          <Package className="h-3 w-3 text-slate-500" />
                          <input
                            type="number"
                            min="0"
                            value={article.stock || 0}
                            onChange={(e) => handleStockUpdate(article.id, parseInt(e.target.value) || 0)}
                            className="w-12 px-1 py-0.5 text-xs border border-slate-300 rounded"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className={`text-xs font-medium ${article.stock === 0 ? 'text-red-600' : 'text-slate-600'}`}>
                            {article.stock === 0 ? 'Rupture' : 'en stock'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Toggles de visibilité */}
                      <div className="flex gap-2 pt-2 border-t border-slate-100 mt-2">
                        <label className={`flex items-center gap-1 px-2 py-1 rounded text-xs cursor-pointer transition-colors ${
                          article.visible_public !== false ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          <input
                            type="checkbox"
                            checked={article.visible_public !== false}
                            onChange={(e) => handleVisibilityToggle(article.id, 'visible_public', e.target.checked)}
                            className="w-3 h-3 accent-green-600"
                            onClick={(e) => e.stopPropagation()}
                          />
                          Public
                        </label>
                        <label className={`flex items-center gap-1 px-2 py-1 rounded text-xs cursor-pointer transition-colors ${
                          article.visible_seller !== false ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          <input
                            type="checkbox"
                            checked={article.visible_seller !== false}
                            onChange={(e) => handleVisibilityToggle(article.id, 'visible_seller', e.target.checked)}
                            className="w-3 h-3 accent-purple-600"
                            onClick={(e) => e.stopPropagation()}
                          />
                          Revendeur
                        </label>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/article/${article.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => navigate(`/admin/articles/${article.id}`)}
                      >
                        Éditer
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(article.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
