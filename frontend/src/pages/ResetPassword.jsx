import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import api from '../utils/api';
import { toast } from 'sonner';

const MIN_PASSWORD_LENGTH = 8;

export const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const token = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('token') || '';
  }, [location.search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!token) {
      setErrorMessage('Lien invalide ou expiré. Veuillez demander un nouveau lien.');
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setErrorMessage(`Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        token,
        new_password: password
      });
      setSuccess(true);
      toast.success('Mot de passe réinitialisé');
      setTimeout(() => navigate('/login'), 1500);
    } catch (error) {
      const detail = error.response?.data?.detail;
      setErrorMessage(detail || 'Lien invalide ou expiré. Veuillez demander un nouveau lien.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white" data-testid="reset-password-page">
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Réinitialiser mon mot de passe</CardTitle>
              <CardDescription className="text-zinc-400">
                Choisissez un nouveau mot de passe sécurisé.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {success ? (
                <div className="space-y-3 text-sm text-zinc-300">
                  <p>Votre mot de passe a bien été réinitialisé.</p>
                  <p>Redirection vers la connexion...</p>
                </div>
              ) : (
                <>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-white">Nouveau mot de passe</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="bg-zinc-800 border-zinc-700 text-white"
                        data-testid="reset-password-new-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password" className="text-white">Confirmer le mot de passe</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="bg-zinc-800 border-zinc-700 text-white"
                        data-testid="reset-password-confirm-input"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-full"
                      disabled={loading}
                      data-testid="reset-password-submit-btn"
                    >
                      {loading ? 'Réinitialisation...' : 'Réinitialiser'}
                    </Button>
                  </form>

                  {errorMessage && (
                    <p className="mt-4 text-sm text-red-300">
                      {errorMessage}
                    </p>
                  )}
                </>
              )}

              {!success && (
                <div className="mt-4 text-center">
                  <Link to="/forgot-password" className="text-orange-500 hover:text-orange-400">
                    Besoin d'un nouveau lien ?
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

