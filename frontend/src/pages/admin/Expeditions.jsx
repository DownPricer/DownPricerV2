import React from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Truck, Construction } from 'lucide-react';

export const AdminExpeditionsPage = () => {
  return (
    <AdminLayout>
      <div className="min-h-screen bg-black text-white p-4 sm:p-6 md:p-12 selection:bg-orange-500/30">
        
        {/* Header Section */}
        <div className="mb-8 md:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-4">
            <Truck className="h-3 w-3" /> Logistics Pipeline
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Expéditions
          </h2>
        </div>

        {/* Placeholder Card OLED Style */}
        <Card className="bg-[#080808] border-white/5 rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl">
          <CardContent className="p-8 md:p-20 flex flex-col items-center text-center">
            
            <div className="h-16 w-16 md:h-20 md:w-20 bg-orange-500/5 border border-orange-500/10 rounded-2xl md:rounded-3xl flex items-center justify-center mb-6 md:mb-8 relative">
              <Construction className="h-8 w-8 md:h-10 md:w-10 text-orange-500" />
              <div className="absolute -top-1 -right-1 flex h-3 w-3 md:h-4 md:w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 md:h-4 md:w-4 bg-orange-500"></span>
              </div>
            </div>

            <p className="text-zinc-400 font-medium mb-6 md:mb-8 text-sm md:text-base max-w-md leading-relaxed uppercase tracking-wide">
              Suivi des expéditions et tracking colis
            </p>
            
            <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20 px-6 py-2 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">
              Fonctionnalité en développement
            </Badge>

          </CardContent>
        </Card>

        {/* Footer info discret */}
        <p className="mt-8 text-center text-[9px] font-bold text-zinc-800 uppercase tracking-[0.4em]">
          Logistics Control Unit • DownPricer v2.4
        </p>
      </div>
    </AdminLayout>
  );
};