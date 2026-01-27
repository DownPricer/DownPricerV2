/**
 * Résout une URL d'image pour l'affichage
 * Gère les URLs relatives, absolues et les placeholders
 * Normalise les URLs pour éviter les erreurs de certificat SSL
 * 
 * @param {string|null|undefined} imageUrl - URL de l'image (peut être relative, absolue, ou vide)
 * @returns {string|null} - URL résolue ou null pour afficher un placeholder
 */
export const resolveImageUrl = (imageUrl) => {
  // Si pas d'URL ou chaîne vide, retourner null pour afficher placeholder
  if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim() === '') {
    return null;
  }

  const trimmedUrl = imageUrl.trim();
  const currentOrigin = window.location.origin; // https://downpricer.com

  // Data URL (base64) : retourner tel quel
  if (trimmedUrl.startsWith('data:')) {
    return trimmedUrl;
  }

  // URL externe (http/https) : normaliser si nécessaire
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    try {
      const url = new URL(trimmedUrl);
      
      // Si l'URL pointe vers un domaine/IP différent du domaine actuel, normaliser
      // Cela évite les erreurs de certificat SSL (ERR_CERT_COMMON_NAME_INVALID)
      if (url.origin !== currentOrigin) {
        // Si c'est une URL vers /api/uploads/ ou /uploads/, utiliser le domaine actuel
        if (url.pathname.startsWith('/api/uploads/') || url.pathname.startsWith('/uploads/')) {
          return `${currentOrigin}${url.pathname}`;
        }
        
        // Si c'est une IP ou un domaine différent, filtrer (probablement une mauvaise URL)
        // On retourne null pour éviter les erreurs de certificat
        console.warn('Image URL points to different domain/IP, filtering:', trimmedUrl);
        return null;
      }
      
      // URL externe valide vers le même domaine : retourner tel quel
      return trimmedUrl;
    } catch (e) {
      // URL malformée : filtrer
      console.warn('Invalid image URL format:', trimmedUrl);
      return null;
    }
  }

  // URL relative commençant par /api/uploads/ : convertir en /uploads/ (standard)
  if (trimmedUrl.startsWith('/api/uploads/')) {
    return trimmedUrl.replace('/api/uploads/', '/uploads/');
  }

  // URL relative commençant par /uploads/ : retourner tel quel (standard)
  if (trimmedUrl.startsWith('/uploads/')) {
    return trimmedUrl;
  }

  // URLs commençant par / : retourner tel quel
  if (trimmedUrl.startsWith('/')) {
    return trimmedUrl;
  }

  // Filtrer les URLs d'exemple/test/localhost
  if (trimmedUrl.includes('example.com') || 
      trimmedUrl.includes('localhost:') || 
      trimmedUrl.includes('127.0.0.1') ||
      /^\d+\.\d+\.\d+\.\d+/.test(trimmedUrl)) { // IP directe
    return null;
  }

  // Si c'est juste un nom de fichier sans chemin, supposer que c'est dans /uploads/
  // Mais en général, le backend retourne toujours un chemin complet, donc ce cas est rare
  // On retourne null pour être sûr
  return null;
};

/**
 * Vérifie si une URL d'image est valide pour l'affichage
 * 
 * @param {string|null|undefined} imageUrl - URL de l'image
 * @returns {boolean} - true si l'URL est valide
 */
export const isValidImageUrl = (imageUrl) => {
  return resolveImageUrl(imageUrl) !== null;
};

