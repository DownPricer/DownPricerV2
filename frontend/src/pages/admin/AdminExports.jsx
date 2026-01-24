import React, { useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Download, FileText, Table, Users, Package, Database, ShieldCheck, Loader2, ChevronRight } from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'sonner';

export const AdminExportsPage = () => {
  const [exporting, setExporting] = useState(null);

  const handleExport = async (type) => {
    setExporting(type);
    try {
      let data = [];
      let filename = '';
      
      switch(type) {
        case 'articles':
          const articlesRes = await api.get('/articles?limit=10000');
          data = articlesRes.data.articles;
          filename = 'articles.csv';
          break;
        case 'users':
          const usersRes = await api.get('/admin/users');
          data = usersRes.data;
          filename = 'utilisateurs.csv';
          break;
        case 'demandes':
          const demandesRes = await api.get('/admin/demandes');
          data = demandesRes.data;
          filename = 'demandes.csv';
          break;
        case 'ventes':
          const ventesRes = await api.get('/admin/sales');
          data = ventesRes.data;
          filename = 'ventes.csv';
          break;
        default:
          throw new Error('Type d\'export inconnu');
      }

      if (data.length === 0) {
        toast.error('Aucune donnée à exporter');
        setExporting(null);
        return;
      }

      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(item => 
        Object.values(item).map(val => 
          typeof val === 'string' && val.includes(',') ? `"${val}"` : val
        ).join(',')
      );
      const csv = [headers, ...rows].join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);

      toast.success(`Export ${filename} réussi`);
    } catch (error) {
      toast.error('Erreur lors de l\'export');
    }
    setExporting(null);
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-black text-white p-6 md:p-12 selection:bg-orange-500/30">
        
        {/* Header Section */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] font-black uppercase tracking-widest mb-4">
            <Database className="h-3 w-3" /> Data Management
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Exports & <span className="text-orange-500">Backups</span>
          </h2>
          <p className="mt-2 text-zinc-500 text-sm font-medium uppercase tracking-wider italic">Extraction brute et sauvegarde de la base de données</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* CSV Section */}
          <Card className="bg-[#080808] border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
            <CardHeader className="px-8 pt-8 pb-4">
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                <Table className="h-4 w-4 text-orange-500" /> Formats Tableurs (CSV)
              </CardTitle>
            </CardHeader>
            <CardContent className="px-8 pb-8 space-y-3">
              <ExportButton 
                label="Articles" icon={<Package size={16}/>} 
                loading={exporting === 'articles'} 
                onClick={() => handleExport('articles')} 
              />
              <ExportButton 
                label="Utilisateurs" icon={<Users size={16}/>} 
                loading={exporting === 'users'} 
                onClick={() => handleExport('users')} 
              />
              <ExportButton 
                label="Demandes" icon={<FileText size={16}/>} 
                loading={exporting === 'demandes'} 
                onClick={() => handleExport('demandes')} 
              />
              <ExportButton 
                label="Ventes" icon={<Download size={16}/>} 
                loading={exporting === 'ventes'} 
                onClick={() => handleExport('ventes')} 
              />
            </CardContent>
          </Card>

          {/* Full Backup Section */}
          <Card className="bg-[#080808] border-white/5 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col">
            <CardHeader className="px-8 pt-8 pb-4">
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-green-500" /> Sauvegarde Critique
              </CardTitle>
            </CardHeader>
            <CardContent className="px-8 pb-8 flex-1 flex flex-col">
              <p className="text-zinc-500 text-xs font-medium leading-relaxed mb-8 uppercase tracking-wider">
                Générez un snapshot complet de l'infrastructure au format JSON pour une restauration d'urgence.
              </p>
              
              <div className="mt-auto space-y-6">
                <Button
                  className="w-full bg-white hover:bg-zinc-200 text-black font-black uppercase tracking-widest text-[11px] h-14 rounded-2xl shadow-lg transition-all active:scale-[0.98]"
                  disabled={exporting === 'full'}
                >
                  {exporting === 'full' ? (
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  ) : (
                    <Download className="h-4 w-4 mr-2 stroke-[3px]" />
                  )}
                  Full System Dump (JSON)
                </Button>

                <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Dernier Snapshot</p>
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-tighter">Aucune archive détectée</p>
                  </div>
                  <div className="h-2 w-2 rounded-full bg-zinc-800 animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instructions Card OLED */}
        <Card className="mt-8 bg-[#080808] border-white/5 rounded-[2rem] overflow-hidden">
          <CardHeader className="px-8 pt-8">
            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-orange-500">Security Protocols</CardTitle>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
              <InstructionItem text="Les exports CSV sont formatés pour Excel et Google Sheets." />
              <InstructionItem text="Le dump JSON inclut l'intégralité des relations SQL." />
              <InstructionItem text="Privilégiez les sauvegardes hors pic d'activité." />
              <InstructionItem text="Toutes les extractions sont loggées à des fins d'audit." />
            </div>
          </CardContent>
        </Card>

      </div>
    </AdminLayout>
  );
};

// --- COMPOSANTS INTERNES ---

const ExportButton = ({ label, icon, loading, onClick }) => (
  <button
    onClick={onClick}
    disabled={loading}
    className="w-full flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.03] hover:border-orange-500/30 hover:bg-white/[0.04] rounded-2xl transition-all group active:scale-[0.99] disabled:opacity-50"
  >
    <div className="flex items-center gap-4">
      <div className="h-10 w-10 rounded-xl bg-black border border-white/5 flex items-center justify-center text-zinc-500 group-hover:text-orange-500 transition-colors">
        {loading ? <Loader2 className="animate-spin h-5 w-5" /> : icon}
      </div>
      <span className="text-xs font-bold text-zinc-300 group-hover:text-white uppercase tracking-widest">
        {loading ? 'Processing...' : `Exporter les ${label}`}
      </span>
    </div>
    <ChevronRight className="h-4 w-4 text-zinc-800 group-hover:text-orange-500 transition-colors" />
  </button>
);

const InstructionItem = ({ text }) => (
  <div className="flex items-start gap-3 py-2 border-b border-white/[0.02]">
    <div className="h-1.5 w-1.5 rounded-full bg-orange-500/50 mt-1.5 shrink-0" />
    <p className="text-[11px] font-medium text-zinc-500 uppercase leading-relaxed">{text}</p>
  </div>
);