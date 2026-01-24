// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Header } from '../components/Header';
// import { Button } from '../components/ui/button';
// import { Card, CardContent } from '../components/ui/card';
// import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
// import { getUser } from '../utils/auth';
// import api from '../utils/api';

// export const FaireDemande = () => {
//   const navigate = useNavigate();
//   const [user, setUser] = useState(null);
//   const [settings, setSettings] = useState({});

//   useEffect(() => {
//     setUser(getUser());
//     fetchSettings();
//   }, []);

//   const fetchSettings = async () => {
//     try {
//       const response = await api.get('/settings/public');
//       setSettings(response.data);
//     } catch (error) {
//       console.error('Erreur chargement paramètres:', error);
//     }
//   };

//   const handleCTA = () => {
//     if (user) {
//       navigate('/nouvelle-demande');
//     } else {
//       navigate('/signup');
//     }
//   };

//   return (
//     <div className="min-h-screen bg-zinc-950 text-white" data-testid="faire-demande-page">
//       
//       <main className="container mx-auto px-4 py-8 max-w-4xl">
//         <div className="mb-8">
//           <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-orange-500 mb-4" style={{fontFamily: 'Outfit, sans-serif'}}>
//             Faire une demande de prix cassé
//           </h1>
//           <p className="text-zinc-300 text-lg leading-relaxed">
//             DownPricer vous aide à trouver des prix cassés et des bons plans sur des produits que vous cherchez.
//             Chaque jour, des opportunités apparaissent. Vous pouvez demander un produit précis, ou une catégorie de produit (ex : 'lave-vaisselle').
//             Plus votre demande est précise, plus nous pouvons viser juste.
//           </p>
//         </div>

//         <Card className="bg-zinc-900 border-zinc-800 mb-6">
//           <CardContent className="p-6">
//             <Accordion type="single" collapsible>
//               <AccordionItem value="comment-ca-marche" className="border-zinc-800">
//                 <AccordionTrigger className="text-white hover:text-orange-500" data-testid="accordion-trigger-comment-ca-marche">
//                   Comment ça marche ?
//                 </AccordionTrigger>
//                 <AccordionContent className="text-zinc-300 space-y-3">
//                   <ol className="list-decimal list-inside space-y-2">
//                     <li>Vous remplissez le formulaire (photos + description + prix maximum).</li>
//                     <li>Nous analysons la faisabilité (acceptation ou refus).</li>
//                     <li>Acompte : un acompte est demandé pour confirmer votre demande.</li>
//                     <li>Annulation : vous pouvez annuler tant que l'achat n'a pas été lancé.</li>
//                     <li>Une fois l'achat lancé : l'acompte n'est plus annulable.</li>
//                   </ol>
//                 </AccordionContent>
//               </AccordionItem>
//             </Accordion>
//           </CardContent>
//         </Card>

//         <Card className="bg-zinc-900 border-zinc-800 mb-6">
//           <CardContent className="p-6">
//             <h2 className="text-2xl font-bold text-white mb-3">Acompte</h2>
//             <p className="text-zinc-300 leading-relaxed">
//               L'acompte correspond à environ 40% de votre prix maximum (pourcentage modifiable).
//               Cela permet d'éviter les demandes non sérieuses et d'être prêt à acheter rapidement quand une opportunité apparaît.
//             </p>
//             {settings.billing_mode === 'FREE_TEST' && (
//               <div className="mt-4 p-4 bg-orange-500/20 border border-orange-500/50 rounded-lg">
//                 <p className="text-orange-300 text-sm font-medium">
//                   Mode test : paiements désactivés. Tous les acomptes sont gratuits.
//                 </p>
//               </div>
//             )}
//           </CardContent>
//         </Card>

//         <div className="text-center">
//           <Button
//             className="bg-orange-500 hover:bg-orange-600 text-white text-lg px-8 py-6 rounded-full"
//             onClick={handleCTA}
//             data-testid="faire-demande-cta-btn"
//           >
//             {user ? 'Créer ma demande' : 'Créer mon compte / Me connecter'}
//           </Button>
//           {!user && (
//             <p className="text-zinc-400 mt-4 text-sm">
//               Un compte est nécessaire pour suivre vos demandes.
//             </p>
//           )}
//         </div>
//       </main>
//     </div>
//   );
// };

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { getUser } from '../utils/auth';
import api from '../utils/api';
import { 
  FileText, 
  SearchCheck, 
  CreditCard, 
  ShieldCheck, 
  ArrowRight, 
  Info 
} from 'lucide-react';

