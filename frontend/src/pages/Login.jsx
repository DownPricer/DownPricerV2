import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import axios from 'axios';
import { setToken, setUser } from '../utils/auth';
import { toast } from 'sonner';

export const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/auth/login`, {
        email,
        password
      });

      setToken(response.data.token);
      setUser(response.data.user);
      
      toast.success('Connexion réussie');
      
      if (response.data.user.roles.includes('ADMIN')) {
        navigate('/admin/dashboard');
      } else if (response.data.user.roles.includes('SELLER')) {
        navigate('/seller/dashboard');
      } else {
        navigate('/mes-demandes');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur de connexion');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white" data-testid="login-page">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Connexion</CardTitle>
              <CardDescription className="text-zinc-400">
                Connectez-vous à votre compte DownPricer
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
                    data-testid="login-email-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-zinc-800 border-zinc-700 text-white"
                    data-testid="login-password-input"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-full"
                  disabled={loading}
                  data-testid="login-submit-btn"
                >
                  {loading ? 'Connexion...' : 'Se connecter'}
                </Button>
              </form>
              <div className="mt-4 text-center">
                <Link to="/signup" className="text-orange-500 hover:text-orange-400" data-testid="login-signup-link">
                  Pas de compte ? Créer un compte
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};