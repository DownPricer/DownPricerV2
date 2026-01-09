/**
 * Résout une URL d'image pour l'affichage
 * Gère les URLs relatives, absolues et les placeholders
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

  // URL externe (http/https) : retourner tel quel
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    return trimmedUrl;
  }

  // Data URL (base64) : retourner tel quel
  if (trimmedUrl.startsWith('data:')) {
    return trimmedUrl;
  }

  // URL relative commençant par /api/uploads/ : retourner tel quel (sera résolu par le navigateur)
  if (trimmedUrl.startsWith('/api/uploads/')) {
    return trimmedUrl;
  }

  // URL relative commençant par /uploads/ : convertir en /api/uploads/
  if (trimmedUrl.startsWith('/uploads/')) {
    return trimmedUrl.replace('/uploads/', '/api/uploads/');
  }

  // URLs commençant par / : retourner tel quel
  if (trimmedUrl.startsWith('/')) {
    return trimmedUrl;
  }

  // Filtrer les URLs d'exemple/test
  if (trimmedUrl.includes('example.com') || trimmedUrl.includes('localhost:8001')) {
    return null;
  }

  // Si c'est juste un nom de fichier sans chemin, supposer que c'est dans /api/uploads/
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

