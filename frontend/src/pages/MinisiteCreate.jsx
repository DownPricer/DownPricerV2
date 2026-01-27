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
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [formData, setFormData] = useState({
    site_name: '',
    slug: '',
    plan_id: null, // Sera rempli depuis l'API
    welcome_text: '',
    template: 'template1',
    primary_color: '#FF5722',
    font_family: 'Arial'
  });

  // Charger le plan depuis l'API au montage du composant
  useEffect(() => {
    const fetchPlan = async () => {
      try {
        // 1. Essayer de récupérer le plan depuis /billing/subscription
        const subscriptionResponse = await api.get('/billing/subscription');
        const subscription = subscriptionResponse.data;
        
        let planId = null;
        
        // Priorité 1: site_plan (SITE_PLAN_1/2/3) - source de vérité
        if (subscription.site_plan && ['SITE_PLAN_1', 'SITE_PLAN_2', 'SITE_PLAN_3'].includes(subscription.site_plan)) {
          planId = subscription.site_plan;
        }
        // Priorité 2: mapper plan string (starter/standard/premium) vers SITE_PLAN_X
        else if (subscription.plan) {
          const planMapping = {
            'starter': 'SITE_PLAN_1',
            'standard': 'SITE_PLAN_2',
            'premium': 'SITE_PLAN_3'
          };
          planId = planMapping[subscription.plan];
        }
        
        // Si on a trouvé un plan, l'utiliser
        if (planId) {
          setFormData(prev => ({ ...prev, plan_id: planId }));
          setLoadingPlan(false);
          return;
        }
        
        // Priorité 3: vérifier les rôles de l'utilisateur via /auth/me
        if (subscription.has_subscription) {
          try {
            const userResponse = await api.get('/auth/me');
            const user = userResponse.data;
            const planRoles = user.roles?.filter(role => 
              ['SITE_PLAN_1', 'SITE_PLAN_2', 'SITE_PLAN_3'].includes(role)
            );
            
            if (planRoles && planRoles.length > 0) {
              // Prendre le premier rôle plan trouvé (normalement il n'y en a qu'un)
              planId = planRoles[0];
              setFormData(prev => ({ ...prev, plan_id: planId }));
              setLoadingPlan(false);
              return;
            }
          } catch (userError) {
            console.error('Error fetching user:', userError);
          }
        }
        
        // Priorité 4: utiliser le plan depuis l'URL (query param)
        const planFromUrl = searchParams.get('plan');
        if (planFromUrl && ['SITE_PLAN_1', 'SITE_PLAN_2', 'SITE_PLAN_3'].includes(planFromUrl)) {
          setFormData(prev => ({ ...prev, plan_id: planFromUrl }));
          setLoadingPlan(false);
          return;
        }
        
        // Aucun plan trouvé : rediriger vers la landing
        navigate('/minisite', { replace: true });
      } catch (error) {
        console.error('Error fetching subscription:', error);
        // En cas d'erreur, essayer le plan depuis l'URL
        const planFromUrl = searchParams.get('plan');
        if (planFromUrl && ['SITE_PLAN_1', 'SITE_PLAN_2', 'SITE_PLAN_3'].includes(planFromUrl)) {
          setFormData(prev => ({ ...prev, plan_id: planFromUrl }));
        } else {
          // Pas de plan valide, rediriger vers la landing
          navigate('/minisite', { replace: true });
        }
      } finally {
        setLoadingPlan(false);
      }
    };
    fetchPlan();
  }, [navigate, searchParams]);

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

  if (loadingPlan) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-zinc-400">Chargement de votre plan...</p>
        </div>
      </div>
    );
  }

  if (!formData.plan_id) {
    return null; // Redirection en cours
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      
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
                    value={formData.plan_id || ''} 
                    onValueChange={(value) => setFormData({...formData, plan_id: value})}
                    disabled={true} // Toujours désactivé - plan pré-sélectionné depuis l'API
                  >
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                      <SelectValue placeholder={loadingPlan ? "Chargement..." : "Plan sélectionné"} />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                      <SelectItem value="SITE_PLAN_1">Plan Starter (1€/mois)</SelectItem>
                      <SelectItem value="SITE_PLAN_2">Plan Standard (10€/mois)</SelectItem>
                      <SelectItem value="SITE_PLAN_3">Plan Premium (15€/mois)</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.plan_id && (
                    <p className="text-xs text-zinc-500">Plan automatiquement sélectionné selon votre abonnement (non modifiable)</p>
                  )}
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