export const FaireDemande = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState({});

  useEffect(() => {
    setUser(getUser());
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings/public');
      setSettings(response.data);
    } catch (error) {
      console.error('Erreur chargement paramètres:', error);
    }
  };

  const handleCTA = () => {
    if (user) {
      navigate('/nouvelle-demande');
    } else {
      navigate('/signup');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-orange-500/30" data-testid="faire-demande-page">
      
      {/* --- HERO SECTION --- */}
      <div className="relative border-b border-zinc-800/50 bg-zinc-900/30">
        <div className="container mx-auto px-4 py-12 md:py-20 text-center max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6" style={{fontFamily: 'Outfit, sans-serif'}}>
            Obtenez le <span className="text-orange-500">meilleur prix</span> sur demande
          </h1>
          <p className="text-zinc-400 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
            DownPricer chasse les opportunités pour vous. Décrivez le produit ou la catégorie que vous visez, et nous trouvons l'offre impossible à refuser.
          </p>
        </div>
      </div>

      <main className="container mx-auto px-4 py-12 max-w-5xl">
        
        {/* --- COMMENT ÇA MARCHE (STEPS) --- */}
        <div className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-white inline-flex items-center gap-2">
              <Info className="text-orange-500" /> Comment ça marche ?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StepCard 
              icon={<FileText className="h-8 w-8 text-orange-500" />}
              step="1"
              title="Votre demande"
              description="Remplissez le formulaire avec vos critères (photos, description) et fixez votre prix maximum."
            />
            <StepCard 
              icon={<SearchCheck className="h-8 w-8 text-blue-500" />}
              step="2"
              title="Analyse & Validation"
              description="Nous analysons la faisabilité de votre requête. Si c'est réaliste, nous l'acceptons."
            />
            <StepCard 
              icon={<CreditCard className="h-8 w-8 text-green-500" />}
              step="3"
              title="Acompte & Recherche"
              description="Vous versez un acompte pour lancer la chasse. Annulable tant que l'achat n'est pas fait."
            />
          </div>
        </div>

        {/* --- SECTION CONFIANCE / ACOMPTE --- */}
        <div className="grid md:grid-cols-5 gap-8 items-start mb-16">
          {/* Info Acompte */}
          <Card className="md:col-span-3 bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-zinc-800 rounded-lg">
                  <ShieldCheck className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Pourquoi un acompte ?</h3>
                  <p className="text-zinc-400 leading-relaxed mb-4">
                    L'acompte correspond à environ <strong>40% de votre prix maximum</strong>. 
                    C'est un engagement mutuel qui nous permet de sécuriser immédiatement une bonne affaire 
                    lorsqu'elle apparaît, sans perdre une seconde.
                  </p>
                  <ul className="space-y-2 text-sm text-zinc-300">
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      Totalement remboursable avant l'achat final
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      Sécurisé via notre partenaire de paiement
                    </li>
                  </ul>
                </div>
              </div>

              {/* Mode Test Warning */}
              {settings.billing_mode === 'FREE_TEST' && (
                <div className="mt-6 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg flex gap-3">
                  <Info className="h-5 w-5 text-orange-500 shrink-0" />
                  <p className="text-orange-200 text-sm">
                    <span className="font-semibold">Mode Démo actif :</span> Le système de paiement est désactivé. 
                    Vous pouvez créer des demandes et simuler des acomptes gratuitement.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* CTA Box */}
          <div className="md:col-span-2 flex flex-col justify-center h-full space-y-6 text-center md:text-left">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Prêt à économiser ?</h3>
              <p className="text-zinc-400">
                Ne passez plus à côté des meilleures offres. Laissez-nous chercher pour vous.
              </p>
            </div>
            
            <Button
              className="w-full bg-orange-500 hover:bg-orange-600 text-white text-lg h-14 rounded-xl shadow-lg shadow-orange-900/20 hover:scale-[1.02] transition-all duration-200 group"
              onClick={handleCTA}
              data-testid="faire-demande-cta-btn"
            >
              {user ? 'Créer ma demande' : 'Commencer maintenant'}
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            {!user && (
              <p className="text-xs text-center text-zinc-500">
                Création de compte gratuite et sans engagement.
              </p>
            )}
          </div>
        </div>

      </main>
    </div>
  );
};

// --- Composant Helper pour les étapes ---
const StepCard = ({ icon, step, title, description }) => (
  <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors relative overflow-hidden">
    <div className="absolute top-0 right-0 p-4 opacity-5 font-black text-6xl text-white pointer-events-none select-none">
      {step}
    </div>
    <CardContent className="p-6 pt-8 text-center flex flex-col items-center h-full">
      <div className="mb-4 p-4 bg-zinc-950 rounded-full border border-zinc-800 shadow-inner">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-white mb-3">{title}</h3>
      <p className="text-zinc-400 text-sm leading-relaxed">
        {description}
      </p>
    </CardContent>
  </Card>
);