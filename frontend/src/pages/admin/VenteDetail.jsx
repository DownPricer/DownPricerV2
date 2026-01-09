import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { CheckCircle, XCircle, Truck } from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'sonner';
import { resolveImageUrl } from '../../utils/images';

export const AdminVenteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showShipDialog, setShowShipDialog] = useState(false);

  useEffect(() => {
    fetchVenteDetail();
  }, [id]);

  const fetchVenteDetail = async () => {
    try {
      const response = await api.get(`/admin/sales/${id}`);
      setData(response.data);
    } catch (error) {
      toast.error('Vente non trouvée');
      navigate('/admin/ventes');
    }
    setLoading(false);
  };

  const handleValidate = async () => {
    try {
      await api.post(`/admin/sales/${id}/validate`);
      toast.success('Vente validée');
      fetchVenteDetail();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur');
    }
  };

  const handleReject = async () => {
    try {
      await api.post(`/admin/sales/${id}/reject`, { reason: rejectReason });
      toast.success('Vente refusée');
      setShowRejectDialog(false);
      setRejectReason('');
      fetchVenteDetail();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleConfirmPayment = async () => {
    try {
      await api.post(`/admin/sales/${id}/confirm-payment`);
      toast.success('Paiement confirmé');
      fetchVenteDetail();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleRejectPayment = async () => {
    try {
      await api.post(`/admin/sales/${id}/reject-payment`, { reason: rejectReason });
      toast.success('Paiement refusé');
      setShowRejectDialog(false);
      setRejectReason('');
      fetchVenteDetail();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleMarkShipped = async () => {
    try {
      await api.post(`/admin/sales/${id}/mark-shipped`, { tracking_number: trackingNumber });
      toast.success('Vente marquée comme expédiée');
      setShowShipDialog(false);
      fetchVenteDetail();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleComplete = async () => {
    try {
      await api.post(`/admin/sales/${id}/complete`);
      toast.success('Vente terminée');
      fetchVenteDetail();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      'WAITING_ADMIN_APPROVAL': { label: 'En attente validation', color: 'bg-orange-100 text-orange-800' },
      'PAYMENT_PENDING': { label: 'Paiement requis', color: 'bg-red-100 text-red-800' },
      'PAYMENT_SUBMITTED': { label: 'Paiement soumis', color: 'bg-blue-100 text-blue-800' },
      'SHIPPING_PENDING': { label: 'Attente expédition', color: 'bg-purple-100 text-purple-800' },
      'SHIPPED': { label: 'Expédié', color: 'bg-green-100 text-green-800' },
      'COMPLETED': { label: 'Terminé', color: 'bg-green-100 text-green-800' },
      'REJECTED': { label: 'Refusé', color: 'bg-red-100 text-red-800' }
    };
    const { label, color } = map[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
    return <Badge className={color}>{label}</Badge>;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-8 text-center">
          <p className="text-slate-500">Chargement...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!data) return null;

  const { sale, article, seller } = data;

  return (
    <AdminLayout>
      <div className="p-8">
        <Button variant="ghost" onClick={() => navigate('/admin/ventes')} className="mb-4">
          ← Retour aux ventes
        </Button>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card className="bg-white border-slate-200">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle>Détail de la vente</CardTitle>
                  {getStatusBadge(sale.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-600">Prix de vente</Label>
                    <p className="text-2xl font-bold text-slate-900">{sale.sale_price}€</p>
                  </div>
                  <div>
                    <Label className="text-slate-600">Coût vendeur</Label>
                    <p className="text-2xl font-bold text-slate-900">{sale.seller_cost}€</p>
                  </div>
                  <div>
                    <Label className="text-slate-600">Profit vendeur</Label>
                    <p className="text-2xl font-bold text-green-600">+{sale.profit}€</p>
                  </div>
                  <div>
                    <Label className="text-slate-600">Date</Label>
                    <p className="text-sm text-slate-700">{new Date(sale.created_at).toLocaleString()}</p>
                  </div>
                </div>

                {sale.payment_proof && (
                  <div className="pt-4 border-t">
                    <Label className="text-slate-600">Preuve de paiement</Label>
                    <div className="mt-2 p-4 bg-slate-50 rounded-lg">
                      <p><strong>Méthode :</strong> {sale.payment_method}</p>
                      {sale.payment_proof.proof_url && (
                        <p><strong>Preuve :</strong> <a href={sale.payment_proof.proof_url} target="_blank" rel="noopener noreferrer" className="text-blue-600">Voir la preuve</a></p>
                      )}
                      {sale.payment_proof.link && (
                        <p><strong>Lien :</strong> {sale.payment_proof.link}</p>
                      )}
                      {sale.payment_proof.note && (
                        <p><strong>Note :</strong> {sale.payment_proof.note}</p>
                      )}
                    </div>
                  </div>
                )}

                {sale.tracking_number && (
                  <div className="pt-4 border-t">
                    <Label className="text-slate-600">Numéro de suivi</Label>
                    <p className="text-slate-900">{sale.tracking_number}</p>
                  </div>
                )}

                {sale.rejection_reason && (
                  <div className="pt-4 border-t">
                    <Label className="text-slate-600">Motif de refus</Label>
                    <p className="text-red-600">{sale.rejection_reason}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200">
              <CardHeader>
                <CardTitle>Article</CardTitle>
              </CardHeader>
              <CardContent>
                {article ? (
                  <div className="flex gap-4">
                    <div className="w-32 h-32 bg-slate-100 rounded-lg overflow-hidden">
                      {(() => {
                        const imageUrl = resolveImageUrl(article.photos?.[0]);
                        if (!imageUrl) {
                          return <div className="w-full h-full flex items-center justify-center text-slate-400">Pas de photo</div>;
                        }
                        return <img src={imageUrl} alt={article.name} className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />;
                      })()}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-slate-900">{article.name}</h3>
                      <p className="text-sm text-slate-600 mt-1">{article.description?.substring(0, 150)}...</p>
                      <div className="mt-3 flex gap-4">
                        <div>
                          <span className="text-xs text-slate-500">Prix vendeur</span>
                          <p className="font-semibold text-slate-900">{article.price}€</p>
                        </div>
                        <div>
                          <span className="text-xs text-slate-500">Prix référence</span>
                          <p className="font-semibold text-slate-900">{article.reference_price}€</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500">Article non disponible</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-white border-slate-200">
              <CardHeader>
                <CardTitle>Vendeur</CardTitle>
              </CardHeader>
              <CardContent>
                {seller ? (
                  <div className="space-y-2">
                    <p className="font-semibold text-slate-900">{seller.first_name} {seller.last_name}</p>
                    <p className="text-sm text-slate-600">{seller.email}</p>
                    {seller.phone && <p className="text-sm text-slate-600">{seller.phone}</p>}
                  </div>
                ) : (
                  <p className="text-slate-500">Vendeur non disponible</p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200">
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {sale.status === 'WAITING_ADMIN_APPROVAL' && (
                  <>
                    <Button onClick={handleValidate} className="w-full bg-green-600 hover:bg-green-700">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Valider la vente
                    </Button>
                    <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full border-red-300 text-red-600 hover:bg-red-50">
                          <XCircle className="h-4 w-4 mr-2" />
                          Refuser la vente
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Refuser la vente</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Textarea
                            placeholder="Motif du refus (optionnel)"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                          />
                          <Button onClick={handleReject} className="w-full bg-red-600 hover:bg-red-700">
                            Confirmer le refus
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </>
                )}

                {sale.status === 'PAYMENT_SUBMITTED' && (
                  <>
                    <Button onClick={handleConfirmPayment} className="w-full bg-green-600 hover:bg-green-700">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Valider le paiement
                    </Button>
                    <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full border-red-300 text-red-600 hover:bg-red-50">
                          <XCircle className="h-4 w-4 mr-2" />
                          Refuser le paiement
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Refuser le paiement</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Textarea
                            placeholder="Motif du refus"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                          />
                          <Button onClick={handleRejectPayment} className="w-full bg-red-600 hover:bg-red-700">
                            Confirmer le refus
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </>
                )}

                {sale.status === 'SHIPPING_PENDING' && (
                  <Dialog open={showShipDialog} onOpenChange={setShowShipDialog}>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700">
                        <Truck className="h-4 w-4 mr-2" />
                        Marquer expédié
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Marquer comme expédié</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Numéro de suivi (optionnel)</Label>
                          <Input
                            placeholder="Ex: 1Z999AA10123456784"
                            value={trackingNumber}
                            onChange={(e) => setTrackingNumber(e.target.value)}
                          />
                        </div>
                        <Button onClick={handleMarkShipped} className="w-full bg-blue-600 hover:bg-blue-700">
                          Confirmer l'expédition
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}

                {sale.status === 'SHIPPED' && (
                  <Button onClick={handleComplete} className="w-full bg-green-600 hover:bg-green-700">
                    Marquer terminé
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
