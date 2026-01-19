import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';
import { Mail, Send } from 'lucide-react';
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

  const testEmail = async () => {
    try {
      const response = await api.post('/admin/email/test');
      toast.success(response.data.message || 'Email de test envoyé avec succès');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'envoi de l\'email de test');
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
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Activer les paiements (Stripe)</Label>
                      <p className="text-xs text-slate-500">Active ou désactive les boutons de paiement Stripe Checkout sur le site</p>
                    </div>
                    <Switch
                      checked={settings.payments_enabled || false}
                      onCheckedChange={(checked) => {
                        setSettings({...settings, payments_enabled: checked});
                        updateSetting('payments_enabled', checked);
                      }}
                    />
                  </div>
                  {!settings.payments_enabled && (
                    <p className="text-xs text-orange-600">Les paiements sont désactivés. Les boutons "S'abonner / Payer" seront masqués.</p>
                  )}
                </div>
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

            <Card className="bg-white border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Notifications email
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Activer les notifications email</Label>
                      <p className="text-xs text-slate-500">Envoyer des emails pour les demandes et ventes</p>
                    </div>
                    <Switch
                      checked={settings.email_notif_enabled || false}
                      onCheckedChange={(checked) => {
                        setSettings({...settings, email_notif_enabled: checked});
                        updateSetting('email_notif_enabled', checked);
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email admin (notifications)</Label>
                  <Input
                    type="email"
                    value={settings.admin_notif_email || ''}
                    onChange={(e) => setSettings({...settings, admin_notif_email: e.target.value})}
                    onBlur={(e) => updateSetting('admin_notif_email', e.target.value)}
                    placeholder="contact@downpricer.com"
                  />
                  <p className="text-xs text-slate-500">Email qui recevra les notifications admin</p>
                </div>
                <div className="pt-2">
                  <Button
                    onClick={testEmail}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    Envoyer un email de test
                  </Button>
                  <p className="text-xs text-slate-500 mt-2">
                    L'email de test sera envoyé à l'adresse configurée ci-dessus
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};