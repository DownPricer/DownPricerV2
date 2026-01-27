/**
 * Helper pour résoudre le plan_id (SITE_PLAN_1/2/3) depuis différentes sources
 * 
 * @param {Object} params
 * @param {Object|null} params.user - Objet utilisateur depuis /auth/me
 * @param {Object|null} params.subscription - Objet subscription depuis /billing/subscription
 * @param {string|null} params.urlPlanParam - Plan depuis query param ?plan=SITE_PLAN_X
 * @returns {string|null} - SITE_PLAN_1, SITE_PLAN_2, SITE_PLAN_3 ou null
 */
export const resolvePlanId = ({ user, subscription, urlPlanParam }) => {
  // Mapping plan string vers SITE_PLAN_X
  const planMapping = {
    'starter': 'SITE_PLAN_1',
    'standard': 'SITE_PLAN_2',
    'premium': 'SITE_PLAN_3'
  };

  // Priorité 1: Query param depuis l'URL (source la plus fiable)
  if (urlPlanParam && ['SITE_PLAN_1', 'SITE_PLAN_2', 'SITE_PLAN_3'].includes(urlPlanParam)) {
    return urlPlanParam;
  }

  // Priorité 2: Rôles utilisateur (SITE_PLAN_X)
  if (user?.roles) {
    const planRoles = user.roles.filter(role =>
      ['SITE_PLAN_1', 'SITE_PLAN_2', 'SITE_PLAN_3'].includes(role)
    );
    if (planRoles.length > 0) {
      return planRoles[0]; // Prendre le premier rôle plan trouvé
    }

    // Priorité 2b: ADMIN ou SUPERADMIN => SITE_PLAN_3
    if (user.roles.includes('ADMIN') || user.roles.includes('SUPERADMIN')) {
      return 'SITE_PLAN_3';
    }
  }

  // Priorité 3: Subscription (si has_subscription)
  if (subscription?.has_subscription) {
    // 3a: site_plan depuis subscription (source de vérité backend)
    if (subscription.site_plan && ['SITE_PLAN_1', 'SITE_PLAN_2', 'SITE_PLAN_3'].includes(subscription.site_plan)) {
      return subscription.site_plan;
    }

    // 3b: mapper plan string (starter/standard/premium) vers SITE_PLAN_X
    if (subscription.plan && planMapping[subscription.plan]) {
      return planMapping[subscription.plan];
    }

    // 3c: mapper plan_key si présent
    if (subscription.plan_key && planMapping[subscription.plan_key]) {
      return planMapping[subscription.plan_key];
    }
  }

  // Aucun plan trouvé
  return null;
};

