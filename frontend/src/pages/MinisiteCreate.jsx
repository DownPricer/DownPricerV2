import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ArrowLeft } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'sonner';

export const MinisiteCreate = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    site_name: '',
    slug: '',
    plan_id: searchParams.get('plan') || 'SITE_PLAN_1',
    welcome_text: '',
    template: 'template1',
    primary_color: '#FF5722',
    font_family: 'Arial'
  });

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData({
      ...formData,
      site_name: name,
      slug: generateSlug(name)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.slug) {
      toast.error('Le slug ne peut pas être vide');
      return;
    }
    
    setCreating(true);
    
    try {
      const response = await api.post('/minisites', formData);
      toast.success('Mini-site créé avec succès !');
      navigate('/minisite/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la création');
    }
    
    setCreating(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/minisite')}
          className="mb-4 text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>

        <h1 className="text-3xl font-bold text-orange-500 mb-2" style={{fontFamily: 'Outfit, sans-serif'}}>
          Créer votre mini-site
        </h1>
        <p className="text-zinc-400 mb-8">Configurez votre boutique en ligne en quelques minutes</p>

        <form onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-orange-500">Informations de base</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Nom du site *</Label>
                  <Input
                    value={formData.site_name}
                    onChange={handleNameChange}
                    placeholder="Ma Boutique"
                    required
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-300">URL du site *</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-zinc-500">downpricer.com/s/</span>
                    <Input
                      value={formData.slug}
                      onChange={(e) => setFormData({...formData, slug: e.target.value})}
                      placeholder="ma-boutique"
                      required
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>
                  <p className="text-xs text-zinc-500">Seuls les lettres, chiffres et tirets sont autorisés</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-300">Texte de bienvenue</Label>
                  <Textarea
                    value={formData.welcome_text}
                    onChange={(e) => setFormData({...formData, welcome_text: e.target.value})}
                    placeholder="Bienvenue sur ma boutique !"
                    rows={3}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-300">Plan sélectionné</Label>
                  <Select 
                    value={formData.plan_id} 
                    onValueChange={(value) => setFormData({...formData, plan_id: value})}
                  >
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                      <SelectItem value="SITE_PLAN_1">Plan Starter (1€/mois)</SelectItem>
                      <SelectItem value="SITE_PLAN_10">Plan Standard (10€/mois)</SelectItem>
                      <SelectItem value="SITE_PLAN_15">Plan Premium (15€/mois)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-orange-500">Apparence</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Template</Label>
                  <Select 
                    value={formData.template} 
                    onValueChange={(value) => setFormData({...formData, template: value})}
                  >
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                      <SelectItem value="template1">Template 1 - Moderne</SelectItem>
                      <SelectItem value="template2">Template 2 - Classique</SelectItem>
                      <SelectItem value="template3">Template 3 - Minimaliste</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-300">Couleur principale</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={formData.primary_color}
                      onChange={(e) => setFormData({...formData, primary_color: e.target.value})}
                      className="w-20 h-10"
                    />
                    <Input
                      value={formData.primary_color}
                      onChange={(e) => setFormData({...formData, primary_color: e.target.value})}
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-300">Police</Label>
                  <Select 
                    value={formData.font_family} 
                    onValueChange={(value) => setFormData({...formData, font_family: value})}
                  >
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                      <SelectItem value="Arial">Arial</SelectItem>
                      <SelectItem value="Helvetica">Helvetica</SelectItem>
                      <SelectItem value="Georgia">Georgia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/minisite')}
              className="border-zinc-700 text-white hover:bg-zinc-800"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={creating}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {creating ? 'Création...' : 'Créer mon mini-site'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};