import React, { useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Download, FileText, Table, Users, Package } from 'lucide-react';
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
      console.error(error);
    }
    
    setExporting(null);
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex items-center gap-2 mb-6">
          <Download className="h-8 w-8 text-blue-600" />
          <h2 className="text-3xl font-bold text-slate-900">Exports & Sauvegardes</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Table className="h-5 w-5" />
                Exports CSV
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => handleExport('articles')}
                disabled={exporting === 'articles'}
              >
                <Package className="h-4 w-4 mr-2" />
                {exporting === 'articles' ? 'Export en cours...' : 'Exporter les articles'}
              </Button>
              
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => handleExport('users')}
                disabled={exporting === 'users'}
              >
                <Users className="h-4 w-4 mr-2" />
                {exporting === 'users' ? 'Export en cours...' : 'Exporter les utilisateurs'}
              </Button>
              
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => handleExport('demandes')}
                disabled={exporting === 'demandes'}
              >
                <FileText className="h-4 w-4 mr-2" />
                {exporting === 'demandes' ? 'Export en cours...' : 'Exporter les demandes'}
              </Button>
              
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => handleExport('ventes')}
                disabled={exporting === 'ventes'}
              >
                <Download className="h-4 w-4 mr-2" />
                {exporting === 'ventes' ? 'Export en cours...' : 'Exporter les ventes'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Sauvegarde complète
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">
                Téléchargez une sauvegarde complète de toutes les données au format JSON.
              </p>
              
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={exporting === 'full'}
              >
                <Download className="h-4 w-4 mr-2" />
                {exporting === 'full' ? 'Sauvegarde en cours...' : 'Sauvegarde complète (JSON)'}
              </Button>

              <div className="border-t pt-4">
                <p className="text-xs text-slate-500 mb-2">Dernière sauvegarde</p>
                <p className="text-sm text-slate-700">Aucune sauvegarde effectuée</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-sm text-slate-600">
              <li>Les exports CSV peuvent être ouverts avec Excel, Google Sheets, etc.</li>
              <li>La sauvegarde JSON contient toutes les données de la base</li>
              <li>Effectuez des sauvegardes régulières pour sécuriser vos données</li>
              <li>Les fichiers exportés sont optimisés et compressibles</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};