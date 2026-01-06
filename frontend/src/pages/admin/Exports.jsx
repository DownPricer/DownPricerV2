import React from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

export const AdminExportsPage = () => {
  const handleExport = (type) => {
    toast.info(`Export ${type} en développement`);
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-6">Exports & Sauvegardes</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-white border-slate-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Exports Excel</h3>
              <div className="space-y-2">
                <Button className="w-full justify-start" variant="outline" onClick={() => handleExport('articles')}>
                  <Download className="h-4 w-4 mr-2" />
                  Exporter les articles
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={() => handleExport('demandes')}>
                  <Download className="h-4 w-4 mr-2" />
                  Exporter les demandes
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={() => handleExport('ventes')}>
                  <Download className="h-4 w-4 mr-2" />
                  Exporter les ventes
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={() => handleExport('users')}>
                  <Download className="h-4 w-4 mr-2" />
                  Exporter les utilisateurs
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Sauvegardes complètes</h3>
              <div className="space-y-2">
                <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white" onClick={() => handleExport('json')}>
                  <Download className="h-4 w-4 mr-2" />
                  Sauvegarde JSON
                </Button>
                <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white" onClick={() => handleExport('zip')}>
                  <Download className="h-4 w-4 mr-2" />
                  Sauvegarde ZIP
                </Button>
              </div>
              <p className="text-xs text-slate-500 mt-4">Les sauvegardes incluent toutes les données de la plateforme</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};