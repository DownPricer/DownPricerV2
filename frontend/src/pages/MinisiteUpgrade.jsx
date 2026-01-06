import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Check, Crown, Zap, Star, ArrowLeft, Loader2 } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'sonner';

export const MinisiteUpgrade = () => {
  const navigate = useNavigate();
  const [currentPlan, setCurrentPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingMode, setBillingMode] = useState('FREE_TEST');

  useEffect(() => {
    fetchCurrentPlan();
    fetchBillingMode();
  }, []);

  const fetchCurrentPlan = async () => {
    try {
      const response = await api.get('/minisites/my');
      setCurrentPlan(response.data.plan_id);
    } catch (error) {
      // Pas de mini-site, rediriger vers création
      navigate('/minisite');
    }
    setLoading(false);
  };

  const fetchBillingMode = async () => {
    try {
      const response = await api.get('/settings');
      if (response.data.billing_mode) {
        setBillingMode(response.data.billing_mode);
      }
    } catch (error) {
      console.error('Error fetching billing mode');
    }
  };

  const plans = [
    {
      id: 'SITE_PLAN_1',
      name: 'Starter',
      price: 1,
      colorClass: 'text-green-500',
      bgClass: 'bg-green-600 hover:bg-green-700',
      borderClass: 'border-green-500',
      features: [
        '3 templates',
        '3 polices',
        '5 articles max',
        'Branding DownPricer'
      ]
    },
    {
      id: 'SITE_PLAN_10',
      name: 'Standard',
      price: 10,
      colorClass: 'text-blue-500',
      bgClass: 'bg-blue-600 hover:bg-blue-700',
      borderClass: 'border-blue-500',
      popular: true,
      features: [
        '10 templates',
        '10 polices',
        '10 articles max',
        'Sans branding',
        'Couleurs personnalisées',
        'Catalogue revendeurs'
      ]
    },
    {
      id: 'SITE_PLAN_15',
      name: 'Premium',
      price: 15,
      colorClass: 'text-purple-500',
      bgClass: 'bg-purple-600 hover:bg-purple-700',
      borderClass: 'border-purple-500',
      features: [
        '20 templates',
        '20 polices',
        '20 articles max',
        'Sans branding',
        'Couleurs personnalisées',
        'Catalogue revendeurs',
        'Boost visibilité',
        'Support prioritaire'
      ]
    }
  ];

  const getPlanOrder = (planId) => {
    const order = { 'SITE_PLAN_1': 1, 'SITE_PLAN_10': 2, 'SITE_PLAN_15': 3 };
    return order[planId] || 0;
  };

  const handleUpgrade = async (planId) => {
    if (getPlanOrder(planId) <= getPlanOrder(currentPlan)) {
      toast.error('Vous ne pouvez pas passer à un plan inférieur ou identique');
      return;
    }

    setUpgrading(true);
    setSelectedPlan(planId);

    try {
      if (billingMode === 'FREE_TEST') {
        // Mode test : upgrade instantané
        await api.post('/minisites/upgrade', { plan_id: planId });
        toast.success('Plan mis à jour avec succès !');
        navigate('/minisite/dashboard');
      } else {
        // Mode production : rediriger vers Stripe (stub pour l'instant)
        toast.info('Redirection vers le paiement... (stub)');
        // TODO: Intégration Stripe
        setTimeout(() => {
          toast.success('Paiement simulé - Plan mis à jour !');
          navigate('/minisite/dashboard');
        }, 2000);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la mise à jour du plan');
    }
    setUpgrading(false);
    setSelectedPlan(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate('/minisite/dashboard')} className="mb-6 text-zinc-400 hover:text-white">
          <ArrowLeft className="h-4 w-4 mr-2" /> Retour au dashboard
        </Button>

        <div className="text-center mb-12">
          <Badge className="bg-purple-600 text-white mb-4"><Crown className="h-3 w-3 mr-1" /> Upgrade</Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Passez au niveau <span className="text-orange-500">supérieur</span>
          </h1>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            Débloquez plus de fonctionnalités et faites grandir votre mini-site
          </p>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => {
            const isCurrentPlan = currentPlan === plan.id;
            const canUpgrade = getPlanOrder(plan.id) > getPlanOrder(currentPlan);
            
            return (
              <Card 
                key={plan.id}
                className={`bg-zinc-900 border-2 relative ${
                  isCurrentPlan ? 'border-orange-500' : plan.popular ? plan.borderClass : 'border-zinc-800'
                }`}
              >
                {isCurrentPlan && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-orange-500 text-white">Plan actuel</Badge>
                  </div>
                )}
                {plan.popular && !isCurrentPlan && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-500 text-white"><Star className="h-3 w-3 mr-1" /> Populaire</Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl mb-2">
                    <span className="text-zinc-400">Plan</span>{' '}
                    <span className={plan.colorClass}>{plan.name}</span>
                  </CardTitle>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className={`text-5xl font-bold ${plan.colorClass}`}>{plan.price}€</span>
                    <span className="text-zinc-400">/mois</span>
                  </div>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-zinc-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {isCurrentPlan ? (
                    <Button disabled className="w-full bg-zinc-700 cursor-not-allowed">
                      Plan actuel
                    </Button>
                  ) : canUpgrade ? (
                    <Button 
                      className={`w-full ${plan.bgClass}`}
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={upgrading}
                    >
                      {upgrading && selectedPlan === plan.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Zap className="h-4 w-4 mr-2" />
                      )}
                      Passer à {plan.name}
                    </Button>
                  ) : (
                    <Button disabled className="w-full bg-zinc-700 cursor-not-allowed">
                      Non disponible
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Info mode test */}
        {billingMode === 'FREE_TEST' && (
          <Card className="max-w-2xl mx-auto mt-8 bg-green-900/20 border-green-500/30">
            <CardContent className="p-4 flex items-center gap-3">
              <Zap className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-green-400 font-medium">Mode Test Actif</p>
                <p className="text-sm text-zinc-400">Les upgrades sont gratuits et instantanés en mode test</p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};
