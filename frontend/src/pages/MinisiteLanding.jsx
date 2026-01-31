import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Check, Globe, Zap, TrendingUp, MessageCircle, Users, Loader2, CreditCard } from 'lucide-react';
import { getUser, getToken } from '../utils/auth';
import api from '../utils/api';
import { toast } from 'sonner';
import { resolveMinisiteEntry, getUserPlanRole } from '../utils/minisiteAccess';

export const MinisiteLanding = () => {
  const navigate = useNavigate();
  const [checkingMinisite, setCheckingMinisite] = useState(true);
  const [hasMinisite, setHasMinisite] = useState(false);
  const [startingCheckout, setStartingCheckout] = useState(false);
  const isMountedRef = useRef(true);
  const didRunRef = useRef(false);

  useEffect(() => {
    if (didRunRef.current) return;
    didRunRef.current = true;
    isMountedRef.current = true;
    let cancelled = false;
    const params = new URLSearchParams(window.location.search);
    const autopay = params.get('autopay');
    const plan = params.get('plan');
    const guardKey = 'minisiteLandingChecked';

    if (autopay !== '1' && sessionStorage.getItem(guardKey) === '1') {
      setCheckingMinisite(false);
      return;
    }

    const checkMinisite = async () => {
      const token = getToken();
      if (!token) {
        if (autopay === '1' && plan) {
          navigate(`/login?redirect=/minisite?autopay=1&plan=${plan}`, { replace: true });
          return;
        }
        if (isMountedRef.current && !cancelled) {
          setCheckingMinisite(false);
        }
        return;
      }

      // Guard d'entrée : max 2 calls (/auth/me et /minisites/my)
      try {
        // Appels en parallèle pour optimiser
        const [userResponse, minisiteResponse] = await Promise.allSettled([
          api.get('/auth/me'),
          api.get('/minisites/my').catch(err => {
            // 404 et 403 sont normaux (pas de minisite)
            if (err.response?.status === 404 || err.response?.status === 403) {
              return { data: null, exists: false };
            }
            throw err;
          })
        ]);

        if (cancelled) return;

        const user = userResponse.status === 'fulfilled' ? userResponse.value.data : null;
        const minisiteExists = minisiteResponse.status === 'fulfilled' && 
                               minisiteResponse.value.data?.id ? true : false;

        // Résoudre la route d'entrée
        const entryRoute = resolveMinisiteEntry(user, minisiteExists);

        // Si on doit rediriger (pas pricing), le faire
        if (entryRoute !== '/minisite') {
          navigate(entryRoute, { replace: true });
          return;
        }

        // Sinon, afficher pricing
        if (isMountedRef.current && !cancelled) {
          setCheckingMinisite(false);
        }

        if (autopay !== '1') {
          sessionStorage.setItem(guardKey, '1');
        }

        if (autopay === '1' && plan && (plan === 'starter' || plan === 'standard' || plan === 'premium')) {
          setTimeout(() => {
            if (isMountedRef.current && !cancelled) {
              startCheckout(plan);
            }
          }, 500);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification:', error);
        if (isMountedRef.current && !cancelled) {
          setCheckingMinisite(false);
        }
      }
    };

    checkMinisite();

    return () => {
      cancelled = true;
      isMountedRef.current = false;
    };
  }, []);

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

  const startCheckout = useCallback(async (planKey) => {
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
  }, []);

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
      <div className="min-h-screen dp-bg flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen dp-bg">
      
      <main className="container mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-16">
          <Badge className="bg-orange-500 text-white mb-4">Nouveau !</Badge>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4" style={{fontFamily: 'Outfit, sans-serif'}}>
            Créez votre <span className="text-orange-500">page web</span>
          </h1>
          <p className="text-lg text-[hsl(var(--text-muted))] max-w-2xl mx-auto mb-8">
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
              className="border-[hsl(var(--border))] text-[hsl(var(--text))] hover:bg-[hsl(var(--surface-2))] text-lg px-8 py-6"
              onClick={() => window.open('https://discord.gg/downpricer', '_blank')}
            >
              <MessageCircle className="h-5 w-5 mr-2" />
              Rejoindre Discord
            </Button>
          </div>
        </div>

        {/* Avantages */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <Card className="dp-surface">
            <CardContent className="p-6 text-center">
              <Zap className="h-12 w-12 text-orange-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-[hsl(var(--text))]">Ultra rapide</h3>
              <p className="text-[hsl(var(--text-muted))] text-sm">
                Page optimisée mobile-first. Images compressées, chargement instantané.
              </p>
            </CardContent>
          </Card>

          <Card className="dp-surface">
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-[hsl(var(--text))]">Visibilité boostée</h3>
              <p className="text-[hsl(var(--text-muted))] text-sm">
                Vos articles apparaissent dans le catalogue public DownPricer.
              </p>
            </CardContent>
          </Card>

          <Card className="dp-surface">
            <CardContent className="p-6 text-center">
              <Users className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-[hsl(var(--text))]">Catalogue revendeurs</h3>
              <p className="text-[hsl(var(--text-muted))] text-sm">
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
                className={`dp-surface border-2 relative ${
                  plan.popular ? 'border-blue-500' : 'border-[hsl(var(--border))]'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-500 text-white">Le plus populaire</Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl mb-2">
                    <span className="text-[hsl(var(--text-muted))]">Plan</span>{' '}
                    <span className={plan.colorClass}>{plan.name}</span>
                  </CardTitle>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className={`text-5xl font-bold ${plan.colorClass}`}>{plan.price}</span>
                    <span className="text-[hsl(var(--text-muted))]">{plan.period}</span>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-[hsl(var(--text))]">{feature}</span>
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
            <p className="text-[hsl(var(--text-muted))] mb-6">
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
