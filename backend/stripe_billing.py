"""
Module Stripe pour la gestion des abonnements Mini-site
Utilise Stripe Checkout, Customer Portal et Webhooks
"""
import os
import logging
import stripe
from typing import Dict, Any, Optional
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

# Configuration Stripe
stripe.api_key = os.environ.get("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")

# Price IDs depuis les variables d'environnement
PRICE_IDS = {
    "starter": os.environ.get("STRIPE_PRICE_MINISITE_STARTER", ""),
    "standard": os.environ.get("STRIPE_PRICE_MINISITE_STANDARD", ""),
    "premium": os.environ.get("STRIPE_PRICE_MINISITE_PREMIUM", ""),
}

# URLs de redirection - Utiliser https://downpricer.com en production
BASE_URL = os.environ.get("FRONTEND_URL", os.environ.get("BACKEND_PUBLIC_URL", "https://downpricer.com"))
if BASE_URL.startswith("http://localhost"):
    BASE_URL = "https://downpricer.com"  # Forcer https://downpricer.com en production

SUCCESS_URL = os.environ.get("STRIPE_SUCCESS_URL", f"{BASE_URL}/minisite/dashboard?stripe=success&session_id={{CHECKOUT_SESSION_ID}}")
CANCEL_URL = os.environ.get("STRIPE_CANCEL_URL", f"{BASE_URL}/minisite/dashboard?stripe=cancel")
PORTAL_RETURN_URL = os.environ.get("STRIPE_PORTAL_RETURN_URL", f"{BASE_URL}/minisite/dashboard")


async def get_stripe_customer_id(db, user_id: str, user_email: str) -> Optional[str]:
    """
    Récupère ou crée un customer Stripe pour un utilisateur
    """
    try:
        logger.info(f"🔄 get_stripe_customer_id - User ID: {user_id}, Email: {user_email}")
        
        # Vérifier que Stripe est configuré
        if not stripe.api_key:
            error_msg = "STRIPE_SECRET_KEY not configured"
            logger.error(f"❌ {error_msg}")
            raise ValueError(error_msg)
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        
        if not user:
            error_msg = f"User {user_id} not found in database"
            logger.error(f"❌ {error_msg}")
            raise ValueError(error_msg)
        
        # Si l'utilisateur a déjà un customer_id, le retourner
        existing_customer_id = user.get("stripe_customer_id")
        if existing_customer_id:
            logger.info(f"✅ Existing Stripe customer found - Customer ID: {existing_customer_id}")
            return existing_customer_id
        
        # Sinon, créer un nouveau customer Stripe
        logger.info(f"🔄 Creating new Stripe customer - Email: {user_email}")
        try:
            customer = stripe.Customer.create(
                email=user_email,
                metadata={
                    "user_id": user_id,
                    "product": "minisite"
                }
            )
            logger.info(f"✅ Stripe customer created - Customer ID: {customer.id}")
        except stripe.error.StripeError as e:
            error_msg = f"Stripe API error creating customer: {str(e)}"
            logger.error(f"❌ {error_msg}")
            raise Exception(error_msg)
        
        # Sauvegarder le customer_id dans la DB
        try:
            await db.users.update_one(
                {"id": user_id},
                {"$set": {"stripe_customer_id": customer.id}}
            )
            logger.info(f"✅ Customer ID saved to database - Customer ID: {customer.id}")
        except Exception as e:
            logger.warning(f"⚠️ Failed to save customer_id to DB (non-critical): {str(e)}")
            # On continue quand même car le customer Stripe est créé
        
        return customer.id
        
    except ValueError as e:
        # Erreurs de validation (user not found, config missing)
        logger.error(f"❌ Validation error in get_stripe_customer_id: {str(e)}")
        raise
    except stripe.error.StripeError as e:
        # Erreurs Stripe spécifiques
        error_msg = f"Stripe error: {str(e)}"
        logger.error(f"❌ {error_msg}")
        raise Exception(error_msg)
    except Exception as e:
        # Autres erreurs
        error_msg = f"Unexpected error: {str(e)}"
        logger.error(f"❌ {error_msg}", exc_info=True)
        raise Exception(error_msg)


