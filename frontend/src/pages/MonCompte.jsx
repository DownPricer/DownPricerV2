import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import api from '../utils/api';
import { getUser, setUser } from '../utils/auth';
import { toast } from 'sonner';

export const MonCompte = () => {
  const [user, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = getUser();
    if (userData) {
      fetchUserDetails();
    }
  }, []);

  const fetchUserDetails = async () => {
    try {
      const response = await api.get('/auth/me');
      setUserData(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement du profil');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white" data-testid="mon-compte-page">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold text-orange-500 mb-6" style={{fontFamily: 'Outfit, sans-serif'}}>
          Mon compte
        </h1>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-zinc-400">Chargement...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">Informations personnelles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-400">Prénom</Label>
                    <Input
                      value={user?.first_name || ''}
                      disabled
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-400">Nom</Label>
                    <Input
                      value={user?.last_name || ''}
                      disabled
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Email</Label>
                  <Input
                    value={user?.email || ''}
                    disabled
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Téléphone</Label>
                  <Input
                    value={user?.phone || 'Non renseigné'}
                    disabled
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">Rôles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {user?.roles?.map((role) => (
                    <span key={role} className="px-3 py-1 bg-orange-500/20 text-orange-400 border border-orange-500/50 rounded-full text-sm">
                      {role}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">Modifier le mot de passe</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-400 text-sm mb-4">
                  Fonctionnalité à venir : modification du mot de passe
                </p>
                <Button disabled className="bg-zinc-800 text-zinc-500">
                  Bientôt disponible
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};