// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Header } from '../components/Header';
// import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
// import { Button } from '../components/ui/button';
// import { Badge } from '../components/ui/badge';
// import { Check, Crown, Zap, Star, ArrowLeft, Loader2 } from 'lucide-react';
// import api from '../utils/api';
// import { toast } from 'sonner';

// export const MinisiteUpgrade = () => {
//   const navigate = useNavigate();
//   const [currentPlan, setCurrentPlan] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [upgrading, setUpgrading] = useState(false);
//   const [selectedPlan, setSelectedPlan] = useState(null);
//   const [billingMode, setBillingMode] = useState('FREE_TEST');

//   useEffect(() => {
//     fetchCurrentPlan();
//     fetchBillingMode();
//   }, []);

//   const fetchCurrentPlan = async () => {
//     try {
//       const response = await api.get('/minisites/my');
//       setCurrentPlan(response.data.plan_id);
//     } catch (error) {
//       // Pas de mini-site, rediriger vers création
//       navigate('/minisite');
//     }
//     setLoading(false);
//   };

//   const fetchBillingMode = async () => {
//     try {
//       const response = await api.get('/settings');
//       if (response.data.billing_mode) {
//         setBillingMode(response.data.billing_mode);
//       }
//     } catch (error) {
//       console.error('Error fetching billing mode');
//     }
//   };

//   const plans = [
//     {
//       id: 'SITE_PLAN_1',
//       name: 'Starter',
//       price: 1,
//       colorClass: 'text-green-500',
//       bgClass: 'bg-green-600 hover:bg-green-700',
//       borderClass: 'border-green-500',
//       features: [
//         '3 templates',
//         '3 polices',
//         '5 articles max',
//         'Branding DownPricer'
//       ]
//     },
//     {
//       id: 'SITE_PLAN_2',
//       name: 'Standard',
//       price: 10,
//       colorClass: 'text-blue-500',
//       bgClass: 'bg-blue-600 hover:bg-blue-700',
//       borderClass: 'border-blue-500',
//       popular: true,
//       features: [
//         '10 templates',
//         '10 polices',
//         '10 articles max',
//         'Sans branding',
//         'Couleurs personnalisées',
//         'Catalogue revendeurs'
//       ]
//     },
//     {
//       id: 'SITE_PLAN_3',
//       name: 'Premium',
//       price: 15,
//       colorClass: 'text-purple-500',
//       bgClass: 'bg-purple-600 hover:bg-purple-700',
//       borderClass: 'border-purple-500',
//       features: [
//         '20 templates',
//         '20 polices',
//         '20 articles max',
//         'Sans branding',
//         'Couleurs personnalisées',
//         'Catalogue revendeurs',
//         'Boost visibilité',
//         'Support prioritaire'
//       ]
//     }
//   ];

//   const getPlanOrder = (planId) => {
//     const order = { 'SITE_PLAN_1': 1, 'SITE_PLAN_2': 2, 'SITE_PLAN_3': 3 };
//     return order[planId] || 0;
//   };

//   const handleUpgrade = async (planId) => {
//     if (getPlanOrder(planId) <= getPlanOrder(currentPlan)) {
//       toast.error('Vous ne pouvez pas passer à un plan inférieur ou identique');
//       return;
//     }

//     setUpgrading(true);
//     setSelectedPlan(planId);

//     try {
//       if (billingMode === 'FREE_TEST') {
//         // Mode test : upgrade instantané
//         await api.post('/minisites/upgrade', { plan_id: planId });
//         toast.success('Plan mis à jour avec succès !');
//         navigate('/minisite/dashboard');
//       } else {
//         // Mode production : rediriger vers Stripe (stub pour l'instant)
//         toast.info('Redirection vers le paiement... (stub)');
//         // TODO: Intégration Stripe
//         setTimeout(() => {
//           toast.success('Paiement simulé - Plan mis à jour !');
//           navigate('/minisite/dashboard');
//         }, 2000);
//       }
//     } catch (error) {
//       toast.error(error.response?.data?.detail || 'Erreur lors de la mise à jour du plan');
//     }
//     setUpgrading(false);
//     setSelectedPlan(null);
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
//         <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-zinc-950 text-white">
//       <Header />
      
