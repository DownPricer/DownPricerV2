/**
 * Helper centralisé pour la gestion de l'accès et du routing minisite
 * Source de vérité : les rôles utilisateur (SITE_PLAN_1/2/3)
 */

/**
 * Extrait le rôle plan de l'utilisateur (SITE_PLAN_1, SITE_PLAN_2, ou SITE_PLAN_3)
 * ADMIN ne compte pas comme un plan
 * 
 * @param {Object|null} user - Objet utilisateur depuis /auth/me
 * @returns {string|null} - 'SITE_PLAN_1', 'SITE_PLAN_2', 'SITE_PLAN_3' ou null
 */
export const getUserPlanRole = (user) => {
  if (!user || !user.roles || !Array.isArray(user.roles)) {
    return null;
  }

  // Chercher le premier rôle plan trouvé (un user ne peut avoir qu'un seul plan)
  const planRoles = user.roles.filter(role =>
    ['SITE_PLAN_1', 'SITE_PLAN_2', 'SITE_PLAN_3'].includes(role)
  );

  if (planRoles.length > 0) {
    return planRoles[0]; // Retourner le premier (normalement il n'y en a qu'un)
  }

  return null;
};

/**
 * Résout la route d'entrée minisite appropriée
 * 
 * @param {Object|null} user - Objet utilisateur depuis /auth/me
 * @param {boolean} minisiteExists - true si GET /minisites/my retourne 200
 * @returns {string} - Route vers laquelle rediriger
 */
export const resolveMinisiteEntry = (user, minisiteExists) => {
  // Si minisite existe => dashboard
  if (minisiteExists) {
    return '/minisite/dashboard';
  }

  // Si user a un plan => création avec le plan
  const planRole = getUserPlanRole(user);
  if (planRole) {
    return `/minisite/create?plan=${planRole}`;
  }

  // Sinon => pricing
  return '/minisite';
};

/**
 * Vérifie si le plan dans l'URL correspond au rôle de l'utilisateur
 * 
 * @param {Object|null} user - Objet utilisateur depuis /auth/me
 * @param {string|null} urlPlan - Plan depuis query param ?plan=SITE_PLAN_X
 * @returns {string|null} - Le plan valide (celui du user si urlPlan ne match pas)
 */
export const validatePlanAccess = (user, urlPlan) => {
  const userPlanRole = getUserPlanRole(user);

  // Si pas de plan dans l'URL, retourner celui du user
  if (!urlPlan) {
    return userPlanRole;
  }

  // Si plan dans URL ne correspond pas au rôle du user, forcer le bon plan
  if (urlPlan !== userPlanRole) {
    console.warn(`Plan mismatch: URL has ${urlPlan} but user has ${userPlanRole || 'no plan'}`);
    return userPlanRole; // Retourner le plan réel du user
  }

  return urlPlan; // Plan valide
};

