import React, { useState, useEffect } from 'react';
import { Header } from '../../components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { AlertCircle, Upload, ExternalLink, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'sonner';

export const SellerPaiementsEnAttente = () => {
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSale, setSelectedSale] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('paypal');
  const [proofUrl, setProofUrl] = useState('');
  const [proofNote, setProofNote] = useState('');
  const [proofLink, setProofLink] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const itemsPerPage = 10;

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  const fetchPendingPayments = async () => {
    try {
      const response = await api.get('/seller/sales');
      const pendingSales = response.data.filter(s => s.status === 'PAYMENT_PENDING');
      setSales(pendingSales);
    } catch (error) {
      toast.error('Erreur lors du chargement des paiements');
    }
    setLoading(false);
  };

  const handleOpenPaymentModal = (sale) => {
    setSelectedSale(sale);
    setShowPaymentModal(true);
    setPaymentMethod('paypal');
    setProofUrl('');
    setProofNote('');
    setProofLink('');
  };

  const handleSubmitPayment = async () => {
    if (!selectedSale) return;
    
    if (paymentMethod === 'paypal' && !proofUrl) {
      toast.error('Veuillez fournir une capture d\'écran PayPal');
      return;
    }
    
    if (paymentMethod === 'vinted' && !proofLink && !proofUrl) {
      toast.error('Veuillez fournir un lien ou une capture Vinted');
      return;
    }
    
    setSubmitting(true);
    
    try {
      await api.post(`/seller/sales/${selectedSale.id}/submit-payment`, {
        method: paymentMethod,
        proof_url: proofUrl,
        note: proofNote,
        link: proofLink
      });
      
      toast.success('Preuve de paiement envoyée ! En attente de validation admin.');
      setShowPaymentModal(false);
      fetchPendingPayments();
    } catch (error) {
      toast.error('Erreur lors de l\'envoi de la preuve');
    }
    
    setSubmitting(false);
  };

  const totalPages = Math.ceil(sales.length / itemsPerPage);
  const paginatedSales = sales.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-orange-500 mb-2" style={{fontFamily: 'Outfit, sans-serif'}}>
            Paiements en attente
          </h1>
          <p className="text-zinc-400">Soumettez vos preuves de paiement pour validation</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-zinc-400">Chargement...</p>
          </div>
        ) : sales.length === 0 ? (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-12 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <p className="text-lg text-zinc-400">Aucun paiement en attente</p>
              <p className="text-sm text-zinc-500 mt-2">Toutes vos ventes sont à jour !</p>
              <Button
                className="mt-6 bg-orange-600 hover:bg-orange-700"
                onClick={() => navigate('/seller/dashboard')}
              >
                Retour au Dashboard
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-zinc-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Article</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Prix de vente</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Coût</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Profit</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {paginatedSales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-zinc-800/50 transition-colors">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <AlertCircle className="h-5 w-5 text-orange-500 mr-2" />
                            <span className="text-sm font-medium text-white">{sale.article_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-sm text-white font-semibold">{sale.sale_price}€</span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-sm text-zinc-400">{sale.seller_cost}€</span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-sm text-green-500 font-semibold">+{sale.profit}€</span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-sm text-zinc-400">
                            {new Date(sale.created_at).toLocaleDateString('fr-FR')}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <Button
                            size="sm"
                            className="bg-orange-600 hover:bg-orange-700"
                            onClick={() => handleOpenPaymentModal(sale)}
                          >
                            Envoyer preuve
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="border-zinc-700 text-white hover:bg-zinc-800"
                >
                  Précédent
                </Button>
                <span className="text-sm text-zinc-400">
                  Page {currentPage} sur {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="border-zinc-700 text-white hover:bg-zinc-800"
                >
                  Suivant
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="bg-zinc-900 text-white border-zinc-800 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-orange-500">Soumettre une preuve de paiement</DialogTitle>
          </DialogHeader>
          
          {selectedSale && (
            <div className="space-y-4">
              <div className="bg-zinc-800 p-4 rounded-lg">
                <p className="text-sm text-zinc-400">Article</p>
                <p className="text-lg font-semibold">{selectedSale.article_name}</p>
                <p className="text-sm text-zinc-400 mt-2">Montant à payer</p>
                <p className="text-2xl font-bold text-orange-500">{selectedSale.seller_cost}€</p>
              </div>

              <div>
                <Label htmlFor="payment-method" className="text-zinc-300">Méthode de paiement</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="vinted">Vinted</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {paymentMethod === 'paypal' && (
                <div>
                  <Label htmlFor="proof-url" className="text-zinc-300">Capture d'écran PayPal (URL)</Label>
                  <Input
                    id="proof-url"
                    type="text"
                    placeholder="https://exemple.com/capture.png"
                    value={proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white mt-1"
                  />
                  <p className="text-xs text-zinc-500 mt-1">Uploadez votre capture sur un hébergeur (Imgur, etc.) et collez le lien</p>
                </div>
              )}

              {paymentMethod === 'vinted' && (
                <>
                  <div>
                    <Label htmlFor="proof-link" className="text-zinc-300">Lien ou numéro de commande Vinted</Label>
                    <Input
                      id="proof-link"
                      type="text"
                      placeholder="https://vinted.fr/transaction/... ou #123456"
                      value={proofLink}
                      onChange={(e) => setProofLink(e.target.value)}
                      className="bg-zinc-800 border-zinc-700 text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="proof-url-vinted" className="text-zinc-300">Capture d'écran (optionnel)</Label>
                    <Input
                      id="proof-url-vinted"
                      type="text"
                      placeholder="https://exemple.com/capture.png"
                      value={proofUrl}
                      onChange={(e) => setProofUrl(e.target.value)}
                      className="bg-zinc-800 border-zinc-700 text-white mt-1"
                    />
                  </div>
                </>
              )}

              {paymentMethod === 'autre' && (
                <div>
                  <Label htmlFor="proof-url-autre" className="text-zinc-300">Preuve de paiement (URL)</Label>
                  <Input
                    id="proof-url-autre"
                    type="text"
                    placeholder="https://exemple.com/preuve.png"
                    value={proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white mt-1"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="proof-note" className="text-zinc-300">Note additionnelle (optionnel)</Label>
                <Textarea
                  id="proof-note"
                  placeholder="Informations supplémentaires..."
                  value={proofNote}
                  onChange={(e) => setProofNote(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white mt-1"
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPaymentModal(false)}
              className="border-zinc-700 text-white hover:bg-zinc-800"
              disabled={submitting}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmitPayment}
              className="bg-orange-600 hover:bg-orange-700"
              disabled={submitting}
            >
              {submitting ? 'Envoi...' : 'Valider le paiement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};