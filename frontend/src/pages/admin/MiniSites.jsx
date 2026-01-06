import React from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

export const AdminMiniSitesPage = () => {
  return (
    <AdminLayout>
      <div className="p-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-6">Mini-sites</h2>
        <Card className="bg-white border-slate-200">
          <CardContent className="p-8 text-center">
            <p className="text-slate-600 mb-4">Gestion des mini-sites vendeurs : validation, modération, quotas</p>
            <Badge className="bg-blue-100 text-blue-800">Fonctionnalité en développement</Badge>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};