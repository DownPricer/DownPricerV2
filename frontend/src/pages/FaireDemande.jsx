import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import { getUser } from '../utils/auth';
import api from '../utils/api';

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
    <div className="min-h-screen bg-zinc-950 text-white" data-testid="faire-demande-page">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-orange-500 mb-4" style={{fontFamily: 'Outfit, sans-serif'}}>
            Faire une demande de prix cassé
          </h1>
          <p className="text-zinc-300 text-lg leading-relaxed">
            DownPricer vous aide à trouver des prix cassés et des bons plans sur des produits que vous cherchez.
            Chaque jour, des opportunités apparaissent. Vous pouvez demander un produit précis, ou une catégorie de produit (ex : 'lave-vaisselle').
            Plus votre demande est précise, plus nous pouvons viser juste.
          </p>
        </div>

        <Card className="bg-zinc-900 border-zinc-800 mb-6">
          <CardContent className="p-6">
            <Accordion type="single" collapsible>
              <AccordionItem value="comment-ca-marche" className="border-zinc-800">
                <AccordionTrigger className="text-white hover:text-orange-500" data-testid="accordion-trigger-comment-ca-marche">
                  Comment ça marche ?
                </AccordionTrigger>
                <AccordionContent className="text-zinc-300 space-y-3">
                  <ol className="list-decimal list-inside space-y-2">
                    <li>Vous remplissez le formulaire (photos + description + prix maximum).</li>
                    <li>Nous analysons la faisabilité (acceptation ou refus).</li>
                    <li>Acompte : un acompte est demandé pour confirmer votre demande.</li>
                    <li>Annulation : vous pouvez annuler tant que l'achat n'a pas été lancé.</li>
                    <li>Une fois l'achat lancé : l'acompte n'est plus annulable.</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 mb-6">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold text-white mb-3">Acompte</h2>
            <p className="text-zinc-300 leading-relaxed">
              L'acompte correspond à environ 40% de votre prix maximum (pourcentage modifiable).
              Cela permet d'éviter les demandes non sérieuses et d'être prêt à acheter rapidement quand une opportunité apparaît.
            </p>
            {settings.billing_mode === 'FREE_TEST' && (
              <div className="mt-4 p-4 bg-orange-500/20 border border-orange-500/50 rounded-lg">
                <p className="text-orange-300 text-sm font-medium">
                  Mode test : paiements désactivés. Tous les acomptes sont gratuits.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center">
          <Button
            className="bg-orange-500 hover:bg-orange-600 text-white text-lg px-8 py-6 rounded-full"
            onClick={handleCTA}
            data-testid="faire-demande-cta-btn"
          >
            {user ? 'Créer ma demande' : 'Créer mon compte / Me connecter'}
          </Button>
          {!user && (
            <p className="text-zinc-400 mt-4 text-sm">
              Un compte est nécessaire pour suivre vos demandes.
            </p>
          )}
        </div>
      </main>
    </div>
  );
};