async def create_checkout_session(
    db,
    user_id: str,
    user_email: str,
    plan: str
) -> Dict[str, Any]:
    """
    Crée une session Stripe Checkout pour un abonnement
    """
    try:
        logger.info(f"🔄 create_checkout_session called - User: {user_id}, Email: {user_email}, Plan: {plan}")
        
        # Vérifier que le plan est valide
        if plan not in PRICE_IDS:
            error_msg = f"Invalid plan: {plan}. Valid plans: {list(PRICE_IDS.keys())}"
            logger.error(f"❌ {error_msg}")
            raise ValueError(error_msg)
        
        price_id = PRICE_IDS[plan]
        if not price_id:
            error_msg = f"Price ID not configured for plan: {plan}. Check STRIPE_PRICE_MINISITE_{plan.upper()} env var"
            logger.error(f"❌ {error_msg}")
            logger.error(f"Current PRICE_IDS: {PRICE_IDS}")
            raise ValueError(error_msg)
        
        logger.info(f"✅ Plan validated - Plan: {plan}, Price ID: {price_id}")
        
        # Vérifier les URLs de redirection
        if not SUCCESS_URL or not CANCEL_URL:
            error_msg = "SUCCESS_URL or CANCEL_URL not configured"
            logger.error(f"❌ {error_msg}")
            raise ValueError(error_msg)
        
        logger.info(f"✅ URLs configured - Success: {SUCCESS_URL[:50]}..., Cancel: {CANCEL_URL[:50]}...")
        
        # Récupérer ou créer le customer Stripe
        logger.info(f"🔄 Getting/creating Stripe customer - User: {user_id}, Email: {user_email}")
        try:
            customer_id = await get_stripe_customer_id(db, user_id, user_email)
            if not customer_id:
                error_msg = "Failed to get/create Stripe customer - customer_id is None"
                logger.error(f"❌ {error_msg} - User: {user_id}")
                raise Exception(error_msg)
        except ValueError as e:
            # Erreur de validation (user not found, config missing)
            error_msg = f"Validation error: {str(e)}"
            logger.error(f"❌ {error_msg}")
            raise ValueError(error_msg)
        except Exception as e:
            # Autres erreurs (Stripe API, etc.)
            error_msg = f"Failed to get/create Stripe customer: {str(e)}"
            logger.error(f"❌ {error_msg} - User: {user_id}")
            raise Exception(error_msg)
        
        logger.info(f"✅ Stripe customer ready - Customer ID: {customer_id}")
        
        # Créer la session Checkout
        logger.info(f"🔄 Creating Stripe checkout session - Customer: {customer_id}, Price: {price_id}")
        session = stripe.checkout.Session.create(
            customer=customer_id,
            payment_method_types=["card"],
            line_items=[{
                "price": price_id,
                "quantity": 1,
            }],
            mode="subscription",
            success_url=SUCCESS_URL,
            cancel_url=CANCEL_URL,
            metadata={
                "user_id": user_id,
                "plan": plan,
                "product": "minisite"
            },
            subscription_data={
                "metadata": {
                    "user_id": user_id,
                    "plan": plan,
                    "product": "minisite"
                }
            }
        )
        
        logger.info(f"✅ Stripe checkout session created - Session ID: {session.id}, URL: {session.url[:50]}...")
        
        return {
            "success": True,
            "url": session.url,
            "session_id": session.id
        }
        
    except ValueError as e:
        # Erreurs de validation (plan invalide, config manquante)
        error_msg = str(e)
        logger.error(f"❌ Validation error in create_checkout_session: {error_msg}")
        return {
            "success": False,
            "error": error_msg
        }
    except stripe.error.StripeError as e:
        # Erreurs Stripe spécifiques
        error_msg = f"Stripe error: {str(e)}"
        logger.error(f"❌ Stripe API error in create_checkout_session: {error_msg}")
        return {
            "success": False,
            "error": error_msg
        }
    except Exception as e:
        # Autres erreurs
        error_msg = f"Unexpected error: {str(e)}"
        logger.error(f"❌ Unexpected error in create_checkout_session: {error_msg}", exc_info=True)
        return {
            "success": False,
            "error": error_msg
        }


