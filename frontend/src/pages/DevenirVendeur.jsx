// import React, { useState } from 'react';
// import { Header } from '../components/Header';
// import { Button } from '../components/ui/button';
// import { Card, CardContent } from '../components/ui/card';
// import { Input } from '../components/ui/input';
// import { Label } from '../components/ui/label';
// import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
// import api from '../utils/api';
// import { toast } from 'sonner';

// export const DevenirVendeur = () => {
//   const [formData, setFormData] = useState({
//     first_name: '',
//     last_name: '',
//     email: '',
//     phone: ''
//   });
//   const [loading, setLoading] = useState(false);
//   const [submitted, setSubmitted] = useState(false);

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);

//     try {
//       const formDataObj = new FormData();
//       Object.keys(formData).forEach(key => {
//         formDataObj.append(key, formData[key]);
//       });

//       await api.post('/seller/request', formDataObj, {
//         headers: { 'Content-Type': 'multipart/form-data' }
//       });

//       toast.success('Demande envoyée. Nous vous contacterons par email.');
//       setSubmitted(true);
//     } catch (error) {
//       toast.error(error.response?.data?.detail || 'Erreur lors de l\'envoi de la demande');
//     }

//     setLoading(false);
//   };

//   return (
//     <div className="min-h-screen bg-zinc-950 text-white" data-testid="devenir-vendeur-page">
//       <Header />
      
//       <main className="container mx-auto px-4 py-8 max-w-4xl">
//         <div className="mb-8">
//           <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-orange-500 mb-4" style={{fontFamily: 'Outfit, sans-serif'}}>
//             Devenir vendeur
//           </h1>
//           <p className="text-zinc-300 text-lg leading-relaxed">
//             Vous voulez compléter vos fins de mois ?
//             Rejoignez DownPricer et vendez des articles via Vinted.
//             Vous accédez à un catalogue revendeur, vous revendez, et vous gardez votre marge.
//           </p>
//         </div>

//         <Card className="bg-zinc-900 border-zinc-800 mb-6">
//           <CardContent className="p-6">
//             <Accordion type="single" collapsible>
//               <AccordionItem value="en-savoir-plus" className="border-zinc-800">
//                 <AccordionTrigger className="text-white hover:text-orange-500" data-testid="accordion-trigger-en-savoir-plus">
//                   En savoir plus
//                 </AccordionTrigger>
//                 <AccordionContent className="text-zinc-300">
//                   <p>
//                     Le principe est simple : vous choisissez des articles, vous les publiez, et quand vous vendez, vous finalisez avec DownPricer.
//                   </p>
//                 </AccordionContent>
//               </AccordionItem>
//             </Accordion>
//           </CardContent>
//         </Card>

//         {!submitted ? (
//           <Card className="bg-zinc-900 border-zinc-800">
//             <CardContent className="p-6">
//               <form onSubmit={handleSubmit} className="space-y-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="first_name" className="text-white">Prénom</Label>
//                   <Input
//                     id="first_name"
//                     name="first_name"
//                     value={formData.first_name}
//                     onChange={handleChange}
//                     required
//                     className="bg-zinc-800 border-zinc-700 text-white"
//                     data-testid="seller-request-firstname-input"
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="last_name" className="text-white">Nom</Label>
//                   <Input
//                     id="last_name"
//                     name="last_name"
//                     value={formData.last_name}
//                     onChange={handleChange}
//                     required
//                     className="bg-zinc-800 border-zinc-700 text-white"
//                     data-testid="seller-request-lastname-input"
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="email" className="text-white">Email</Label>
//                   <Input
//                     id="email"
//                     name="email"
//                     type="email"
//                     value={formData.email}
//                     onChange={handleChange}
//                     required
//                     className="bg-zinc-800 border-zinc-700 text-white"
//                     data-testid="seller-request-email-input"
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="phone" className="text-white">Téléphone</Label>
//                   <Input
//                     id="phone"
//                     name="phone"
//                     type="tel"
//                     value={formData.phone}
//                     onChange={handleChange}
//                     required
//                     className="bg-zinc-800 border-zinc-700 text-white"
//                     data-testid="seller-request-phone-input"
//                   />
//                 </div>
//                 <Button
//                   type="submit"
//                   className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-full"
//                   disabled={loading}
//                   data-testid="seller-request-submit-btn"
//                 >
//                   {loading ? 'Envoi...' : 'Envoyer ma demande'}
//                 </Button>
//               </form>
//             </CardContent>
//           </Card>
//         ) : (
//           <Card className="bg-green-500/20 border-green-500/50">
//             <CardContent className="p-6 text-center">
//               <p className="text-green-300 text-lg">
//                 Demande envoyée. Nous vous contacterons par email.
//               </p>
//             </CardContent>
//           </Card>
//         )}
//       </main>
//     </div>
//   );
// };

import React, { useState } from 'react';
import { Header } from '../components/Header';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { CheckCircle, TrendingUp, ShieldCheck, ArrowRight, Loader2, Store } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'sonner';