//       <main className="container mx-auto px-4 py-8">
//         <Button variant="ghost" onClick={() => navigate('/minisite/dashboard')} className="mb-6 text-zinc-400 hover:text-white">
//           <ArrowLeft className="h-4 w-4 mr-2" /> Retour au dashboard
//         </Button>

//         <div className="text-center mb-12">
//           <Badge className="bg-purple-600 text-white mb-4"><Crown className="h-3 w-3 mr-1" /> Upgrade</Badge>
//           <h1 className="text-3xl md:text-4xl font-bold mb-4">
//             Passez au niveau <span className="text-orange-500">supérieur</span>
//           </h1>
//           <p className="text-zinc-400 max-w-2xl mx-auto">
//             Débloquez plus de fonctionnalités et faites grandir votre mini-site
//           </p>
//         </div>

//         {/* Plans */}
//         <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
//           {plans.map((plan) => {
//             const isCurrentPlan = currentPlan === plan.id;
//             const canUpgrade = getPlanOrder(plan.id) > getPlanOrder(currentPlan);
            
//             return (
//               <Card 
//                 key={plan.id}
//                 className={`bg-zinc-900 border-2 relative ${
//                   isCurrentPlan ? 'border-orange-500' : plan.popular ? plan.borderClass : 'border-zinc-800'
//                 }`}
//               >
//                 {isCurrentPlan && (
//                   <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
//                     <Badge className="bg-orange-500 text-white">Plan actuel</Badge>
//                   </div>
//                 )}
//                 {plan.popular && !isCurrentPlan && (
//                   <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
//                     <Badge className="bg-blue-500 text-white"><Star className="h-3 w-3 mr-1" /> Populaire</Badge>
//                   </div>
//                 )}

//                 <CardHeader className="text-center pb-4">
//                   <CardTitle className="text-xl mb-2">
//                     <span className="text-zinc-400">Plan</span>{' '}
//                     <span className={plan.colorClass}>{plan.name}</span>
//                   </CardTitle>
//                   <div className="flex items-baseline justify-center gap-1">
//                     <span className={`text-5xl font-bold ${plan.colorClass}`}>{plan.price}€</span>
//                     <span className="text-zinc-400">/mois</span>
//                   </div>
//                 </CardHeader>

//                 <CardContent>
//                   <ul className="space-y-3 mb-6">
//                     {plan.features.map((feature, index) => (
//                       <li key={index} className="flex items-center gap-2">
//                         <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
//                         <span className="text-sm text-zinc-300">{feature}</span>
//                       </li>
//                     ))}
//                   </ul>

//                   {isCurrentPlan ? (
//                     <Button disabled className="w-full bg-zinc-700 cursor-not-allowed">
//                       Plan actuel
//                     </Button>
//                   ) : canUpgrade ? (
//                     <Button 
//                       className={`w-full ${plan.bgClass}`}
//                       onClick={() => handleUpgrade(plan.id)}
//                       disabled={upgrading}
//                     >
//                       {upgrading && selectedPlan === plan.id ? (
//                         <Loader2 className="h-4 w-4 animate-spin mr-2" />
//                       ) : (
//                         <Zap className="h-4 w-4 mr-2" />
//                       )}
//                       Passer à {plan.name}
//                     </Button>
//                   ) : (
//                     <Button disabled className="w-full bg-zinc-700 cursor-not-allowed">
//                       Non disponible
//                     </Button>
//                   )}
//                 </CardContent>
//               </Card>
//             );
//           })}
//         </div>

