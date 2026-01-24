import React from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

export const AdminAbonnementsPage = () => {
  return (
    <AdminLayout>
      {/* Ajustement du padding : p-4 sur mobile, p-8 sur tablette, p-12 sur desktop */}
      <div className="min-h-screen bg-black p-4 sm:p-8 md:p-12">
        
        {/* Titre : réduction de la taille sur mobile (text-2xl) pour éviter les retours à la ligne brusques */}
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-6 md:mb-8 tracking-tighter uppercase italic" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Abonnements
        </h2>
        
        {/* Card : arrondi réduit sur mobile (rounded-2xl) pour gagner de l'espace visuel */}
        <Card className="bg-[#080808] border-white/5 rounded-2xl md:rounded-[2rem] overflow-hidden shadow-2xl">
          {/* CardContent : padding réduit (p-6) sur mobile pour que le contenu ne soit pas écrasé */}
          <CardContent className="p-6 sm:p-10 md:p-12 text-center">
            <p className="text-zinc-400 text-sm sm:text-base font-medium mb-6">
              Gestion des abonnements Mini-sites <span className="text-white block sm:inline">(1€/10€/15€)</span> et S-Plan <span className="text-white block sm:inline">(5€/15€)</span>
            </p>
            
            <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20 px-4 py-1.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em]">
              Fonctionnalité en développement
            </Badge>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};