import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import api from '../utils/api';
import { toast } from 'sonner';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (error) {
      toast.error('Erreur lors de l\'envoi. Réessayez plus tard.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white" data-testid="forgot-password-page">
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Mot de passe oublié</CardTitle>
              <CardDescription className="text-zinc-400">
                Entrez votre email pour recevoir un lien de réinitialisation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-zinc-800 border-zinc-700 text-white"
                    data-testid="forgot-password-email-input"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-full"
                  disabled={loading}
                  data-testid="forgot-password-submit-btn"
                >
                  {loading ? 'Envoi...' : 'Envoyer le lien'}
                </Button>
              </form>

              {sent && (
                <p className="mt-4 text-sm text-zinc-300">
                  Si un compte existe, un email de réinitialisation a été envoyé.
                </p>
              )}

              <div className="mt-4 text-center">
                <Link to="/login" className="text-orange-500 hover:text-orange-400">
                  Retour à la connexion
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

