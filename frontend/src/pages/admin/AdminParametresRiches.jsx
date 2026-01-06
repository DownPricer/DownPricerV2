import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Settings, DollarSign, FileText, Link as LinkIcon, Save } from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'sonner';

export const AdminParametresRichesPage = () => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  const handleSave = async (key, value) => {
    setSaving(true);
    try {
      await api.put(`/admin/settings/${key}`, { value });
      toast.success(`Paramètre ${key} mis à jour`);
      fetchSettings();
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    }
    setSaving(false);
  };

  const handleChange = (key, value) => {
    setSettings({ ...settings, [key]: value });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-8">
          <p className="text-slate-500">Chargement...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex items-center gap-2 mb-6">
          <Settings className="h-8 w-8 text-blue-600" />
          <h2 className="text-3xl font-bold text-slate-900">Paramètres globaux</h2>
        </div>

        <Tabs defaultValue="general">
          <TabsList>
            <TabsTrigger value="general">
              <Settings className="h-4 w-4 mr-2" />
              Général
            </TabsTrigger>
            <TabsTrigger value="prix">
              <DollarSign className="h-4 w-4 mr-2" />
              Prix & Quotas
            </TabsTrigger>
            <TabsTrigger value="textes">
              <FileText className="h-4 w-4 mr-2" />
              Textes
            </TabsTrigger>
            <TabsTrigger value="liens">
              <LinkIcon className="h-4 w-4 mr-2" />
              Liens
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informations du site</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Logo URL</Label>
                  <Input
                    value={settings.logo_url || ''}
                    onChange={(e) => handleChange('logo_url', e.target.value)}
                    placeholder="https://exemple.com/logo.png"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email de contact</Label>
                  <Input
                    type="email"
                    value={settings.contact_email || ''}
                    onChange={(e) => handleChange('contact_email', e.target.value)}
                    placeholder="contact@downpricer.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Téléphone de contact</Label>
                  <Input
                    value={settings.contact_phone || ''}
                    onChange={(e) => handleChange('contact_phone', e.target.value)}
                    placeholder="+33 1 23 45 67 89"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Lien Discord</Label>
                  <Input
                    value={settings.discord_invite_url || ''}
                    onChange={(e) => handleChange('discord_invite_url', e.target.value)}
                    placeholder="https://discord.gg/..."
                  />
                </div>

                <Button
                  onClick={() => {
                    handleSave('logo_url', settings.logo_url);
                    handleSave('contact_email', settings.contact_email);
                    handleSave('contact_phone', settings.contact_phone);
                    handleSave('discord_invite_url', settings.discord_invite_url);
                  }}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="prix" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tarification et quotas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Pourcentage d'acompte (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={settings.deposit_percentage || 40}
                      onChange={(e) => handleChange('deposit_percentage', parseFloat(e.target.value))}
                    />
                    <p className="text-xs text-slate-500">Acompte demandé sur les demandes clients</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Frais de service vendeur (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={settings.seller_fee_percentage || 10}
                      onChange={(e) => handleChange('seller_fee_percentage', parseFloat(e.target.value))}
                    />
                    <p className="text-xs text-slate-500">Commission prélevée sur les ventes vendeurs</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Prix Mini-site Plan 1 (€)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={settings.minisite_plan_1_price || 1}
                      onChange={(e) => handleChange('minisite_plan_1_price', parseFloat(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Prix Mini-site Plan 10 (€)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={settings.minisite_plan_10_price || 10}
                      onChange={(e) => handleChange('minisite_plan_10_price', parseFloat(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Prix Mini-site Plan 15 (€)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={settings.minisite_plan_15_price || 15}
                      onChange={(e) => handleChange('minisite_plan_15_price', parseFloat(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Prix S-Plan 5 (€)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={settings.splan_5_price || 5}
                      onChange={(e) => handleChange('splan_5_price', parseFloat(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Prix S-Plan 15 (€)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={settings.splan_15_price || 15}
                      onChange={(e) => handleChange('splan_15_price', parseFloat(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Quota articles gratuits</Label>
                    <Input
                      type="number"
                      min="0"
                      value={settings.free_articles_quota || 50}
                      onChange={(e) => handleChange('free_articles_quota', parseInt(e.target.value))}
                    />
                    <p className="text-xs text-slate-500">Nombre d'articles inclus gratuitement</p>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    Object.keys(settings).filter(k => k.includes('price') || k.includes('percentage') || k.includes('quota')).forEach(key => {
                      handleSave(key, settings[key]);
                    });
                  }}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer tous les prix
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="textes" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Textes personnalisables</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Message d'accueil homepage</Label>
                  <Textarea
                    rows={3}
                    value={settings.homepage_welcome_text || ''}
                    onChange={(e) => handleChange('homepage_welcome_text', e.target.value)}
                    placeholder="Bienvenue sur DownPricer..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description du service</Label>
                  <Textarea
                    rows={4}
                    value={settings.service_description || ''}
                    onChange={(e) => handleChange('service_description', e.target.value)}
                    placeholder="DownPricer vous aide à..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Message après paiement</Label>
                  <Textarea
                    rows={3}
                    value={settings.payment_success_message || ''}
                    onChange={(e) => handleChange('payment_success_message', e.target.value)}
                    placeholder="Merci pour votre paiement..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>CGV (Conditions générales)</Label>
                  <Textarea
                    rows={6}
                    value={settings.terms_and_conditions || ''}
                    onChange={(e) => handleChange('terms_and_conditions', e.target.value)}
                    placeholder="Conditions générales de vente..."
                  />
                </div>

                <Button
                  onClick={() => {
                    Object.keys(settings).filter(k => k.includes('text') || k.includes('message') || k.includes('description') || k.includes('conditions')).forEach(key => {
                      handleSave(key, settings[key]);
                    });
                  }}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer tous les textes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="liens" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Liens externes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Lien Facebook</Label>
                  <Input
                    value={settings.facebook_url || ''}
                    onChange={(e) => handleChange('facebook_url', e.target.value)}
                    placeholder="https://facebook.com/..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Lien Instagram</Label>
                  <Input
                    value={settings.instagram_url || ''}
                    onChange={(e) => handleChange('instagram_url', e.target.value)}
                    placeholder="https://instagram.com/..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Lien Twitter/X</Label>
                  <Input
                    value={settings.twitter_url || ''}
                    onChange={(e) => handleChange('twitter_url', e.target.value)}
                    placeholder="https://twitter.com/..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Lien LinkedIn</Label>
                  <Input
                    value={settings.linkedin_url || ''}
                    onChange={(e) => handleChange('linkedin_url', e.target.value)}
                    placeholder="https://linkedin.com/..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>URL d'assistance</Label>
                  <Input
                    value={settings.support_url || ''}
                    onChange={(e) => handleChange('support_url', e.target.value)}
                    placeholder="https://support.downpricer.com"
                  />
                </div>

                <Button
                  onClick={() => {
                    Object.keys(settings).filter(k => k.includes('url')).forEach(key => {
                      handleSave(key, settings[key]);
                    });
                  }}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer tous les liens
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};
