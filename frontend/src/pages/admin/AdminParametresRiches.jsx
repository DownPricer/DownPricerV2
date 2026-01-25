import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  Settings,
  DollarSign,
  FileText,
  Link as LinkIcon,
  Save,
  Mail,
  Send,
  Loader2,
  Globe,
  Zap,
} from 'lucide-react';
import { Switch } from '../../components/ui/switch';
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
      toast.success(`Config ${key} mise à jour`);
      fetchSettings();
    } catch (error) {
      toast.error('Erreur de sauvegarde');
    }
    setSaving(false);
  };

  const handleChange = (key, value) => {
    setSettings({ ...settings, [key]: value });
  };

  const testEmail = async () => {
    setSaving(true);
    try {
      const response = await api.post('/admin/email/test');
      toast.success(response.data.message || 'Email de test envoyé');
    } catch (error) {
      toast.error('Erreur SMTP');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-[#070707] flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Fond moins noir + gradient léger */}
      <div className="min-h-screen text-white p-4 sm:p-6 md:p-12 selection:bg-orange-500/30 bg-gradient-to-b from-[#090909] via-[#070707] to-black">
        {/* Header */}
        <div className="mb-8 md:mb-12 max-w-7xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-4">
            <Settings className="h-3 w-3" /> System Preferences
          </div>
          <h2
            className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tighter uppercase italic leading-tight"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            Paramètres <span className="text-orange-500">Globaux</span>
          </h2>
          <p className="mt-2 text-zinc-500 text-[10px] sm:text-sm font-medium uppercase tracking-wider italic">
            Configuration maître de l&apos;infrastructure DownPricer
          </p>
        </div>

        <div className="max-w-7xl mx-auto">
          <Tabs defaultValue="general" className="space-y-8">
            <TabsList className="bg-[#0E0E0E] border border-white/10 ring-1 ring-white/[0.03] p-1 rounded-full inline-flex h-12 mb-4 flex-wrap">
              <TabItem value="general" icon={<Globe size={14} />} label="Général" />
              <TabItem value="prix" icon={<DollarSign size={14} />} label="Prix & Quotas" />
              <TabItem value="textes" icon={<FileText size={14} />} label="Textes" />
              <TabItem value="liens" icon={<LinkIcon size={14} />} label="Liens" />
              <TabItem value="email" icon={<Mail size={14} />} label="Emails" />
            </TabsList>

            {/* TAB: GENERAL */}
            <TabsContent value="general" className="animate-in fade-in duration-500">
              <SettingsCard title="Identité du site" icon={<Globe className="text-orange-500" />}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Field label="URL du Logo" value={settings.logo_url} onChange={(v) => handleChange('logo_url', v)} placeholder="https://..." />
                  <Field label="Email de Contact" value={settings.contact_email} onChange={(v) => handleChange('contact_email', v)} type="email" />
                  <Field label="Téléphone" value={settings.contact_phone} onChange={(v) => handleChange('contact_phone', v)} />
                  <Field label="Invitation Discord" value={settings.discord_invite_url} onChange={(v) => handleChange('discord_invite_url', v)} />
                </div>

                <SaveButton
                  onClick={() => {
                    handleSave('logo_url', settings.logo_url);
                    handleSave('contact_email', settings.contact_email);
                    handleSave('contact_phone', settings.contact_phone);
                    handleSave('discord_invite_url', settings.discord_invite_url);
                  }}
                  saving={saving}
                />
              </SettingsCard>
            </TabsContent>

            {/* TAB: PRIX & QUOTAS */}
            <TabsContent value="prix" className="animate-in fade-in duration-500">
              <SettingsCard title="Tarification & Business Model" icon={<Zap className="text-orange-500" />}>
                <div className="bg-[#0B0B0B] border border-white/[0.08] p-6 rounded-2xl mb-8 flex items-center justify-between gap-6">
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white mb-1 uppercase tracking-tight">Passerelle de Paiement (Stripe)</h4>
                    <p className="text-[10px] sm:text-xs text-zinc-500 uppercase tracking-widest font-medium">
                      Active ou désactive les transactions sur tout le site
                    </p>
                  </div>
                  <Switch
                    checked={settings.payments_enabled === true || settings.payments_enabled === 'true'}
                    onCheckedChange={(checked) => {
                      handleChange('payments_enabled', checked);
                      handleSave('payments_enabled', checked);
                    }}
                    className="data-[state=checked]:bg-orange-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <Field label="Acompte Client (%)" value={settings.deposit_percentage} onChange={(v) => handleChange('deposit_percentage', v)} type="number" hint="Sur les demandes sourcing" />
                  <Field label="Frais Vendeur (%)" value={settings.seller_fee_percentage} onChange={(v) => handleChange('seller_fee_percentage', v)} type="number" hint="Commission sur ventes" />
                  <Field label="Quota Gratuit" value={settings.free_articles_quota} onChange={(v) => handleChange('free_articles_quota', v)} type="number" hint="Articles inclus" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8 pt-8 border-t border-white/[0.06]">
                  <Field label="Plan Mini-site 1€" value={settings.minisite_plan_1_price} onChange={(v) => handleChange('minisite_plan_1_price', v)} type="number" />
                  <Field label="Plan Mini-site 10€" value={settings.minisite_plan_10_price} onChange={(v) => handleChange('minisite_plan_10_price', v)} type="number" />
                  <Field label="Plan Mini-site 15€" value={settings.minisite_plan_15_price} onChange={(v) => handleChange('minisite_plan_15_price', v)} type="number" />
                  <Field label="S-Plan 5€" value={settings.splan_5_price} onChange={(v) => handleChange('splan_5_price', v)} type="number" />
                  <Field label="S-Plan 15€" value={settings.splan_15_price} onChange={(v) => handleChange('splan_15_price', v)} type="number" />
                </div>

                <SaveButton
                  label="Mettre à jour la grille tarifaire"
                  onClick={() => {
                    Object.keys(settings)
                      .filter((k) => k.includes('price') || k.includes('percentage') || k.includes('quota'))
                      .forEach((key) => handleSave(key, settings[key]));
                  }}
                  saving={saving}
                />
              </SettingsCard>
            </TabsContent>

            {/* TAB: TEXTES */}
            <TabsContent value="textes" className="animate-in fade-in duration-500">
              <SettingsCard title="Copywriting & Légal" icon={<FileText className="text-orange-500" />}>
                <div className="space-y-8">
                  <AreaField label="Message Accueil" value={settings.homepage_welcome_text} onChange={(v) => handleChange('homepage_welcome_text', v)} />
                  <AreaField label="Description Service" value={settings.service_description} onChange={(v) => handleChange('service_description', v)} rows={4} />
                  <AreaField label="Succès Paiement" value={settings.payment_success_message} onChange={(v) => handleChange('payment_success_message', v)} />
                  <AreaField label="CGV & Mentions" value={settings.terms_and_conditions} onChange={(v) => handleChange('terms_and_conditions', v)} rows={8} />
                </div>

                <SaveButton
                  label="Enregistrer les textes"
                  onClick={() => {
                    Object.keys(settings)
                      .filter((k) => k.includes('text') || k.includes('message') || k.includes('description') || k.includes('conditions'))
                      .forEach((key) => handleSave(key, settings[key]));
                  }}
                  saving={saving}
                />
              </SettingsCard>
            </TabsContent>

            {/* TAB: LIENS */}
            <TabsContent value="liens" className="animate-in fade-in duration-500">
              <SettingsCard title="Écosystème Social" icon={<LinkIcon className="text-orange-500" />}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Field label="Facebook" value={settings.facebook_url} onChange={(v) => handleChange('facebook_url', v)} />
                  <Field label="Instagram" value={settings.instagram_url} onChange={(v) => handleChange('instagram_url', v)} />
                  <Field label="Twitter / X" value={settings.twitter_url} onChange={(v) => handleChange('twitter_url', v)} />
                  <Field label="LinkedIn" value={settings.linkedin_url} onChange={(v) => handleChange('linkedin_url', v)} />
                  <Field label="Support URL" value={settings.support_url} onChange={(v) => handleChange('support_url', v)} />
                </div>

                <SaveButton
                  label="Mettre à jour les URLs"
                  onClick={() => {
                    Object.keys(settings)
                      .filter((k) => k.includes('url'))
                      .forEach((key) => handleSave(key, settings[key]));
                  }}
                  saving={saving}
                />
              </SettingsCard>
            </TabsContent>

            {/* TAB: EMAIL */}
            <TabsContent value="email" className="animate-in fade-in duration-500">
              <SettingsCard title="Configuration SMTP & Alertes" icon={<Mail className="text-orange-500" />}>
                <div className="bg-[#0B0B0B] border border-white/[0.08] p-6 rounded-2xl mb-8 flex items-center justify-between gap-6">
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white mb-1 uppercase tracking-tight">Flux de Notifications</h4>
                    <p className="text-[10px] sm:text-xs text-zinc-500 uppercase tracking-widest font-medium">
                      Active l&apos;envoi global des emails transactionnels
                    </p>
                  </div>
                  <Switch
                    checked={settings.email_notif_enabled === true || settings.email_notif_enabled === 'true'}
                    onCheckedChange={(checked) => {
                      handleChange('email_notif_enabled', checked);
                      handleSave('email_notif_enabled', checked);
                    }}
                    className="data-[state=checked]:bg-orange-500"
                  />
                </div>

                <div className="max-w-md mb-10">
                  <Field
                    label="Email Admin (Réception)"
                    value={settings.admin_notif_email}
                    onChange={(v) => handleChange('admin_notif_email', v)}
                    onBlur={(v) => handleSave('admin_notif_email', v)}
                  />
                </div>

                <div className="p-6 sm:p-8 bg-[#0B0B0B] border border-white/[0.08] rounded-3xl">
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 mb-4 flex items-center gap-2">
                    <Send size={14} /> Test de connectivité
                  </h4>
                  <p className="text-[10px] sm:text-[11px] font-medium text-zinc-600 uppercase mb-6 leading-relaxed">
                    Lancez une séquence de test SMTP vers l&apos;adresse admin configurée ci-dessus.
                  </p>
                  <Button
                    onClick={testEmail}
                    disabled={saving}
                    variant="outline"
                    className="rounded-xl border-white/10 bg-white hover:bg-zinc-200 text-black font-black uppercase tracking-widest text-[10px] px-8 h-12 transition-all active:scale-95 shadow-lg shadow-white/5"
                  >
                    Lancer le Test SMTP
                  </Button>
                </div>
              </SettingsCard>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AdminLayout>
  );
};

// ---------------- INTERNAL COMPONENTS ----------------

const TabItem = ({ value, icon, label }) => (
  <TabsTrigger
    value={value}
    className="rounded-full px-4 sm:px-6 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-orange-500 data-[state=active]:text-white"
  >
    <span className="mr-2 opacity-60">{icon}</span> {label}
  </TabsTrigger>
);

const SettingsCard = ({ title, icon, children }) => (
  <Card className="bg-[#0E0E0E] border-white/10 ring-1 ring-white/[0.03] rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl hover:ring-white/[0.06] transition-all">
    <CardHeader className="p-6 sm:p-10 pb-4 border-b border-white/[0.06]">
      <CardTitle className="text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] text-zinc-500 flex items-center gap-3">
        {icon} {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="p-6 sm:p-10">{children}</CardContent>
  </Card>
);

const Field = ({ label, hint, value, onChange, onBlur, type = 'text', placeholder }) => (
  <div className="space-y-3">
    <Label className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">{label}</Label>
    <Input
      type={type}
      value={value || ''}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur ? (e) => onBlur(e.target.value) : undefined}
      className="bg-[#0B0B0B] border-white/10 ring-1 ring-white/[0.02] h-12 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all"
    />
    {hint && <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest ml-1">{hint}</p>}
  </div>
);

const AreaField = ({ label, value, onChange, rows = 3 }) => (
  <div className="space-y-3">
    <Label className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">{label}</Label>
    <Textarea
      value={value || ''}
      rows={rows}
      onChange={(e) => onChange(e.target.value)}
      className="bg-[#0B0B0B] border-white/10 ring-1 ring-white/[0.02] rounded-2xl text-sm text-white placeholder:text-zinc-600 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all p-4"
    />
  </div>
);

const SaveButton = ({ onClick, saving, label = 'Enregistrer les modifications' }) => (
  <div className="mt-10 sm:mt-12 pt-8 border-t border-white/[0.06]">
    <Button
      onClick={onClick}
      disabled={saving}
      className="bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-widest text-[10px] h-12 sm:h-14 px-8 sm:px-10 rounded-2xl shadow-lg shadow-orange-900/20 transition-all active:scale-95"
    >
      {saving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4 mr-2" />}
      {label}
    </Button>
  </div>
);
