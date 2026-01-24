import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import api from '../../utils/api';

// Fonction de compression d'image
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
        alert('Erreur lors de la compression de l\'image');
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
      setTimeout(() => {
        navigate('/pro/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Erreur:', error);
      if (error.response?.status === 403) {
        alert('Accès interdit : vous devez être S-tier pour accéder à cette fonctionnalité');
        navigate('/');
      } else {
        alert('Erreur lors de l\'ajout de l\'article');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Ajouter un article</h1>
      </div>

      {success && (
        <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <p className="text-green-800">Article ajouté avec succès !</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={imageCompressing}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 disabled:opacity-50"
              />
              
              {imageCompressing && (
                <div className="mt-2 flex items-center text-sm text-orange-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500 mr-2"></div>
                  Compression de l'image en cours...
                </div>
              )}
              
              {formData.photo && !imageCompressing && (
                <div className="mt-2 flex items-center">
                  <img src={formData.photo} alt="Preview" className="h-20 w-20 object-cover rounded mr-3" />
                  <span className="text-sm text-green-600">✅ Image optimisée</span>
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantité</label>
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plateforme</label>
              <select
                value={formData.purchase_platform}
                onChange={(e) => setFormData(prev => ({ ...prev, purchase_platform: e.target.value }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Méthode de paiement</label>
              <input
                type="text"
                value={formData.payment_method}
                onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date d'achat</label>
              <input
                type="date"
                value={formData.purchase_date}
                onChange={(e) => setFormData(prev => ({ ...prev, purchase_date: e.target.value }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date limite retour (optionnel)</label>
              <input
                type="date"
                value={formData.return_deadline}
                onChange={(e) => setFormData(prev => ({ ...prev, return_deadline: e.target.value }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prix d'achat (€)</label>
              <input
                type="number"
                step="0.01"
                value={formData.purchase_price}
                onChange={(e) => setFormData(prev => ({ ...prev, purchase_price: e.target.value }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prix estimé de vente (€)</label>
              <input
                type="number"
                step="0.01"
                value={formData.estimated_sale_price}
                onChange={(e) => setFormData(prev => ({ ...prev, estimated_sale_price: e.target.value }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                required
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-md text-sm font-medium disabled:opacity-50"
            >
              {loading ? 'Ajout en cours...' : 'Ajouter l\'article'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


