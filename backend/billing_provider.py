from abc import ABC, abstractmethod
from typing import Dict, Any
from models import BillingMode

class BillingProvider(ABC):
    @abstractmethod
    async def create_deposit_payment(self, amount: float, metadata: Dict[str, Any]) -> Dict[str, Any]:
        pass
    
    @abstractmethod
    async def create_balance_payment(self, amount: float, metadata: Dict[str, Any]) -> Dict[str, Any]:
        pass
    
    @abstractmethod
    async def create_subscription(self, plan_id: str, user_id: str) -> Dict[str, Any]:
        pass
    
    @abstractmethod
    async def refund_deposit(self, payment_id: str, amount: float) -> Dict[str, Any]:
        pass

class FreeTestBillingProvider(BillingProvider):
    async def create_deposit_payment(self, amount: float, metadata: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "success": True,
            "payment_id": "FREE_TEST",
            "amount": 0,
            "type": "FREE_TEST",
            "metadata": metadata
        }
    
    async def create_balance_payment(self, amount: float, metadata: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "success": True,
            "payment_id": "FREE_TEST",
            "amount": 0,
            "type": "FREE_TEST",
            "metadata": metadata
        }
    
    async def create_subscription(self, plan_id: str, user_id: str) -> Dict[str, Any]:
        return {
            "success": True,
            "subscription_id": "FREE_TEST",
            "plan_id": plan_id,
            "amount": 0,
            "type": "FREE_TEST"
        }
    
    async def refund_deposit(self, payment_id: str, amount: float) -> Dict[str, Any]:
        return {
            "success": True,
            "refund_id": "FREE_TEST",
            "amount": 0,
            "type": "FREE_TEST"
        }

class StripeStubBillingProvider(BillingProvider):
    async def create_deposit_payment(self, amount: float, metadata: Dict[str, Any]) -> Dict[str, Any]:
        raise Exception("Stripe non configuré. Veuillez configurer Stripe dans les paramètres admin.")
    
    async def create_balance_payment(self, amount: float, metadata: Dict[str, Any]) -> Dict[str, Any]:
        raise Exception("Stripe non configuré. Veuillez configurer Stripe dans les paramètres admin.")
    
    async def create_subscription(self, plan_id: str, user_id: str) -> Dict[str, Any]:
        raise Exception("Stripe non configuré. Veuillez configurer Stripe dans les paramètres admin.")
    
    async def refund_deposit(self, payment_id: str, amount: float) -> Dict[str, Any]:
        raise Exception("Stripe non configuré. Veuillez configurer Stripe dans les paramètres admin.")

def get_billing_provider(mode: str) -> BillingProvider:
    if mode == BillingMode.FREE_TEST:
        return FreeTestBillingProvider()
    else:
        return StripeStubBillingProvider()