//         {/* Info mode test */}
//         {billingMode === 'FREE_TEST' && (
//           <Card className="max-w-2xl mx-auto mt-8 bg-green-900/20 border-green-500/30">
//             <CardContent className="p-4 flex items-center gap-3">
//               <Zap className="h-5 w-5 text-green-500" />
//               <div>
//                 <p className="text-green-400 font-medium">Mode Test Actif</p>
//                 <p className="text-sm text-zinc-400">Les upgrades sont gratuits et instantanés en mode test</p>
//               </div>
//             </CardContent>
//           </Card>
//         )}
//       </main>
//     </div>
//   );
// };
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Check, Crown, Zap, Star, ArrowLeft, Loader2, ShieldCheck, X, CreditCard } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'sonner';

// Logger simple pour le debug
const logger = {
  info: (msg, ...args) => console.log('[MinisiteUpgrade]', msg, ...args),
  error: (msg, ...args) => console.error('[MinisiteUpgrade]', msg, ...args)
};

export const MinisiteUpgrade = () => {
  const navigate = useNavigate();
  const [currentPlan, setCurrentPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(null); // Plan sélectionné pour le paiement
  const [billingMode, setBillingMode] = useState('FREE_TEST');
  const [paymentsEnabled, setPaymentsEnabled] = useState(false);

  // --- Configuration des Plans ---
  const PLANS = [
    {
      id: 'SITE_PLAN_1',
      name: 'Starter',
      price: 1,
      description: "Pour démarrer en douceur.",
      features: [
        { name: '3 templates basiques', included: true },
        { name: '3 polices', included: true },
        { name: '5 articles maximum', included: true },
        { name: 'Branding DownPricer', included: true },
        { name: 'Catalogue revendeurs', included: false },
        { name: 'Couleurs personnalisées', included: false },
      ],
      style: { border: 'border-zinc-700', bg: 'bg-zinc-900', badge: 'bg-zinc-700' }
    },
    {
      id: 'SITE_PLAN_2',
      name: 'Standard',
      price: 10,
      description: "L'essentiel pour vendre.",
      popular: true,
      features: [
        { name: '10 templates pros', included: true },
        { name: '10 polices', included: true },
        { name: '10 articles maximum', included: true },
        { name: 'Sans branding (Marque blanche)', included: true },
        { name: 'Catalogue revendeurs (B2B)', included: true },
        { name: 'Couleurs personnalisées', included: true },
      ],
      style: { border: 'border-blue-500', bg: 'bg-blue-950/10', badge: 'bg-blue-500' }
    },
    {
      id: 'SITE_PLAN_3',
      name: 'Premium',
      price: 15,
      description: "Pour les vendeurs sérieux.",
      features: [
        { name: 'TOUS les templates (20+)', included: true },
        { name: 'TOUTES les polices', included: true },
        { name: '20 articles maximum', included: true },
        { name: 'Sans branding (Marque blanche)', included: true },
        { name: 'Catalogue revendeurs (B2B)', included: true },
        { name: 'Couleurs personnalisées', included: true },
        { name: 'Support Prioritaire', included: true },
      ],
      style: { border: 'border-purple-500', bg: 'bg-purple-950/10', badge: 'bg-purple-500' }
    }
  ];

  useEffect(() => {
    const init = async () => {
      try {
        const [planRes, settingsRes] = await Promise.all([
          api.get('/minisites/my').catch(() => null), // Ignore error if no site
          api.get('/settings/public').catch(() => ({ data: {} }))
        ]);

        if (!planRes) {
          navigate('/minisite'); // Pas de site -> redirection
          return;
        }

        setCurrentPlan(planRes.data.plan_id);
        if (settingsRes.data.billing_mode) {
          setBillingMode(settingsRes.data.billing_mode);
        }
        setPaymentsEnabled(settingsRes.data.payments_enabled || false);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [navigate]);

  const getPlanOrder = (planId) => {
    const order = { 'SITE_PLAN_1': 1, 'SITE_PLAN_2': 2, 'SITE_PLAN_3': 3 };
    return order[planId] || 0;
  };

  const handleSelectPlan = (planId) => {
    // Vérifier que le plan peut être sélectionné
    if (getPlanOrder(planId) <= getPlanOrder(currentPlan)) {
      toast.error('Vous ne pouvez pas sélectionner un plan inférieur ou identique à votre plan actuel.');
      return;
    }

    if (!paymentsEnabled) {
      toast.error('Les paiements sont actuellement désactivés');
      return;
    }

    // Sélectionner le plan (UI seulement)
    setSelectedPlanId(planId);
  };

  const handleStartCheckout = async () => {
    if (!selectedPlanId) {
      toast.error('Veuillez sélectionner un plan');
      return;
    }

    if (!paymentsEnabled) {
      toast.error('Les paiements sont actuellement désactivés');
      return;
    }

    setUpgrading(true);

    try {
      // Mapper les plan IDs vers les noms de plan Stripe
      const planMapping = {
        'SITE_PLAN_1': 'starter',
        'SITE_PLAN_2': 'standard',
        'SITE_PLAN_3': 'premium'
      };
      
      const stripePlan = planMapping[selectedPlanId];
      if (!stripePlan) {
        toast.error('Plan invalide');
        return;
      }

      logger.info(`Creating checkout session for plan: ${stripePlan}, planId: ${selectedPlanId}`);

      // Créer une session Stripe Checkout
      const response = await api.post('/billing/minisite/checkout', { plan: stripePlan });
      
      if (response.data && response.data.url) {
        logger.info(`Checkout session created, redirecting to: ${response.data.url}`);
        window.location.href = response.data.url;
      } else {
        toast.error('Erreur : aucune URL de paiement reçue');
        logger.error('No URL in checkout response:', response.data);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.detail || error.message || "Erreur lors de la création de la session de paiement";
      toast.error(errorMessage);
      logger.error('Checkout error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
    } finally {
      setUpgrading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-orange-500/30">
      <main className="container mx-auto px-4 py-8 md:py-16">
        
        {/* Navigation retour */}
        <div className="max-w-6xl mx-auto mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/minisite/dashboard')} 
            className="text-zinc-400 hover:text-white pl-0 hover:bg-transparent group"
          >
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" /> 
            Retour au dashboard
          </Button>
        </div>

        {/* Titre */}
        <div className="text-center mb-16 space-y-4">
          <Badge className="bg-gradient-to-r from-orange-500 to-pink-600 text-white border-none px-3 py-1">
             Boostez vos ventes 🚀
          </Badge>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Choisissez la puissance <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">adaptée</span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Débloquez des designs premium, supprimez la publicité et accédez au réseau de revendeurs B2B.
          </p>
        </div>

        {/* Grille de Prix */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-start">
          {PLANS.map((plan) => {
            const isCurrent = currentPlan === plan.id;
            const canUpgrade = getPlanOrder(plan.id) > getPlanOrder(currentPlan);

            return (
              <Card 
                key={plan.id} 
                onClick={() => !isCurrent && canUpgrade && paymentsEnabled && handleSelectPlan(plan.id)}
                className={`relative flex flex-col h-full border-2 transition-all duration-300 cursor-pointer ${
                  plan.popular ? 'scale-105 shadow-2xl shadow-blue-900/20 z-10' : 'hover:border-zinc-600'
                } ${
                  selectedPlanId === plan.id ? 'ring-4 ring-orange-500 ring-offset-2 ring-offset-zinc-950' : ''
                } ${plan.style.border} ${plan.style.bg}`}
              >
                {/* Badge Populaire */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-blue-500 hover:bg-blue-600 border-none px-4 py-1 text-sm shadow-lg">
                      <Star className="h-3 w-3 mr-1 fill-current" /> Le plus choisi
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-2">
                  <h3 
                    className="text-lg font-medium text-zinc-300 cursor-pointer hover:text-white transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isCurrent && canUpgrade && paymentsEnabled) {
                        handleSelectPlan(plan.id);
                      }
                    }}
                  >
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline justify-center mt-2">
                    <span className="text-5xl font-bold text-white">{plan.price}€</span>
                    <span className="text-zinc-500 ml-2">/mois</span>
                  </div>
                  <p className="text-sm text-zinc-400 mt-2">{plan.description}</p>
                  {selectedPlanId === plan.id && (
                    <Badge className="mt-2 bg-orange-500 text-white">
                      <Check className="h-3 w-3 mr-1" /> Sélectionné
                    </Badge>
                  )}
                </CardHeader>

                <CardContent className="flex-1 mt-6">
                   <div className="space-y-4">
                      {plan.features.map((feature, i) => (
                        <div key={i} className="flex items-start gap-3">
                           {feature.included ? (
                             <div className={`mt-0.5 p-0.5 rounded-full ${plan.style.badge}`}>
                               <Check className="h-3 w-3 text-white" />
                             </div>
                           ) : (
                             <X className="h-4 w-4 text-zinc-700 mt-0.5" />
                           )}
                           <span className={`text-sm ${feature.included ? 'text-zinc-200' : 'text-zinc-600 line-through'}`}>
                             {feature.name}
                           </span>
                        </div>
                      ))}
                   </div>
                </CardContent>

                <CardFooter className="pt-6">
                  {isCurrent ? (
                    <Button disabled className="w-full bg-zinc-800 text-zinc-400 border border-zinc-700" type="button">
                      <ShieldCheck className="h-4 w-4 mr-2" /> Votre plan actuel
                    </Button>
                  ) : canUpgrade && paymentsEnabled ? (
                    <Button 
                      type="button"
                      className={`w-full py-4 text-base font-semibold shadow-lg transition-all ${
                        selectedPlanId === plan.id 
                          ? 'bg-orange-600 hover:bg-orange-700 ring-2 ring-orange-400' 
                          : plan.popular 
                            ? 'bg-blue-600 hover:bg-blue-700' 
                            : plan.id === 'SITE_PLAN_3' 
                              ? 'bg-purple-600 hover:bg-purple-700' 
                              : 'bg-white text-black hover:bg-zinc-200'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectPlan(plan.id);
                      }}
                    >
                      {selectedPlanId === plan.id ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Plan sélectionné
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-2" />
                          Choisir {plan.name}
                        </>
                      )}
                    </Button>
                  ) : !paymentsEnabled ? (
                    <Button disabled type="button" className="w-full bg-zinc-900 border border-zinc-800 text-zinc-600 cursor-not-allowed">
                      <X className="h-4 w-4 mr-2" />
                      Paiements désactivés
                    </Button>
                  ) : (
                    <Button disabled type="button" className="w-full bg-zinc-900 border border-zinc-800 text-zinc-600 cursor-not-allowed">
                      Non disponible
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Bouton de paiement */}
        {selectedPlanId && paymentsEnabled && (
          <div className="max-w-6xl mx-auto mt-8 flex justify-center">
            <Card className="bg-gradient-to-r from-orange-900/20 to-red-900/20 border-orange-500/50 w-full max-w-md">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div>
                    <p className="text-zinc-300 text-sm mb-2">Plan sélectionné :</p>
                    <p className="text-2xl font-bold text-white">
                      {PLANS.find(p => p.id === selectedPlanId)?.name || 'Inconnu'}
                    </p>
                    <p className="text-zinc-400 text-sm mt-1">
                      {PLANS.find(p => p.id === selectedPlanId)?.price}€ / mois
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={handleStartCheckout}
                    disabled={upgrading || !selectedPlanId}
                    className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white py-6 text-lg font-bold shadow-lg"
                  >
                    {upgrading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Création de la session...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5 mr-2" />
                        Passer au paiement
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-zinc-500">
                    Vous serez redirigé vers Stripe pour finaliser votre paiement
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Footer Info */}
        <div className="text-center mt-12 text-zinc-500 text-sm">
           <p className="flex items-center justify-center gap-2">
             <ShieldCheck className="h-4 w-4" /> Paiement sécurisé via Stripe. Annulation possible à tout moment.
           </p>
           {billingMode === 'FREE_TEST' && (
             <p className="mt-2 text-green-500 font-mono">
               [MODE TEST ACTIF] Les paiements ne seront pas débités.
             </p>
           )}
        </div>

      </main>
    </div>
  );
};