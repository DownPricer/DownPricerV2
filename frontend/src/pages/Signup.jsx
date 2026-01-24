import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import api from '../utils/api';
import { setToken, setUser } from '../utils/auth';
import { toast } from 'sonner';

export const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: ''
  });
  const [acceptCGU, setAcceptCGU] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!acceptCGU) {
      toast.error('Veuillez accepter les CGU');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/signup', formData);

      setToken(response.data.token);
      setUser(response.data.user);
      
      toast.success('Compte créé avec succès');
      navigate('/mes-demandes');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la création du compte');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white" data-testid="signup-page">
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Créer un compte</CardTitle>
              <CardDescription className="text-zinc-400">
                Vous pourrez suivre vos demandes et être notifié des étapes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name" className="text-white">Prénom</Label>
                    <Input
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      required
                      className="bg-zinc-800 border-zinc-700 text-white"
                      data-testid="signup-firstname-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name" className="text-white">Nom</Label>
                    <Input
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      required
                      className="bg-zinc-800 border-zinc-700 text-white"
                      data-testid="signup-lastname-input"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="bg-zinc-800 border-zinc-700 text-white"
                    data-testid="signup-email-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-white">Téléphone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className="bg-zinc-800 border-zinc-700 text-white"
                    data-testid="signup-phone-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">Mot de passe</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="bg-zinc-800 border-zinc-700 text-white"
                    data-testid="signup-password-input"
                  />
                </div>
                <div className="flex items-center space-x-2 bg-zinc-800 p-3 rounded-lg border border-zinc-700">
                  <Checkbox
                    id="cgu"
                    checked={acceptCGU}
                    onCheckedChange={setAcceptCGU}
                    className="border-orange-400 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                    data-testid="signup-cgu-checkbox"
                  />
                  <Label htmlFor="cgu" className="text-sm text-white font-medium cursor-pointer">
                    J'accepte les <a href="/cgu" target="_blank" className="text-orange-400 hover:text-orange-300 underline">conditions générales d'utilisation</a>
                  </Label>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-full"
                  disabled={loading}
                  data-testid="signup-submit-btn"
                >
                  {loading ? 'Création...' : 'Créer mon compte'}
                </Button>
              </form>
              <div className="mt-4 text-center">
                <Link to="/login" className="text-orange-500 hover:text-orange-400" data-testid="signup-login-link">
                  J'ai déjà un compte
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};