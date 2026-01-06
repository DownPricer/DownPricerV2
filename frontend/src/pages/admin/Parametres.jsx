import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import api from '../../utils/api';
import { toast } from 'sonner';

export const AdminParametresPage = () => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/admin/settings');
      setSettings(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    }
    setLoading(false);
  };

  const updateSetting = async (key, value) => {
    try {
      await api.put(`/admin/settings/${key}`, { value });
      toast.success('Paramètre mis à jour');
    } catch (error) {
      toast.error('Erreur');
    }
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-6">Paramètres</h2>

        {loading ? (
          <div className="text-center py-12"><p className="text-slate-500">Chargement...</p></div>
        ) : (
          <div className="space-y-6">
            <Card className="bg-white border-slate-200">
              <CardHeader>
                <CardTitle>Informations générales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Logo URL</Label>
                  <Input
                    value={settings.logo_url || ''}
                    onChange={(e) => setSettings({...settings, logo_url: e.target.value})}
                    onBlur={(e) => updateSetting('logo_url', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Téléphone de contact</Label>
                  <Input
                    value={settings.contact_phone || ''}
                    onChange={(e) => setSettings({...settings, contact_phone: e.target.value})}
                    onBlur={(e) => updateSetting('contact_phone', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email de contact</Label>
                  <Input
                    value={settings.contact_email || ''}
                    onChange={(e) => setSettings({...settings, contact_email: e.target.value})}
                    onBlur={(e) => updateSetting('contact_email', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Lien Discord</Label>
                  <Input
                    value={settings.discord_invite_url || ''}
                    onChange={(e) => setSettings({...settings, discord_invite_url: e.target.value})}
                    onBlur={(e) => updateSetting('discord_invite_url', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200">
              <CardHeader>
                <CardTitle>Paiements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Mode de facturation</Label>
                  <Select
                    value={settings.billing_mode || 'FREE_TEST'}
                    onValueChange={(val) => { setSettings({...settings, billing_mode: val}); updateSetting('billing_mode', val); }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FREE_TEST">FREE_TEST (Gratuit)</SelectItem>
                      <SelectItem value="STRIPE_PROD">STRIPE_PROD (Stripe actif)</SelectItem>
                    </SelectContent>
                  </Select>
                  {settings.billing_mode === 'FREE_TEST' && (
                    <p className="text-xs text-orange-600">Mode test actif : tous les paiements sont gratuits</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Pourcentage acompte (%)</Label>
                  <Input
                    type="number"
                    value={settings.deposit_percentage || 40}
                    onChange={(e) => setSettings({...settings, deposit_percentage: e.target.value})}
                    onBlur={(e) => updateSetting('deposit_percentage', parseFloat(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};