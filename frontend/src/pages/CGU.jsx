import React from 'react';
import { Header } from '../components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

export const CGU = () => {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Header />
      
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-3xl text-white mb-2">Conditions Générales d'Utilisation</CardTitle>
            <p className="text-zinc-400 text-sm">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>
          </CardHeader>
          <CardContent className="space-y-6 text-zinc-300">
            
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">1. Objet</h2>
              <p>
                Les présentes Conditions Générales d'Utilisation (CGU) régissent l'utilisation de la plateforme DownPricer, 
                service de mise en relation entre vendeurs et acheteurs pour la revente d'articles.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">2. Acceptation des CGU</h2>
              <p>
                L'utilisation de DownPricer implique l'acceptation pleine et entière des présentes CGU. 
                En créant un compte, vous reconnaissez avoir lu, compris et accepté ces conditions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">3. Compte utilisateur</h2>
              <p>
                Pour utiliser les services de DownPricer, vous devez créer un compte en fournissant des informations exactes et à jour. 
                Vous êtes responsable de la confidentialité de vos identifiants et de toutes les activités effectuées sous votre compte.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">4. Services proposés</h2>
              <p>
                DownPricer propose plusieurs services :
              </p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Mise en relation entre vendeurs et acheteurs</li>
                <li>Gestion de demandes d'achat</li>
                <li>Création de mini-sites personnalisés</li>
                <li>Gestion de ventes et paiements</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">5. Obligations des utilisateurs</h2>
              <p>Vous vous engagez à :</p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Utiliser la plateforme conformément à la législation en vigueur</li>
                <li>Ne pas diffuser de contenu illicite, diffamatoire ou portant atteinte aux droits de tiers</li>
                <li>Respecter les droits de propriété intellectuelle</li>
                <li>Ne pas utiliser la plateforme à des fins frauduleuses</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">6. Paiements et commissions</h2>
              <p>
                Les transactions peuvent être soumises à des commissions. Les modalités de paiement et les commissions 
                sont détaillées dans les conditions spécifiques de chaque service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">7. Responsabilité</h2>
              <p>
                DownPricer agit en tant qu'intermédiaire technique. La responsabilité de DownPricer ne peut être engagée 
                en cas de litige entre vendeurs et acheteurs, ou en cas de non-respect des obligations par les utilisateurs.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">8. Propriété intellectuelle</h2>
              <p>
                Tous les contenus présents sur DownPricer (textes, images, logos, etc.) sont protégés par le droit d'auteur. 
                Toute reproduction non autorisée est interdite.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">9. Données personnelles</h2>
              <p>
                Vos données personnelles sont traitées conformément à notre politique de confidentialité et au RGPD. 
                Vous disposez d'un droit d'accès, de rectification et de suppression de vos données.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">10. Modification des CGU</h2>
              <p>
                DownPricer se réserve le droit de modifier les présentes CGU à tout moment. 
                Les utilisateurs seront informés des modifications importantes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">11. Contact</h2>
              <p>
                Pour toute question concernant les CGU, vous pouvez nous contacter à : 
                <a href="mailto:support@downpricer.com" className="text-orange-500 hover:text-orange-400 ml-1">
                  support@downpricer.com
                </a>
              </p>
            </section>

          </CardContent>
        </Card>
      </main>
    </div>
  );
};

