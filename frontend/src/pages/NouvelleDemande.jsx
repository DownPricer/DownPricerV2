import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent } from '../components/ui/card';
// Checkbox native avec style personnalisé
import { ImageUpload } from '../components/ImageUpload';
import { HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import api from '../utils/api';
import { toast } from 'sonner';

export const NouvelleDemande = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    photos: [],
    max_price: '',
    reference_price: '',
    prefer_delivery: false,
    prefer_hand_delivery: false
  });
  const [loading, setLoading] = useState(false);
  const [demandeCreated, setDemandeCreated] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const demandeData = {
        ...formData,
        max_price: parseFloat(formData.max_price),
        reference_price: parseFloat(formData.reference_price)
      };

      const response = await api.post('/demandes', demandeData);
      setDemandeCreated(response.data);
      toast.success('Demande créée avec succès');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la création de la demande');
      setLoading(false);
    }
  };

  const handlePayDeposit = async () => {
    setLoading(true);
    try {
      await api.post(`/demandes/${demandeCreated.id}/pay-deposit`);
      toast.success('Acompte payé avec succès');
      navigate('/mes-demandes');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors du paiement');
      setLoading(false);
    }
  };

  if (demandeCreated) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white" data-testid="nouvelle-demande-recap">
        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-white mb-6 text-center">Reçu DownPricer</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-zinc-800 pb-2">
                  <span className="text-zinc-400">Demande :</span>
                  <span className="text-white font-medium">{demandeCreated.name}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800 pb-2">
                  <span className="text-zinc-400">Acompte :</span>
                  <span className="text-white font-medium">{demandeCreated.deposit_amount}€</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800 pb-2">
                  <span className="text-zinc-400">Statut :</span>
                  <span className="text-orange-500 font-medium">{demandeCreated.status === 'AWAITING_DEPOSIT' ? 'En attente d\'acompte' : 'Acompte payé'}</span>
                </div>
              </div>
              <p className="text-zinc-400 text-sm mt-6 text-center">
                Le solde exact sera communiqué si une opportunité est trouvée.
              </p>
              <div className="mt-6">
                <Button
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-full"
                  onClick={handlePayDeposit}
                  disabled={loading}
                  data-testid="pay-deposit-btn"
                >
                  {loading ? 'Traitement...' : demandeCreated.deposit_amount === 0 ? 'Valider gratuitement (mode test)' : 'Payer l\'acompte'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white" data-testid="nouvelle-demande-page">
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-orange-500 mb-2" style={{fontFamily: 'Outfit, sans-serif'}}>
          Nouvelle demande
        </h1>
        <p className="text-zinc-400 mb-6">
          Remplissez ce formulaire le plus précisément possible. Les photos et la description nous permettent de viser exactement ce que vous voulez.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6 space-y-4">
              <ImageUpload
                images={formData.photos}
                onChange={(photos) => setFormData({...formData, photos})}
                maxImages={10}
                label="Photos du produit (optionnel)"
                placeholder="https://exemple.com/photo-produit.jpg"
              />

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="name" className="text-white">Nom de l'objet *</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-zinc-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-zinc-800 text-white border-zinc-700 max-w-xs">
                        <p>Vous pouvez mettre un nom général ('lave-vaisselle') ou un modèle précis si vous l'avez.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="bg-zinc-800 border-zinc-700 text-white"
                  data-testid="demande-name-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-white">Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Décrivez exactement ce que vous voulez : marque, modèle, dimensions, couleur, état accepté, détails importants…"
                  required
                  rows={5}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  data-testid="demande-description-input"
                />
                <p className="text-xs text-zinc-500">
                  Important : si votre description est floue, cela signifie que vous donnez carte blanche sur les détails.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="max_price" className="text-white">Prix maximum *</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-zinc-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="bg-zinc-800 text-white border-zinc-700 max-w-xs">
                          <p>C'est le prix maximum que vous acceptez, commission incluse. Si vous acceptez 185€ max, ne mettez pas 180€.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="max_price"
                    name="max_price"
                    type="number"
                    step="0.01"
                    value={formData.max_price}
                    onChange={handleChange}
                    required
                    className="bg-zinc-800 border-zinc-700 text-white"
                    data-testid="demande-maxprice-input"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="reference_price" className="text-white">Prix de référence *</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-zinc-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="bg-zinc-800 text-white border-zinc-700 max-w-xs">
                          <p>Prix habituel constaté (ex : prix neuf, prix moyen). Cela sert à calculer le badge -%.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="reference_price"
                    name="reference_price"
                    type="number"
                    step="0.01"
                    value={formData.reference_price}
                    onChange={handleChange}
                    required
                    className="bg-zinc-800 border-zinc-700 text-white"
                    data-testid="demande-refprice-input"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-white font-medium">Livraison / Remise en main propre</Label>
                <div className="space-y-3">
                  <label 
                    htmlFor="prefer_delivery" 
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      formData.prefer_delivery 
                        ? 'border-orange-500 bg-orange-500/10' 
                        : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      id="prefer_delivery"
                      checked={formData.prefer_delivery}
                      onChange={(e) => setFormData({...formData, prefer_delivery: e.target.checked})}
                      className="w-5 h-5 rounded border-2 border-zinc-500 bg-zinc-800 text-orange-500 focus:ring-orange-500 focus:ring-offset-0 accent-orange-500"
                    />
                    <span className={`text-sm ${formData.prefer_delivery ? 'text-orange-400 font-medium' : 'text-zinc-300'}`}>
                      Je préfère une livraison
                    </span>
                  </label>
                  <label 
                    htmlFor="prefer_hand_delivery" 
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      formData.prefer_hand_delivery 
                        ? 'border-orange-500 bg-orange-500/10' 
                        : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      id="prefer_hand_delivery"
                      checked={formData.prefer_hand_delivery}
                      onChange={(e) => setFormData({...formData, prefer_hand_delivery: e.target.checked})}
                      className="w-5 h-5 rounded border-2 border-zinc-500 bg-zinc-800 text-orange-500 focus:ring-orange-500 focus:ring-offset-0 accent-orange-500"
                    />
                    <span className={`text-sm ${formData.prefer_hand_delivery ? 'text-orange-400 font-medium' : 'text-zinc-300'}`}>
                      Je peux récupérer en main propre
                    </span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-full py-6 text-lg"
            disabled={loading}
            data-testid="demande-submit-btn"
          >
            {loading ? 'Création...' : 'Continuer'}
          </Button>
        </form>
      </main>
    </div>
  );
};