import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { ArrowLeft } from 'lucide-react';
import { ImageUpload } from '../../components/ImageUpload';
import api from '../../utils/api';
import { toast } from 'sonner';
import { hasSPlan3 } from '../../utils/auth';

export const SellerArticleNew = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    photos: [],
    price: '',
    reference_price: '',
    platform_links: { vinted: '', leboncoin: '' },
    discord_contact: '',
    visible_seller: true,
    visible_public: false
  });

  // Vérifier que l'utilisateur a S_PLAN_3
  React.useEffect(() => {
    if (!hasSPlan3()) {
      toast.error('Accès réservé aux utilisateurs avec le plan S_PLAN_3');
      navigate('/seller/articles');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price) {
      toast.error('Le nom et le prix sont requis');
      return;
    }

    if (!formData.discord_contact || !formData.discord_contact.trim()) {
      toast.error('Le pseudo Discord est obligatoire');
      return;
    }

    // Validation longueur Discord
    const discordTrimmed = formData.discord_contact.trim();
    if (discordTrimmed.length > 64) {
      toast.error('Le pseudo Discord ne peut pas dépasser 64 caractères');
      return;
    }

    setSubmitting(true);
    
    try {
      await api.post('/seller/articles', {
        ...formData,
        price: parseFloat(formData.price),
        reference_price: parseFloat(formData.reference_price) || parseFloat(formData.price),
        discord_contact: discordTrimmed,
        visible_seller: true,  // Toujours visible pour les revendeurs
        visible_public: false  // Pas visible sur le catalogue public
      });
      
      toast.success('Article B2B créé avec succès !');
      navigate('/seller/articles');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la création');
    }
    
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/seller/articles')}
          className="mb-4 text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour au catalogue
        </Button>

        <Card className="bg-zinc-900 border-zinc-800 max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="text-orange-500 text-2xl">Nouvel article B2B</CardTitle>
            <p className="text-zinc-400 text-sm mt-2">Créez un article visible dans le catalogue revendeur</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <ImageUpload 
                images={formData.photos} 
                onChange={(photos) => setFormData({...formData, photos})} 
                maxImages={5} 
                label="Photos du produit" 
              />

              <div className="space-y-3">
                <Label>Nom de l'article *</Label>
                <Input
                  placeholder="Ex: iPhone 13 128Go"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  required
                />
              </div>

              <div className="space-y-3">
                <Label>Description *</Label>
                <Textarea
                  placeholder="Description détaillée..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prix de vente (€) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    placeholder="100"
                    className="bg-zinc-800 border-zinc-700 text-white"
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
                    placeholder="150"
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Liens vers les plateformes</Label>
                <div className="flex gap-2 items-center">
                  <div className="w-24 text-sm text-zinc-400">Vinted</div>
                  <Input
                    placeholder="https://vinted..."
                    value={formData.platform_links.vinted}
                    onChange={(e) => setFormData({...formData, platform_links: {...formData.platform_links, vinted: e.target.value}})}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
                <div className="flex gap-2 items-center">
                  <div className="w-24 text-sm text-zinc-400">Leboncoin</div>
                  <Input
                    placeholder="https://leboncoin..."
                    value={formData.platform_links.leboncoin}
                    onChange={(e) => setFormData({...formData, platform_links: {...formData.platform_links, leboncoin: e.target.value}})}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Pseudo Discord * (obligatoire pour S_PLAN_3)</Label>
                <Input
                  placeholder="Ex: pseudo, @pseudo, ou pseudo#1234"
                  value={formData.discord_contact}
                  onChange={(e) => setFormData({...formData, discord_contact: e.target.value})}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  required
                />
                <p className="text-xs text-zinc-500">Ce pseudo sera affiché aux revendeurs pour vous contacter sur Discord</p>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/seller/articles')}
                  className="border-zinc-700 text-white hover:bg-zinc-800"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {submitting ? 'Création...' : 'Créer l\'article B2B'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

