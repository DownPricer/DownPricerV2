import React, { useState, useEffect } from 'react';
import { Header } from '../../components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { DollarSign, Package, TrendingUp, AlertCircle, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'sonner';
import { SellerStatsGraph } from './SellerStatsGraph';

export const SellerDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchSettings();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/seller/stats');
      setStats(response.data);
    } catch (error) {
      toast.error('Erreur chargement stats');
    }
    setLoading(false);
  };

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings/public');
      setSettings(response.data);
    } catch (error) {
      console.error('Erreur settings');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-orange-500 mb-2" style={{fontFamily: 'Outfit, sans-serif'}}>
            Dashboard Vendeur
          </h1>
          <p className="text-zinc-400">Gérez vos ventes et suivez vos revenus</p>
        </div>

        {settings.discord_invite_url && (
          <Card className="bg-blue-500/10 border-blue-500/50 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-blue-400">Rejoindre la communauté Discord</p>
                  <p className="text-sm text-zinc-400">Échangez avec d'autres vendeurs, partagez vos astuces</p>
                </div>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => window.open(settings.discord_invite_url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Discord
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="text-center py-12"><p className="text-zinc-400">Chargement...</p></div>
        ) : (
          <>
            {/* KPIs en premier (mobile-first) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-1 md:pb-2 px-3 md:px-6 pt-3 md:pt-6">
                  <CardTitle className="text-xs md:text-sm font-medium text-zinc-400">Chiffre d'affaires</CardTitle>
                </CardHeader>
                <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xl md:text-3xl font-bold text-white">{stats?.total_revenue || 0}€</span>
                    <DollarSign className="h-6 w-6 md:h-8 md:w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-1 md:pb-2 px-3 md:px-6 pt-3 md:pt-6">
                  <CardTitle className="text-xs md:text-sm font-medium text-zinc-400">Ventes réalisées</CardTitle>
                </CardHeader>
                <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xl md:text-3xl font-bold text-white">{stats?.total_sales || 0}</span>
                    <Package className="h-6 w-6 md:h-8 md:w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-1 md:pb-2 px-3 md:px-6 pt-3 md:pt-6">
                  <CardTitle className="text-xs md:text-sm font-medium text-zinc-400">Bénéfice total</CardTitle>
                </CardHeader>
                <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xl md:text-3xl font-bold text-green-500">{stats?.total_profit || 0}€</span>
                    <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800 hover:border-orange-500/50 transition-colors cursor-pointer" onClick={() => navigate('/seller/paiements-en-attente')}>
                <CardHeader className="pb-1 md:pb-2 px-3 md:px-6 pt-3 md:pt-6">
                  <CardTitle className="text-xs md:text-sm font-medium text-zinc-400">Paiements en attente</CardTitle>
                </CardHeader>
                <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xl md:text-3xl font-bold text-orange-500">{stats?.pending_payments || 0}</span>
                    <AlertCircle className="h-6 w-6 md:h-8 md:w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Menu sections après les KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
              <Card className="bg-zinc-900 border-zinc-800 hover:border-orange-500/50 transition-colors cursor-pointer" onClick={() => navigate('/seller/articles')}>
                <CardContent className="p-4 md:p-6 flex items-center sm:flex-col sm:items-start gap-3">
                  <Package className="h-8 w-8 text-orange-500 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-white text-base md:text-lg">Catalogue articles</h3>
                    <p className="text-xs md:text-sm text-zinc-400 hidden sm:block">Parcourir les articles disponibles</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800 hover:border-orange-500/50 transition-colors cursor-pointer" onClick={() => navigate('/seller/ventes')}>
                <CardContent className="p-4 md:p-6 flex items-center sm:flex-col sm:items-start gap-3">
                  <DollarSign className="h-8 w-8 text-green-500 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-white text-base md:text-lg">Mes ventes</h3>
                    <p className="text-xs md:text-sm text-zinc-400 hidden sm:block">Gérer vos ventes en cours</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800 hover:border-orange-500/50 transition-colors cursor-pointer" onClick={() => navigate('/seller/tresorerie')}>
                <CardContent className="p-4 md:p-6 flex items-center sm:flex-col sm:items-start gap-3">
                  <TrendingUp className="h-8 w-8 text-blue-500 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-white text-base md:text-lg">Trésorerie</h3>
                    <p className="text-xs md:text-sm text-zinc-400 hidden sm:block">Suivre vos paiements</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <SellerStatsGraph />
          </>
        )}
      </main>
    </div>
  );
};