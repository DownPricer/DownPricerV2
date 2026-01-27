/**
 * Fonction utilitaire pour résoudre la route minisite appropriée
 * Évite les boucles et les appels multiples en centralisant la logique
 * 
 * @param {Function} navigate - Fonction navigate de react-router-dom
 * @param {Function} checkCancelled - Fonction optionnelle pour vérifier si l'opération a été annulée
 * @returns {Promise<string|null>} La route vers laquelle rediriger ou null si rester sur la page actuelle
 */
import { getToken } from './auth';
import api from './api';

export const resolveMinisiteRoute = async (navigate, checkCancelled = () => false) => {
  // 1. Vérifier le token
  const token = getToken();
  if (!token) {
    navigate('/login?redirect=/minisite', { replace: true });
    return '/login';
  }
  
  try {
    // 2. Appeler /auth/me et /billing/subscription en parallèle (1 seule fois)
    const [userResponse, subscriptionResponse] = await Promise.all([
      api.get('/auth/me'),
      api.get('/billing/subscription')
    ]);
    
    if (checkCancelled()) return null;
    
    const user = userResponse.data;
    const subscription = subscriptionResponse.data;
    
    // 3. Déterminer si l'utilisateur a un plan actif
    const hasPlanRole = user.roles?.some(role => 
      ['SITE_PLAN_1', 'SITE_PLAN_2', 'SITE_PLAN_3'].includes(role)
    );
    const hasSubscription = subscription?.has_subscription === true;
    const hasPlan = hasPlanRole || hasSubscription;
    
    // 4. Si pas de plan, rester sur /minisite (pricing)
    if (!hasPlan) {
      // Pas de redirection, rester sur la landing
      return null;
    }
    
    // 5. Vérifier si le minisite existe
    try {
      const minisiteResponse = await api.get('/minisites/my');
      if (checkCancelled()) return null;
      
      if (minisiteResponse.data && minisiteResponse.data.id) {
        // Minisite existe -> rediriger vers le dashboard
        navigate('/minisite/dashboard', { replace: true });
        return '/minisite/dashboard';
      }
    } catch (minisiteError) {
      if (checkCancelled()) return null;
      
      const status = minisiteError.response?.status;
      
      if (status === 404) {
        // 404 = pas de minisite encore créé (CAS NORMAL)
        // Rediriger vers la création
        navigate('/minisite/create', { replace: true });
        return '/minisite/create';
      } else if (status === 403) {
        // 403 = token manquant ou invalide
        console.error('Missing auth header? 403 on /minisites/my', minisiteError);
        navigate('/login?redirect=/minisite', { replace: true });
        return '/login';
      } else {
        // Autre erreur
        console.error('Error fetching minisite:', minisiteError);
        // Ne pas rediriger, laisser l'utilisateur sur la page actuelle
        return null;
      }
    }
    
    return null;
  } catch (error) {
    if (checkCancelled()) return null;
    
    const status = error.response?.status;
    
    if (status === 401 || status === 403) {
      // Token invalide ou manquant
      console.error('Auth error:', error);
      navigate('/login?redirect=/minisite', { replace: true });
      return '/login';
    }
    
    // Autre erreur - ne pas rediriger
    console.error('Error resolving minisite route:', error);
    return null;
  }
};