async def create_portal_session(
    db,
    user_id: str
) -> Dict[str, Any]:
    """
    Crée une session Stripe Customer Portal pour gérer l'abonnement
    """
    try:
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        
        if not user:
            raise ValueError(f"User {user_id} not found")
        
        customer_id = user.get("stripe_customer_id")
        if not customer_id:
            raise ValueError("User has no Stripe customer ID")
        
        # Créer la session Portal
        session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=PORTAL_RETURN_URL
        )
        
        logger.info(f"Created portal session for user {user_id}")
        
        return {
            "success": True,
            "url": session.url
        }
        
    except Exception as e:
        logger.error(f"Error creating portal session: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }


def handle_checkout_session_completed(db, session: Dict[str, Any]) -> None:
    """
    Gère l'événement checkout.session.completed
    Supporte à la fois les abonnements minisite et les acomptes de demandes
    """
    try:
        metadata = session.get("metadata", {})
        user_id = metadata.get("user_id")
        payment_type = metadata.get("type")
        session_id = session.get("id")
        customer_id = session.get("customer")
        
        # Vérifier si c'est un acompte
        if payment_type == "deposit":
            demande_id = metadata.get("demande_id")
            logger.info(f"💰 Processing deposit payment - Session: {session_id}, Demande: {demande_id}, User: {user_id}")
            
            if not demande_id or not user_id:
                logger.error(f"❌ Missing data in deposit checkout session: {session_id} - demande_id={demande_id}, user_id={user_id}")
                return
            
            # Mettre à jour la demande
            now = datetime.now(timezone.utc).isoformat()
            db.demandes.update_one(
                {"id": demande_id},
                {"$set": {
                    "status": "DEPOSIT_PAID",
                    "deposit_paid_at": now,
                    "deposit_stripe_session_id": session_id,
                    "payment_type": "stripe"
                }}
            )
            
            # Passer automatiquement en ANALYSIS_AFTER_DEPOSIT
            db.demandes.update_one(
                {"id": demande_id},
                {"$set": {"status": "ANALYSIS_AFTER_DEPOSIT"}}
            )
            
            # Récupérer la demande pour les notifications
            demande = db.demandes.find_one({"id": demande_id}, {"_id": 0})
            user = db.users.find_one({"id": user_id}, {"_id": 0, "email": 1})
            
            if demande and user:
                logger.info(f"✅ Deposit paid successfully - Demande: {demande_id}, User: {user_id} ({user.get('email', 'N/A')})")
                
                # Notification admin sera envoyée via le webhook handler dans server.py
            else:
                logger.warning(f"⚠️  Demande or user not found after deposit payment - Demande: {demande_id}, User: {user_id}")
            
            return
        
        # Sinon, c'est un abonnement minisite (logique existante)
        plan = metadata.get("plan")
        subscription_id = session.get("subscription")
        
        logger.info(f"🛒 Processing checkout.session.completed - Session: {session_id}, User: {user_id}, Plan: {plan}, Subscription: {subscription_id}, Customer: {customer_id}")
        
        if not user_id or not plan or not subscription_id:
            logger.error(f"❌ Missing data in checkout session: {session_id} - user_id={user_id}, plan={plan}, subscription_id={subscription_id}")
            return
        
        # Récupérer la subscription complète depuis Stripe
        subscription = stripe.Subscription.retrieve(subscription_id)
        
        # Mapper le plan vers le format interne
        plan_mapping = {
            "starter": "SITE_PLAN_1",
            "standard": "SITE_PLAN_10",
            "premium": "SITE_PLAN_15"
        }
        internal_plan = plan_mapping.get(plan)
        
        # Mettre à jour l'utilisateur
        user_update = {
            "stripe_subscription_id": subscription_id,
            "stripe_subscription_status": subscription.status,
            "stripe_current_period_end": datetime.fromtimestamp(
                subscription.current_period_end,
                tz=timezone.utc
            ).isoformat(),
            "minisite_plan": plan,
            "minisite_active": subscription.status in ["active", "trialing"]
        }
        
        # Ajouter le rôle si nécessaire
        user = db.users.find_one({"id": user_id}, {"_id": 0})
        if user:
            roles = user.get("roles", [])
            if internal_plan and internal_plan not in roles:
                roles.append(internal_plan)
                user_update["roles"] = roles
        
        db.users.update_one(
            {"id": user_id},
            {"$set": user_update}
        )
        
        # Créer ou mettre à jour l'abonnement dans la collection subscriptions
        subscription_doc = {
            "id": subscription_id,
            "user_id": user_id,
            "user_email": user.get("email") if user else "",
            "product": "minisite",
            "plan": plan,
            "price_id": subscription.items.data[0].price.id if subscription.items.data else "",
            "amount_cents": subscription.items.data[0].price.unit_amount if subscription.items.data else 0,
            "currency": subscription.currency or "eur",
            "stripe_customer_id": subscription.customer,
            "stripe_subscription_id": subscription_id,
            "status": subscription.status,
            "current_period_end": datetime.fromtimestamp(
                subscription.current_period_end,
                tz=timezone.utc
            ).isoformat(),
            "created_at": datetime.fromtimestamp(
                subscription.created,
                tz=timezone.utc
            ).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        db.subscriptions.update_one(
            {"id": subscription_id},
            {"$set": subscription_doc},
            upsert=True
        )
        
        logger.info(f"✅ Checkout traité avec succès - User: {user_id} ({user.get('email') if user else 'N/A'}), Subscription: {subscription_id}, Plan: {plan}, Status: {subscription.status}")
        
    except Exception as e:
        logger.error(f"Error handling checkout.session.completed: {str(e)}", exc_info=True)


def handle_subscription_updated(db, subscription: Dict[str, Any]) -> None:
    """
    Gère l'événement customer.subscription.updated
    """
    try:
        subscription_id = subscription.get("id")
        metadata = subscription.get("metadata", {})
        user_id = metadata.get("user_id")
        plan = metadata.get("plan")
        status = subscription.get("status")
        customer_id = subscription.get("customer")
        
        logger.info(f"🔄 Processing subscription.updated - Subscription: {subscription_id}, User: {user_id}, Plan: {plan}, Status: {status}, Customer: {customer_id}")
        
        if not user_id or not subscription_id:
            logger.error(f"❌ Missing data in subscription: {subscription_id} - user_id={user_id}")
            return
        
        # Mapper le plan
        plan_mapping = {
            "starter": "SITE_PLAN_1",
            "standard": "SITE_PLAN_10",
            "premium": "SITE_PLAN_15"
        }
        internal_plan = plan_mapping.get(plan)
        
        # Mettre à jour l'utilisateur
        user_update = {
            "stripe_subscription_status": status,
            "stripe_current_period_end": datetime.fromtimestamp(
                subscription.get("current_period_end", 0),
                tz=timezone.utc
            ).isoformat(),
            "minisite_active": status in ["active", "trialing"]
        }
        
        if plan:
            user_update["minisite_plan"] = plan
        
        # Gérer les rôles (upgrade/downgrade)
        user = db.users.find_one({"id": user_id}, {"_id": 0})
        if user:
            roles = user.get("roles", [])
            # Retirer les anciens rôles de plan
            roles = [r for r in roles if r not in ["SITE_PLAN_1", "SITE_PLAN_10", "SITE_PLAN_15"]]
            # Ajouter le nouveau rôle
            if internal_plan:
                roles.append(internal_plan)
            user_update["roles"] = roles
        
        db.users.update_one(
            {"id": user_id},
            {"$set": user_update}
        )
        
        # Mettre à jour l'abonnement dans la collection subscriptions
        subscription_doc = {
            "status": status,
            "current_period_end": datetime.fromtimestamp(
                subscription.get("current_period_end", 0),
                tz=timezone.utc
            ).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        if plan:
            subscription_doc["plan"] = plan
        
        db.subscriptions.update_one(
            {"id": subscription_id},
            {"$set": subscription_doc}
        )
        
        user_email = user.get("email") if user else "N/A"
        logger.info(f"✅ Subscription mise à jour - User: {user_id} ({user_email}), Subscription: {subscription_id}, Plan: {plan}, Status: {status}, Active: {status in ['active', 'trialing']}")
        
    except Exception as e:
        logger.error(f"Error handling subscription.updated: {str(e)}", exc_info=True)


def handle_subscription_deleted(db, subscription: Dict[str, Any]) -> None:
    """
    Gère l'événement customer.subscription.deleted
    """
    try:
        subscription_id = subscription.get("id")
        metadata = subscription.get("metadata", {})
        user_id = metadata.get("user_id")
        customer_id = subscription.get("customer")
        
        logger.info(f"🗑️  Processing subscription.deleted - Subscription: {subscription_id}, User: {user_id}, Customer: {customer_id}")
        
        if not user_id or not subscription_id:
            logger.error(f"❌ Missing data in subscription: {subscription_id} - user_id={user_id}")
            return
        
        # Mettre à jour l'utilisateur
        user = db.users.find_one({"id": user_id}, {"_id": 0})
        if user:
            roles = user.get("roles", [])
            # Retirer les rôles de plan
            roles = [r for r in roles if r not in ["SITE_PLAN_1", "SITE_PLAN_10", "SITE_PLAN_15"]]
            
            db.users.update_one(
                {"id": user_id},
                {"$set": {
                    "stripe_subscription_status": "canceled",
                    "minisite_active": False,
                    "minisite_plan": None,
                    "roles": roles
                }}
            )
        
        # Mettre à jour l'abonnement
        db.subscriptions.update_one(
            {"id": subscription_id},
            {"$set": {
                "status": "canceled",
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        user_email = user.get("email") if user else "N/A"
        logger.info(f"✅ Subscription annulée - User: {user_id} ({user_email}), Subscription: {subscription_id}")
        
    except Exception as e:
        logger.error(f"Error handling subscription.deleted: {str(e)}", exc_info=True)


def handle_invoice_payment_failed(db, invoice: Dict[str, Any]) -> None:
    """
    Gère l'événement invoice.payment_failed
    """
    try:
        invoice_id = invoice.get("id")
        subscription_id = invoice.get("subscription")
        customer_id = invoice.get("customer")
        amount = invoice.get("amount_due", 0) / 100
        
        logger.info(f"💳 Processing invoice.payment_failed - Invoice: {invoice_id}, Subscription: {subscription_id}, Customer: {customer_id}, Amount: {amount}€")
        
        if not subscription_id:
            logger.warning(f"⚠️  No subscription_id in invoice: {invoice_id}")
            return
        
        # Récupérer l'abonnement depuis Stripe pour avoir les metadata
        subscription = stripe.Subscription.retrieve(subscription_id)
        metadata = subscription.get("metadata", {})
        user_id = metadata.get("user_id")
        
        if not user_id:
            logger.error(f"❌ No user_id in subscription metadata: {subscription_id}")
            return
        
        # Mettre à jour l'utilisateur
        db.users.update_one(
            {"id": user_id},
            {"$set": {
                "stripe_subscription_status": invoice.get("status", "past_due"),
                "minisite_active": False
            }}
        )
        
        # Mettre à jour l'abonnement
        db.subscriptions.update_one(
            {"id": subscription_id},
            {"$set": {
                "status": invoice.get("status", "past_due"),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        user = db.users.find_one({"id": user_id}, {"_id": 0, "email": 1})
        user_email = user.get("email") if user else "N/A"
        logger.info(f"✅ Paiement échoué traité - User: {user_id} ({user_email}), Subscription: {subscription_id}, Status: {invoice.get('status', 'past_due')}")
        
    except Exception as e:
        logger.error(f"Error handling invoice.payment_failed: {str(e)}", exc_info=True)


async def create_deposit_checkout_session(
    db,
    demande_id: str,
    user_id: str,
    user_email: str,
    amount: float
) -> Dict[str, Any]:
    """
    Crée une session Stripe Checkout pour un acompte (paiement unique)
    """
    try:
        logger.info(f"🔄 create_deposit_checkout_session - Demande: {demande_id}, User: {user_id}, Amount: {amount}€")
        
        if not stripe.api_key:
            error_msg = "STRIPE_SECRET_KEY not configured"
            logger.error(f"❌ {error_msg}")
            raise ValueError(error_msg)
        
        # Récupérer ou créer le customer Stripe
        customer_id = await get_stripe_customer_id(db, user_id, user_email)
        if not customer_id:
            error_msg = "Failed to get/create Stripe customer"
            logger.error(f"❌ {error_msg}")
            raise Exception(error_msg)
        
        # URLs de redirection pour acompte
        base_url = os.environ.get("BACKEND_PUBLIC_URL", "https://downpricer.com")
        success_url = f"{base_url}/demandes/{demande_id}?deposit=success&session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{base_url}/demandes/{demande_id}?deposit=cancel"
        
        # Créer la session Checkout en mode "payment" (paiement unique)
        session = stripe.checkout.Session.create(
            customer=customer_id,
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "eur",
                    "product_data": {
                        "name": f"Acompte - Demande {demande_id}",
                        "description": "Acompte pour votre demande DownPricer"
                    },
                    "unit_amount": int(amount * 100)  # Convertir en centimes
                },
                "quantity": 1
            }],
            mode="payment",  # Paiement unique, pas d'abonnement
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "user_id": user_id,
                "demande_id": demande_id,
                "type": "deposit",
                "amount": str(amount)
            }
        )
        
        logger.info(f"✅ Deposit checkout session created - Session ID: {session.id}, URL: {session.url[:50]}...")
        
        return {
            "success": True,
            "url": session.url,
            "session_id": session.id
        }
        
    except ValueError as e:
        error_msg = str(e)
        logger.error(f"❌ Validation error in create_deposit_checkout_session: {error_msg}")
        return {
            "success": False,
            "error": error_msg
        }
    except stripe.error.StripeError as e:
        error_msg = f"Stripe error: {str(e)}"
        logger.error(f"❌ Stripe API error in create_deposit_checkout_session: {error_msg}")
        return {
            "success": False,
            "error": error_msg
        }
    except Exception as e:
        error_msg = f"Unexpected error: {str(e)}"
        logger.error(f"❌ Unexpected error in create_deposit_checkout_session: {error_msg}", exc_info=True)
        return {
            "success": False,
            "error": error_msg
        }


def handle_invoice_paid(db, invoice: Dict[str, Any]) -> None:
    """
    Gère l'événement invoice.paid
    """
    try:
        invoice_id = invoice.get("id")
        subscription_id = invoice.get("subscription")
        customer_id = invoice.get("customer")
        amount = invoice.get("amount_paid", 0) / 100
        
        logger.info(f"💳 Processing invoice.paid - Invoice: {invoice_id}, Subscription: {subscription_id}, Customer: {customer_id}, Amount: {amount}€")
        
        if not subscription_id:
            logger.warning(f"⚠️  No subscription_id in invoice: {invoice_id}")
            return
        
        # Récupérer l'abonnement depuis Stripe
        subscription = stripe.Subscription.retrieve(subscription_id)
        metadata = subscription.get("metadata", {})
        user_id = metadata.get("user_id")
        
        if not user_id:
            logger.error(f"❌ No user_id in subscription metadata: {subscription_id}")
            return
        
        # Mettre à jour l'utilisateur (réactiver l'accès)
        db.users.update_one(
            {"id": user_id},
            {"$set": {
                "stripe_subscription_status": subscription.status,
                "minisite_active": subscription.status in ["active", "trialing"]
            }}
        )
        
        # Mettre à jour l'abonnement
        db.subscriptions.update_one(
            {"id": subscription_id},
            {"$set": {
                "status": subscription.status,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        user = db.users.find_one({"id": user_id}, {"_id": 0, "email": 1})
        user_email = user.get("email") if user else "N/A"
        logger.info(f"✅ Paiement traité avec succès - User: {user_id} ({user_email}), Subscription: {subscription_id}, Status: {subscription.status}, Active: {subscription.status in ['active', 'trialing']}")
        
    except Exception as e:
        logger.error(f"Error handling invoice.paid: {str(e)}", exc_info=True)

