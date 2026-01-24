import React from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Globe, LayoutGrid, Construction, Activity } from 'lucide-react';

export const AdminMiniSitesPage = () => {
  return (
    <AdminLayout>
      <div className="min-h-screen bg-black text-white p-4 sm:p-6 md:p-12 selection:bg-orange-500/30">
        
        {/* Header Section Adaptatif */}
        <div className="mb-10 md:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-4">
            <Globe className="h-3 w-3" /> Network Infrastructure
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Gestion <span className="text-orange-500">Mini-sites</span>
          </h2>
          <p className="mt-2 text-zinc-500 text-xs md:text-sm font-medium uppercase tracking-wider italic">Contrôle des vitrines vendeurs et régulation des quotas</p>
        </div>

        {/* Placeholder Card OLED Style - Responsive Padding */}
        <Card className="bg-[#080808] border-white/5 rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl">
          <CardContent className="p-10 md:p-24 flex flex-col items-center text-center">
            
            {/* Visual Feedback: Construction Mode */}
            <div className="h-16 w-16 md:h-20 md:w-20 bg-orange-500/5 border border-orange-500/10 rounded-2xl md:rounded-3xl flex items-center justify-center mb-6 md:mb-8 relative">
              <LayoutGrid className="h-8 w-8 md:h-10 md:w-10 text-orange-500" />
              <div className="absolute -top-1 -right-1 flex h-3 w-3 md:h-4 md:w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 md:h-4 md:w-4 bg-orange-500"></span>
              </div>
            </div>

            <p className="text-zinc-400 font-medium mb-6 md:mb-8 text-sm md:text-base max-w-lg leading-relaxed uppercase tracking-wide">
              Gestion des mini-sites vendeurs : <span className="text-white">validation</span>, <span className="text-white">modération</span> et supervision des <span className="text-white">quotas</span>.
            </p>
            
            <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20 px-6 py-2 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">
              Module en cours de déploiement
            </Badge>

          </CardContent>
        </Card>

        {/* Technical Footer */}
        <div className="mt-8 md:mt-12 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-white/[0.03] pt-8">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-zinc-700 uppercase tracking-[0.2em]">Service Status</span>
              <div className="flex items-center gap-2">
                <Activity size={10} className="text-orange-500" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase">Ready for Sync</span>
              </div>
            </div>
          </div>
          <p className="text-[9px] font-bold text-zinc-800 uppercase tracking-[0.4em]">
            Admin Store Unit • DownPricer v2.4
          </p>
        </div>

      </div>
    </AdminLayout>
  );
};