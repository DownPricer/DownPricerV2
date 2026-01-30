import React, { useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Download, FileText, Table, Users, Package, Database, ShieldCheck, Loader2, ChevronRight } from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'sonner';

export const AdminExportsPage = () => {
  const [exporting, setExporting] = useState(null);
  const [startDate, setStartDate] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    return toDateInputValue(start);
  });
  const [endDate, setEndDate] = useState(() => toDateInputValue(new Date()));

  const handleExport = async (type) => {
    setExporting(type);
    try {
      let url = '';
      let fallbackName = '';
      const params = {
        start: startDate,
        end: endDate,
      };

      switch (type) {
        case 'articles_me':
          url = '/admin/exports/articles/me';
          fallbackName = 'articles_me.xlsx';
          break;
        case 'articles_all':
          url = '/admin/exports/articles/all';
          fallbackName = 'articles_all.xlsx';
          break;
        case 'users':
          url = '/admin/exports/users';
          fallbackName = 'users.xlsx';
          break;
        case 'demandes':
          url = '/admin/exports/demandes';
          fallbackName = 'demandes.xlsx';
          break;
        case 'sales_me':
          url = '/admin/exports/sales/me';
          fallbackName = 'sales_me.xlsx';
          break;
        case 'snapshot':
          url = '/admin/exports/snapshot';
          fallbackName = 'snapshot.zip';
          break;
        default:
          throw new Error("Type d'export inconnu");
      }

      const response = await api.get(url, {
        params,
        responseType: 'blob',
      });

      const contentDisposition = response.headers?.['content-disposition'];
      const filename = getFilenameFromDisposition(contentDisposition) || fallbackName;
      downloadBlob(response.data, filename);

      toast.success(`Export ${filename} réussi`);
    } catch (error) {
      toast.error("Erreur lors de l'export");
    }
    setExporting(null);
  };

  return (
    <AdminLayout>
      {/* Fond moins noir + gradient léger (cohérent) */}
      <div className="min-h-screen text-white p-4 sm:p-6 md:p-12 selection:bg-orange-500/30 bg-gradient-to-b from-[#090909] via-[#070707] to-black">
        {/* Header */}
        <div className="mb-8 md:mb-12 max-w-7xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-4">
            <Database className="h-3 w-3" /> Data Management
          </div>

          <h2
            className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tighter uppercase italic leading-tight"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            Exports & <span className="text-orange-500">Backups</span>
          </h2>

          <p className="mt-2 text-zinc-500 text-[10px] sm:text-sm font-medium uppercase tracking-wider italic">
            Extraction brute et sauvegarde de la base de données
          </p>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* XLSX Section */}
          <Card className="bg-[#0E0E0E] border-white/10 ring-1 ring-white/[0.03] rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden shadow-2xl hover:ring-white/[0.06] transition-all">
            <CardHeader className="p-6 sm:px-8 sm:pt-8 sm:pb-4">
              <CardTitle className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                <Table className="h-4 w-4 text-orange-500" /> Formats Tableurs (XLSX)
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6 sm:px-8 sm:pb-8 space-y-3">
              <div className="rounded-xl sm:rounded-2xl border border-white/[0.08] bg-[#0B0B0B] p-4 space-y-3">
                <p className="text-[9px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Période globale</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                      Début
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(event) => setStartDate(event.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[10px] sm:text-xs text-white focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                      Fin
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(event) => setEndDate(event.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[10px] sm:text-xs text-white focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-[9px] sm:text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-2">Mes données</p>
                <ExportButton
                  label="Articles (mes données)"
                  icon={<Package size={16} />}
                  loading={exporting === 'articles_me'}
                  onClick={() => handleExport('articles_me')}
                />
                <ExportButton
                  label="Ventes (mes données)"
                  icon={<Download size={16} />}
                  loading={exporting === 'sales_me'}
                  onClick={() => handleExport('sales_me')}
                />
              </div>

              <div className="pt-4">
                <p className="text-[9px] sm:text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-2">Tous les utilisateurs</p>
                <ExportButton
                  label="Articles (tous les utilisateurs)"
                  icon={<Package size={16} />}
                  loading={exporting === 'articles_all'}
                  onClick={() => handleExport('articles_all')}
                />
                <ExportButton
                  label="Utilisateurs"
                  icon={<Users size={16} />}
                  loading={exporting === 'users'}
                  onClick={() => handleExport('users')}
                />
                <ExportButton
                  label="Demandes"
                  icon={<FileText size={16} />}
                  loading={exporting === 'demandes'}
                  onClick={() => handleExport('demandes')}
                />
              </div>
            </CardContent>
          </Card>

          {/* Full Backup Section */}
          <Card className="bg-[#0E0E0E] border-white/10 ring-1 ring-white/[0.03] rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden shadow-2xl hover:ring-white/[0.06] transition-all flex flex-col">
            <CardHeader className="p-6 sm:px-8 sm:pt-8 sm:pb-4">
              <CardTitle className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-green-500" /> Sauvegarde Critique
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6 sm:px-8 sm:pb-8 flex-1 flex flex-col">
              <p className="text-zinc-500 text-[10px] sm:text-xs font-medium leading-relaxed mb-6 sm:mb-8 uppercase tracking-wider">
                Snapshot ZIP incluant les exports XLSX principaux et les métadonnées (sans images).
              </p>

              <div className="mt-auto space-y-4 sm:space-y-6">
                <Button
                  className="w-full bg-white hover:bg-zinc-200 text-black font-black uppercase tracking-widest text-[10px] sm:text-[11px] h-12 sm:h-14 rounded-xl sm:rounded-2xl shadow-lg transition-all active:scale-[0.98]"
                  disabled={exporting === 'snapshot'}
                  onClick={() => handleExport('snapshot')}
                >
                  {exporting === 'snapshot' ? (
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  ) : (
                    <Download className="h-4 w-4 mr-2 stroke-[3px]" />
                  )}
                  Snapshot complet (ZIP)
                </Button>

                <div className="bg-[#0B0B0B] border border-white/[0.08] rounded-xl sm:rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[8px] sm:text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">
                      Dernier Snapshot
                    </p>
                    <p className="text-[10px] sm:text-xs font-bold text-zinc-400 uppercase tracking-tighter">
                      Aucune archive détectée
                    </p>
                  </div>
                  <div className="h-2 w-2 rounded-full bg-zinc-700 animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instructions Card */}
        <div className="max-w-7xl mx-auto">
          <Card className="mt-6 md:mt-8 bg-[#0E0E0E] border-white/10 ring-1 ring-white/[0.03] rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden hover:ring-white/[0.06] transition-all">
            <CardHeader className="p-6 sm:px-8 sm:pt-8">
              <CardTitle className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-orange-500">
                Security Protocols
              </CardTitle>
            </CardHeader>

            <CardContent className="px-6 pb-6 sm:px-8 sm:pb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2 md:gap-y-4">
                <InstructionItem text="Les exports XLSX sont compatibles Excel et Google Sheets." />
                <InstructionItem text="Le snapshot ZIP contient uniquement des données structurées." />
                <InstructionItem text="Période globale appliquée à chaque export." />
                <InstructionItem text="Toutes les extractions sont loggées à des fins d'audit." />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

// ---------------- INTERNAL COMPONENTS ----------------

const ExportButton = ({ label, icon, loading, onClick }) => (
  <button
    onClick={onClick}
    disabled={loading}
    className="w-full flex items-center justify-between p-3 sm:p-4 bg-white/[0.03] border border-white/[0.08] ring-1 ring-white/[0.02]
               hover:border-orange-500/30 hover:bg-white/[0.05] rounded-xl sm:rounded-2xl transition-all group active:scale-[0.99] disabled:opacity-50"
  >
    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
      <div className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 rounded-lg sm:rounded-xl bg-[#0B0B0B] border border-white/[0.08] flex items-center justify-center text-zinc-500 group-hover:text-orange-500 transition-colors">
        {loading ? <Loader2 className="animate-spin h-4 w-4 sm:h-5 sm:w-5" /> : icon}
      </div>

      <span className="text-[9px] sm:text-xs font-bold text-zinc-300 group-hover:text-white uppercase tracking-widest truncate">
        {loading ? 'Processing...' : `Exporter les ${label}`}
      </span>
    </div>

    <ChevronRight className="h-4 w-4 shrink-0 text-zinc-600 group-hover:text-orange-500 transition-colors" />
  </button>
);

const InstructionItem = ({ text }) => (
  <div className="flex items-start gap-3 py-2 border-b border-white/[0.05]">
    <div className="h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full bg-orange-500/50 mt-1.5 shrink-0" />
    <p className="text-[9px] sm:text-[11px] font-medium text-zinc-500 uppercase leading-relaxed">{text}</p>
  </div>
);

const toDateInputValue = (date) => {
  const local = new Date(date);
  local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
  return local.toISOString().split('T')[0];
};

const getFilenameFromDisposition = (contentDisposition) => {
  if (!contentDisposition) return '';
  const match = /filename="(.+?)"/.exec(contentDisposition);
  return match ? match[1] : '';
};

const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
