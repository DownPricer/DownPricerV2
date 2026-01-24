import React from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

export const AdminAbonnementsPage = () => {
  return (
    <AdminLayout>
      <div className="min-h-screen bg-black p-8 md:p-12">
        <h2 className="text-4xl font-black text-white mb-8 tracking-tighter uppercase italic" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Abonnements
        </h2>
        
        <Card className="bg-[#080808] border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
          <CardContent className="p-12 text-center">
            <p className="text-zinc-400 font-medium mb-6">
              Gestion des abonnements Mini-sites <span className="text-white">(1€/10€/15€)</span> et S-Plan <span className="text-white">(5€/15€)</span>
            </p>
            
            <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em]">
              Fonctionnalité en développement
            </Badge>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};