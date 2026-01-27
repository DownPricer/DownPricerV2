import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Check, Globe, Zap, TrendingUp, MessageCircle, Users, Loader2, CreditCard } from 'lucide-react';
import { getUser, getToken } from '../utils/auth';
import api from '../utils/api';
import { toast } from 'sonner';

export const MinisiteLanding = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [checkingMinisite, setCheckingMinisite] = useState(true);
  const [hasMinisite, setHasMinisite] = useState(false);
  const [startingCheckout, setStartingCheckout] = useState(false);

  useEffect(() => {
    // Vérifier si l'utilisateur a déjà un mini-site
    const checkMinisite = async () => {
      const token = getToken();
      if (!token) {
        setCheckingMinisite(false);
        // Vérifier si autopay est demandé après login
        const autopay = searchParams.get('autopay');
        const plan = searchParams.get('plan');
        if (autopay === '1' && plan) {
          // Pas connecté mais autopay demandé -> rediriger vers login
          navigate(`/login?redirect=/minisite?autopay=1&plan=${plan}`);
        }
        return;
      }
      
      try {
        const response = await api.get('/minisites/my');
        if (response.data && response.data.id) {
          // L'utilisateur a un mini-site, rediriger vers le dashboard
          navigate('/minisite/dashboard');
          return;
        }
      } catch (error) {
        // Pas de mini-site : vérifier si l'utilisateur a un rôle plan
        if (error.response?.status === 404) {
          // 404 est normal si pas de minisite encore créé - ne pas logger comme erreur
          try {
            const userResponse = await api.get('/auth/me');
            const user = userResponse.data;
            const hasPlanRole = user.roles?.some(role => 
              ['SITE_PLAN_1', 'SITE_PLAN_2', 'SITE_PLAN_3'].includes(role)
            );
            
            if (hasPlanRole) {
              // L'utilisateur a un plan mais pas de minisite => rediriger vers la création
              navigate('/minisite/create', { replace: true });
              return;
            }
          } catch (userError) {
            // Erreur lors de la vérification, continuer normalement
            console.error('Erreur lors de la vérification de l\'utilisateur:', userError);
          }
        } else {
          // Autre erreur (pas un 404) => afficher un message d'erreur
          console.error('Erreur lors de la vérification du minisite:', error);
          toast.error('Erreur lors du chargement. Veuillez réessayer.');
        }
        // Pas de mini-site et pas de plan, afficher la page pricing
      }
      setCheckingMinisite(false);

      // Vérifier si autopay est demandé (après login)
      const autopay = searchParams.get('autopay');
      const plan = searchParams.get('plan');
      if (autopay === '1' && plan && (plan === 'starter' || plan === 'standard' || plan === 'premium')) {
        // Lancer automatiquement le checkout
        setTimeout(() => {
          startCheckout(plan);
        }, 500);
      }
    };
    
    checkMinisite();
  }, [navigate, searchParams]);

  const plans = [
    {
      planKey: 'starter',
      name: 'Starter',
      price: '1€',
      period: '/mois',
      colorClass: 'text-green-500',
      bgClass: 'bg-green-600 hover:bg-green-700',
      features: [
        '3 templates au choix',
        '3 polices disponibles',
        '5 couleurs prédéfinies',
        '5 articles maximum',
        'Branding DownPricer',
        'Logo modifiable 1x/mois',
        'Nom modifiable 1x/mois'
      ]
    },
    {
      planKey: 'standard',
      name: 'Standard',
      price: '10€',
      period: '/mois',
      colorClass: 'text-blue-500',
      bgClass: 'bg-blue-600 hover:bg-blue-700',
      popular: true,
      features: [
        '10 templates au choix',
        '10 polices disponibles',
        'Toutes les couleurs',
        '10 articles maximum',
        'Sans branding DownPricer',
        'Logo modifiable 2x/mois',
        'Nom modifiable 1x/mois',
        '✨ Afficher vos articles aux revendeurs'
      ]
    },
    {
      planKey: 'premium',
      name: 'Premium',
      price: '15€',
      period: '/mois',
      colorClass: 'text-purple-500',
      bgClass: 'bg-purple-600 hover:bg-purple-700',
      features: [
        '20 templates au choix',
        '20 polices disponibles',
        'Toutes les couleurs',
        '20 articles maximum',
        'Sans branding',
        'Logo illimité',
        'Nom illimité',
        '✨ Afficher vos articles aux revendeurs',
        '⭐ Boost visibilité catalogue',
        '⭐ Référencement prioritaire'
      ]
    }
  ];

  const startCheckout = async (planKey) => {
    if (!planKey || !['starter', 'standard', 'premium'].includes(planKey)) {
      toast.error('Plan invalide');
      return;
    }

    setStartingCheckout(true);
    try {
      console.log(`[MinisiteLanding] Starting checkout for plan: ${planKey}`);
      const response = await api.post('/billing/minisite/checkout', { plan: planKey });
      
      const checkoutUrl = response.data?.url || response.data?.checkout_url;
      if (checkoutUrl) {
        console.log(`[MinisiteLanding] Checkout URL received, redirecting...`);
        window.location.href = checkoutUrl;
      } else {
        console.error('[MinisiteLanding] No URL in checkout response:', response.data);
        toast.error('Erreur : aucune URL de paiement reçue');
      }
    } catch (error) {
      console.error('[MinisiteLanding] Checkout error:', error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.error || error.message || 'Erreur lors de la création de la session de paiement';
      toast.error(errorMessage);
    } finally {
      setStartingCheckout(false);
    }
  };

  const handleSelectPlan = (planKey) => {
    if (!getUser()) {
      // Pas connecté -> rediriger vers login avec autopay
      navigate(`/login?redirect=/minisite?autopay=1&plan=${planKey}`);
    } else {
      // Connecté -> lancer directement le checkout
      startCheckout(planKey);
    }
  };

  if (checkingMinisite) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      
      <main className="container mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-16">
          <Badge className="bg-orange-500 text-white mb-4">Nouveau !</Badge>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4" style={{fontFamily: 'Outfit, sans-serif'}}>
            Créez votre <span className="text-orange-500">page web</span>
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-8">
            Vendez vos articles en ligne avec votre propre boutique. Simple, rapide et optimisé.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              className="bg-orange-600 hover:bg-orange-700 text-lg px-8 py-6"
              onClick={() => document.getElementById('pricing').scrollIntoView({behavior: 'smooth'})}
            >
              <Globe className="h-5 w-5 mr-2" />
              Voir les formules
            </Button>
            <Button
              variant="outline"
              className="border-zinc-700 text-white hover:bg-zinc-800 text-lg px-8 py-6"
              onClick={() => window.open('https://discord.gg/downpricer', '_blank')}
            >
              <MessageCircle className="h-5 w-5 mr-2" />
              Rejoindre Discord
            </Button>
          </div>
        </div>

        {/* Avantages */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6 text-center">
              <Zap className="h-12 w-12 text-orange-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-white">Ultra rapide</h3>
              <p className="text-zinc-400 text-sm">
                Page optimisée mobile-first. Images compressées, chargement instantané.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-white">Visibilité boostée</h3>
              <p className="text-zinc-400 text-sm">
                Vos articles apparaissent dans le catalogue public DownPricer.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6 text-center">
              <Users className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-white">Catalogue revendeurs</h3>
              <p className="text-zinc-400 text-sm">
                Plans Standard/Premium : affichez vos articles aux autres revendeurs.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Pricing */}
        <div id="pricing" className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">Choisissez votre formule</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card 
                key={plan.planKey}
                className={`bg-zinc-900 border-2 relative ${
                  plan.popular ? 'border-blue-500' : 'border-zinc-800'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-500 text-white">Le plus populaire</Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl mb-2">
                    <span className="text-zinc-400">Plan</span>{' '}
                    <span className={plan.colorClass}>{plan.name}</span>
                  </CardTitle>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className={`text-5xl font-bold ${plan.colorClass}`}>{plan.price}</span>
                    <span className="text-zinc-400">{plan.period}</span>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-zinc-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button
                    type="button"
                    className={`w-full ${plan.bgClass}`}
                    onClick={() => handleSelectPlan(plan.planKey)}
                    disabled={startingCheckout}
                  >
                    {startingCheckout ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Redirection...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Choisir {plan.name}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Discord */}
        <Card className="bg-gradient-to-r from-orange-900/20 to-red-900/20 border-orange-500/50">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-2">Vous voulez gagner plus d'argent ?</h3>
            <p className="text-zinc-300 mb-6">
              Rejoignez notre Discord pour des astuces, conseils et opportunités exclusives.
            </p>
            <Button
              className="bg-orange-600 hover:bg-orange-700"
              onClick={() => window.open('https://discord.gg/downpricer', '_blank')}
            >
              <MessageCircle className="h-5 w-5 mr-2" />
              Rejoindre la communauté
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};
