import React, { useState } from 'react';
import { Header } from '../components/Header';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import api from '../utils/api';
import { toast } from 'sonner';

export const DevenirVendeur = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataObj = new FormData();
      Object.keys(formData).forEach(key => {
        formDataObj.append(key, formData[key]);
      });

      await api.post('/seller/request', formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Demande envoyée. Nous vous contacterons par email.');
      setSubmitted(true);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'envoi de la demande');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white" data-testid="devenir-vendeur-page">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-orange-500 mb-4" style={{fontFamily: 'Outfit, sans-serif'}}>
            Devenir vendeur
          </h1>
          <p className="text-zinc-300 text-lg leading-relaxed">
            Vous voulez compléter vos fins de mois ?
            Rejoignez DownPricer et vendez des articles via Vinted.
            Vous accédez à un catalogue revendeur, vous revendez, et vous gardez votre marge.
          </p>
        </div>

        <Card className="bg-zinc-900 border-zinc-800 mb-6">
          <CardContent className="p-6">
            <Accordion type="single" collapsible>
              <AccordionItem value="en-savoir-plus" className="border-zinc-800">
                <AccordionTrigger className="text-white hover:text-orange-500" data-testid="accordion-trigger-en-savoir-plus">
                  En savoir plus
                </AccordionTrigger>
                <AccordionContent className="text-zinc-300">
                  <p>
                    Le principe est simple : vous choisissez des articles, vous les publiez, et quand vous vendez, vous finalisez avec DownPricer.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {!submitted ? (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name" className="text-white">Prénom</Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                    className="bg-zinc-800 border-zinc-700 text-white"
                    data-testid="seller-request-firstname-input"
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
                    data-testid="seller-request-lastname-input"
                  />
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
                    data-testid="seller-request-email-input"
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
                    required
                    className="bg-zinc-800 border-zinc-700 text-white"
                    data-testid="seller-request-phone-input"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-full"
                  disabled={loading}
                  data-testid="seller-request-submit-btn"
                >
                  {loading ? 'Envoi...' : 'Envoyer ma demande'}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-green-500/20 border-green-500/50">
            <CardContent className="p-6 text-center">
              <p className="text-green-300 text-lg">
                Demande envoyée. Nous vous contacterons par email.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};