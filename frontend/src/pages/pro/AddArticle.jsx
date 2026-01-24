import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Camera, Plus, Loader2, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import api from '../../utils/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

// Fonction de compression d'image (Logique conservée)
const compressImage = (file, maxWidth = 800, quality = 0.8) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };
    img.src = URL.createObjectURL(file);
  });
};

export const ProAddArticle = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    quantity: 1,
    purchase_platform: '',
    purchase_date: '',
    return_deadline: '',
    payment_method: '',
    purchase_price: '',
    estimated_sale_price: '',
    photo: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [imageCompressing, setImageCompressing] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('Fichier trop volumineux (max 10MB)');
        return;
      }
      setImageCompressing(true);
      try {
        const compressedImage = await compressImage(file);
        setFormData(prev => ({ ...prev, photo: compressedImage }));
      } catch (error) {
        console.error('Erreur compression:', error);
      } finally {
        setImageCompressing(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const submitData = {
        ...formData,
        quantity: parseInt(formData.quantity),
        purchase_price: parseFloat(formData.purchase_price),
        estimated_sale_price: parseFloat(formData.estimated_sale_price),
        purchase_date: new Date(formData.purchase_date).toISOString(),
        return_deadline: formData.return_deadline ? new Date(formData.return_deadline).toISOString() : null
      };
      await api.post('/pro/articles', submitData);
      setSuccess(true);
      setTimeout(() => navigate('/pro/dashboard'), 2000);
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'ajout de l\'article');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-orange-500/30">
      <div className="max-w-4xl mx-auto px-6 py-10">
        
        {/* Header avec bouton retour */}
        <div className="flex items-center justify-between mb-10">
          <button 
            onClick={() => navigate('/pro/dashboard')}
            className="group flex items-center gap-2 text-zinc-500 hover:text-white transition-colors"
          >
            <div className="p-2 rounded-full group-hover:bg-white/5 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Retour Dashboard</span>
          </button>
          
          <h1 className="text-2xl font-black tracking-tighter uppercase italic" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Nouvel <span className="text-orange-500">Article</span>
          </h1>
        </div>

        {success && (
          <div className="mb-8 bg-green-500/10 border border-green-500/20 rounded-2xl p-4 flex items-center animate-in zoom-in-95">
            <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
            <p className="text-green-500 text-sm font-bold uppercase tracking-widest">Article ajouté avec succès !</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Section Image OLED Style */}
          <div className="bg-[#080808] border border-white/5 rounded-[2rem] p-8">
            <Label className="text-[10px] uppercase tracking-widest text-zinc-500 font-black mb-4 block">Visuel du produit</Label>
            
            <div className="relative group">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={imageCompressing}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
              />
              <div className={`
                h-48 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-3
                ${formData.photo ? 'border-orange-500/50 bg-orange-500/5' : 'border-white/5 bg-black hover:border-white/20'}
              `}>
                {imageCompressing ? (
                  <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                ) : formData.photo ? (
                  <div className="relative h-full w-full p-2">
                    <img src={formData.photo} alt="Preview" className="h-full w-full object-contain rounded-xl" />
                    <div className="absolute bottom-4 right-4 bg-green-500 text-black p-1.5 rounded-full">
                      <CheckCircle className="h-4 w-4" />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="p-4 rounded-full bg-white/5 text-zinc-500 group-hover:text-white transition-colors">
                      <Camera className="h-6 w-6" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Cliquez ou glissez une photo</span>
                  </>
                )}
              </div>
            </div>
            {imageCompressing && <p className="text-center mt-3 text-[10px] text-orange-500 uppercase font-black animate-pulse">Optimisation en cours...</p>}
          </div>

          {/* Formulaire Grid */}
          <div className="bg-[#080808] border border-white/5 rounded-[2rem] p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              
              <div className="md:col-span-2 space-y-2">
                <FormLabel>Nom de l'article</FormLabel>
                <CustomInput 
                  placeholder="Ex: iPhone 15 Pro Max 256GB"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <FormLabel>Quantité</FormLabel>
                <CustomInput 
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <FormLabel>Plateforme d'achat</FormLabel>
                <select
                  value={formData.purchase_platform}
                  onChange={(e) => setFormData(prev => ({ ...prev, purchase_platform: e.target.value }))}
                  className="w-full bg-black border border-white/10 rounded-xl h-12 px-4 text-sm text-white focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all outline-none appearance-none"
                  required
                >
                  <option value="">Sélectionner...</option>
                  <option value="Vinted">Vinted</option>
                  <option value="eBay">eBay</option>
                  <option value="Amazon">Amazon</option>
                  <option value="LeBonCoin">LeBonCoin</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>

              <div className="space-y-2">
                <FormLabel>Prix d'achat (€)</FormLabel>
                <CustomInput 
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.purchase_price}
                  onChange={(e) => setFormData(prev => ({ ...prev, purchase_price: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <FormLabel>Prix de vente estimé (€)</FormLabel>
                <CustomInput 
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.estimated_sale_price}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimated_sale_price: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <FormLabel>Date d'achat</FormLabel>
                <CustomInput 
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, purchase_date: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <FormLabel>Date limite retour</FormLabel>
                <CustomInput 
                  type="date"
                  value={formData.return_deadline}
                  onChange={(e) => setFormData(prev => ({ ...prev, return_deadline: e.target.value }))}
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <FormLabel>Méthode de paiement</FormLabel>
                <CustomInput 
                  placeholder="Ex: PayPal, CB, Solde Vinted..."
                  value={formData.payment_method}
                  onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="mt-10">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black h-14 rounded-2xl shadow-lg shadow-orange-900/20 transition-all active:scale-[0.98] uppercase tracking-widest text-xs"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <span className="flex items-center gap-2">
                    Confirmer l'ajout <Plus className="h-4 w-4 stroke-[3px]" />
                  </span>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// Composants Helper Internes
const FormLabel = ({ children }) => (
  <Label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold ml-1">
    {children}
  </Label>
);

const CustomInput = (props) => (
  <Input 
    {...props}
    className="bg-black border-white/10 text-white placeholder:text-zinc-700 h-12 rounded-xl focus:border-orange-500/50 focus:ring-orange-500/10 transition-all"
  />
);