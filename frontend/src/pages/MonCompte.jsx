import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import api from '../utils/api';
import { getUser } from '../utils/auth';
import { toast } from 'sonner';
import { AvatarCircle } from '../components/AvatarCircle';
import { RatingStars } from '../components/RatingStars';

export const MonCompte = () => {
  const navigate = useNavigate();
  const { userId: routeUserId } = useParams();
  const [user, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState({ avg: 0, count: 0 });
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef(null);

  const fetchRating = async (targetId) => {
    try {
      const ratingRes = await api.get(`/ratings/user/${targetId}`);
      setRating(ratingRes.data || { avg: 0, count: 0 });
    } catch (error) {
      setRating({ avg: 0, count: 0 });
    }
  };

  const fetchUserDetails = async () => {
    try {
      const response = await api.get('/auth/me');
      setUserData(response.data);
      const targetId = routeUserId || response.data?.id;
      if (targetId) {
        await fetchRating(targetId);
      }
    } catch (error) {
      toast.error('Erreur lors du chargement du profil');
    }
    setLoading(false);
  };

  useEffect(() => {
    const userData = getUser();
    if (userData) {
      fetchUserDetails();
    } else {
      setLoading(false);
    }
  }, [routeUserId]);

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data?.avatar_url) {
        setUserData((prev) => (prev ? { ...prev, avatar_url: response.data.avatar_url } : prev));
        toast.success('Photo de profil mise à jour');
      } else {
        toast.error('Impossible de sauvegarder la photo');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'upload de la photo');
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const profileTargetId = routeUserId || user?.id;

  return (
    <div className="min-h-screen bg-zinc-950 text-white" data-testid="mon-compte-page">
      
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
                <CardTitle className="text-white">Photo de profil</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <AvatarCircle
                    src={user?.avatar_url}
                    name={`${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Utilisateur'}
                    size={80}
                  />
                  <div className="flex-1 space-y-2">
                    <p className="text-sm text-zinc-400">
                      Cette photo sera affichée sur les transactions, demandes et avis.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="border-zinc-700 text-white"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={avatarUploading}
                      >
                        {avatarUploading ? 'Upload en cours...' : 'Modifier la photo'}
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleAvatarChange}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">Note revendeur</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <RatingStars rating={rating.avg || 0} count={rating.count || 0} />
                <p className="text-sm text-zinc-400">
                  {rating.count ? `${rating.count} avis` : 'Nouveau vendeur'}
                </p>
                {profileTargetId && (
                  <Button
                    variant="outline"
                    className="border-zinc-700 text-white"
                    onClick={() => navigate(`/user/${profileTargetId}/avis`)}
                  >
                    Voir mes avis
                  </Button>
                )}
              </CardContent>
            </Card>
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