export const DevenirVendeur = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataObj = new FormData();
      Object.keys(formData).forEach(key => {
        formDataObj.append(key, formData[key]);
      });

      await api.post('/seller/request', formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Demande envoyée avec succès !');
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'envoi de la demande');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-orange-500/30" data-testid="devenir-vendeur-page">
      <Header />
      
      <main className="container mx-auto px-4 py-8 md:py-16">
        
        {/* Layout Grid: 1 colonne sur Mobile, 2 colonnes sur Desktop (lg) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-start">
          
          {/* --- COLONNE GAUCHE : Argumentaire de vente --- */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-medium">
                <Store className="h-4 w-4" /> Programme Revendeur
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white" style={{fontFamily: 'Outfit, sans-serif'}}>
                Transformez vos ventes en <span className="text-orange-500">revenus</span>
              </h1>
              <p className="text-zinc-400 text-lg leading-relaxed max-w-lg">
                Rejoignez le réseau DownPricer. Accédez à notre catalogue exclusif, revendez sur Vinted ou Leboncoin, et encaissez la marge.
              </p>
            </div>

            {/* Liste des avantages (Visible tout de suite, pas d'accordéon) */}
            <div className="space-y-6 pt-4">
              <BenefitItem 
                icon={<TrendingUp className="h-6 w-6 text-green-500" />}
                title="Marges attractives"
                description="Achetez à prix cassé via notre plateforme et revendez au prix du marché."
              />
              <BenefitItem 
                icon={<ShieldCheck className="h-6 w-6 text-blue-500" />}
                title="Simplicité & Sécurité"
                description="Nous gérons le sourcing. Vous gérez la vente. Transactions sécurisées garanties."
              />
              <BenefitItem 
                icon={<CheckCircle className="h-6 w-6 text-orange-500" />}
                title="Accès Prioritaire"
                description="Les vendeurs validés accèdent aux meilleures offres avant tout le monde."
              />
            </div>
          </div>

          {/* --- COLONNE DROITE : Formulaire --- */}
          <div className="w-full">
            {!submitted ? (
              <Card className="bg-zinc-900 border-zinc-800 shadow-2xl shadow-black/50">
                <CardHeader>
                  <CardTitle className="text-xl text-white">Formulaire d'inscription</CardTitle>
                  <CardDescription className="text-zinc-400">
                    Remplissez ce formulaire pour être recontacté par notre équipe.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    
                    {/* Grille Prénom / Nom pour gagner de la place */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first_name" className="text-zinc-300">Prénom</Label>
                        <Input
                          id="first_name"
                          name="first_name"
                          placeholder="Jean"
                          value={formData.first_name}
                          onChange={handleChange}
                          required
                          className="bg-zinc-950 border-zinc-700 text-white focus:border-orange-500 focus:ring-orange-500/20"
                          data-testid="seller-request-firstname-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last_name" className="text-zinc-300">Nom</Label>
                        <Input
                          id="last_name"
                          name="last_name"
                          placeholder="Dupont"
                          value={formData.last_name}
                          onChange={handleChange}
                          required
                          className="bg-zinc-950 border-zinc-700 text-white focus:border-orange-500 focus:ring-orange-500/20"
                          data-testid="seller-request-lastname-input"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-zinc-300">Email professionnel ou personnel</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="jean.dupont@exemple.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="bg-zinc-950 border-zinc-700 text-white focus:border-orange-500 focus:ring-orange-500/20"
                        data-testid="seller-request-email-input"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-zinc-300">Téléphone mobile</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="06 12 34 56 78"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        className="bg-zinc-950 border-zinc-700 text-white focus:border-orange-500 focus:ring-orange-500/20"
                        data-testid="seller-request-phone-input"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-6 rounded-lg transition-all mt-2 group"
                      disabled={loading}
                      data-testid="seller-request-submit-btn"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Envoi en cours...
                        </>
                      ) : (
                        <>
                          Envoyer ma candidature <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </Button>
                    
                    <p className="text-xs text-zinc-500 text-center pt-2">
                      En cliquant, vous acceptez d'être contacté pour valider votre profil.
                    </p>
                  </form>
                </CardContent>
              </Card>
            ) : (
              // --- Success State ---
              <Card className="bg-zinc-900 border-green-500/30 shadow-2xl shadow-green-900/10 h-full flex flex-col justify-center items-center text-center p-8 animate-in fade-in zoom-in duration-300">
                <div className="h-20 w-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle className="h-10 w-10 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">Candidature reçue !</h2>
                <p className="text-zinc-400 mb-8 max-w-sm">
                  Merci {formData.first_name}. Notre équipe va examiner votre profil. Vous recevrez un email de confirmation d'ici 24 à 48 heures.
                </p>
                <Button 
                  variant="outline" 
                  className="border-zinc-700 hover:bg-zinc-800 text-white"
                  onClick={() => window.location.href = '/'}
                >
                  Retour à l'accueil
                </Button>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

// --- Composant Helper pour la lisibilité ---
const BenefitItem = ({ icon, title, description }) => (
  <div className="flex gap-4 items-start p-4 rounded-xl hover:bg-zinc-900/50 transition-colors border border-transparent hover:border-zinc-800/50">
    <div className="mt-1 bg-zinc-900 p-2 rounded-lg border border-zinc-800 shrink-0">
      {icon}
    </div>
    <div>
      <h3 className="font-bold text-white text-lg mb-1">{title}</h3>
      <p className="text-zinc-400 text-sm leading-relaxed">{description}</p>
    </div>
  </div>
);