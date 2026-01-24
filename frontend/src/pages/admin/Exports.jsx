import React from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Download, Database, Table, ShieldCheck, ChevronRight, FileJson, Archive } from 'lucide-react';
import { toast } from 'sonner';

export const AdminExportsPage = () => {
  const handleExport = (type) => {
    toast.info(`Export ${type} en cours de développement`);
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-black text-white p-4 sm:p-6 md:p-12 selection:bg-orange-500/30">
        
        {/* Header Section */}
        <div className="mb-10 md:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-4">
            <Database className="h-3 w-3" /> Data Management
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Exports & <span className="text-orange-500">Sauvegardes</span>
          </h2>
          <p className="mt-2 text-zinc-500 text-sm font-medium uppercase tracking-wider italic">Extraction brute et sécurisation de l'infrastructure</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          
          {/* Section Exports CSV/Excel */}
          <Card className="bg-[#080808] border-white/5 rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl">
            <CardHeader className="p-6 md:p-8 pb-4 border-b border-white/[0.03]">
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-3">
                <Table size={16} className="text-orange-500" /> Flux Tableurs (CSV)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 md:p-8 space-y-3">
              <ExportRow label="Articles" type="articles" onClick={handleExport} />
              <ExportRow label="Demandes" type="demandes" onClick={handleExport} />
              <ExportRow label="Ventes" type="ventes" onClick={handleExport} />
              <ExportRow label="Utilisateurs" type="users" onClick={handleExport} />
            </CardContent>
          </Card>

          {/* Section Sauvegardes Système */}
          <Card className="bg-[#080808] border-white/5 rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col">
            <CardHeader className="p-6 md:p-8 pb-4 border-b border-white/[0.03]">
              <CardTitle className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 flex items-center gap-3">
                <ShieldCheck size={16} className="text-green-500" /> Archives Critiques
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 md:p-8 flex-1 flex flex-col">
              <div className="space-y-4">
                <Button 
                  className="w-full justify-between bg-white hover:bg-zinc-200 text-black font-black uppercase tracking-widest text-[10px] h-14 rounded-2xl transition-all active:scale-[0.98]"
                  onClick={() => handleExport('json')}
                >
                  <span className="flex items-center gap-3">
                    <FileJson className="h-5 w-5" /> Sauvegarde JSON
                  </span>
                  <Download className="h-4 w-4 opacity-30" />
                </Button>

                <Button 
                  className="w-full justify-between bg-white hover:bg-zinc-200 text-black font-black uppercase tracking-widest text-[10px] h-14 rounded-2xl transition-all active:scale-[0.98]"
                  onClick={() => handleExport('zip')}
                >
                  <span className="flex items-center gap-3">
                    <Archive className="h-5 w-5" /> Sauvegarde ZIP
                  </span>
                  <Download className="h-4 w-4 opacity-30" />
                </Button>
              </div>
              
              <div className="mt-8 pt-6 border-t border-white/[0.03]">
                <p className="text-[10px] text-zinc-600 font-bold uppercase leading-relaxed tracking-wider">
                  ⚠️ Les sauvegardes incluent l'intégralité des données transactionnelles et utilisateurs de la plateforme.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Footer */}
        <p className="mt-8 text-center text-[9px] font-bold text-zinc-800 uppercase tracking-[0.4em]">
          Data Extraction Unit • Secure Vault • DownPricer v2.4
        </p>

      </div>
    </AdminLayout>
  );
};

// --- COMPOSANT ROW INTERNE ---

const ExportRow = ({ label, type, onClick }) => (
  <button
    onClick={() => onClick(type)}
    className="w-full flex items-center justify-between p-4 bg-black border border-white/5 hover:border-orange-500/30 rounded-2xl transition-all group active:scale-[0.99]"
  >
    <div className="flex items-center gap-4">
      <div className="h-10 w-10 rounded-xl bg-[#0F0F0F] border border-white/5 flex items-center justify-center text-zinc-600 group-hover:text-orange-500 transition-colors">
        <Download size={18} />
      </div>
      <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-white">
        Exporter les {label}
      </span>
    </div>
    <ChevronRight size={16} className="text-zinc-800 group-hover:text-orange-500 transition-colors" />
  </button>
);