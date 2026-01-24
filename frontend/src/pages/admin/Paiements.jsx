import React from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { CreditCard, Landmark, Construction, Activity } from 'lucide-react';

export const AdminPaiementsPage = () => {
  return (
    <AdminLayout>
      <div className="min-h-screen bg-black text-white p-4 sm:p-6 md:p-12 selection:bg-orange-500/30">
        
        {/* Header Section Responsiv */}
        <div className="mb-10 md:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-4">
            <Landmark className="h-3 w-3" /> Financial Control
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Gestion <span className="text-orange-500">Paiements</span>
          </h2>
          <p className="mt-2 text-zinc-500 text-xs md:text-sm font-medium uppercase tracking-wider italic">Supervision des flux entrants, acomptes et remboursements</p>
        </div>

        {/* Status Card OLED - Responsive Padding */}
        <Card className="bg-[#080808] border-white/5 rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl">
          <CardContent className="p-10 md:p-24 flex flex-col items-center text-center">
            
            {/* Visual: Secure Payment Pulse */}
            <div className="h-16 w-16 md:h-20 md:w-20 bg-orange-500/5 border border-orange-500/10 rounded-2xl md:rounded-3xl flex items-center justify-center mb-6 md:mb-8 relative">
              <CreditCard className="h-8 w-8 md:h-10 md:w-10 text-orange-500" />
              <div className="absolute -top-1 -right-1 flex h-3 w-3 md:h-4 md:w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 md:h-4 md:w-4 bg-orange-500"></span>
              </div>
            </div>

            <p className="text-zinc-400 font-medium mb-6 md:mb-8 text-sm md:text-base max-w-lg leading-relaxed uppercase tracking-wide">
              Interface de gestion des <span className="text-white">acomptes</span>, des <span className="text-white">soldes</span> finaux et des protocoles de <span className="text-white">remboursement</span>.
            </p>
            
            <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20 px-6 py-2 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">
              Architecture en cours de finalisation
            </Badge>

          </CardContent>
        </Card>

        {/* Security / System Footer */}
        <div className="mt-8 md:mt-12 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-white/[0.03] pt-8">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-zinc-700 uppercase tracking-[0.2em]">Stripe Connection</span>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase">Gateway Ready</span>
              </div>
            </div>
          </div>
          <p className="text-[9px] font-bold text-zinc-800 uppercase tracking-[0.4em]">
            Financial Audit Unit • DownPricer v2.4
          </p>
        </div>

      </div>
    </AdminLayout>
  );
};