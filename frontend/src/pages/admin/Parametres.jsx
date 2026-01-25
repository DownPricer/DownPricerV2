import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';
import { Mail, Send, Settings, Globe, CreditCard, ShieldCheck, Loader2, Zap } from 'lucide-react';
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
      toast.error('Erreur lors du chargement des préférences');
    }
    setLoading(false);
  };

  const updateSetting = async (key, value) => {
    try {
      await api.put(`/admin/settings/${key}`, { value });
      toast.success(`Système : ${key} mis à jour`);
    } catch (error) {
      toast.error('Erreur de synchronisation');
    }
  };

  const testEmail = async () => {
    const toastId = toast.loading("Séquence d'envoi en cours...");
    try {
      const response = await api.post('/admin/email/test');
      toast.success(response.data.message || 'Email de test délivré', { id: toastId });
    } catch (error) {
      toast.error('Échec de la passerelle SMTP', { id: toastId });
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-black flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen text-white p-4 sm:p-6 md:p-12 selection:bg-orange-500/30 bg-gradient-to-b from-[#0B0B0B] via-[#070707] to-black">
        {/* Header Section */}
        <div className="mb-10 md:mb-12 max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-4">
            <Settings className="h-3 w-3" /> Core Configuration
          </div>
          <h2
            className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic leading-tight"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            Paramètres <span className="text-orange-500">Système</span>
          </h2>
          <p className="mt-2 text-zinc-500 text-xs md:text-sm font-medium uppercase tracking-wider italic">
            Contrôle global des passerelles et de l'identité
          </p>
        </div>

        <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">
          {/* SECTION: INFORMATIONS GÉNÉRALES */}
          <SettingsSection title="Identité & Réseaux" icon={<Globe className="text-orange-500" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field
                label="URL du Logo"
                value={settings.logo_url || ''}
                placeholder="https://..."
                onChange={(v) => setSettings({ ...settings, logo_url: v })}
                onBlur={(v) => updateSetting('logo_url', v)}
              />
              <Field
                label="Lien Discord"
                value={settings.discord_invite_url || ''}
                placeholder="https://discord.gg/..."
                onChange={(v) => setSettings({ ...settings, discord_invite_url: v })}
                onBlur={(v) => updateSetting('discord_invite_url', v)}
              />
              <Field
                label="Email de Contact"
                type="email"
                value={settings.contact_email || ''}
                onChange={(v) => setSettings({ ...settings, contact_email: v })}
                onBlur={(v) => updateSetting('contact_email', v)}
              />
              <Field
                label="Téléphone support"
                value={settings.contact_phone || ''}
                onChange={(v) => setSettings({ ...settings, contact_phone: v })}
                onBlur={(v) => updateSetting('contact_phone', v)}
              />
            </div>
          </SettingsSection>

          {/* SECTION: PAIEMENTS */}
          <SettingsSection title="Passerelle Financière" icon={<CreditCard className="text-orange-500" />}>
            <div className="space-y-8">
              <div className="flex items-center justify-between bg-[#101010] border border-white/10 p-4 rounded-2xl">
                <div className="space-y-1">
                  <Label className="text-sm font-bold uppercase tracking-tight text-white">Stripe Checkout</Label>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Activer les paiements en production</p>
                </div>
                <Switch
                  checked={settings.payments_enabled || false}
                  onCheckedChange={(checked) => {
                    setSettings({ ...settings, payments_enabled: checked });
                    updateSetting('payments_enabled', checked);
                  }}
                  className="data-[state=checked]:bg-orange-500"
                />
              </div>

              {!settings.payments_enabled && (
                <div className="flex items-center gap-3 bg-orange-500/5 border border-orange-500/25 p-4 rounded-2xl text-orange-500">
                  <Zap size={16} className="shrink-0" />
                  <p className="text-[10px] font-bold uppercase tracking-wide">
                    Mode Maintenance : Les boutons de paiement sont actuellement masqués pour les utilisateurs.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">
                    Mode de facturation
                  </Label>
                  <Select
                    value={settings.billing_mode || 'FREE_TEST'}
                    onValueChange={(val) => {
                      setSettings({ ...settings, billing_mode: val });
                      updateSetting('billing_mode', val);
                    }}
                  >
                    <SelectTrigger className="bg-[#0E0E0E] border-white/10 h-11 rounded-xl focus:ring-orange-500/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0B0B0B] border-white/10 text-white">
                      <SelectItem value="FREE_TEST" className="focus:bg-white/5">
                        Mode Gratuit (Test)
                      </SelectItem>
                      <SelectItem value="STRIPE_PROD" className="focus:bg-white/5 text-emerald-500 font-bold">
                        Production Stripe
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">
                    Acompte Sourcing (%)
                  </Label>
                  <Input
                    type="number"
                    value={settings.deposit_percentage ?? 40}
                    onChange={(e) => setSettings({ ...settings, deposit_percentage: e.target.value })}
                    onBlur={(e) => updateSetting('deposit_percentage', parseFloat(e.target.value))}
                    className="bg-[#0E0E0E] border-white/10 h-11 rounded-xl focus:border-orange-500/50 font-mono placeholder:text-zinc-700"
                  />
                </div>
              </div>
            </div>
          </SettingsSection>

          {/* SECTION: NOTIFICATIONS */}
          <SettingsSection title="Canaux de Communication" icon={<Mail className="text-orange-500" />}>
            <div className="space-y-8">
              <div className="flex items-center justify-between bg-[#101010] border border-white/10 p-4 rounded-2xl">
                <div className="space-y-1">
                  <Label className="text-sm font-bold uppercase tracking-tight text-white">Emails Transactionnels</Label>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Acomptes, ventes et confirmations</p>
                </div>
                <Switch
                  checked={settings.email_notif_enabled || false}
                  onCheckedChange={(checked) => {
                    setSettings({ ...settings, email_notif_enabled: checked });
                    updateSetting('email_notif_enabled', checked);
                  }}
                  className="data-[state=checked]:bg-orange-500"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">
                  Email Destinataire Admin
                </Label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    type="email"
                    value={settings.admin_notif_email || ''}
                    onChange={(e) => setSettings({ ...settings, admin_notif_email: e.target.value })}
                    onBlur={(e) => updateSetting('admin_notif_email', e.target.value)}
                    placeholder="admin@downpricer.com"
                    className="bg-[#0E0E0E] border-white/10 h-11 rounded-xl focus:border-orange-500/50 flex-1 placeholder:text-zinc-700"
                  />
                  <Button
                    onClick={testEmail}
                    variant="outline"
                    className="rounded-xl border-white/10 bg-white hover:bg-zinc-200 text-black font-black uppercase text-[10px] tracking-widest h-11 px-6 shadow-lg shadow-white/5"
                  >
                    <Send className="h-3.5 w-3.5 mr-2" /> Test SMTP
                  </Button>
                </div>
              </div>
            </div>
          </SettingsSection>
        </div>

        {/* Footer Technique */}
        <div className="max-w-5xl mx-auto mt-12 pt-8 border-t border-white/[0.06] flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck size={14} className="text-zinc-700" />
            <span className="text-[9px] font-bold text-zinc-700 uppercase tracking-[0.3em]">System Security: Active</span>
          </div>
          <p className="text-[9px] font-bold text-zinc-700 uppercase tracking-[0.4em]">DownPricer Management v2.4</p>
        </div>
      </div>
    </AdminLayout>
  );
};

// --- COMPOSANTS INTERNES ---

const SettingsSection = ({ title, icon, children }) => (
  <Card className="bg-[#0E0E0E] border-white/10 ring-1 ring-white/[0.03] rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl">
    <CardHeader className="p-6 md:p-8 pb-4 border-b border-white/[0.04]">
      <CardTitle className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 flex items-center gap-3">
        {icon} {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="p-6 md:p-8">{children}</CardContent>
  </Card>
);

const Field = ({ label, value, onChange, onBlur, type = 'text', placeholder }) => (
  <div className="space-y-2">
    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">{label}</Label>
    <Input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={(e) => (onBlur ? onBlur(e.target.value) : undefined)}
      placeholder={placeholder}
      className="bg-[#0E0E0E] border-white/10 h-11 rounded-xl focus:border-orange-500/50 placeholder:text-zinc-700"
    />
  </div>
);
