import { useState, useEffect } from 'react';
import api from '../../utils/api';

// Hook pour détecter si on est sur mobile
export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

// Hook pour charger les images à la demande
export const useImageLoader = () => {
  const [imageCache, setImageCache] = useState({});
  const [loadingImages, setLoadingImages] = useState({});

  const loadImage = async (articleId) => {
    // Si l'image est déjà en cache, la retourner
    if (imageCache[articleId]) {
      return imageCache[articleId];
    }

    // Si l'image est en cours de chargement, attendre
    if (loadingImages[articleId]) {
      return null;
    }

    try {
      setLoadingImages(prev => ({ ...prev, [articleId]: true }));
      
      const response = await api.get(`/pro/articles/${articleId}/photo`);
      const photo = response.data.photo;
      
      // Mettre en cache
      setImageCache(prev => ({ ...prev, [articleId]: photo }));
      setLoadingImages(prev => ({ ...prev, [articleId]: false }));
      
      return photo;
    } catch (error) {
      console.error('Erreur chargement image:', error);
      setLoadingImages(prev => ({ ...prev, [articleId]: false }));
      return null;
    }
  };

  const isImageLoading = (articleId) => loadingImages[articleId] || false;
  const getImageFromCache = (articleId) => imageCache[articleId] || null;

  return { loadImage, isImageLoading, getImageFromCache };
};

// Fonction utilitaire pour compresser les images côté client
export const compressImage = (file, maxWidth = 800, quality = 0.8) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculer les nouvelles dimensions
      let { width, height } = img;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      // Redimensionner
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convertir en base64 avec compression
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };
    
    img.src = URL.createObjectURL(file);
  });
};





